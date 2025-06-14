import OpenAI from "openai";

// Initialize OpenAI with proper error handling
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (error) {
  console.warn('OpenAI initialization failed:', error);
}

interface VulnerabilityContext {
  cveId: string;
  severity: string;
  packageName: string;
  packageVersion: string;
  repositoryId: number;
  businessCriticality: 'low' | 'medium' | 'high' | 'critical';
  exposureLevel: 'internal' | 'external' | 'public';
  dataAccess: string[];
  dependencies: string[];
}

interface ThreatIntelligence {
  exploitAvailable: boolean;
  exploitMaturity: 'unproven' | 'proof_of_concept' | 'functional' | 'weaponized';
  attackComplexity: 'low' | 'medium' | 'high';
  threatActorActivity: boolean;
  industryTargeting: string[];
  recentIncidents: number;
  patchAvailable: boolean;
  patchComplexity: 'simple' | 'moderate' | 'complex';
}

interface EnhancedRiskScore {
  alertId: number;
  cveId: string;
  baseScore: number;
  contextualScore: number;
  finalRiskScore: number;
  confidenceLevel: number;
  priorityLevel: 'low' | 'medium' | 'high' | 'critical';
  timeToExploit: string;
  businessImpact: number;
  remediationUrgency: 'immediate' | 'high' | 'medium' | 'low';
  reasoning: string;
  mitigatingFactors: string[];
  aggravatingFactors: string[];
  recommendedActions: string[];
  estimatedEffort: string;
}

export class AdvancedRiskScoring {
  
  /**
   * Calculate enhanced risk score using AI and threat intelligence
   */
  async calculateEnhancedRiskScore(
    alertId: number,
    context: VulnerabilityContext
  ): Promise<EnhancedRiskScore> {
    
    // Gather threat intelligence
    const threatIntel = await this.gatherThreatIntelligence(context.cveId);
    
    // Get repository context
    const repoContext = await this.getRepositoryContext(context.repositoryId);
    
    // Calculate base CVSS-like score
    const baseScore = await this.calculateBaseScore(context);
    
    // Apply contextual adjustments using AI
    const contextualAdjustments = await this.calculateContextualAdjustments(
      context,
      threatIntel,
      repoContext
    );
    
    // Calculate final risk score
    const finalScore = this.calculateFinalScore(baseScore.score, contextualAdjustments);
    
    // Generate AI-powered analysis and recommendations
    const analysis = await this.generateRiskAnalysis(context, threatIntel, finalScore);
    
    return {
      alertId,
      cveId: context.cveId,
      baseScore: baseScore.score,
      contextualScore: contextualAdjustments.adjustedScore,
      finalRiskScore: finalScore,
      confidenceLevel: analysis.confidence,
      priorityLevel: this.determinePriorityLevel(finalScore),
      timeToExploit: analysis.timeToExploit,
      businessImpact: analysis.businessImpact,
      remediationUrgency: analysis.urgency,
      reasoning: analysis.reasoning,
      mitigatingFactors: analysis.mitigatingFactors,
      aggravatingFactors: analysis.aggravatingFactors,
      recommendedActions: analysis.recommendations,
      estimatedEffort: analysis.estimatedEffort
    };
  }

