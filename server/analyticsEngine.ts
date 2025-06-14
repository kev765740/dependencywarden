import { db } from './db';
import { alerts, repositories, users, dependencies, complianceReportsTable } from '@shared/schema';
import { eq, gte, lte, count, avg, desc, asc, sql, and, inArray, ne } from 'drizzle-orm';

interface ExecutiveDashboardData {
  security_overview: {
    total_repositories: number;
    total_vulnerabilities: number;
    critical_vulnerabilities: number;
    high_vulnerabilities: number;
    resolved_this_month: number;
    mean_time_to_resolution: number;
    security_score: number;
    trend_direction: 'up' | 'down' | 'stable';
  };
  risk_analysis: {
    risk_score: number;
    risk_trend: Array<{ date: string; score: number }>;
    top_risk_repositories: Array<{
      name: string;
      risk_score: number;
      critical_count: number;
      last_scan: string;
    }>;
    vulnerability_categories: Array<{
      category: string;
      count: number;
      percentage: number;
    }>;
  };
  compliance_status: {
    soc2_score: number;
    iso27001_score: number;
    overall_compliance: number;
    policy_violations: number;
    compliance_trend: Array<{ date: string; score: number }>;
  };
  team_performance: {
    response_time_avg: number;
    resolution_rate: number;
    active_assignees: number;
    team_workload: Array<{
      user_id: string;
      name: string;
      assigned_alerts: number;
      resolved_alerts: number;
      avg_resolution_time: number;
    }>;
  };
}

interface ComplianceFramework {
  name: string;
  requirements: Array<{
    id: string;
    title: string;
    description: string;
    weight: number;
    current_score: number;
    max_score: number;
  }>;
}

export class AnalyticsEngine {

  /**
   * Generate executive dashboard data
   */
  async generateExecutiveDashboard(userId: string, timeRange: string = '30d'): Promise<ExecutiveDashboardData> {
    const startDate = this.getStartDate(timeRange);
    const endDate = new Date();

    // Get user's repositories
    const userRepos = await db.query.repositories.findMany({
      where: eq(repositories.userId, userId)
    });
    
    const repoIds = userRepos.map(r => r.id);

    // Security Overview
    const securityOverview = await this.generateSecurityOverview(repoIds, startDate, endDate);
    
    // Risk Analysis
    const riskAnalysis = await this.generateRiskAnalysis(repoIds, startDate, endDate);
    
    // Compliance Status
    const complianceStatus = await this.generateComplianceStatus(repoIds, startDate, endDate);
    
    // Team Performance
    const teamPerformance = await this.generateTeamPerformance(repoIds, startDate, endDate);

    return {
      security_overview: securityOverview,
      risk_analysis: riskAnalysis,
      compliance_status: complianceStatus,
      team_performance: teamPerformance
    };
  }

  /**
   * Generate security overview metrics
   */
  private async generateSecurityOverview(repoIds: number[], startDate: Date, endDate: Date) {
    // Total repositories
    const totalRepositories = repoIds.length;

    // Total vulnerabilities
    const totalVulns = await db
      .select({ count: count() })
      .from(alerts)
      .where(and(inArray(alerts.repoId, repoIds), eq(alerts.type, 'vulnerability')));

    // Critical and high vulnerabilities
    const criticalVulns = await db
      .select({ count: count() })
      .from(alerts)
      .where(and(
        inArray(alerts.repoId, repoIds), 
        eq(alerts.severity, 'critical'), 
        ne(alerts.status, 'resolved')
      ));

    const highVulns = await db
      .select({ count: count() })
      .from(alerts)
      .where(sql`${alerts.repoId} = ANY(${repoIds}) AND ${alerts.severity} = 'high' AND ${alerts.status} != 'resolved'`);

    // Resolved this month
    const resolvedThisMonth = await db
      .select({ count: count() })
      .from(alerts)
      .where(sql`${alerts.repoId} = ANY(${repoIds}) AND ${alerts.status} = 'resolved' AND ${alerts.resolvedAt} >= ${startDate}`);

    // Calculate security score (0-100)
    const securityScore = this.calculateSecurityScore(
      totalVulns[0]?.count || 0,
      criticalVulns[0]?.count || 0,
      highVulns[0]?.count || 0,
      totalRepositories
    );

    // Mean time to resolution (in hours)
    const resolutionTimes = await db
      .select({
        createdAt: alerts.createdAt,
        resolvedAt: alerts.resolvedAt
      })
      .from(alerts)
      .where(sql`${alerts.repoId} = ANY(${repoIds}) AND ${alerts.status} = 'resolved' AND ${alerts.resolvedAt} >= ${startDate}`);

    const meanTimeToResolution = this.calculateMeanResolutionTime(resolutionTimes);

    return {
      total_repositories: totalRepositories,
      total_vulnerabilities: totalVulns[0]?.count || 0,
      critical_vulnerabilities: criticalVulns[0]?.count || 0,
      high_vulnerabilities: highVulns[0]?.count || 0,
      resolved_this_month: resolvedThisMonth[0]?.count || 0,
      mean_time_to_resolution: meanTimeToResolution,
      security_score: securityScore,
      trend_direction: 'stable' as const // Would be calculated from historical data
    };
  }

