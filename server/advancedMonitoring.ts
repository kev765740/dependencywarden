import { db } from "./db";
import { alerts, repositories, users } from "@shared/schema";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { analyticsService } from "./analyticsService";
import { slackService } from "./slackService";
import { emailService } from "./emailService";

interface ThreatIntelligence {
  cve_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  exploit_availability: boolean;
  exploit_maturity: 'unproven' | 'proof_of_concept' | 'functional' | 'weaponized';
  threat_actor_activity: boolean;
  targeted_industries: string[];
  first_seen: Date;
  last_updated: Date;
  confidence_score: number;
  references: string[];
}

interface CustomAlertRule {
  id: number;
  userId: string;
  name: string;
  description: string;
  conditions: {
    severity?: string[];
    packageNames?: string[];
    licenseTypes?: string[];
    usageLevel?: 'low' | 'medium' | 'high';
    businessCriticality?: 'low' | 'medium' | 'high' | 'critical';
    repositories?: number[];
    ageInDays?: number;
    cvssScore?: { min?: number; max?: number };
    exploitAvailable?: boolean;
    threatActorActivity?: boolean;
  };
  actions: {
    notify?: {
      email?: boolean;
      slack?: boolean;
      webhook?: string;
    };
    escalate?: {
      afterMinutes: number;
      to: string[];
    };
    autoRemediate?: {
      enabled: boolean;
      strategy: 'update' | 'remove' | 'isolate';
    };
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface EscalationRule {
  id: number;
  userId: string;
  name: string;
  triggerConditions: {
    slaBreachMinutes: number;
    severity: string[];
    businessImpact: string[];
    unacknowledgedTime: number;
  };
  escalationLevels: Array<{
    level: number;
    afterMinutes: number;
    contacts: Array<{
      type: 'email' | 'slack' | 'webhook';
      target: string;
    }>;
    actions: string[];
  }>;
  isActive: boolean;
}

export class AdvancedMonitoring {

  /**
   * Real-time Threat Intelligence Integration
   */
  async enrichWithThreatIntelligence(alertId: number): Promise<ThreatIntelligence | null> {
    try {
      const [alert] = await db.select()
        .from(alerts)
        .where(eq(alerts.id, alertId));

      if (!alert) {
        throw new Error('Alert not found');
      }

      // Extract CVE from alert data
      const cveId = this.extractCVEFromAlert(alert);
      if (!cveId) {
        return null;
      }

      // Fetch threat intelligence from multiple sources
      const threatIntel = await this.fetchThreatIntelligence(cveId);
      
      // Store enriched data
      await this.storeThreatIntelligence(alertId, threatIntel);

      // Track analytics
      await analyticsService.trackFeatureUsage(alert.userId, {
        feature: 'threat_intelligence_enrichment',
        context: { alert_id: alertId, cve_id: cveId }
      });

      return threatIntel;
    } catch (error) {
      console.error('Error enriching with threat intelligence:', error);
      return null;
    }
  }

  private async fetchThreatIntelligence(cveId: string): Promise<ThreatIntelligence> {
    // Simulate fetching from multiple threat intelligence sources
    // In production, integrate with: MITRE CVE, NVD, CISA KEV, VulnDB, etc.
    
    const sources = [
      this.fetchFromNVD(cveId),
      this.fetchFromMITRE(cveId),
      this.fetchFromCISA(cveId),
      this.fetchFromExploitDB(cveId)
    ];

    const results = await Promise.allSettled(sources);
    
    // Aggregate and correlate threat intelligence
    return this.correlateThreatIntelligence(cveId, results);
  }

  private async fetchFromNVD(cveId: string): Promise<Partial<ThreatIntelligence>> {
    // Integrate with National Vulnerability Database
    const response = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${cveId}`);
    
    if (!response.ok) {
      throw new Error(`NVD API error: ${response.statusText}`);
    }

    const data = await response.json();
    const cve = data.vulnerabilities?.[0]?.cve;

    if (!cve) {
      throw new Error('CVE not found in NVD');
    }

    return {
      cve_id: cveId,
      severity: this.mapCVSSToSeverity(cve.metrics?.cvssMetricV31?.[0]?.cvssData?.baseScore || 0),
      first_seen: new Date(cve.published),
      last_updated: new Date(cve.lastModified),
      confidence_score: 0.9,
      references: cve.references?.map((ref: any) => ref.url) || []
    };
  }

  private async fetchFromMITRE(cveId: string): Promise<Partial<ThreatIntelligence>> {
    // Integrate with MITRE CVE database
    const response = await fetch(`https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cveId}`);
    
    if (!response.ok) {
      throw new Error(`MITRE API error: ${response.statusText}`);
    }

    // Parse MITRE data (simplified)
    return {
      cve_id: cveId,
      confidence_score: 0.85,
      references: [`https://cve.mitre.org/cgi-bin/cvename.cgi?name=${cveId}`]
    };
  }

