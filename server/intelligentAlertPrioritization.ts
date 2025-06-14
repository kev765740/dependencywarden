import OpenAI from "openai";
import { advancedRiskScoring } from "./advancedRiskScoring";

// Initialize OpenAI with error handling
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (error) {
  console.warn('OpenAI initialization failed:', error);
}

interface Alert {
  id: number;
  cveId: string;
  packageName: string;
  severity: string;
  repositoryId: number;
  createdAt: Date;
  status: 'new' | 'triaged' | 'in_progress' | 'resolved' | 'dismissed';
  assignedTo?: string;
  businessContext: {
    criticality: 'low' | 'medium' | 'high' | 'critical';
    dataAccess: string[];
    userImpact: 'minimal' | 'moderate' | 'significant' | 'severe';
    revenueImpact: number;
  };
}

interface PrioritizationScore {
  alertId: number;
  finalScore: number;
  priorityLevel: 'low' | 'medium' | 'high' | 'critical';
  urgencyRating: 'immediate' | 'today' | 'this_week' | 'next_sprint';
  reasoning: string;
  factors: {
    technicalRisk: number;
    businessImpact: number;
    exploitability: number;
    contextualRelevance: number;
    historicalPattern: number;
  };
  recommendations: {
    immediateActions: string[];
    assignTo: string;
    estimatedEffort: string;
    dependencies: string[];
  };
  suppressionRules?: {
    shouldSuppress: boolean;
    reason: string;
    duration: string;
  };
}

interface TeamContext {
  teamSize: number;
  expertise: string[];
  currentWorkload: number;
  availableHours: number;
  specializations: Map<string, string[]>;
}

export class IntelligentAlertPrioritization {

  /**
   * Prioritize alerts using advanced AI analysis
   */
  async prioritizeAlerts(alerts: Alert[], teamContext: TeamContext): Promise<PrioritizationScore[]> {
    const scores = await Promise.all(
      alerts.map(alert => this.calculatePrioritizationScore(alert, teamContext))
    );

    // Apply cross-alert correlation and deduplication
    const correlatedScores = await this.applyCorrelationAnalysis(scores);

    // Apply intelligent suppression rules
    const filteredScores = await this.applySuppressionRules(correlatedScores);

    // Sort by final priority score
    return filteredScores.sort((a, b) => b.finalScore - a.finalScore);
  }

  /**
   * Calculate comprehensive prioritization score for a single alert
   */
  private async calculatePrioritizationScore(
    alert: Alert,
    teamContext: TeamContext
  ): Promise<PrioritizationScore> {

    // Get enhanced risk analysis
    const riskContext = {
      cveId: alert.cveId,
      severity: alert.severity,
      packageName: alert.packageName,
      packageVersion: '1.0.0', // Would be retrieved from actual data
      repositoryId: alert.repositoryId,
      businessCriticality: alert.businessContext.criticality,
      exposureLevel: 'external' as const,
      dataAccess: alert.businessContext.dataAccess,
      dependencies: []
    };

    const enhancedRisk = await advancedRiskScoring.calculateEnhancedRiskScore(
      alert.id,
      riskContext
    );

    // Calculate individual factor scores
    const factors = await this.calculateFactorScores(alert, enhancedRisk, teamContext);

    // Get AI-powered final analysis
    const aiAnalysis = await this.getAIPrioritizationAnalysis(alert, factors, enhancedRisk);

    // Calculate final weighted score
    const finalScore = this.calculateFinalScore(factors);

    return {
      alertId: alert.id,
      finalScore,
      priorityLevel: this.determinePriorityLevel(finalScore),
      urgencyRating: this.determineUrgencyRating(finalScore, factors),
      reasoning: aiAnalysis.reasoning,
      factors,
      recommendations: aiAnalysis.recommendations,
      suppressionRules: await this.evaluateSuppressionRules(alert, factors)
    };
  }

