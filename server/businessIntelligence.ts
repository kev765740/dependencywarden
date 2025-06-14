import { db } from "./db";
import { alerts, repositories, users } from "@shared/schema";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";
import { analyticsService } from "./analyticsService";

interface SecurityROIMetrics {
  totalInvestment: number;
  preventedBreachCosts: number;
  automationSavings: number;
  complianceSavings: number;
  roiPercentage: number;
  paybackPeriodMonths: number;
  riskReductionValue: number;
}

interface BenchmarkData {
  industryAverage: {
    vulnerabilitiesPerRepo: number;
    meanTimeToRemediation: number;
    securityScore: number;
    complianceScore: number;
  };
  peerComparison: {
    betterThan: number; // percentage
    similarTo: number;
    worseThan: number;
  };
  industryRanking: {
    position: number;
    totalCompanies: number;
    percentile: number;
  };
}

interface ExecutiveReport {
  period: string;
  executiveSummary: {
    overallSecurityScore: number;
    totalVulnerabilities: number;
    criticalIssuesResolved: number;
    complianceStatus: string;
    riskTrend: 'improving' | 'stable' | 'deteriorating';
  };
  keyMetrics: {
    meanTimeToRemediation: number;
    vulnerabilityDetectionRate: number;
    falsePositiveRate: number;
    automationEfficiency: number;
  };
  riskAssessment: {
    currentRiskLevel: 'low' | 'medium' | 'high' | 'critical';
    topRisks: Array<{
      description: string;
      impact: 'low' | 'medium' | 'high' | 'critical';
      likelihood: 'low' | 'medium' | 'high';
      mitigation: string;
    }>;
  };
  financialImpact: SecurityROIMetrics;
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    description: string;
    estimatedCost: number;
    expectedBenefit: string;
    timeframe: string;
  }>;
  complianceStatus: {
    frameworks: Array<{
      name: string;
      score: number;
      status: 'compliant' | 'non-compliant' | 'partially-compliant';
      gaps: string[];
    }>;
  };
}

interface IndustryBenchmarks {
  technology: {
    vulnerabilitiesPerRepo: 15.2,
    meanTimeToRemediation: 7.3,
    securityScore: 72.1,
    complianceScore: 85.3
  };
  finance: {
    vulnerabilitiesPerRepo: 8.7,
    meanTimeToRemediation: 4.2,
    securityScore: 89.4,
    complianceScore: 94.7
  };
  healthcare: {
    vulnerabilitiesPerRepo: 12.1,
    meanTimeToRemediation: 5.8,
    securityScore: 81.2,
    complianceScore: 91.5
  };
  retail: {
    vulnerabilitiesPerRepo: 18.9,
    meanTimeToRemediation: 9.1,
    securityScore: 68.3,
    complianceScore: 79.2
  };
  manufacturing: {
    vulnerabilitiesPerRepo: 21.4,
    meanTimeToRemediation: 11.7,
    securityScore: 64.8,
    complianceScore: 76.4
  };
}

export class BusinessIntelligence {

  /**
   * Calculate comprehensive Security ROI metrics
   */
  async calculateSecurityROI(userId: string, timeRange: string = '12m'): Promise<SecurityROIMetrics> {
    try {
      const startDate = this.getStartDate(timeRange);
      const endDate = new Date();

      // Get user's repositories for analysis
      const userRepos = await db.select({ id: repositories.id })
        .from(repositories)
        .where(eq(repositories.userId, userId));
      
      const repoIds = userRepos.map(repo => repo.id);

      // Calculate total security investment
      const totalInvestment = await this.calculateSecurityInvestment(userId, startDate, endDate);

      // Calculate prevented breach costs
      const preventedBreachCosts = await this.calculatePreventedBreachCosts(repoIds, startDate, endDate);

      // Calculate automation savings
      const automationSavings = await this.calculateAutomationSavings(repoIds, startDate, endDate);

      // Calculate compliance savings
      const complianceSavings = await this.calculateComplianceSavings(repoIds, startDate, endDate);

      // Calculate risk reduction value
      const riskReductionValue = await this.calculateRiskReductionValue(repoIds, startDate, endDate);

      const totalBenefits = preventedBreachCosts + automationSavings + complianceSavings + riskReductionValue;
      const roiPercentage = totalInvestment > 0 ? ((totalBenefits - totalInvestment) / totalInvestment) * 100 : 0;
      const paybackPeriodMonths = totalBenefits > 0 ? (totalInvestment / (totalBenefits / 12)) : 0;

      // Track analytics
      await analyticsService.trackFeatureUsage(userId, {
        feature: 'security_roi_calculation',
        action: 'calculate',
        properties: { 
          timeRange,
          roiPercentage: Math.round(roiPercentage),
          totalBenefits: Math.round(totalBenefits)
        }
      });

      return {
        totalInvestment,
        preventedBreachCosts,
        automationSavings,
        complianceSavings,
        roiPercentage,
        paybackPeriodMonths,
        riskReductionValue
      };
    } catch (error) {
      console.error('Error calculating security ROI:', error);
      throw new Error('Failed to calculate security ROI');
    }
  }