  private async fetchFromCISA(cveId: string): Promise<Partial<ThreatIntelligence>> {
    // Integrate with CISA Known Exploited Vulnerabilities
    const response = await fetch('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json');
    
    if (!response.ok) {
      throw new Error(`CISA API error: ${response.statusText}`);
    }

    const data = await response.json();
    const vulnerability = data.vulnerabilities?.find((vuln: any) => vuln.cveID === cveId);

    if (vulnerability) {
      return {
        cve_id: cveId,
        exploit_availability: true,
        exploit_maturity: 'weaponized',
        threat_actor_activity: true,
        confidence_score: 0.95
      };
    }

    return {
      cve_id: cveId,
      exploit_availability: false,
      threat_actor_activity: false,
      confidence_score: 0.7
    };
  }

  private async fetchFromExploitDB(cveId: string): Promise<Partial<ThreatIntelligence>> {
    // Check for public exploits
    try {
      const response = await fetch(`https://www.exploit-db.com/search?cve=${cveId}`);
      
      return {
        cve_id: cveId,
        exploit_availability: response.ok,
        exploit_maturity: response.ok ? 'functional' : 'unproven',
        confidence_score: 0.8
      };
    } catch (error) {
      return {
        cve_id: cveId,
        exploit_availability: false,
        exploit_maturity: 'unproven',
        confidence_score: 0.6
      };
    }
  }