  /**
   * Calculate individual factor scores
   */
  private async calculateFactorScores(
    alert: Alert,
    enhancedRisk: any,
    teamContext: TeamContext
  ): Promise<{
    technicalRisk: number;
    businessImpact: number;
    exploitability: number;
    contextualRelevance: number;
    historicalPattern: number;
  }> {

    // Technical Risk (0-10)
    const technicalRisk = enhancedRisk.finalRiskScore || 5.0;

    // Business Impact (0-10)
    const businessImpact = this.calculateBusinessImpact(alert);

    // Exploitability (0-10)
    const exploitability = await this.calculateExploitability(alert);

    // Contextual Relevance (0-10)
    const contextualRelevance = await this.calculateContextualRelevance(alert, teamContext);

    // Historical Pattern Analysis (0-10)
    const historicalPattern = await this.calculateHistoricalPattern(alert);

    return {
      technicalRisk,
      businessImpact,
      exploitability,
      contextualRelevance,
      historicalPattern
    };
  }

  /**
   * Calculate business impact score
   */
  private calculateBusinessImpact(alert: Alert): number {
    let score = 0;

    // Base criticality score
    const criticalityScores = {
      'low': 2,
      'medium': 4,
      'high': 7,
      'critical': 10
    };
    score += criticalityScores[alert.businessContext.criticality];

    // User impact multiplier
    const userImpactMultipliers = {
      'minimal': 0.5,
      'moderate': 1.0,
      'significant': 1.5,
      'severe': 2.0
    };
    score *= userImpactMultipliers[alert.businessContext.userImpact];

    // Revenue impact adjustment
    if (alert.businessContext.revenueImpact > 100000) score += 2;
    else if (alert.businessContext.revenueImpact > 50000) score += 1;

    return Math.min(score, 10);
  }