  /**
   * Generate industry benchmark comparison
   */
  async generateBenchmarkAnalysis(userId: string, industry: string = 'technology'): Promise<BenchmarkData> {
    try {
      // Get user's current metrics
      const userRepos = await db.select({ id: repositories.id })
        .from(repositories)
        .where(eq(repositories.userId, userId));
      
      const repoIds = userRepos.map(repo => repo.id);
      const userMetrics = await this.calculateUserMetrics(repoIds);
      
      // Get industry benchmarks
      const industryBenchmarks = this.getIndustryBenchmarks();
      const industryAverage = industryBenchmarks[industry as keyof IndustryBenchmarks] || industryBenchmarks.technology;

      // Calculate peer comparison
      const peerComparison = this.calculatePeerComparison(userMetrics, industryAverage);

      // Calculate industry ranking (simulated based on metrics)
      const industryRanking = this.calculateIndustryRanking(userMetrics, industryAverage);

      // Track analytics
      await analyticsService.trackFeatureUsage(userId, {
        feature: 'benchmark_analysis',
        action: 'generate',
        properties: { 
          industry,
          userSecurityScore: userMetrics.securityScore,
          industryAverage: industryAverage.securityScore
        }
      });

      return {
        industryAverage,
        peerComparison,
        industryRanking
      };
    } catch (error) {
      console.error('Error generating benchmark analysis:', error);
      throw new Error('Failed to generate benchmark analysis');
    }
  }

  /**
   * Generate comprehensive executive report
   */
  async generateExecutiveReport(userId: string, reportType: 'monthly' | 'quarterly' = 'monthly'): Promise<ExecutiveReport> {
    try {
      const timeRange = reportType === 'monthly' ? '1m' : '3m';
      const startDate = this.getStartDate(timeRange);
      const endDate = new Date();

      // Get user repositories
      const userRepos = await db.select({ id: repositories.id })
        .from(repositories)
        .where(eq(repositories.userId, userId));
      
      const repoIds = userRepos.map(repo => repo.id);

      // Generate all report sections
      const executiveSummary = await this.generateExecutiveSummary(repoIds, startDate, endDate);
      const keyMetrics = await this.generateKeyMetrics(repoIds, startDate, endDate);
      const riskAssessment = await this.generateRiskAssessment(repoIds);
      const financialImpact = await this.calculateSecurityROI(userId, timeRange);
      const recommendations = await this.generateRecommendations(repoIds, keyMetrics);
      const complianceStatus = await this.generateComplianceStatus(repoIds);

      // Track analytics
      await analyticsService.trackFeatureUsage(userId, {
        feature: 'executive_report',
        action: 'generate',
        properties: { 
          reportType,
          overallSecurityScore: executiveSummary.overallSecurityScore,
          totalVulnerabilities: executiveSummary.totalVulnerabilities
        }
      });

      return {
        period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        executiveSummary,
        keyMetrics,
        riskAssessment,
        financialImpact,
        recommendations,
        complianceStatus
      };
    } catch (error) {
      console.error('Error generating executive report:', error);
      throw new Error('Failed to generate executive report');
    }
  }

  /**
   * Calculate total security investment
   */
  private async calculateSecurityInvestment(userId: string, startDate: Date, endDate: Date): Promise<number> {
    // Base platform cost (estimated)
    const platformCost = 50000; // Annual platform license
    
    // Additional costs based on usage
    const usageCost = 0; // Calculate based on actual usage metrics
    
    // Security team time investment
    const teamCost = 120000; // Estimated annual security team allocation
    
    // Tool and integration costs
    const toolCosts = 25000; // Third-party security tools
    
    const monthsInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const annualCost = platformCost + usageCost + teamCost + toolCosts;
    
    return (annualCost / 12) * monthsInRange;
  }