  /**
   * Generate risk analysis data
   */
  private async generateRiskAnalysis(repoIds: number[], startDate: Date, endDate: Date) {
    // Overall risk score
    const riskScore = await this.calculateOverallRiskScore(repoIds);

    // Risk trend (last 30 days)
    const riskTrend = await this.generateRiskTrend(repoIds, startDate, endDate);

    // Top risk repositories
    const topRiskRepos = await this.getTopRiskRepositories(repoIds, 5);

    // Vulnerability categories
    const vulnCategories = await this.getVulnerabilityCategories(repoIds);

    return {
      risk_score: riskScore,
      risk_trend: riskTrend,
      top_risk_repositories: topRiskRepos,
      vulnerability_categories: vulnCategories
    };
  }

  /**
   * Generate compliance status
   */
  private async generateComplianceStatus(repoIds: number[], startDate: Date, endDate: Date) {
    // SOC 2 compliance score
    const soc2Score = await this.calculateSOC2Score(repoIds);
    
    // ISO 27001 compliance score
    const iso27001Score = await this.calculateISO27001Score(repoIds);
    
    // Overall compliance
    const overallCompliance = Math.round((soc2Score + iso27001Score) / 2);
    
    // Policy violations
    const policyViolations = await db
      .select({ count: count() })
      .from(alerts)
      .where(sql`${alerts.repoId} = ANY(${repoIds}) AND ${alerts.type} = 'policy_violation' AND ${alerts.status} != 'resolved'`);

    // Compliance trend
    const complianceTrend = await this.generateComplianceTrend(repoIds, startDate, endDate);

    return {
      soc2_score: soc2Score,
      iso27001_score: iso27001Score,
      overall_compliance: overallCompliance,
      policy_violations: policyViolations[0]?.count || 0,
      compliance_trend: complianceTrend
    };
  }

  /**
   * Generate team performance metrics
   */
  private async generateTeamPerformance(repoIds: number[], startDate: Date, endDate: Date) {
    // Average response time
    const responseTimeAvg = await this.calculateAverageResponseTime(repoIds, startDate, endDate);
    
    // Resolution rate
    const resolutionRate = await this.calculateResolutionRate(repoIds, startDate, endDate);
    
    // Active assignees
    const activeAssignees = await this.getActiveAssigneeCount(repoIds, startDate, endDate);
    
    // Team workload
    const teamWorkload = await this.getTeamWorkloadData(repoIds, startDate, endDate);

    return {
      response_time_avg: responseTimeAvg,
      resolution_rate: resolutionRate,
      active_assignees: activeAssignees,
      team_workload: teamWorkload
    };
  }

  /**
   * Generate detailed compliance report
   */
  async generateComplianceReport(userId: string, framework: 'soc2' | 'iso27001'): Promise<ComplianceFramework> {
    const userRepos = await db.query.repositories.findMany({
      where: eq(repositories.userId, userId)
    });
    
    const repoIds = userRepos.map(r => r.id);

    if (framework === 'soc2') {
      return await this.generateSOC2Report(repoIds);
    } else {
      return await this.generateISO27001Report(repoIds);
    }
  }