  /**
   * Gather real-time threat intelligence
   */
  private async gatherThreatIntelligence(cveId: string): Promise<ThreatIntelligence> {
    // In production, this would integrate with real threat intelligence feeds
    // For now, we'll use AI to simulate intelligent analysis
    
    const prompt = `Analyze the threat landscape for CVE ${cveId}. Consider:
    - Exploit availability and maturity
    - Attack complexity
    - Threat actor activity
    - Industry targeting patterns
    - Recent security incidents
    - Patch availability and complexity
    
    Respond with a JSON object containing threat intelligence data.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a cybersecurity threat intelligence analyst. Provide realistic threat intelligence data based on CVE patterns."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const intel = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        exploitAvailable: intel.exploitAvailable || false,
        exploitMaturity: intel.exploitMaturity || 'unproven',
        attackComplexity: intel.attackComplexity || 'medium',
        threatActorActivity: intel.threatActorActivity || false,
        industryTargeting: intel.industryTargeting || [],
        recentIncidents: intel.recentIncidents || 0,
        patchAvailable: intel.patchAvailable || true,
        patchComplexity: intel.patchComplexity || 'moderate'
      };
    } catch (error) {
      console.error('Error gathering threat intelligence:', error);
      return {
        exploitAvailable: false,
        exploitMaturity: 'unproven',
        attackComplexity: 'medium',
        threatActorActivity: false,
        industryTargeting: [],
        recentIncidents: 0,
        patchAvailable: true,
        patchComplexity: 'moderate'
      };
    }
  }

  /**
   * Calculate base vulnerability score
   */
  private async calculateBaseScore(context: VulnerabilityContext): Promise<{ score: number; factors: string[] }> {
    let score = 0;
    const factors: string[] = [];

    // Severity mapping
    const severityScores = {
      'critical': 9.0,
      'high': 7.0,
      'medium': 4.0,
      'low': 2.0
    };

    score = severityScores[context.severity.toLowerCase() as keyof typeof severityScores] || 4.0;
    factors.push(`Base severity: ${context.severity}`);

    // Business criticality multiplier
    const criticalityMultipliers = {
      'critical': 1.5,
      'high': 1.2,
      'medium': 1.0,
      'low': 0.8
    };

    const multiplier = criticalityMultipliers[context.businessCriticality];
    score *= multiplier;
    factors.push(`Business criticality: ${context.businessCriticality} (${multiplier}x)`);

    // Exposure level adjustment
    const exposureAdjustments = {
      'public': 2.0,
      'external': 1.5,
      'internal': 1.0
    };

    const exposureAdj = exposureAdjustments[context.exposureLevel];
    score *= exposureAdj;
    factors.push(`Exposure level: ${context.exposureLevel} (${exposureAdj}x)`);

    return { score: Math.min(score, 10), factors };
  }

  /**
   * Calculate contextual adjustments using AI
   */
  private async calculateContextualAdjustments(
    context: VulnerabilityContext,
    threatIntel: ThreatIntelligence,
    repoContext: any
  ): Promise<{ adjustedScore: number; adjustments: string[] }> {
    
    const prompt = `Analyze this vulnerability context and provide risk adjustments:

Vulnerability: ${context.cveId}
Package: ${context.packageName}@${context.packageVersion}
Business Criticality: ${context.businessCriticality}
Exposure: ${context.exposureLevel}
Data Access: ${context.dataAccess.join(', ')}

Threat Intelligence:
- Exploit Available: ${threatIntel.exploitAvailable}
- Exploit Maturity: ${threatIntel.exploitMaturity}
- Attack Complexity: ${threatIntel.attackComplexity}
- Threat Actor Activity: ${threatIntel.threatActorActivity}
- Recent Incidents: ${threatIntel.recentIncidents}

Repository Context: ${JSON.stringify(repoContext)}

Provide contextual risk adjustments as a JSON object with:
- adjustmentFactor (0.5 to 2.0)
- adjustments (array of adjustment reasons)`;

    try {
      if (!openai) {
        throw new Error('OpenAI API key not configured - contextual risk analysis unavailable');
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a cybersecurity risk analyst. Provide realistic risk adjustments based on context."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      });

      const adjustments = JSON.parse(response.choices[0].message.content || '{"adjustmentFactor": 1.0, "adjustments": []}');
      
      return {
        adjustedScore: adjustments.adjustmentFactor || 1.0,
        adjustments: adjustments.adjustments || []
      };
    } catch (error) {
      console.error('Error calculating contextual adjustments:', error);
      return {
        adjustedScore: 1.0,
        adjustments: ['Error calculating contextual adjustments']
      };
    }
  }

  /**
   * Generate comprehensive AI-powered risk analysis
   */
  private async generateRiskAnalysis(
    context: VulnerabilityContext,
    threatIntel: ThreatIntelligence,
    finalScore: number
  ): Promise<{
    confidence: number;
    timeToExploit: string;
    businessImpact: number;
    urgency: 'immediate' | 'high' | 'medium' | 'low';
    reasoning: string;
    mitigatingFactors: string[];
    aggravatingFactors: string[];
    recommendations: string[];
    estimatedEffort: string;
  }> {
    
    const prompt = `Provide comprehensive risk analysis for this vulnerability:

CVE: ${context.cveId}
Final Risk Score: ${finalScore}/10
Package: ${context.packageName}@${context.packageVersion}
Business Criticality: ${context.businessCriticality}
Exposure: ${context.exposureLevel}

Threat Intelligence:
- Exploit Available: ${threatIntel.exploitAvailable}
- Exploit Maturity: ${threatIntel.exploitMaturity}
- Attack Complexity: ${threatIntel.attackComplexity}
- Threat Actor Activity: ${threatIntel.threatActorActivity}
- Patch Available: ${threatIntel.patchAvailable}
- Patch Complexity: ${threatIntel.patchComplexity}

Provide analysis as JSON with:
- confidence (0-100)
- timeToExploit (e.g., "hours", "days", "weeks")
- businessImpact (1-10)
- urgency ("immediate", "high", "medium", "low")
- reasoning (detailed explanation)
- mitigatingFactors (array)
- aggravatingFactors (array)  
- recommendations (array of specific actions)
- estimatedEffort (e.g., "2-4 hours", "1-2 days")`;

    try {
      if (!openai) {
        throw new Error('OpenAI API key not configured - enhanced risk analysis unavailable');
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a senior cybersecurity analyst providing detailed vulnerability risk analysis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        confidence: analysis.confidence || 75,
        timeToExploit: analysis.timeToExploit || 'unknown',
        businessImpact: analysis.businessImpact || 5,
        urgency: analysis.urgency || 'medium',
        reasoning: analysis.reasoning || 'Standard vulnerability analysis',
        mitigatingFactors: analysis.mitigatingFactors || [],
        aggravatingFactors: analysis.aggravatingFactors || [],
        recommendations: analysis.recommendations || [],
        estimatedEffort: analysis.estimatedEffort || 'unknown'
      };
    } catch (error) {
      console.error('Error generating risk analysis:', error);
      return {
        confidence: 50,
        timeToExploit: 'unknown',
        businessImpact: 5,
        urgency: 'medium',
        reasoning: 'Error generating detailed analysis',
        mitigatingFactors: [],
        aggravatingFactors: [],
        recommendations: ['Review vulnerability manually'],
        estimatedEffort: 'unknown'
      };
    }
  }

  /**
   * Get repository context for analysis
   */
  private async getRepositoryContext(repositoryId: number): Promise<any> {
    // This would integrate with your repository data
    return {
      framework: 'Node.js',
      environment: 'production',
      hasTests: true,
      deploymentFrequency: 'daily',
      monitoringLevel: 'comprehensive'
    };
  }

  /**
   * Calculate final weighted score
   */
  private calculateFinalScore(baseScore: number, contextualAdjustments: { adjustedScore: number }): number {
    const finalScore = baseScore * contextualAdjustments.adjustedScore;
    return Math.min(Math.max(finalScore, 0), 10);
  }

  /**
   * Determine priority level based on final score
   */
  private determinePriorityLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 9.0) return 'critical';
    if (score >= 7.0) return 'high';
    if (score >= 4.0) return 'medium';
    return 'low';
  }

  /**
   * Batch process multiple vulnerabilities for comparative analysis
   */
  async batchAnalyzeVulnerabilities(contexts: VulnerabilityContext[]): Promise<EnhancedRiskScore[]> {
    const results = await Promise.all(
      contexts.map(context => this.calculateEnhancedRiskScore(context.repositoryId, context))
    );

    // Sort by final risk score for prioritization
    return results.sort((a, b) => b.finalRiskScore - a.finalRiskScore);
  }
}

export const advancedRiskScoring = new AdvancedRiskScoring();