  /**
   * Calculate exploitability score using AI analysis
   */
  private async calculateExploitability(alert: Alert): Promise<number> {
    const prompt = `Analyze the exploitability of this vulnerability:

CVE: ${alert.cveId}
Package: ${alert.packageName}
Severity: ${alert.severity}

Consider:
- Public exploit availability
- Attack complexity
- Required privileges
- Network accessibility
- Proof of concept existence
- Active exploitation in the wild

Provide a score from 0-10 where:
- 0-2: Very difficult to exploit
- 3-4: Moderate difficulty
- 5-6: Relatively easy
- 7-8: Easy with tools available
- 9-10: Trivial exploitation

Respond with JSON containing score and reasoning.`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a cybersecurity expert analyzing vulnerability exploitability."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      return Math.min(Math.max(analysis.score || 5, 0), 10);
    } catch (error) {
      console.error('Error calculating exploitability:', error);
      return 5; // Default moderate score
    }
  }

  /**
   * Calculate contextual relevance based on team and environment
   */
  private async calculateContextualRelevance(
    alert: Alert,
    teamContext: TeamContext
  ): Promise<number> {
    let score = 5; // Base score

    // Team expertise matching
    const hasRelevantExpertise = teamContext.expertise.some(skill =>
      alert.packageName.toLowerCase().includes(skill.toLowerCase()) ||
      alert.cveId.toLowerCase().includes(skill.toLowerCase())
    );
    
    if (hasRelevantExpertise) score += 2;

    // Workload consideration
    if (teamContext.currentWorkload > 80) score -= 1;
    if (teamContext.availableHours < 10) score -= 1;

    // Repository context
    // This would check if the repository is actively maintained, has recent commits, etc.
    score += 1; // Assuming active repository

    return Math.min(Math.max(score, 0), 10);
  }

  /**
   * Analyze historical patterns to predict alert importance
   */
  private async calculateHistoricalPattern(alert: Alert): Promise<number> {
    // This would analyze:
    // - Similar vulnerabilities that were dismissed vs fixed
    // - Time to resolution for similar alerts
    // - False positive rates for this package/vulnerability type
    // - Team's historical response patterns

    // For now, return a calculated score based on available data
    let score = 5;

    // Package popularity and maintenance
    if (alert.packageName.includes('react') || alert.packageName.includes('express')) {
      score += 1; // High-impact packages
    }

    // CVE age (newer CVEs might be more critical)
    const currentYear = new Date().getFullYear();
    const cveYear = parseInt(alert.cveId.split('-')[1]) || currentYear;
    if (currentYear - cveYear < 1) score += 1;

    return Math.min(score, 10);
  }

  /**
   * Get AI-powered prioritization analysis
   */
  private async getAIPrioritizationAnalysis(
    alert: Alert,
    factors: any,
    enhancedRisk: any
  ): Promise<{
    reasoning: string;
    recommendations: {
      immediateActions: string[];
      assignTo: string;
      estimatedEffort: string;
      dependencies: string[];
    };
  }> {

    const prompt = `Provide comprehensive prioritization analysis for this security alert:

Alert Details:
- CVE: ${alert.cveId}
- Package: ${alert.packageName}
- Severity: ${alert.severity}
- Business Criticality: ${alert.businessContext.criticality}
- User Impact: ${alert.businessContext.userImpact}

Risk Factors:
- Technical Risk: ${factors.technicalRisk}/10
- Business Impact: ${factors.businessImpact}/10
- Exploitability: ${factors.exploitability}/10
- Contextual Relevance: ${factors.contextualRelevance}/10
- Historical Pattern: ${factors.historicalPattern}/10

Enhanced Risk Analysis: ${JSON.stringify(enhancedRisk, null, 2)}

Provide detailed analysis as JSON with:
- reasoning (comprehensive explanation of prioritization)
- recommendations object with:
  - immediateActions (array of specific next steps)
  - assignTo (suggested team/role)
  - estimatedEffort (time estimate)
  - dependencies (blocking factors)`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a senior security analyst providing detailed alert prioritization analysis."
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
        reasoning: analysis.reasoning || 'Standard prioritization based on risk factors',
        recommendations: {
          immediateActions: analysis.recommendations?.immediateActions || ['Review vulnerability details'],
          assignTo: analysis.recommendations?.assignTo || 'Security Team',
          estimatedEffort: analysis.recommendations?.estimatedEffort || '2-4 hours',
          dependencies: analysis.recommendations?.dependencies || []
        }
      };
    } catch (error) {
      console.error('Error getting AI prioritization analysis:', error);
      return {
        reasoning: 'Error generating detailed analysis',
        recommendations: {
          immediateActions: ['Manual review required'],
          assignTo: 'Security Team',
          estimatedEffort: 'Unknown',
          dependencies: []
        }
      };
    }
  }

  /**
   * Calculate final weighted priority score
   */
  private calculateFinalScore(factors: any): number {
    // Weighted scoring based on enterprise priorities
    const weights = {
      technicalRisk: 0.25,
      businessImpact: 0.30,
      exploitability: 0.25,
      contextualRelevance: 0.15,
      historicalPattern: 0.05
    };

    const score = 
      factors.technicalRisk * weights.technicalRisk +
      factors.businessImpact * weights.businessImpact +
      factors.exploitability * weights.exploitability +
      factors.contextualRelevance * weights.contextualRelevance +
      factors.historicalPattern * weights.historicalPattern;

    return Math.min(Math.max(score, 0), 10);
  }

  /**
   * Apply correlation analysis to identify related alerts
   */
  private async applyCorrelationAnalysis(scores: PrioritizationScore[]): Promise<PrioritizationScore[]> {
    // Group by package or CVE family
    const packageGroups = new Map<string, PrioritizationScore[]>();
    
    scores.forEach(score => {
      const key = `package_group`; // Would extract package family
      if (!packageGroups.has(key)) {
        packageGroups.set(key, []);
      }
      packageGroups.get(key)!.push(score);
    });

    // Adjust scores based on correlation
    packageGroups.forEach(group => {
      if (group.length > 1) {
        // If multiple related alerts, boost the highest priority one
        group.sort((a, b) => b.finalScore - a.finalScore);
        group[0].finalScore = Math.min(group[0].finalScore * 1.2, 10);
        
        // Lower priority for others in the group
        for (let i = 1; i < group.length; i++) {
          group[i].finalScore *= 0.8;
        }
      }
    });

    return scores;
  }

  /**
   * Apply intelligent suppression rules
   */
  private async applySuppressionRules(scores: PrioritizationScore[]): Promise<PrioritizationScore[]> {
    return scores.filter(score => {
      if (score.suppressionRules?.shouldSuppress) {
        console.log(`Suppressing alert ${score.alertId}: ${score.suppressionRules.reason}`);
        return false;
      }
      return true;
    });
  }

  /**
   * Evaluate if alert should be suppressed
   */
  private async evaluateSuppressionRules(
    alert: Alert,
    factors: any
  ): Promise<{
    shouldSuppress: boolean;
    reason: string;
    duration: string;
  }> {

    // Low priority alerts in low criticality repos
    if (factors.technicalRisk < 3 && alert.businessContext.criticality === 'low') {
      return {
        shouldSuppress: true,
        reason: 'Low risk in non-critical system',
        duration: '30 days'
      };
    }

    // Very old CVEs in inactive projects
    const cveYear = parseInt(alert.cveId.split('-')[1]) || new Date().getFullYear();
    if (new Date().getFullYear() - cveYear > 3 && factors.contextualRelevance < 4) {
      return {
        shouldSuppress: true,
        reason: 'Old CVE in inactive project',
        duration: '90 days'
      };
    }

    return {
      shouldSuppress: false,
      reason: '',
      duration: ''
    };
  }

  /**
   * Determine priority level from score
   */
  private determinePriorityLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 8.5) return 'critical';
    if (score >= 6.5) return 'high';
    if (score >= 4.0) return 'medium';
    return 'low';
  }

  /**
   * Determine urgency rating
   */
  private determineUrgencyRating(
    score: number,
    factors: any
  ): 'immediate' | 'today' | 'this_week' | 'next_sprint' {
    if (score >= 9.0 || factors.exploitability >= 8) return 'immediate';
    if (score >= 7.0) return 'today';
    if (score >= 5.0) return 'this_week';
    return 'next_sprint';
  }

  /**
   * Generate prioritized alert queue for team
   */
  async generateAlertQueue(
    alerts: Alert[],
    teamContext: TeamContext,
    maxQueueSize: number = 20
  ): Promise<{
    prioritizedAlerts: PrioritizationScore[];
    queueMetrics: {
      totalAlerts: number;
      suppressed: number;
      highPriority: number;
      estimatedWorkload: string;
    };
    recommendations: string[];
  }> {

    const prioritizedAlerts = await this.prioritizeAlerts(alerts, teamContext);
    const topAlerts = prioritizedAlerts.slice(0, maxQueueSize);

    const metrics = {
      totalAlerts: alerts.length,
      suppressed: alerts.length - prioritizedAlerts.length,
      highPriority: prioritizedAlerts.filter(a => ['high', 'critical'].includes(a.priorityLevel)).length,
      estimatedWorkload: this.calculateWorkloadEstimate(topAlerts)
    };

    const recommendations = await this.generateQueueRecommendations(topAlerts, teamContext);

    return {
      prioritizedAlerts: topAlerts,
      queueMetrics: metrics,
      recommendations
    };
  }

  /**
   * Calculate workload estimate
   */
  private calculateWorkloadEstimate(alerts: PrioritizationScore[]): string {
    const totalHours = alerts.reduce((sum, alert) => {
      const effort = alert.recommendations.estimatedEffort;
      const hours = this.parseEffortToHours(effort);
      return sum + hours;
    }, 0);

    if (totalHours < 8) return `${totalHours} hours`;
    const days = Math.ceil(totalHours / 8);
    return `${days} day${days > 1 ? 's' : ''}`;
  }

  /**
   * Parse effort string to hours
   */
  private parseEffortToHours(effort: string): number {
    const hourMatch = effort.match(/(\d+).*hour/i);
    if (hourMatch) return parseInt(hourMatch[1]);
    
    const dayMatch = effort.match(/(\d+).*day/i);
    if (dayMatch) return parseInt(dayMatch[1]) * 8;
    
    return 4; // Default 4 hours
  }

  /**
   * Generate recommendations for alert queue management
   */
  private async generateQueueRecommendations(
    alerts: PrioritizationScore[],
    teamContext: TeamContext
  ): Promise<string[]> {
    
    const recommendations: string[] = [];
    
    const criticalCount = alerts.filter(a => a.priorityLevel === 'critical').length;
    if (criticalCount > 0) {
      recommendations.push(`${criticalCount} critical alert${criticalCount > 1 ? 's' : ''} require immediate attention`);
    }

    if (teamContext.currentWorkload > 90) {
      recommendations.push('Team workload is high - consider deferring non-critical alerts');
    }

    const immediateAlerts = alerts.filter(a => a.urgencyRating === 'immediate').length;
    if (immediateAlerts > teamContext.availableHours / 4) {
      recommendations.push('Immediate alerts exceed available capacity - escalate to additional resources');
    }

    return recommendations;
  }
}

export const intelligentAlertPrioritization = new IntelligentAlertPrioritization();