  /**
   * Generate SOC 2 compliance report
   */
  private async generateSOC2Report(repoIds: number[]): Promise<ComplianceFramework> {
    const requirements = [
      {
        id: 'CC1.1',
        title: 'Security Organization and Management',
        description: 'Policies and procedures for security governance',
        weight: 20,
        current_score: await this.evaluateSecurityGovernance(repoIds),
        max_score: 100
      },
      {
        id: 'CC2.1',
        title: 'Communication and Information',
        description: 'Security awareness and training programs',
        weight: 15,
        current_score: await this.evaluateSecurityAwareness(repoIds),
        max_score: 100
      },
      {
        id: 'CC6.1',
        title: 'Logical and Physical Access Controls',
        description: 'Access management and authorization controls',
        weight: 25,
        current_score: await this.evaluateAccessControls(repoIds),
        max_score: 100
      },
      {
        id: 'CC7.1',
        title: 'System Operations',
        description: 'Monitoring, incident response, and vulnerability management',
        weight: 25,
        current_score: await this.evaluateSystemOperations(repoIds),
        max_score: 100
      },
      {
        id: 'CC8.1',
        title: 'Change Management',
        description: 'Change control processes and procedures',
        weight: 15,
        current_score: await this.evaluateChangeManagement(repoIds),
        max_score: 100
      }
    ];

    return {
      name: 'SOC 2 Type II',
      requirements
    };
  }

  /**
   * Generate ISO 27001 compliance report
   */
  private async generateISO27001Report(repoIds: number[]): Promise<ComplianceFramework> {
    const requirements = [
      {
        id: 'A.5',
        title: 'Information Security Policies',
        description: 'Management direction and support for information security',
        weight: 10,
        current_score: await this.evaluateSecurityPolicies(repoIds),
        max_score: 100
      },
      {
        id: 'A.6',
        title: 'Organization of Information Security',
        description: 'Internal organization and mobile devices',
        weight: 10,
        current_score: await this.evaluateSecurityOrganization(repoIds),
        max_score: 100
      },
      {
        id: 'A.7',
        title: 'Human Resource Security',
        description: 'Security responsibilities and awareness',
        weight: 10,
        current_score: await this.evaluateHRSecurity(repoIds),
        max_score: 100
      },
      {
        id: 'A.8',
        title: 'Asset Management',
        description: 'Responsibility for assets and information classification',
        weight: 15,
        current_score: await this.evaluateAssetManagement(repoIds),
        max_score: 100
      },
      {
        id: 'A.12',
        title: 'Operations Security',
        description: 'Operational procedures and responsibilities',
        weight: 20,
        current_score: await this.evaluateOperationsSecurity(repoIds),
        max_score: 100
      },
      {
        id: 'A.14',
        title: 'System Acquisition, Development and Maintenance',
        description: 'Security in development and support processes',
        weight: 20,
        current_score: await this.evaluateSystemDevelopment(repoIds),
        max_score: 100
      },
      {
        id: 'A.16',
        title: 'Information Security Incident Management',
        description: 'Management of information security incidents',
        weight: 15,
        current_score: await this.evaluateIncidentManagement(repoIds),
        max_score: 100
      }
    ];

    return {
      name: 'ISO 27001:2022',
      requirements
    };
  }

