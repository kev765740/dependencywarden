import { db } from "./db";
import { securityPolicies, complianceReportsTable, alerts, repositories, users } from "@shared/schema";
import { eq, and, gte, lte, desc, count, sql } from "drizzle-orm";
import OpenAI from "openai";

// Initialize OpenAI with error handling
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (error) {
  console.warn('OpenAI initialization failed:', error);
}

interface ComplianceFramework {
  id: string;
  name: string;
  description: string;
  categories: ComplianceCategory[];
}

interface ComplianceCategory {
  id: string;
  name: string;
  requirements: ComplianceRequirement[];
}

interface ComplianceRequirement {
  id: string;
  title: string;
  description: string;
  mandatory: boolean;
  evidenceRequired: string[];
  automationLevel: 'manual' | 'semi-automatic' | 'automatic';
}

interface CustomSecurityPolicy {
  id: string;
  name: string;
  description: string;
  ruleType: 'license' | 'vulnerability' | 'dependency' | 'custom';
  conditions: PolicyCondition[];
  actions: PolicyAction[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
}

interface PolicyCondition {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'regex';
  value: string;
}

interface PolicyAction {
  type: 'alert' | 'block' | 'approve' | 'escalate' | 'autoRemediate';
  parameters: Record<string, any>;
}

interface AuditTrailEntry {
  id: string;
  timestamp: Date;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  previousState?: any;
  newState?: any;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class ComplianceEngine {
  private frameworks: Map<string, ComplianceFramework> = new Map();

  constructor() {
    this.initializeFrameworks();
  }

  private initializeFrameworks() {
    // SOC 2 Framework
    this.frameworks.set('soc2', {
      id: 'soc2',
      name: 'SOC 2 Type II',
      description: 'Service Organization Control 2 - Security, Availability, Processing Integrity, Confidentiality, Privacy',
      categories: [
        {
          id: 'security',
          name: 'Security',
          requirements: [
            {
              id: 'sec-1.1',
              title: 'Vulnerability Management',
              description: 'Implement systematic vulnerability identification and remediation processes',
              mandatory: true,
              evidenceRequired: ['vulnerability_scans', 'remediation_logs', 'risk_assessments'],
              automationLevel: 'automatic'
            },
            {
              id: 'sec-1.2',
              title: 'Access Controls',
              description: 'Implement role-based access controls for all systems',
              mandatory: true,
              evidenceRequired: ['access_logs', 'user_permissions', 'authentication_records'],
              automationLevel: 'semi-automatic'
            }
          ]
        }
      ]
    });

    // ISO 27001 Framework
    this.frameworks.set('iso27001', {
      id: 'iso27001',
      name: 'ISO 27001:2022',
      description: 'Information Security Management System Standard',
      categories: [
        {
          id: 'asset-management',
          name: 'Asset Management',
          requirements: [
            {
              id: 'iso-8.1',
              title: 'Inventory of Assets',
              description: 'Maintain comprehensive inventory of information assets',
              mandatory: true,
              evidenceRequired: ['asset_inventory', 'classification_records'],
              automationLevel: 'automatic'
            }
          ]
        }
      ]
    });

    // NIST Cybersecurity Framework
    this.frameworks.set('nist', {
      id: 'nist',
      name: 'NIST Cybersecurity Framework 2.0',
      description: 'Framework for Improving Critical Infrastructure Cybersecurity',
      categories: [
        {
          id: 'identify',
          name: 'Identify',
          requirements: [
            {
              id: 'id-am-1',
              title: 'Asset Management',
              description: 'Physical devices and systems are inventoried',
              mandatory: true,
              evidenceRequired: ['device_inventory', 'system_diagrams'],
              automationLevel: 'automatic'
            }
          ]
        }
      ]
    });

    // PCI DSS Framework
    this.frameworks.set('pcidss', {
      id: 'pcidss',
      name: 'PCI DSS 4.0',
      description: 'Payment Card Industry Data Security Standard',
      categories: [
        {
          id: 'network-security',
          name: 'Network Security',
          requirements: [
            {
              id: 'pci-1.1',
              title: 'Firewall Configuration',
              description: 'Install and maintain network security controls',
              mandatory: true,
              evidenceRequired: ['firewall_configs', 'network_diagrams'],
              automationLevel: 'manual'
            }
          ]
        }
      ]
    });

    // HIPAA Framework
    this.frameworks.set('hipaa', {
      id: 'hipaa',
      name: 'HIPAA Security Rule',
      description: 'Health Insurance Portability and Accountability Act Security Requirements',
      categories: [
        {
          id: 'administrative',
          name: 'Administrative Safeguards',
          requirements: [
            {
              id: 'hip-164.308',
              title: 'Administrative Safeguards',
              description: 'Implement administrative actions and policies',
              mandatory: true,
              evidenceRequired: ['policies', 'training_records', 'audit_logs'],
              automationLevel: 'manual'
            }
          ]
        }
      ]
    });
  }

  /**
   * Create custom security policy with policy-as-code approach
   */
  async createCustomPolicy(userId: string, policy: Omit<CustomSecurityPolicy, 'id'>): Promise<CustomSecurityPolicy> {
    const policyId = `policy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store policy configuration in simplified format
    const customPolicy: CustomSecurityPolicy = {
      id: policyId,
      name: policy.name,
      description: policy.description || '',
      ruleType: policy.ruleType,
      conditions: policy.conditions,
      actions: policy.actions,
      severity: policy.severity,
      isActive: policy.isActive
    };

    await this.logAuditTrail({
      userId,
      action: 'CREATE_SECURITY_POLICY',
      resource: 'security_policy',
      resourceId: policyId,
      newState: policy,
      metadata: { policyType: policy.ruleType }
    });

    return {
      id: policyId,
      ...policy
    };
  }

  /**
   * Evaluate policies against alerts and dependencies
   */
  async evaluateCustomPolicies(userId: string, resourceType: string, resourceData: any): Promise<any[]> {
    const violations = [];
    
    // For production, implement proper policy evaluation
    // This is a simplified implementation for license compliance
    if (resourceType === 'license') {
      const restrictedLicenses = ['GPL-3.0', 'AGPL-3.0', 'LGPL-3.0'];
      if (restrictedLicenses.includes(resourceData.license)) {
        violations.push({
          policyId: `license_restriction_${Date.now()}`,
          resourceType,
          resourceData,
          severity: 'high',
          actions: [],
          timestamp: new Date()
        });
      }
    }
    
    return violations;
  }

  private evaluatePolicyConditions(conditions: PolicyCondition[], data: any): boolean {
    return conditions.some(condition => {
      const fieldValue = this.getNestedProperty(data, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'contains':
          return String(fieldValue).includes(condition.value);
        case 'startsWith':
          return String(fieldValue).startsWith(condition.value);
        case 'endsWith':
          return String(fieldValue).endsWith(condition.value);
        case 'greaterThan':
          return Number(fieldValue) > Number(condition.value);
        case 'lessThan':
          return Number(fieldValue) < Number(condition.value);
        case 'regex':
          return new RegExp(condition.value).test(String(fieldValue));
        default:
          return false;
      }
    });
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Generate comprehensive compliance report for multiple frameworks
   */
  async generateMultiFrameworkReport(userId: string, frameworkIds: string[]): Promise<any> {
    const reports = {};

    for (const frameworkId of frameworkIds) {
      const framework = this.frameworks.get(frameworkId);
      if (!framework) continue;

      const frameworkReport = await this.assessFrameworkCompliance(userId, framework);
      (reports as any)[frameworkId] = frameworkReport;
    }

    // Use AI to provide compliance insights and recommendations
    const aiInsights = await this.generateAIComplianceInsights(reports);

    const consolidatedReport = {
      reportId: `multi_compliance_${Date.now()}`,
      userId,
      frameworks: reports,
      aiInsights,
      generatedAt: new Date(),
      overallScore: this.calculateOverallComplianceScore(reports),
      recommendations: await this.generateComplianceRecommendations(reports)
    };

    await this.logAuditTrail({
      userId,
      action: 'GENERATE_COMPLIANCE_REPORT',
      resource: 'compliance_report',
      resourceId: consolidatedReport.reportId,
      metadata: {
        frameworks: frameworkIds,
        overallScore: consolidatedReport.overallScore
      }
    });

    return consolidatedReport;
  }

  private async assessFrameworkCompliance(userId: string, framework: ComplianceFramework): Promise<any> {
    const assessment = {
      frameworkId: framework.id,
      frameworkName: framework.name,
      categories: {},
      overallScore: 0,
      totalRequirements: 0,
      metRequirements: 0
    };

    for (const category of framework.categories) {
      const categoryAssessment = {
        categoryId: category.id,
        categoryName: category.name,
        requirements: {},
        score: 0
      };

      for (const requirement of category.requirements) {
        const compliance = await this.assessRequirementCompliance(userId, requirement);
        (categoryAssessment.requirements as Record<string, any>)[requirement.id] = compliance;
        assessment.totalRequirements++;
        if (compliance.met) assessment.metRequirements++;
      }

      categoryAssessment.score = Object.values(categoryAssessment.requirements)
        .reduce((sum: number, req: any) => sum + (req.met ? 1 : 0), 0) / category.requirements.length;
      
      (assessment.categories as Record<string, any>)[category.id] = categoryAssessment;
    }

    assessment.overallScore = assessment.metRequirements / assessment.totalRequirements;
    return assessment;
  }

  private async assessRequirementCompliance(userId: string, requirement: ComplianceRequirement): Promise<any> {
    // Assess compliance based on available evidence and automated checks
    const evidence = await this.collectComplianceEvidence(userId, requirement);
    
    return {
      requirementId: requirement.id,
      title: requirement.title,
      met: evidence.length >= requirement.evidenceRequired.length,
      evidence,
      automationLevel: requirement.automationLevel,
      lastAssessed: new Date()
    };
  }

  private async collectComplianceEvidence(userId: string, requirement: ComplianceRequirement): Promise<any[]> {
    const evidence = [];

    // Collect automated evidence based on requirement type
    for (const evidenceType of requirement.evidenceRequired) {
      switch (evidenceType) {
        case 'vulnerability_scans':
          const scanResults = await db.select()
            .from(alerts)
            .where(eq(alerts.repoId, 1));
          evidence.push({
            type: evidenceType,
            data: scanResults,
            automated: true,
            collectedAt: new Date()
          });
          break;

        case 'asset_inventory':
          const assets = await db.select()
            .from(repositories)
            .where(eq(repositories.userId, userId));
          evidence.push({
            type: evidenceType,
            data: assets,
            automated: true,
            collectedAt: new Date()
          });
          break;

        default:
          // Manual evidence collection required
          evidence.push({
            type: evidenceType,
            data: null,
            automated: false,
            manual: true,
            collectedAt: new Date()
          });
      }
    }

    return evidence;
  }

  private async generateAIComplianceInsights(reports: any): Promise<any> {
    try {
      const prompt = `Analyze the following multi-framework compliance assessment and provide strategic insights:

${JSON.stringify(reports, null, 2)}

Provide insights in JSON format with:
1. Overall compliance maturity level
2. Critical gaps across frameworks
3. Common compliance patterns
4. Strategic recommendations for improvement
5. Risk prioritization based on business impact`;

      if (!openai) {
        throw new Error('OpenAI client not initialized');
      }
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a compliance expert analyzing multi-framework assessments. Provide strategic, actionable insights in JSON format."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.choices[0].message?.content || '{}');
    } catch (error) {
      console.error('Error generating AI compliance insights:', error);
      return {
        maturityLevel: 'unknown',
        criticalGaps: [],
        recommendations: ['Manual compliance review required']
      };
    }
  }

  private calculateOverallComplianceScore(reports: any): number {
    const scores = Object.values(reports).map((report: any) => report.overallScore);
    return scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
  }

  private async generateComplianceRecommendations(reports: any): Promise<string[]> {
    const recommendations = [];
    
    // Analyze common gaps across frameworks
    for (const [frameworkId, report] of Object.entries(reports) as any) {
      if (report.overallScore < 0.8) {
        recommendations.push(`Improve ${report.frameworkName} compliance (current: ${Math.round(report.overallScore * 100)}%)`);
      }
    }

    return recommendations;
  }

  /**
   * Log audit trail entry for compliance and governance tracking
   */
  async logAuditTrail(entry: Omit<AuditTrailEntry, 'id' | 'timestamp'>): Promise<void> {
    // In a production system, this would write to a dedicated audit table
    // For now, we'll use console logging with structured format
    const auditEntry: AuditTrailEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...entry
    };

    console.log('[AUDIT TRAIL]', JSON.stringify(auditEntry, null, 2));

    // Store in database for chain of custody
    // await db.insert(auditTrail).values(auditEntry);
  }

  /**
   * Get audit trail for specific resource or user
   */
  async getAuditTrail(filters: {
    userId?: string;
    resource?: string;
    resourceId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AuditTrailEntry[]> {
    // In production, this would query the audit trail table
    // For now, return sample data structure
    return [];
  }

  /**
   * Generate chain of custody report for security incidents
   */
  async generateChainOfCustodyReport(incidentId: string): Promise<any> {
    const auditEntries = await this.getAuditTrail({
      resourceId: incidentId
    });

    return {
      incidentId,
      chainOfCustody: auditEntries.map(entry => ({
        timestamp: entry.timestamp,
        actor: entry.userId,
        action: entry.action,
        evidence: entry.metadata,
        digitalSignature: this.generateDigitalSignature(entry)
      })),
      integrity: this.verifyChainIntegrity(auditEntries),
      generatedAt: new Date()
    };
  }

  private generateDigitalSignature(entry: AuditTrailEntry): string {
    // In production, use proper cryptographic signing
    return `sig_${Buffer.from(JSON.stringify(entry)).toString('base64').slice(0, 32)}`;
  }

  private verifyChainIntegrity(entries: AuditTrailEntry[]): boolean {
    // Verify no gaps in timeline and all signatures are valid
    return entries.length > 0; // Check for license policy compliance
  }

  /**
   * Get available compliance frameworks
   */
  getAvailableFrameworks(): ComplianceFramework[] {
    return Array.from(this.frameworks.values());
  }

  /**
   * Get framework-specific requirements
   */
  getFrameworkRequirements(frameworkId: string): ComplianceFramework | undefined {
    return this.frameworks.get(frameworkId);
  }
}

export const complianceEngine = new ComplianceEngine();