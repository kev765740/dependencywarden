/**
 * Advanced Security Engine
 * Vulnerability remediation suggestions and security policy enforcement
 */

import { db } from "./db";
import { 
  securityPolicies, 
  remediationSuggestions, 
  complianceReportsTable, 
  securityWorkflows,
  alerts,
  repositories,
  dependencies
} from "@shared/schema";
import type { 
  SecurityPolicy, 
  InsertRemediationSuggestion, 
  InsertComplianceReport,
  Alert,
  Repository
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { analyticsService } from "./analyticsService";
import { slackService } from "./slackService";
import { emailService } from "./emailService";
import fetch from "node-fetch";

interface VulnerabilityData {
  id: string;
  summary: string;
  details: string;
  severity: string;
  cvss_score?: number;
  fixed_version?: string;
}

interface RemediationStrategy {
  type: 'upgrade' | 'patch' | 'replace' | 'remove';
  description: string;
  steps: string[];
  confidence: number;
  automationAvailable: boolean;
}

export class SecurityEngine {
  
  /**
   * Generate vulnerability remediation suggestions
   */
  async generateRemediationSuggestions(alertId: number): Promise<void> {
    try {
      const alert = await db.query.alerts.findFirst({
        where: eq(alerts.id, alertId),
        with: {
          repository: true
        }
      });

      if (!alert || alert.alertType !== 'vuln') {
        return;
      }

      const vulnerability = await this.fetchVulnerabilityDetails(alert.dependencyName, alert.newValue);
      const strategy = await this.analyzeRemediationStrategy(
        alert.dependencyName,
        alert.oldValue || 'unknown',
        vulnerability
      );

      const suggestion = {
        alertId: alert.id,
        repoId: alert.repoId,
        dependencyName: alert.dependencyName,
        vulnerabilityId: vulnerability.id,
        currentVersion: alert.oldValue || 'unknown',
        recommendedVersion: vulnerability.fixed_version,
        fixType: strategy.type,
        description: strategy.description,
        remedationSteps: strategy.steps || [],
        confidence: strategy.confidence,
        automationAvailable: strategy.automationAvailable,
        status: 'pending'
      };

      try {
        const createdSuggestions = await db.insert(remediationSuggestions)
          .values([suggestion])
          .returning();
        const createdSuggestion = createdSuggestions[0];

        // Trigger security workflows if applicable
        await this.triggerSecurityWorkflows('vulnerability_detected', {
          alertId: alert.id,
          repoId: alert.repoId,
          severity: alert.severity,
          suggestionId: createdSuggestion.id
        });
      } catch (error) {
        console.error('Error creating remediation suggestion:', error);
      }

      // Track analytics
      await analyticsService.trackAlertGenerated(alert.repository?.userId || 'system', {
        repositoryId: alert.repoId,
        repositoryName: alert.repository?.name || 'Unknown',
        alertType: 'vulnerability' as const,
        alertId: alert.id,
        severity: alert.severity,
        dependencyName: alert.dependencyName
      });

    } catch (error) {
      console.error('Failed to generate remediation suggestions:', error);
    }
  }

  /**
   * Fetch detailed vulnerability information
   */
  private async fetchVulnerabilityDetails(packageName: string, vulnerabilityId: string): Promise<VulnerabilityData> {
    try {
      const response = await fetch(`https://osv.dev/v1/vulns/${vulnerabilityId}`, {
        headers: {
          'User-Agent': 'DependencyWatcher/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`OSV API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        id: (data as any)?.id || vulnerabilityId,
        summary: (data as any)?.summary || 'Vulnerability detected',
        details: (data as any)?.details || 'No details available',
        severity: this.extractSeverity(data),
        cvss_score: this.extractCVSSScore(data),
        fixed_version: this.extractFixedVersion(data, packageName)
      };
    } catch (error) {
      console.error('Failed to fetch vulnerability details:', error);
      return {
        id: vulnerabilityId,
        summary: 'Vulnerability detected',
        details: 'Unable to fetch detailed information',
        severity: 'medium'
      };
    }
  }

  /**
   * Analyze remediation strategy based on vulnerability data
   */
  private async analyzeRemediationStrategy(
    packageName: string, 
    currentVersion: string, 
    vulnerability: VulnerabilityData
  ): Promise<RemediationStrategy> {
    
    if (vulnerability.fixed_version) {
      return {
        type: 'upgrade',
        description: `Upgrade ${packageName} from ${currentVersion} to ${vulnerability.fixed_version} to fix vulnerability`,
        steps: [
          `Update package.json to use ${packageName}@${vulnerability.fixed_version}`,
          'Run npm install to update dependencies',
          'Test application functionality',
          'Commit and deploy changes'
        ],
        confidence: 90,
        automationAvailable: true
      };
    }

    // Check for alternative packages
    const alternatives = await this.findAlternativePackages(packageName);
    if (alternatives.length > 0) {
      return {
        type: 'replace',
        description: `Replace ${packageName} with a secure alternative`,
        steps: [
          `Remove ${packageName} from package.json`,
          `Install alternative package: ${alternatives[0]}`,
          'Update import statements in code',
          'Test application functionality',
          'Commit and deploy changes'
        ],
        confidence: 70,
        automationAvailable: false
      };
    }

    // Last resort - remove if not critical
    return {
      type: 'remove',
      description: `Remove ${packageName} if not essential for application functionality`,
      steps: [
        `Remove ${packageName} from package.json`,
        'Remove all imports and usage from code',
        'Implement alternative solution if needed',
        'Test application functionality',
        'Commit and deploy changes'
      ],
      confidence: 50,
      automationAvailable: false
    };
  }

  /**
   * Enforce security policies for a repository
   */
  async enforceSecurityPolicies(repoId: number): Promise<void> {
    try {
      const repository = await db.query.repositories.findFirst({
        where: eq(repositories.id, repoId)
      });

      if (!repository) {
        return;
      }

      const policies = await db.query.securityPolicies.findMany({
        where: and(
          eq(securityPolicies.userId, Number(repository.userId)),
          eq(securityPolicies.isActive, true)
        )
      });

      for (const policy of policies) {
        await this.evaluatePolicy(repository, policy);
      }

    } catch (error) {
      console.error('Failed to enforce security policies:', error);
    }
  }

  /**
   * Evaluate a single security policy against a repository
   */
  private async evaluatePolicy(repository: Repository, policy: SecurityPolicy): Promise<void> {
    const repoAlerts = await db.query.alerts.findMany({
      where: eq(alerts.repoId, repository.id),
      orderBy: [desc(alerts.createdAt)]
    });

    const repoDependencies = await db.query.dependencies.findMany({
      where: eq(dependencies.repoId, repository.id)
    });

    // Evaluate license compliance
    const licenseViolations = this.checkLicenseCompliance(repoDependencies, policy);
    
    // Evaluate vulnerability severity compliance
    const severityViolations = this.checkSeverityCompliance(repoAlerts, policy);

    // Calculate compliance score
    const totalChecks = repoDependencies.length + repoAlerts.length;
    const violations = licenseViolations.length + severityViolations.length;
    const complianceScore = totalChecks > 0 ? Math.round(((totalChecks - violations) / totalChecks) * 100) : 100;

    // Create compliance report
    const report: InsertComplianceReport = {
      repoId: repository.id,
      policyId: policy.id,
      complianceScore,
      totalDependencies: repoDependencies.length,
      compliantDependencies: repoDependencies.length - licenseViolations.length,
      violatingDependencies: licenseViolations.length,
      criticalViolations: this.countViolationsBySeverity(repoAlerts, 'critical'),
      highViolations: this.countViolationsBySeverity(repoAlerts, 'high'),
      mediumViolations: this.countViolationsBySeverity(repoAlerts, 'medium'),
      lowViolations: this.countViolationsBySeverity(repoAlerts, 'low'),
      reportData: {
        licenseViolations,
        severityViolations,
        policyDetails: {
          allowedLicenses: policy.allowedLicenses,
          blockedLicenses: policy.blockedLicenses,
          maxSeverityLevel: policy.maxSeverityLevel
        }
      },
      status: 'completed'
    };

    await db.insert(complianceReportsTable).values(report);

    // Trigger workflows for violations
    if (violations > 0) {
      await this.triggerSecurityWorkflows('license_violation', {
        repoId: repository.id,
        policyId: policy.id,
        violations: violations,
        complianceScore
      });
    }

    // Send notifications for critical violations
    if (complianceScore < 70) {
      await this.sendComplianceAlert(repository, policy, complianceScore, violations);
    }
  }

  /**
   * Check license compliance against policy
   */
  private checkLicenseCompliance(dependencies: any[], policy: SecurityPolicy): any[] {
    const violations = [];

    for (const dep of dependencies) {
      const license = dep.currentLicense;
      
      if (!license) {
        violations.push({
          dependency: dep.name,
          issue: 'No license information available',
          severity: 'medium'
        });
        continue;
      }

      // Check against blocked licenses
      if (policy.blockedLicenses?.includes(license)) {
        violations.push({
          dependency: dep.name,
          license,
          issue: 'License is explicitly blocked by policy',
          severity: 'high'
        });
        continue;
      }

      // Check against allowed licenses (if specified)
      if (policy.allowedLicenses && policy.allowedLicenses.length > 0 && !policy.allowedLicenses.includes(license)) {
        violations.push({
          dependency: dep.name,
          license,
          issue: 'License is not in allowed list',
          severity: 'medium'
        });
      }
    }

    return violations;
  }

  /**
   * Check severity compliance against policy
   */
  private checkSeverityCompliance(alerts: any[], policy: SecurityPolicy): any[] {
    const violations = [];
    const maxSeverity = policy.maxSeverityLevel || 'medium';
    
    const severityLevels: { [key: string]: number } = { low: 1, medium: 2, high: 3, critical: 4 };
    const maxLevel = severityLevels[maxSeverity] || 2;

    for (const alert of alerts) {
      const alertLevel = severityLevels[alert.severity] || 1;
      
      if (alertLevel > maxLevel) {
        violations.push({
          dependency: alert.dependencyName,
          alertType: alert.alertType,
          severity: alert.severity,
          issue: `Severity ${alert.severity} exceeds policy maximum of ${maxSeverity}`,
          alertId: alert.id
        });
      }
    }

    return violations;
  }

  /**
   * Count violations by severity level
   */
  private countViolationsBySeverity(alerts: any[], severity: string): number {
    return alerts.filter(alert => alert.severity === severity).length;
  }

  /**
   * Trigger security workflows based on events
   */
  async triggerSecurityWorkflows(triggerType: string, context: any): Promise<void> {
    try {
      const workflows = await db.query.securityWorkflows.findMany({
        where: and(
          eq(securityWorkflows.triggerType, triggerType),
          eq(securityWorkflows.isActive, true)
        )
      });

      for (const workflow of workflows) {
        // Check if workflow conditions are met
        if (this.evaluateWorkflowConditions(workflow.triggerConditions, context)) {
          await this.executeWorkflow(workflow, context);
        }
      }
    } catch (error) {
      console.error('Failed to trigger security workflows:', error);
    }
  }

  /**
   * Execute a security workflow
   */
  private async executeWorkflow(workflow: any, context: any): Promise<void> {
    try {
      for (const action of workflow.actions || []) {
        await this.executeWorkflowAction(action, context);
      }

      // Update workflow execution stats
      await db.update(securityWorkflows)
        .set({
          lastExecutedAt: new Date(),
          executionCount: workflow.executionCount + 1
        })
        .where(eq(securityWorkflows.id, workflow.id));

    } catch (error) {
      console.error(`Failed to execute workflow ${workflow.name}:`, error);
    }
  }

  /**
   * Execute individual workflow action
   */
  private async executeWorkflowAction(action: any, context: any): Promise<void> {
    switch (action.type) {
      case 'send_slack_notification':
        await this.sendSlackNotification(action.config, context);
        break;
        
      case 'send_email_alert':
        await this.sendEmailAlert(action.config, context);
        break;
        
      case 'create_github_issue':
        await this.createGitHubIssue(action.config, context);
        break;
        
      case 'auto_remediate':
        await this.autoRemediate(action.config, context);
        break;
        
      default:
        console.warn(`Unknown workflow action type: ${action.type}`);
    }
  }

  /**
   * Send compliance alert notifications
   */
  private async sendComplianceAlert(
    repository: Repository, 
    policy: SecurityPolicy, 
    complianceScore: number, 
    violations: number
  ): Promise<void> {
    const message = `Security compliance alert for repository "${repository.name}": 
    Compliance score: ${complianceScore}% 
    Policy: ${policy.name} 
    Violations: ${violations}`;

    // Send Slack notification
    if (repository.slackWebhookUrl) {
      const alertData = {
        id: 0,
        repoId: repository.id,
        repositoryId: repository.id,
        dependencyName: 'Multiple',
        packageName: 'Multiple',
        packageVersion: null,
        cveId: null,
        alertType: 'compliance',
        oldValue: null,
        newValue: `${Array.isArray(violations) ? violations.length : 0} violations`,
        severity: complianceScore < 50 ? 'critical' : 'high',
        description: message,
        isUsedInCode: null,
        usageCount: null,
        riskScore: 100 - complianceScore,
        status: null,
        type: null,
        resolvedAt: null,
        assigneeId: null,
        fixedVersion: null,
        vulnerabilityType: null,
        createdAt: new Date()
      };
      await slackService.sendSlackNotification(repository.slackWebhookUrl, repository.name, alertData as any, process.env.FRONTEND_URL || 'http://localhost:5000');
    }

    // Send email notification
    const emailAlertData = {
      id: 0,
      repoId: repository.id,
      repositoryId: repository.id,
      dependencyName: 'Policy Compliance',
      packageName: 'Multiple',
      packageVersion: null,
      cveId: null,
      alertType: 'compliance',
      oldValue: null,
      newValue: `Score: ${complianceScore}%`,
      severity: complianceScore < 50 ? 'critical' : 'high',
      description: message,
      isUsedInCode: null,
      usageCount: null,
      riskScore: 100 - complianceScore,
      status: null,
      type: null,
      resolvedAt: null,
      assigneeId: null,
      fixedVersion: null,
      vulnerabilityType: null,
      createdAt: new Date()
    };
    await emailService.sendAlertEmail(repository.ownerEmail, repository.name, emailAlertData as any, process.env.FRONTEND_URL || 'http://localhost:5000');
  }

  /**
   * Helper methods for vulnerability analysis
   */
  private extractSeverity(vulnData: any): string {
    if (vulnData.severity) {
      return vulnData.severity.toLowerCase();
    }
    
    if (vulnData.database_specific?.severity) {
      return vulnData.database_specific.severity.toLowerCase();
    }
    
    const cvssScore = this.extractCVSSScore(vulnData);
    if (cvssScore >= 9.0) return 'critical';
    if (cvssScore >= 7.0) return 'high';
    if (cvssScore >= 4.0) return 'medium';
    return 'low';
  }

  private extractCVSSScore(vulnData: any): number {
    if (vulnData.severity && Array.isArray(vulnData.severity)) {
      for (const sev of vulnData.severity) {
        if (sev.type === 'CVSS_V3' && sev.score) {
          return parseFloat(sev.score);
        }
      }
    }
    return 0;
  }

  private extractFixedVersion(vulnData: any, packageName: string): string | undefined {
    if (vulnData.affected && Array.isArray(vulnData.affected)) {
      for (const affected of vulnData.affected) {
        if (affected.package?.name === packageName && affected.ranges) {
          for (const range of affected.ranges) {
            if (range.events) {
              for (const event of range.events) {
                if (event.fixed) {
                  return event.fixed;
                }
              }
            }
          }
        }
      }
    }
    return undefined;
  }

  private async findAlternativePackages(packageName: string): Promise<string[]> {
    // This would integrate with package recommendation services
    // For now, return empty array
    return [];
  }

  private evaluateWorkflowConditions(conditions: any, context: any): boolean {
    if (!conditions) return true;
    
    // Simple condition evaluation - can be expanded
    if (conditions.severity && context.severity !== conditions.severity) {
      return false;
    }
    
    if (conditions.minConfidence && context.confidence < conditions.minConfidence) {
      return false;
    }
    
    return true;
  }

  private async sendSlackNotification(config: any, context: any): Promise<void> {
    // Implementation for Slack notifications
    console.log('Sending Slack notification:', config, context);
  }

  private async sendEmailAlert(config: any, context: any): Promise<void> {
    // Implementation for email alerts
    console.log('Sending email alert:', config, context);
  }

  private async createGitHubIssue(config: any, context: any): Promise<void> {
    // Implementation for GitHub issue creation
    console.log('Creating GitHub issue:', config, context);
  }

  private async autoRemediate(config: any, context: any): Promise<void> {
    // Implementation for automatic remediation
    console.log('Auto-remediating:', config, context);
  }
}

export const securityEngine = new SecurityEngine();