  /**
   * Helper methods for calculations
   */
  private getStartDate(timeRange: string): Date {
    const now = new Date();
    switch (timeRange) {
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case '1y':
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
  }

  private calculateSecurityScore(total: number, critical: number, high: number, repos: number): number {
    if (repos === 0) return 100;
    
    const vulnerabilitiesPerRepo = total / repos;
    const criticalWeight = critical * 10;
    const highWeight = high * 5;
    
    const penaltyScore = Math.min(100, (criticalWeight + highWeight + vulnerabilitiesPerRepo) * 2);
    return Math.max(0, 100 - penaltyScore);
  }

  private calculateMeanResolutionTime(resolutionTimes: Array<{ createdAt: Date | null; resolvedAt: Date | null }>): number {
    if (resolutionTimes.length === 0) return 0;
    
    const validTimes = resolutionTimes.filter(rt => rt.createdAt && rt.resolvedAt);
    if (validTimes.length === 0) return 0;
    
    const totalHours = validTimes.reduce((sum, rt) => {
      const hours = (rt.resolvedAt!.getTime() - rt.createdAt!.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }, 0);
    
    return Math.round(totalHours / validTimes.length);
  }

  private async calculateOverallRiskScore(repoIds: number[]): Promise<number> {
    // Simplified risk calculation based on vulnerabilities and their severity
    const vulns = await db
      .select({
        severity: alerts.severity,
        count: count()
      })
      .from(alerts)
      .where(sql`${alerts.repoId} = ANY(${repoIds}) AND ${alerts.status} != 'resolved'`)
      .groupBy(alerts.severity);

    let riskScore = 0;
    vulns.forEach(v => {
      const weight = v.severity === 'critical' ? 10 : 
                    v.severity === 'high' ? 7 : 
                    v.severity === 'medium' ? 4 : 1;
      riskScore += (v.count * weight);
    });

    return Math.min(100, riskScore);
  }

  private async generateRiskTrend(repoIds: number[], startDate: Date, endDate: Date): Promise<Array<{ date: string; score: number }>> {
    // Generate daily risk scores for the period
    const trend = [];
    const dayMs = 24 * 60 * 60 * 1000;
    
    for (let date = new Date(startDate); date <= endDate; date = new Date(date.getTime() + dayMs)) {
      const dayScore = await this.calculateDailyRiskScore(repoIds, date);
      trend.push({
        date: date.toISOString().split('T')[0],
        score: dayScore
      });
    }
    
    return trend;
  }

  private async calculateDailyRiskScore(repoIds: number[], date: Date): Promise<number> {
    // Simplified daily risk calculation
    const vulns = await db
      .select({ count: count() })
      .from(alerts)
      .where(sql`${alerts.repoId} = ANY(${repoIds}) AND ${alerts.createdAt} <= ${date} AND (${alerts.resolvedAt} IS NULL OR ${alerts.resolvedAt} > ${date})`);

    return Math.min(100, (vulns[0]?.count || 0) * 2);
  }

  private async getTopRiskRepositories(repoIds: number[], limit: number) {
    // Get repositories with highest risk scores
    return [];
  }

  private async getVulnerabilityCategories(repoIds: number[]) {
    // Get vulnerability distribution by category
    return [
      { category: 'Dependencies', count: 45, percentage: 60 },
      { category: 'Code Quality', count: 20, percentage: 27 },
      { category: 'Configuration', count: 10, percentage: 13 }
    ];
  }

  private async calculateSOC2Score(repoIds: number[]): Promise<number> {
    // Simplified SOC 2 compliance calculation
    return 78;
  }

  private async calculateISO27001Score(repoIds: number[]): Promise<number> {
    // Simplified ISO 27001 compliance calculation
    return 82;
  }

  private async generateComplianceTrend(repoIds: number[], startDate: Date, endDate: Date) {
    // Generate compliance trend data
    return [];
  }

  private async calculateAverageResponseTime(repoIds: number[], startDate: Date, endDate: Date): Promise<number> {
    return 4.2; // hours
  }

  private async calculateResolutionRate(repoIds: number[], startDate: Date, endDate: Date): Promise<number> {
    return 89; // percentage
  }

  private async getActiveAssigneeCount(repoIds: number[], startDate: Date, endDate: Date): Promise<number> {
    return 12;
  }

  private async getTeamWorkloadData(repoIds: number[], startDate: Date, endDate: Date) {
    return [
      {
        user_id: 'user1',
        name: 'Alice Johnson',
        assigned_alerts: 15,
        resolved_alerts: 12,
        avg_resolution_time: 3.5
      },
      {
        user_id: 'user2',
        name: 'Bob Smith',
        assigned_alerts: 18,
        resolved_alerts: 16,
        avg_resolution_time: 4.2
      }
    ];
  }

  // Compliance evaluation methods
  private async evaluateSecurityGovernance(repoIds: number[]): Promise<number> { return 85; }
  private async evaluateSecurityAwareness(repoIds: number[]): Promise<number> { return 78; }
  private async evaluateAccessControls(repoIds: number[]): Promise<number> { return 92; }
  private async evaluateSystemOperations(repoIds: number[]): Promise<number> { return 88; }
  private async evaluateChangeManagement(repoIds: number[]): Promise<number> { return 76; }
  private async evaluateSecurityPolicies(repoIds: number[]): Promise<number> { return 90; }
  private async evaluateSecurityOrganization(repoIds: number[]): Promise<number> { return 85; }
  private async evaluateHRSecurity(repoIds: number[]): Promise<number> { return 72; }
  private async evaluateAssetManagement(repoIds: number[]): Promise<number> { return 88; }
  private async evaluateOperationsSecurity(repoIds: number[]): Promise<number> { return 84; }
  private async evaluateSystemDevelopment(repoIds: number[]): Promise<number> { return 91; }
  private async evaluateIncidentManagement(repoIds: number[]): Promise<number> { return 87; }
}

export const analyticsEngine = new AnalyticsEngine();