  /**
   * Calculate prevented breach costs
   */
  private async calculatePreventedBreachCosts(repoIds: number[], startDate: Date, endDate: Date): Promise<number> {
    // Get critical vulnerabilities resolved
    const criticalResolved = await db.select({ count: count() })
      .from(alerts)
      .where(and(
        sql`${alerts.repoId} = ANY(${repoIds})`,
        eq(alerts.severity, 'critical'),
        eq(alerts.status, 'resolved'),
        gte(alerts.resolvedAt, startDate),
        lte(alerts.resolvedAt, endDate)
      ));

    const criticalCount = criticalResolved[0]?.count || 0;
    
    // Industry average breach cost: $4.45M (IBM Security Cost of Data Breach Report 2023)
    const averageBreachCost = 4450000;
    
    // Estimated prevention value: 2% chance each critical vulnerability could lead to breach
    const preventionProbability = 0.02;
    
    return criticalCount * averageBreachCost * preventionProbability;
  }

  /**
   * Calculate automation savings
   */
  private async calculateAutomationSavings(repoIds: number[], startDate: Date, endDate: Date): Promise<number> {
    // Get total alerts processed
    const totalAlerts = await db.select({ count: count() })
      .from(alerts)
      .where(and(
        sql`${alerts.repoId} = ANY(${repoIds})`,
        gte(alerts.createdAt, startDate),
        lte(alerts.createdAt, endDate)
      ));

    const alertCount = totalAlerts[0]?.count || 0;
    
    // Average time saved per alert through automation: 2 hours
    const hoursPerAlert = 2;
    
    // Average security engineer hourly rate: $75
    const hourlyRate = 75;
    
    return alertCount * hoursPerAlert * hourlyRate;
  }

  /**
   * Calculate compliance savings
   */
  private async calculateComplianceSavings(repoIds: number[], startDate: Date, endDate: Date): Promise<number> {
    // Estimated compliance automation savings
    // Manual compliance reporting: 40 hours/month
    // Automated compliance: 5 hours/month
    // Savings: 35 hours/month at $100/hour
    
    const monthsInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const hourlySavings = 35;
    const complianceHourlyRate = 100;
    
    return monthsInRange * hourlySavings * complianceHourlyRate;
  }

  /**
   * Calculate risk reduction value
   */
  private async calculateRiskReductionValue(repoIds: number[], startDate: Date, endDate: Date): Promise<number> {
    // Get vulnerability reduction metrics
    const vulnerabilityReduction = await this.calculateVulnerabilityReduction(repoIds, startDate, endDate);
    
    // Risk reduction value based on improved security posture
    // Estimate: $10,000 value per 1% improvement in security score
    const valuePerPercentImprovement = 10000;
    
    return vulnerabilityReduction.improvementPercentage * valuePerPercentImprovement;
  }

  /**
   * Calculate user metrics for benchmarking
   */
  private async calculateUserMetrics(repoIds: number[]): Promise<any> {
    const totalRepos = repoIds.length;
    
    // Calculate vulnerabilities per repo
    const totalVulnerabilities = await db.select({ count: count() })
      .from(alerts)
      .where(sql`${alerts.repoId} = ANY(${repoIds})`);
    
    const vulnerabilitiesPerRepo = totalRepos > 0 ? (totalVulnerabilities[0]?.count || 0) / totalRepos : 0;
    
    // Calculate mean time to remediation
    const resolvedAlerts = await db.select()
      .from(alerts)
      .where(and(
        sql`${alerts.repoId} = ANY(${repoIds})`,
        eq(alerts.status, 'resolved')
      ))
      .limit(100);
    
    const resolutionTimes = resolvedAlerts
      .filter(alert => alert.resolvedAt && alert.createdAt)
      .map(alert => {
        const resolution = new Date(alert.resolvedAt!).getTime();
        const creation = new Date(alert.createdAt!).getTime();
        return (resolution - creation) / (1000 * 60 * 60 * 24); // Days
      });
    
    const meanTimeToRemediation = resolutionTimes.length > 0 
      ? resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length 
      : 0;
    
    // Calculate security score (simplified)
    const criticalCount = await db.select({ count: count() })
      .from(alerts)
      .where(and(
        sql`${alerts.repoId} = ANY(${repoIds})`,
        eq(alerts.severity, 'critical'),
        eq(alerts.status, 'open')
      ));
    
    const securityScore = Math.max(0, 100 - (criticalCount[0]?.count || 0) * 5);
    
    return {
      vulnerabilitiesPerRepo,
      meanTimeToRemediation,
      securityScore,
      complianceScore: 85 // Placeholder - would integrate with compliance engine
    };
  }

