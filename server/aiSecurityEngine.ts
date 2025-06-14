import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { db } from './db';
import { alerts, repositories, dependencies, vulnerabilityPatterns, aiRemediationSuggestions, riskScores, falsePositivePatterns } from '@shared/schema';
import { eq, and, gte, lte, desc, count, sql, inArray } from 'drizzle-orm';

interface VulnerabilityContext {
  cve?: string;
  package?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  affectedVersions?: string[];
  patchedVersions?: string[];
}

interface ChatContext {
  message: string;
  vulnerability?: VulnerabilityContext;
  conversationHistory?: Array<{role: 'user' | 'assistant', content: string}>;
}

interface AIResponse {
  response: string;
  confidence: number;
  sources?: string[];
  suggestions?: RemediationSuggestion[];
  followUpQuestions?: string[];
}

class AISecurityEngineCore {
  private genAI: GoogleGenerativeAI | null = null;
  private openai: OpenAI | null = null;
  private fallbackResponses: Map<string, string> = new Map();

  constructor() {
    this.initializeAIProviders();
    this.initializeFallbackResponses();
  }

  private initializeAIProviders(): void {
    try {
      if (process.env.GOOGLE_API_KEY) {
        this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      }
    } catch (error) {
      console.warn('Google Gemini AI initialization failed:', error);
    }

    try {
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      }
    } catch (error) {
      console.warn('OpenAI initialization failed:', error);
    }
  }

  private initializeFallbackResponses(): void {
    this.fallbackResponses.set('vulnerability_analysis', 
      'Based on the vulnerability information provided, I recommend reviewing the official security advisories and applying the latest patches as soon as possible.');
    
    this.fallbackResponses.set('remediation_general',
      'For security vulnerabilities, the general approach is: 1) Assess the impact, 2) Apply patches or updates, 3) Implement workarounds if patches aren\'t available, 4) Monitor for exploitation attempts.');
    
    this.fallbackResponses.set('best_practices',
      'Security best practices include: keeping dependencies updated, implementing defense in depth, regular security audits, and maintaining an incident response plan.');
  }

  async processSecurityQuery(context: ChatContext): Promise<AIResponse> {
    const { message, vulnerability, conversationHistory = [] } = context;
    
    try {
      // Try primary AI providers
      const response = await this.tryAIProviders(message, vulnerability, conversationHistory);
      if (response) {
        return response;
      }
    } catch (error) {
      console.error('AI processing error:', error);
    }

    // Fallback to rule-based responses
    return this.generateFallbackResponse(message, vulnerability);
  }

  private async tryAIProviders(
    message: string, 
    vulnerability?: VulnerabilityContext,
    history: Array<{role: 'user' | 'assistant', content: string}> = []
  ): Promise<AIResponse | null> {
    const prompt = this.buildSecurityPrompt(message, vulnerability, history);
    
    // Try OpenAI first (generally more reliable for structured responses)
    if (this.openai) {
      try {
        const response = await this.queryOpenAI(prompt);
        if (response) return response;
      } catch (error) {
        console.warn('OpenAI request failed:', error);
      }
    }

    // Try Google Gemini as fallback
    if (this.genAI) {
      try {
        const response = await this.queryGemini(prompt);
        if (response) return response;
      } catch (error) {
        console.warn('Gemini request failed:', error);
      }
    }

    return null;
  }

  private buildSecurityPrompt(
    message: string, 
    vulnerability?: VulnerabilityContext,
    history: Array<{role: 'user' | 'assistant', content: string}> = []
  ): string {
    let prompt = `You are a cybersecurity expert assistant specializing in vulnerability analysis and remediation.

Context:`;

    if (vulnerability) {
      prompt += `
Vulnerability Details:
- CVE: ${vulnerability.cve || 'Not specified'}
- Package: ${vulnerability.package || 'Not specified'}  
- Severity: ${vulnerability.severity}
- Description: ${vulnerability.description || 'Not provided'}
- Affected Versions: ${vulnerability.affectedVersions?.join(', ') || 'Not specified'}
- Patched Versions: ${vulnerability.patchedVersions?.join(', ') || 'Not specified'}`;
    }

    if (history.length > 0) {
      prompt += `\n\nConversation History:`;
      history.slice(-5).forEach(msg => { // Keep last 5 messages for context
        prompt += `\n${msg.role}: ${msg.content}`;
      });
    }

    prompt += `\n\nUser Question: ${message}

Please provide:
1. A clear, actionable response
2. Specific remediation steps if applicable
3. Risk assessment
4. Follow-up questions to help the user

Respond in JSON format:
{
  "response": "detailed response",
  "confidence": 0.8,
  "suggestions": [...],
  "followUpQuestions": [...]
}`;

    return prompt;
  }

  private async queryOpenAI(prompt: string): Promise<AIResponse | null> {
    try {
      const completion = await this.openai!.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3, // Lower temperature for more consistent security advice
        max_tokens: 1000
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) return null;

      try {
        const parsed = JSON.parse(content);
        return {
          response: parsed.response,
          confidence: parsed.confidence || 0.7,
          suggestions: parsed.suggestions || [],
          followUpQuestions: parsed.followUpQuestions || []
        };
      } catch {
        // If JSON parsing fails, return the raw response
        return {
          response: content,
          confidence: 0.6,
          suggestions: [],
          followUpQuestions: []
        };
      }
    } catch (error) {
      console.error('OpenAI query failed:', error);
      return null;
    }
  }

  private async queryGemini(prompt: string): Promise<AIResponse | null> {
    try {
      const model = this.genAI!.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) return null;

      try {
        const parsed = JSON.parse(text);
        return {
          response: parsed.response,
          confidence: parsed.confidence || 0.7,
          suggestions: parsed.suggestions || [],
          followUpQuestions: parsed.followUpQuestions || []
        };
      } catch {
        return {
          response: text,
          confidence: 0.6,
          suggestions: [],
          followUpQuestions: []
        };
      }
    } catch (error) {
      console.error('Gemini query failed:', error);
      return null;
    }
  }

  private generateFallbackResponse(message: string, vulnerability?: VulnerabilityContext): AIResponse {
    const lowerMessage = message.toLowerCase();
    
    let response = '';
    let confidence = 0.4;
    
    if (lowerMessage.includes('remediation') || lowerMessage.includes('fix')) {
      response = this.fallbackResponses.get('remediation_general')!;
    } else if (lowerMessage.includes('best practice')) {
      response = this.fallbackResponses.get('best_practices')!;
    } else if (vulnerability) {
      response = `For the ${vulnerability.severity} severity vulnerability in ${vulnerability.package || 'the specified package'}, ` +
                this.fallbackResponses.get('vulnerability_analysis')!;
    } else {
      response = 'I\'m currently unable to provide detailed analysis. Please ensure your question is specific and try again, or contact support if the issue persists.';
    }

    return {
      response,
      confidence,
      suggestions: [],
      followUpQuestions: [
        "Would you like me to explain the remediation steps in more detail?",
        "Do you need help understanding the security impact?",
        "Would you like best practices for preventing similar vulnerabilities?"
      ]
    };
  }

  async storeRemediationSuggestion(suggestion: RemediationSuggestion): Promise<boolean> {
    try {
      await db.insert(aiRemediationSuggestions).values({
        vulnerabilityType: suggestion.vulnerabilityType,
        suggestedFix: suggestion.suggestedFix,
        codeExample: suggestion.codeExample,
        confidence: suggestion.confidence.toString(),
        automationLevel: suggestion.automationLevel,
        isImplemented: false,
        createdAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error storing remediation suggestion:', error);
      return false;
    }
  }
}

// Export the enhanced AI security engine
// Remove duplicate export

// Initialize the original AI engine
let genAI: GoogleGenerativeAI | null = null;
let openai: OpenAI | null = null;

try {
  if (process.env.GOOGLE_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  }
} catch (error) {
  console.warn('Google Gemini AI initialization failed:', error);
}

try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (error) {
  console.warn('OpenAI initialization failed:', error);
}

interface RiskScore {
  alertId: number;
  exploitProbability: number;
  businessImpact: number;
  overallRiskScore: number;
  reasoning: string;
}

interface RemediationSuggestion {
  alertId: number;
  vulnerabilityType: string;
  suggestedFix: string;
  codeExample: string;
  confidence: number;
  automationLevel: 'manual' | 'semi-automatic' | 'automatic';
}

interface FalsePositiveAnalysis {
  alertId: number;
  falsePositiveProbability: number;
  reasoning: string;
  confidence: number;
  similarDismissedPatterns: Array<{
    pattern: string;
    frequency: number;
  }>;
}

interface CodebaseContext {
  languages: string[];
  frameworks: string[];
  architecturePatterns: string[];
  securityPractices: string[];
  businessDomain: string;
}

export class AISecurityEngine {
  
  /**
   * Analyze and prioritize vulnerabilities using AI-powered risk assessment
   */
  async prioritizeVulnerabilities(userId: string, repositoryId?: number): Promise<RiskScore[]> {
    try {
      // Get user's repositories and alerts
      const repoFilter = repositoryId 
        ? eq(repositories.id, repositoryId)
        : eq(repositories.userId, userId);

      const userRepos = await db.query.repositories.findMany({
        where: repoFilter
      });

      const repoIds = userRepos.map(r => r.id);
      
      // Get unresolved alerts
      const unresolvedAlerts = await db.query.alerts.findMany({
        where: sql`${alerts.repoId} = ANY(${repoIds})`,
        with: {
          repository: true
        }
      });

      if (unresolvedAlerts.length === 0) {
        return [];
      }

      // Get codebase context for better analysis
      const codebaseContext = await this.analyzeCodebaseContext(repoIds);

      // Analyze each alert for risk prioritization
      const riskScores: RiskScore[] = [];
      
      for (const alert of unresolvedAlerts) {
        const riskScore = await this.calculateAIRiskScore(alert, codebaseContext);
        riskScores.push(riskScore);
      }

      // Sort by overall risk score (highest first)
      return riskScores.sort((a, b) => b.overallRiskScore - a.overallRiskScore);

    } catch (error) {
      console.error('Error in AI vulnerability prioritization:', error);
      throw new Error('Failed to prioritize vulnerabilities with AI');
    }
  }



  /**
   * Analyze alerts for false positive probability using ML patterns
   */
  async analyzeFalsePositives(userId: string): Promise<FalsePositiveAnalysis[]> {
    try {
      // Get user's historical alert dismissal patterns
      const dismissalHistory = await this.getDismissalPatterns(userId);
      
      // Get current unresolved alerts
      const userRepos = await db.query.repositories.findMany({
        where: eq(repositories.userId, userId)
      });
      const repoIds = userRepos.map(r => r.id);

      const currentAlerts = await db.query.alerts.findMany({
        where: sql`${alerts.repoId} = ANY(${repoIds}) AND ${alerts.status} != 'resolved'`,
        with: {
          repository: true
        }
      });

      const analyses: FalsePositiveAnalysis[] = [];

      for (const alert of currentAlerts) {
        const analysis = await this.calculateFalsePositiveProbability(alert, dismissalHistory);
        analyses.push(analysis);
      }

      return analyses.sort((a, b) => b.falsePositiveProbability - a.falsePositiveProbability);

    } catch (error) {
      console.error('Error in false positive analysis:', error);
      throw new Error('Failed to analyze false positives');
    }
  }

  /**
   * Calculate AI-powered risk score for a specific alert
   */
  private async calculateAIRiskScore(alert: any, context: CodebaseContext): Promise<RiskScore> {
    const prompt = `
You are a cybersecurity risk assessment expert. Analyze this vulnerability and provide a risk score.

Vulnerability Details:
- Type: ${alert.alertType}
- Severity: ${alert.severity}
- Component: ${alert.dependencyName}
- Description: ${alert.description}
- Usage in Code: ${alert.isUsedInCode ? 'Yes' : 'No'}
- Usage Count: ${alert.usageCount || 0}

Codebase Context:
- Languages: ${context.languages.join(', ')}
- Frameworks: ${context.frameworks.join(', ')}
- Business Domain: ${context.businessDomain}
- Architecture: ${context.architecturePatterns.join(', ')}

Consider these factors:
1. Exploitability (how easy is it to exploit?)
2. Business impact (what damage could occur?)
3. Attack surface (how exposed is this component?)
4. Current threat landscape
5. Mitigation difficulty

Provide response in JSON format:
{
  "exploitProbability": 0.75,
  "businessImpact": 0.85,
  "overallRiskScore": 0.80,
  "reasoning": "detailed explanation of risk assessment"
}

Scores should be between 0.0 and 1.0.
`;

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const enhancedPrompt = `${prompt}

Please provide your response in valid JSON format with the exact structure requested.`;

      const result = await model.generateContent(enhancedPrompt);
      const response = await result.response;
      const responseText = response.text();
      
      // Extract JSON from response
      let aiRisk = {};
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiRisk = JSON.parse(jsonMatch[0]);
        }
      } catch (error) {
        console.warn('Failed to parse risk assessment JSON:', error);
        aiRisk = {
          exploitProbability: this.getBasicExploitScore(alert.severity),
          businessImpact: this.getBasicImpactScore(alert.alertType),
          overallRiskScore: this.getBasicRiskScore(alert),
          reasoning: 'AI analysis unavailable, using fallback scoring'
        };
      }

      return {
        alertId: alert.id,
        exploitProbability: Math.max(0, Math.min(1, (aiRisk as any).exploitProbability || 0.5)),
        businessImpact: Math.max(0, Math.min(1, (aiRisk as any).businessImpact || 0.5)),
        overallRiskScore: Math.max(0, Math.min(1, (aiRisk as any).overallRiskScore || 0.5)),
        reasoning: (aiRisk as any).reasoning || 'AI risk assessment completed'
      };

    } catch (error) {
      console.error('Error calculating AI risk score:', error);
      // Fallback to basic scoring
      return {
        alertId: alert.id,
        exploitProbability: this.getBasicExploitScore(alert.severity),
        businessImpact: this.getBasicImpactScore(alert.alertType),
        overallRiskScore: this.getBasicRiskScore(alert),
        reasoning: 'Fallback risk assessment due to AI processing error'
      };
    }
  }

  /**
   * Analyze codebase context for better AI understanding
   */
  private async analyzeCodebaseContext(repoIds: number[]): Promise<CodebaseContext> {
    // Get repository information
    let repos: any[] = [];
    let deps: any[] = [];
    
    if (repoIds.length > 0) {
      try {
        repos = await db.select().from(repositories).where(sql`${repositories.id} IN (${sql.join(repoIds.map(id => sql`${id}`), sql`, `)})`);
      } catch (error) {
        console.warn('Failed to fetch repositories for AI analysis:', error);
        repos = [];
      }

      try {
        deps = await db.select().from(dependencies).where(sql`${dependencies.repoId} IN (${sql.join(repoIds.map(id => sql`${id}`), sql`, `)})`).limit(100);
      } catch (error) {
        console.warn('Failed to fetch dependencies for AI analysis:', error);
        deps = [];
      }
    }

    // Analyze languages and frameworks from dependencies
    const languages = this.extractLanguages(deps);
    const frameworks = this.extractFrameworks(deps);
    const architecturePatterns = this.detectArchitecturePatterns(deps);
    
    // Infer business domain from repository names and dependencies
    const businessDomain = this.inferBusinessDomain(repos, deps);

    return {
      languages,
      frameworks,
      architecturePatterns,
      securityPractices: [], // Could be enhanced with code analysis
      businessDomain
    };
  }

  /**
   * Get historical dismissal patterns for false positive analysis
   */
  private async getDismissalPatterns(userId: string): Promise<any[]> {
    // Get dismissed alerts and their patterns
    const userRepos = await db.query.repositories.findMany({
      where: eq(repositories.userId, userId)
    });
    const repoIds = userRepos.map(r => r.id);

    const dismissedAlerts = await db.query.alerts.findMany({
      where: sql`${alerts.repoId} = ANY(${repoIds}) AND ${alerts.status} = 'dismissed'`,
      orderBy: [desc(alerts.createdAt)],
      limit: 100
    });

    // Group by patterns for analysis
    const patterns = dismissedAlerts.reduce((acc, alert) => {
      const key = `${alert.alertType}-${alert.severity}-${alert.dependencyName}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(patterns).map(([pattern, frequency]) => ({
      pattern,
      frequency
    }));
  }

  /**
   * Calculate false positive probability using pattern matching
   */
  private async calculateFalsePositiveProbability(alert: any, dismissalHistory: any[]): Promise<FalsePositiveAnalysis> {
    const alertPattern = `${alert.alertType}-${alert.severity}-${alert.dependencyName}`;
    
    // Find similar dismissed patterns
    const similarPatterns = dismissalHistory.filter(p => 
      p.pattern.includes(alert.alertType) || 
      p.pattern.includes(alert.dependencyName) ||
      p.pattern.includes(alert.severity)
    );

    let probability = 0;
    let reasoning = '';

    if (similarPatterns.length > 0) {
      const totalSimilar = similarPatterns.reduce((sum, p) => sum + p.frequency, 0);
      probability = Math.min(0.9, totalSimilar / 20); // Scale based on frequency
      reasoning = `Found ${totalSimilar} similar dismissed alerts. Pattern analysis suggests potential false positive.`;
    } else {
      probability = 0.1; // Base false positive rate
      reasoning = 'No similar dismissal patterns found. Standard false positive probability.';
    }

    return {
      alertId: alert.id,
      falsePositiveProbability: probability,
      reasoning,
      confidence: similarPatterns.length > 0 ? 0.8 : 0.3,
      similarDismissedPatterns: similarPatterns.slice(0, 5)
    };
  }

  /**
   * Store remediation suggestion for future learning
   */
  private async storeRemediationSuggestion(suggestion: RemediationSuggestion): Promise<void> {
    try {
      await db.insert(aiRemediationSuggestions).values({
        vulnerabilityType: suggestion.vulnerabilityType,
        suggestedFix: suggestion.suggestedFix,
        codeExample: suggestion.codeExample,
        confidence: suggestion.confidence.toString(),
        automationLevel: suggestion.automationLevel,
        isImplemented: false
      });
    } catch (error) {
      console.error('Error storing remediation suggestion:', error);
    }
  }

  /**
   * Utility methods for technology stack analysis
   */
  private extractLanguages(deps: any[]): string[] {
    const languageIndicators = {
      'javascript': ['react', 'vue', 'express', 'lodash', '@types'],
      'typescript': ['@types', 'typescript', 'ts-node'],
      'python': ['django', 'flask', 'pandas', 'numpy'],
      'java': ['spring', 'hibernate', 'maven'],
      'csharp': ['microsoft', '.net', 'nuget'],
      'go': ['gin', 'gorilla', 'gorm'],
      'rust': ['serde', 'tokio', 'actix']
    };

    const detectedLanguages = new Set<string>();
    
    deps.forEach(dep => {
      const name = dep.name.toLowerCase();
      Object.entries(languageIndicators).forEach(([lang, indicators]) => {
        if (indicators.some(indicator => name.includes(indicator))) {
          detectedLanguages.add(lang);
        }
      });
    });

    return Array.from(detectedLanguages);
  }

  private extractFrameworks(deps: any[]): string[] {
    const frameworks = new Set<string>();
    
    const frameworkPatterns = [
      'react', 'vue', 'angular', 'express', 'fastify', 'koa',
      'django', 'flask', 'spring', 'laravel', 'rails'
    ];

    deps.forEach(dep => {
      const name = dep.name.toLowerCase();
      frameworkPatterns.forEach(pattern => {
        if (name.includes(pattern)) {
          frameworks.add(pattern);
        }
      });
    });

    return Array.from(frameworks);
  }

  private detectArchitecturePatterns(deps: any[]): string[] {
    const patterns = new Set<string>();
    
    // Detect microservices patterns
    if (deps.some(d => d.name.includes('kubernetes') || d.name.includes('docker'))) {
      patterns.add('microservices');
    }
    
    // Detect API patterns
    if (deps.some(d => d.name.includes('graphql') || d.name.includes('rest'))) {
      patterns.add('api-driven');
    }
    
    // Detect database patterns
    if (deps.some(d => d.name.includes('mongodb') || d.name.includes('postgres'))) {
      patterns.add('database-backed');
    }

    return Array.from(patterns);
  }

  private inferBusinessDomain(repos: any[], deps: any[]): string {
    const domains = [
      { keywords: ['ecommerce', 'shop', 'payment', 'cart'], domain: 'E-commerce' },
      { keywords: ['financial', 'bank', 'trading', 'fintech'], domain: 'Financial Services' },
      { keywords: ['health', 'medical', 'patient', 'hospital'], domain: 'Healthcare' },
      { keywords: ['education', 'learning', 'student', 'course'], domain: 'Education' },
      { keywords: ['game', 'gaming', 'player', 'match'], domain: 'Gaming' },
      { keywords: ['social', 'chat', 'message', 'community'], domain: 'Social Media' }
    ];

    const allText = [
      ...repos.map(r => r.repositoryName || r.name || '').filter(name => name).map(name => name.toLowerCase()),
      ...deps.map(d => d.name || '').filter(name => name).map(name => name.toLowerCase())
    ].join(' ');

    for (const { keywords, domain } of domains) {
      if (keywords.some(keyword => allText.includes(keyword))) {
        return domain;
      }
    }

    return 'General Software';
  }

  /**
   * Fallback scoring methods
   */
  private getBasicExploitScore(severity: string): number {
    switch (severity.toLowerCase()) {
      case 'critical': return 0.9;
      case 'high': return 0.7;
      case 'medium': return 0.5;
      case 'low': return 0.3;
      default: return 0.4;
    }
  }

  private getBasicImpactScore(alertType: string): number {
    const highImpactTypes = ['rce', 'sql-injection', 'xss', 'authentication'];
    return highImpactTypes.some(type => alertType.toLowerCase().includes(type)) ? 0.8 : 0.5;
  }

  private getBasicRiskScore(alert: any): number {
    const exploitScore = this.getBasicExploitScore(alert.severity);
    const impactScore = this.getBasicImpactScore(alert.alertType);
    const usageMultiplier = alert.isUsedInCode ? 1.2 : 0.8;
    
    return Math.min(1.0, (exploitScore + impactScore) / 2 * usageMultiplier);
  }



  /**
   * Generate fallback vulnerability analysis when AI services are unavailable
   */
  private generateFallbackVulnerabilityAnalysis(vulnerability: any): any {
    const severity = vulnerability.severity?.toLowerCase() || 'medium';
    const isUsed = vulnerability.isUsedInCode;
    
    return {
      explanation: `This ${severity} severity vulnerability in ${vulnerability.dependencyName} requires immediate attention. The issue affects ${vulnerability.alertType} and could potentially compromise application security.`,
      riskAssessment: {
        score: this.calculateFallbackRiskScore(vulnerability),
        factors: this.generateRiskFactors(vulnerability),
        businessContext: `${severity.charAt(0).toUpperCase() + severity.slice(1)} risk to business operations`,
        attackVectors: ["Direct component exploitation", "Supply chain attacks"],
        exploitComplexity: severity === 'critical' ? 'Low complexity' : 'Moderate complexity',
        reasoning: `Risk assessment based on ${severity} severity and ${isUsed ? 'active' : 'passive'} usage in codebase`
      },
      mitigationSteps: this.generateFallbackMitigation(vulnerability),
      codeExamples: [],
      complianceImpact: [],
      monitoringRecommendations: [
        "Monitor for exploitation attempts",
        "Review access logs regularly",
        "Implement runtime application self-protection (RASP)"
      ],
      longTermStrategy: {
        preventiveMeasures: ["Automated dependency updates", "Security scanning in CI/CD"],
        processImprovements: ["Security training", "Threat modeling"],
        technologyUpgrades: ["Security tools integration", "Monitoring enhancements"]
      },
      timeline: this.getTimelineRecommendation(severity),
      confidence: 0.7,
      reasoning: "Fallback analysis using rule-based assessment"
    };
  }

  private calculateFallbackRiskScore(vulnerability: any): number {
    let score = 5.0; // Base score
    
    const severity = vulnerability.severity?.toLowerCase();
    switch (severity) {
      case 'critical': score = 9.5; break;
      case 'high': score = 8.0; break;
      case 'medium': score = 6.0; break;
      case 'low': score = 3.0; break;
    }
    
    // Adjust for usage
    if (vulnerability.isUsedInCode) score += 1.0;
    if (vulnerability.usageCount > 10) score += 0.5;
    
    return Math.min(10.0, score);
  }

  private generateRiskFactors(vulnerability: any): string[] {
    const factors = [];
    
    factors.push(`${vulnerability.severity || 'Unknown'} severity rating`);
    
    if (vulnerability.isUsedInCode) {
      factors.push('Component actively used in application');
    } else {
      factors.push('Component present but not actively used');
    }
    
    if (vulnerability.cve) {
      factors.push(`Public CVE identifier: ${vulnerability.cve}`);
    }
    
    if (vulnerability.usageCount > 0) {
      factors.push(`Used in ${vulnerability.usageCount} locations`);
    }
    
    factors.push('Potential for automated exploitation');
    
    return factors;
  }

  private generateFallbackMitigation(vulnerability: any): any[] {
    const severity = vulnerability.severity?.toLowerCase() || 'medium';
    const priority = severity === 'critical' ? 'immediate' : severity === 'high' ? 'high' : 'medium';
    
    return [
      {
        priority: priority,
        action: `Update ${vulnerability.dependencyName}`,
        description: `Upgrade to the latest secure version that addresses this vulnerability`,
        estimatedTime: severity === 'critical' ? '1-2 hours' : '2-4 hours',
        complexity: 'moderate',
        businessImpact: 'Minimal impact during maintenance window',
        successCriteria: 'Vulnerability scanner shows issue resolved'
      },
      {
        priority: 'medium',
        action: 'Review and test changes',
        description: 'Thoroughly test the application after updates to ensure functionality',
        estimatedTime: '2-4 hours',
        complexity: 'simple',
        businessImpact: 'Testing requires development environment',
        successCriteria: 'All tests pass and application functions normally'
      },
      {
        priority: 'low',
        action: 'Implement monitoring',
        description: 'Set up monitoring for similar vulnerabilities in the future',
        estimatedTime: '1-2 hours',
        complexity: 'simple',
        businessImpact: 'No impact on current operations',
        successCriteria: 'Monitoring alerts configured and tested'
      }
    ];
  }

  private getTimelineRecommendation(severity: string): string {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'Immediate action required (within 24 hours)';
      case 'high': return 'Address within 72 hours';
      case 'medium': return 'Resolve within 1 week';
      case 'low': return 'Address during next maintenance cycle';
      default: return 'Review and prioritize based on risk assessment';
    }
  }





  /**
   * Generate automated remediation suggestions
   */
  async generateRemediationSuggestions(alertId: number): Promise<RemediationSuggestion> {
    try {
      const { storage } = await import('./storage');
      const alert = await storage.getAlertById(alertId);
      
      if (!alert) {
        throw new Error('Alert not found');
      }

      const context = {
        cve: alert.cve,
        package: alert.dependencyName,
        severity: alert.severity,
        description: alert.description
      };

      let suggestedFix = '';
      let codeExample = '';
      let confidence = 0.7;

      // Try AI providers first
      if (this.genAI) {
        try {
          const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
          const prompt = `Generate remediation steps for ${context.cve} in ${context.package}. Include specific commands and code examples.`;
          const result = await model.generateContent(prompt);
          const response = await result.response;
          suggestedFix = response.text();
          confidence = 0.9;
          
          const codeMatch = suggestedFix.match(/```[\s\S]*?```/);
          if (codeMatch) {
            codeExample = codeMatch[0];
          }
        } catch (error) {
          console.warn('AI remediation failed, using fallback:', error);
        }
      }

      if (!suggestedFix) {
        suggestedFix = `Update ${context.package} to address this ${context.severity} severity vulnerability. Check package manager for latest secure version.`;
        codeExample = `npm update ${context.package}\nyarn upgrade ${context.package}`;
        confidence = 0.6;
      }

      const remediation: RemediationSuggestion = {
        alertId,
        vulnerabilityType: context.cve || 'dependency-vulnerability',
        suggestedFix,
        codeExample,
        confidence,
        automationLevel: context.severity === 'critical' ? 'manual' : 'semi-automatic'
      };

      await this.storeRemediationSuggestion(remediation);
      return remediation;
    } catch (error) {
      console.error('Error generating remediation suggestions:', error);
      
      return {
        alertId,
        vulnerabilityType: 'unknown',
        suggestedFix: 'Update the affected package to the latest secure version.',
        codeExample: 'npm update <package-name>',
        confidence: 0.3,
        automationLevel: 'manual' as const
      };
    }
  }

  /**
   * Explain vulnerability details and impact
   */
  async explainVulnerability(vulnerability: any): Promise<any> {
    try {
      const explanation = {
        summary: `${vulnerability.severity} severity vulnerability detected in ${vulnerability.dependencyName || 'dependency'}`,
        details: vulnerability.description || 'No detailed description available',
        impact: this.generateImpactAnalysis(vulnerability),
        recommendations: this.generateRecommendations(vulnerability),
        technicalDetails: {
          cve: vulnerability.cve,
          package: vulnerability.dependencyName,
          currentVersion: vulnerability.oldValue,
          fixedVersion: vulnerability.newValue,
          severity: vulnerability.severity
        }
      };

      return explanation;
    } catch (error) {
      console.error('Error explaining vulnerability:', error);
      return {
        summary: 'Vulnerability analysis unavailable',
        details: 'Unable to retrieve vulnerability details',
        impact: 'Unknown impact',
        recommendations: ['Contact security team for manual review'],
        technicalDetails: {}
      };
    }
  }

  private generateImpactAnalysis(vulnerability: any): string {
    const severity = vulnerability.severity?.toLowerCase() || 'medium';
    
    switch (severity) {
      case 'critical':
        return 'Critical impact - immediate attention required. This vulnerability could allow complete system compromise.';
      case 'high':
        return 'High impact - significant security risk. Could lead to data breach or service disruption.';
      case 'medium':
        return 'Medium impact - moderate security risk. Should be addressed in next maintenance cycle.';
      case 'low':
        return 'Low impact - minimal security risk. Can be addressed during routine updates.';
      default:
        return 'Impact assessment pending - requires manual review.';
    }
  }

  private generateRecommendations(vulnerability: any): string[] {
    const recommendations = [];
    
    if (vulnerability.newValue) {
      recommendations.push(`Update ${vulnerability.dependencyName} to version ${vulnerability.newValue} or later`);
    } else {
      recommendations.push(`Update ${vulnerability.dependencyName} to the latest secure version`);
    }
    
    recommendations.push('Test application functionality after update');
    recommendations.push('Monitor for additional security advisories');
    
    if (vulnerability.severity === 'critical') {
      recommendations.unshift('Apply this fix immediately in emergency maintenance window');
    }
    
    return recommendations;
  }

  /**
   * Process security chat messages
   */
  async processSecurityChat(message: string, context: any): Promise<any> {
    try {
      if (this.openai && process.env.OPENAI_API_KEY) {
        const response = await this.openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a security expert assistant. Provide helpful, accurate security guidance based on the context. Be concise and actionable."
            },
            {
              role: "user",
              content: `Context: ${JSON.stringify(context)}\n\nQuestion: ${message}`
            }
          ]
        });

        return {
          response: response.choices[0].message.content,
          confidence: 0.9,
          suggestions: [
            "Review latest security advisories",
            "Check for additional vulnerabilities",
            "Implement security monitoring"
          ]
        };
      }

      // Fallback response
      return {
        response: "I'm here to help with security questions. Please provide more details about your specific concern.",
        confidence: 0.6,
        suggestions: [
          "Check vulnerability databases",
          "Review security best practices",
          "Consider security scanning"
        ]
      };
    } catch (error) {
      console.error('Error processing security chat:', error);
      throw new Error('Failed to process chat message');
    }
  }

}

export const aiSecurityEngine = new AISecurityEngine();