  private correlateThreatIntelligence(cveId: string, results: PromiseSettledResult<Partial<ThreatIntelligence>>[]): ThreatIntelligence {
    const baseIntel: ThreatIntelligence = {
      cve_id: cveId,
      severity: 'medium',
      exploit_availability: false,
      exploit_maturity: 'unproven',
      threat_actor_activity: false,
      targeted_industries: [],
      first_seen: new Date(),
      last_updated: new Date(),
      confidence_score: 0.5,
      references: []
    };

    // Aggregate data from successful sources
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        const intel = result.value;
        
        // Take highest severity
        if (intel.severity && this.getSeverityWeight(intel.severity) > this.getSeverityWeight(baseIntel.severity)) {
          baseIntel.severity = intel.severity;
        }

        // Logical OR for boolean fields
        baseIntel.exploit_availability = baseIntel.exploit_availability || intel.exploit_availability || false;
        baseIntel.threat_actor_activity = baseIntel.threat_actor_activity || intel.threat_actor_activity || false;

        // Take highest exploit maturity
        if (intel.exploit_maturity && this.getMaturityWeight(intel.exploit_maturity) > this.getMaturityWeight(baseIntel.exploit_maturity)) {
          baseIntel.exploit_maturity = intel.exploit_maturity;
        }

        // Average confidence scores
        if (intel.confidence_score) {
          baseIntel.confidence_score = (baseIntel.confidence_score + intel.confidence_score) / 2;
        }

        // Merge references
        if (intel.references) {
          baseIntel.references = [...new Set([...baseIntel.references, ...intel.references])];
        }

        // Take earliest first_seen
        if (intel.first_seen && intel.first_seen < baseIntel.first_seen) {
          baseIntel.first_seen = intel.first_seen;
        }

        // Take latest last_updated
        if (intel.last_updated && intel.last_updated > baseIntel.last_updated) {
          baseIntel.last_updated = intel.last_updated;
        }
      }
    });

    return baseIntel;
  }

  /**
   * Custom Alert Rules Engine
   */
  async evaluateCustomAlertRules(alertId: number): Promise<void> {
    try {
      const [alert] = await db.select()
        .from(alerts)
        .where(eq(alerts.id, alertId));

      if (!alert) {
        throw new Error('Alert not found');
      }

      // Get all active custom alert rules for the user
      const customRules = await this.getActiveCustomRules(alert.userId);

      for (const rule of customRules) {
        if (await this.evaluateRuleConditions(alert, rule)) {
          await this.executeRuleActions(alert, rule);
          
          // Track rule execution
          await analyticsService.trackFeatureUsage(alert.userId, {
            feature: 'custom_alert_rule_triggered',
            context: { 
              alert_id: alertId, 
              rule_id: rule.id,
              rule_name: rule.name 
            }
          });
        }
      }
    } catch (error) {
      console.error('Error evaluating custom alert rules:', error);
    }
  }

  private async evaluateRuleConditions(alert: any, rule: CustomAlertRule): Promise<boolean> {
    const conditions = rule.conditions;

    // Severity check
    if (conditions.severity && !conditions.severity.includes(alert.severity)) {
      return false;
    }

    // Package name check
    if (conditions.packageNames && conditions.packageNames.length > 0) {
      const alertPackage = alert.packageName || '';
      if (!conditions.packageNames.some(pkg => alertPackage.includes(pkg))) {
        return false;
      }
    }

    // License type check
    if (conditions.licenseTypes && conditions.licenseTypes.length > 0) {
      const alertLicense = alert.license || '';
      if (!conditions.licenseTypes.includes(alertLicense)) {
        return false;
      }
    }

    // Repository check
    if (conditions.repositories && conditions.repositories.length > 0) {
      if (!conditions.repositories.includes(alert.repoId)) {
        return false;
      }
    }

    // Age check
    if (conditions.ageInDays) {
      const alertAge = Math.floor((Date.now() - new Date(alert.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      if (alertAge > conditions.ageInDays) {
        return false;
      }
    }

    // CVSS score check
    if (conditions.cvssScore) {
      const cvssScore = alert.cvssScore || 0;
      if (conditions.cvssScore.min && cvssScore < conditions.cvssScore.min) {
        return false;
      }
      if (conditions.cvssScore.max && cvssScore > conditions.cvssScore.max) {
        return false;
      }
    }

    // Usage level check (requires additional data)
    if (conditions.usageLevel) {
      const usageLevel = await this.getPackageUsageLevel(alert.repoId, alert.packageName);
      if (usageLevel !== conditions.usageLevel) {
        return false;
      }
    }

    // Business criticality check
    if (conditions.businessCriticality) {
      const businessCriticality = await this.getRepositoryBusinessCriticality(alert.repoId);
      if (businessCriticality !== conditions.businessCriticality) {
        return false;
      }
    }

    // Threat intelligence checks
    if (conditions.exploitAvailable !== undefined || conditions.threatActorActivity !== undefined) {
      const threatIntel = await this.getThreatIntelligence(alert.id);
      
      if (conditions.exploitAvailable !== undefined && threatIntel?.exploit_availability !== conditions.exploitAvailable) {
        return false;
      }
      
      if (conditions.threatActorActivity !== undefined && threatIntel?.threat_actor_activity !== conditions.threatActorActivity) {
        return false;
      }
    }

    return true;
  }

  private async executeRuleActions(alert: any, rule: CustomAlertRule): Promise<void> {
    const actions = rule.actions;

    // Notification actions
    if (actions.notify) {
      if (actions.notify.email) {
        await this.sendEmailNotification(alert, rule);
      }
      
      if (actions.notify.slack) {
        await this.sendSlackNotification(alert, rule);
      }
      
      if (actions.notify.webhook) {
        await this.sendWebhookNotification(alert, rule, actions.notify.webhook);
      }
    }

    // Escalation actions
    if (actions.escalate) {
      await this.scheduleEscalation(alert, rule);
    }

    // Auto-remediation actions
    if (actions.autoRemediate?.enabled) {
      await this.executeAutoRemediation(alert, actions.autoRemediate.strategy);
    }
  }

  /**
   * Escalation Workflows
   */
  async processEscalationWorkflows(): Promise<void> {
    try {
      // Find alerts that meet escalation criteria
      const candidateAlerts = await db.select()
        .from(alerts)
        .where(and(
          eq(alerts.status, 'open'),
          lte(alerts.createdAt, new Date(Date.now() - 30 * 60 * 1000)) // 30 minutes old
        ));

      for (const alert of candidateAlerts) {
        await this.evaluateEscalationRules(alert);
      }
    } catch (error) {
      console.error('Error processing escalation workflows:', error);
    }
  }

  private async evaluateEscalationRules(alert: any): Promise<void> {
    const escalationRules = await this.getActiveEscalationRules(alert.userId);

    for (const rule of escalationRules) {
      if (await this.shouldEscalate(alert, rule)) {
        await this.executeEscalation(alert, rule);
      }
    }
  }

  private async shouldEscalate(alert: any, rule: EscalationRule): Promise<boolean> {
    const conditions = rule.triggerConditions;
    const alertAge = Date.now() - new Date(alert.createdAt).getTime();
    const ageInMinutes = alertAge / (1000 * 60);

    // SLA breach check
    if (ageInMinutes < conditions.slaBreachMinutes) {
      return false;
    }

    // Severity check
    if (conditions.severity.length > 0 && !conditions.severity.includes(alert.severity)) {
      return false;
    }

    // Unacknowledged time check
    if (conditions.unacknowledgedTime && alert.acknowledgedAt) {
      return false;
    }

    // Business impact check
    if (conditions.businessImpact.length > 0) {
      const businessImpact = await this.getAlertBusinessImpact(alert.id);
      if (!conditions.businessImpact.includes(businessImpact)) {
        return false;
      }
    }

    return true;
  }

  private async executeEscalation(alert: any, rule: EscalationRule): Promise<void> {
    const alertAge = Date.now() - new Date(alert.createdAt).getTime();
    const ageInMinutes = alertAge / (1000 * 60);

    for (const level of rule.escalationLevels) {
      if (ageInMinutes >= level.afterMinutes) {
        // Check if this escalation level has already been executed
        const hasEscalated = await this.hasEscalationLevelExecuted(alert.id, rule.id, level.level);
        
        if (!hasEscalated) {
          await this.executeEscalationLevel(alert, rule, level);
          await this.recordEscalationExecution(alert.id, rule.id, level.level);
        }
      }
    }
  }

  private async executeEscalationLevel(alert: any, rule: EscalationRule, level: any): Promise<void> {
    // Send notifications to escalation contacts
    for (const contact of level.contacts) {
      switch (contact.type) {
        case 'email':
          await this.sendEscalationEmail(alert, rule, level, contact.target);
          break;
        case 'slack':
          await this.sendEscalationSlack(alert, rule, level, contact.target);
          break;
        case 'webhook':
          await this.sendEscalationWebhook(alert, rule, level, contact.target);
          break;
      }
    }

    // Execute escalation actions
    for (const action of level.actions) {
      await this.executeEscalationAction(alert, action);
    }

    // Track escalation
    await analyticsService.trackFeatureUsage(alert.userId, {
      feature: 'alert_escalated',
      context: { 
        alert_id: alert.id,
        rule_id: rule.id,
        escalation_level: level.level
      }
    });
  }

  // Helper methods
  private extractCVEFromAlert(alert: any): string | null {
    const cveRegex = /CVE-\d{4}-\d{4,}/i;
    const match = alert.description?.match(cveRegex) || alert.title?.match(cveRegex);
    return match ? match[0].toUpperCase() : null;
  }

  private mapCVSSToSeverity(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 9.0) return 'critical';
    if (score >= 7.0) return 'high';
    if (score >= 4.0) return 'medium';
    return 'low';
  }

  private getSeverityWeight(severity: string): number {
    const weights = { low: 1, medium: 2, high: 3, critical: 4 };
    return weights[severity as keyof typeof weights] || 0;
  }

  private getMaturityWeight(maturity: string): number {
    const weights = { unproven: 1, proof_of_concept: 2, functional: 3, weaponized: 4 };
    return weights[maturity as keyof typeof weights] || 0;
  }

  private async storeThreatIntelligence(alertId: number, intel: ThreatIntelligence): Promise<void> {
    // Store in database (would need additional table)
    console.log(`Storing threat intelligence for alert ${alertId}:`, intel);
  }

  private async getActiveCustomRules(userId: string): Promise<CustomAlertRule[]> {
    // Fetch from database (would need additional table)
    return [];
  }

  private async getActiveEscalationRules(userId: string): Promise<EscalationRule[]> {
    // Fetch from database (would need additional table)
    return [];
  }

  private async getPackageUsageLevel(repoId: number, packageName: string): Promise<'low' | 'medium' | 'high'> {
    // Analyze package usage patterns
    return 'medium';
  }

  private async getRepositoryBusinessCriticality(repoId: number): Promise<'low' | 'medium' | 'high' | 'critical'> {
    // Fetch repository business criticality
    return 'medium';
  }

  private async getThreatIntelligence(alertId: number): Promise<ThreatIntelligence | null> {
    // Fetch stored threat intelligence
    return null;
  }

  private async getAlertBusinessImpact(alertId: number): Promise<string> {
    // Calculate business impact
    return 'medium';
  }

  private async hasEscalationLevelExecuted(alertId: number, ruleId: number, level: number): Promise<boolean> {
    // Check escalation history
    return false;
  }

  private async recordEscalationExecution(alertId: number, ruleId: number, level: number): Promise<void> {
    // Record escalation execution
    console.log(`Recording escalation: Alert ${alertId}, Rule ${ruleId}, Level ${level}`);
  }

  private async sendEmailNotification(alert: any, rule: CustomAlertRule): Promise<void> {
    // Send email notification
    console.log(`Sending email notification for alert ${alert.id} via rule ${rule.name}`);
  }

  private async sendSlackNotification(alert: any, rule: CustomAlertRule): Promise<void> {
    // Send Slack notification
    console.log(`Sending Slack notification for alert ${alert.id} via rule ${rule.name}`);
  }

  private async sendWebhookNotification(alert: any, rule: CustomAlertRule, webhookUrl: string): Promise<void> {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert,
          rule: { id: rule.id, name: rule.name },
          timestamp: new Date().toISOString()
        })
      });
    } catch (error) {
      console.error('Webhook notification failed:', error);
    }
  }

  private async scheduleEscalation(alert: any, rule: CustomAlertRule): Promise<void> {
    // Schedule escalation workflow
    console.log(`Scheduling escalation for alert ${alert.id}`);
  }

  private async executeAutoRemediation(alert: any, strategy: string): Promise<void> {
    // Execute auto-remediation based on strategy
    console.log(`Executing auto-remediation for alert ${alert.id} with strategy: ${strategy}`);
  }

  private async sendEscalationEmail(alert: any, rule: EscalationRule, level: any, email: string): Promise<void> {
    // Send escalation email
    console.log(`Sending escalation email to ${email} for alert ${alert.id}`);
  }

  private async sendEscalationSlack(alert: any, rule: EscalationRule, level: any, channel: string): Promise<void> {
    // Send escalation Slack message
    console.log(`Sending escalation Slack message to ${channel} for alert ${alert.id}`);
  }

  private async sendEscalationWebhook(alert: any, rule: EscalationRule, level: any, webhook: string): Promise<void> {
    // Send escalation webhook
    console.log(`Sending escalation webhook to ${webhook} for alert ${alert.id}`);
  }

  private async executeEscalationAction(alert: any, action: string): Promise<void> {
    // Execute escalation action
    console.log(`Executing escalation action ${action} for alert ${alert.id}`);
  }
}

export const advancedMonitoring = new AdvancedMonitoring();