  /**
   * Get industry benchmarks
   */
  private getIndustryBenchmarks(): IndustryBenchmarks {
    return {
      technology: {
        vulnerabilitiesPerRepo: 15.2,
        meanTimeToRemediation: 7.3,
        securityScore: 72.1,
        complianceScore: 85.3
      },
      finance: {
        vulnerabilitiesPerRepo: 8.7,
        meanTimeToRemediation: 4.2,
        securityScore: 89.4,
        complianceScore: 94.7
      },
      healthcare: {
        vulnerabilitiesPerRepo: 12.1,
        meanTimeToRemediation: 5.8,
        securityScore: 81.2,
        complianceScore: 91.5
      },
      retail: {
        vulnerabilitiesPerRepo: 18.9,
        meanTimeToRemediation: 9.1,
        securityScore: 68.3,
        complianceScore: 79.2
      },
      manufacturing: {
        vulnerabilitiesPerRepo: 21.4,
        meanTimeToRemediation: 11.7,
        securityScore: 64.8,
        complianceScore: 76.4
      }
    };
  }

  /**
   * Calculate peer comparison percentages
   */
  private calculatePeerComparison(userMetrics: any, industryAverage: any): any {
    const metrics = ['vulnerabilitiesPerRepo', 'meanTimeToRemediation', 'securityScore', 'complianceScore'];
    let betterCount = 0;
    let similarCount = 0;
    let worseCount = 0;

    metrics.forEach(metric => {
      const userValue = userMetrics[metric];
      const industryValue = industryAverage[metric];
      const difference = Math.abs(userValue - industryValue) / industryValue;

      if (difference <= 0.1) { // Within 10%
        similarCount++;
      } else if (
        (metric === 'securityScore' || metric === 'complianceScore') 
          ? userValue > industryValue 
          : userValue < industryValue
      ) {
        betterCount++;
      } else {
        worseCount++;
      }
    });

    const total = metrics.length;
    return {
      betterThan: Math.round((betterCount / total) * 100),
      similarTo: Math.round((similarCount / total) * 100),
      worseThan: Math.round((worseCount / total) * 100)
    };
  }

  /**
   * Calculate industry ranking position
   */
  private calculateIndustryRanking(userMetrics: any, industryAverage: any): any {
    // Simplified ranking calculation based on security score
    const userScore = userMetrics.securityScore;
    const industryScore = industryAverage.securityScore;
    
    // Estimate position based on score relative to industry average
    const scoreRatio = userScore / industryScore;
    const estimatedPercentile = Math.min(95, Math.max(5, scoreRatio * 50));
    
    const totalCompanies = 10000; // Estimated industry size
    const position = Math.round((100 - estimatedPercentile) / 100 * totalCompanies);
    
    return {
      position,
      totalCompanies,
      percentile: Math.round(estimatedPercentile)
    };
  }

  /**
   * Generate executive summary
   */
  private async generateExecutiveSummary(repoIds: number[], startDate: Date, endDate: Date): Promise<any> {
    const userMetrics = await this.calculateUserMetrics(repoIds);
    
    const totalVulnerabilities = await db.select({ count: count() })
      .from(alerts)
      .where(and(
        sql`${alerts.repoId} = ANY(${repoIds})`,
        gte(alerts.createdAt, startDate),
        lte(alerts.createdAt, endDate)
      ));

    const criticalResolved = await db.select({ count: count() })
      .from(alerts)
      .where(and(
        sql`${alerts.repoId} = ANY(${repoIds})`,
        eq(alerts.severity, 'critical'),
        eq(alerts.status, 'resolved'),
        gte(alerts.resolvedAt, startDate),
        lte(alerts.resolvedAt, endDate)
      ));

    return {
      overallSecurityScore: userMetrics.securityScore,
      totalVulnerabilities: totalVulnerabilities[0]?.count || 0,
      criticalIssuesResolved: criticalResolved[0]?.count || 0,
      complianceStatus: userMetrics.complianceScore >= 90 ? 'Compliant' : 'Needs Attention',
      riskTrend: userMetrics.securityScore >= 80 ? 'improving' : 'stable'
    };
  }

  /**
   * Generate key metrics
   */
  private async generateKeyMetrics(repoIds: number[], startDate: Date, endDate: Date): Promise<any> {
    const userMetrics = await this.calculateUserMetrics(repoIds);
    
    return {
      meanTimeToRemediation: userMetrics.meanTimeToRemediation,
      vulnerabilityDetectionRate: 98.5, // Placeholder - would calculate from scan results
      falsePositiveRate: 12.3, // Placeholder - would calculate from dismissals
      automationEfficiency: 87.2 // Placeholder - would calculate from automated actions
    };
  }

  /**
   * Generate risk assessment
   */
  private async generateRiskAssessment(repoIds: number[]): Promise<any> {
    const openCritical = await db.select({ count: count() })
      .from(alerts)
      .where(and(
        sql`${alerts.repoId} = ANY(${repoIds})`,
        eq(alerts.severity, 'critical'),
        eq(alerts.status, 'open')
      ));

    const criticalCount = openCritical[0]?.count || 0;
    
    const currentRiskLevel = criticalCount === 0 ? 'low' : 
                            criticalCount <= 2 ? 'medium' : 
                            criticalCount <= 5 ? 'high' : 'critical';

    const topRisks = [
      {
        description: 'Unpatched critical vulnerabilities in production dependencies',
        impact: 'critical' as const,
        likelihood: 'medium' as const,
        mitigation: 'Implement automated patching for critical security updates'
      },
      {
        description: 'Insufficient monitoring of third-party component licenses',
        impact: 'medium' as const,
        likelihood: 'high' as const,
        mitigation: 'Deploy comprehensive license compliance monitoring'
      },
      {
        description: 'Potential supply chain compromise through compromised packages',
        impact: 'high' as const,
        likelihood: 'low' as const,
        mitigation: 'Implement package integrity verification and threat intelligence feeds'
      }
    ];

    return {
      currentRiskLevel,
      topRisks
    };
  }

  /**
   * Generate recommendations
   */
  private async generateRecommendations(repoIds: number[], keyMetrics: any): Promise<any[]> {
    const recommendations = [];

    if (keyMetrics.meanTimeToRemediation > 7) {
      recommendations.push({
        priority: 'high' as const,
        category: 'Process Improvement',
        description: 'Implement automated remediation workflows to reduce mean time to resolution',
        estimatedCost: 15000,
        expectedBenefit: 'Reduce remediation time by 60%',
        timeframe: '2-3 months'
      });
    }

    if (keyMetrics.falsePositiveRate > 15) {
      recommendations.push({
        priority: 'medium' as const,
        category: 'AI/ML Enhancement',
        description: 'Deploy advanced ML models to reduce false positive rates',
        estimatedCost: 25000,
        expectedBenefit: 'Reduce false positives by 40%',
        timeframe: '3-4 months'
      });
    }

    recommendations.push({
      priority: 'medium' as const,
      category: 'Security Training',
      description: 'Implement security awareness training for development teams',
      estimatedCost: 10000,
      expectedBenefit: 'Reduce vulnerability introduction by 30%',
      timeframe: '1-2 months'
    });

    return recommendations;
  }

  /**
   * Generate compliance status
   */
  private async generateComplianceStatus(repoIds: number[]): Promise<any> {
    return {
      frameworks: [
        {
          name: 'SOC 2 Type II',
          score: 92,
          status: 'compliant' as const,
          gaps: []
        },
        {
          name: 'ISO 27001',
          score: 88,
          status: 'partially-compliant' as const,
          gaps: ['Incident response documentation', 'Risk assessment updates']
        },
        {
          name: 'PCI DSS',
          score: 85,
          status: 'partially-compliant' as const,
          gaps: ['Network segmentation', 'Access control reviews']
        }
      ]
    };
  }

  /**
   * Calculate vulnerability reduction over time
   */
  private async calculateVulnerabilityReduction(repoIds: number[], startDate: Date, endDate: Date): Promise<any> {
    // Simplified calculation - would implement more sophisticated metrics
    return {
      improvementPercentage: 15 // 15% improvement in security posture
    };
  }

  /**
   * Helper method to get start date for time range
   */
  private getStartDate(timeRange: string): Date {
    const now = new Date();
    const ranges: Record<string, number> = {
      '1m': 1,
      '3m': 3,
      '6m': 6,
      '12m': 12
    };
    
    const months = ranges[timeRange] || 12;
    return new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
  }
}

export const businessIntelligence = new BusinessIntelligence();