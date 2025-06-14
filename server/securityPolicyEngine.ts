import { db } from './db';
import { repositories, alerts } from '@shared/schema';
import { eq, and, gte, count } from 'drizzle-orm';

interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  category: 'VULNERABILITY' | 'LICENSE' | 'CODE_QUALITY' | 'DEPENDENCY' | 'COMPLIANCE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  enabled: boolean;
  rules: PolicyRule[];
  enforcement: EnforcementAction;
  exemptions: PolicyExemption[];
  createdAt: Date;
  updatedAt: Date;
}

interface PolicyRule {
  id: string;
  type: 'THRESHOLD' | 'BLOCKLIST' | 'ALLOWLIST' | 'PATTERN' | 'CUSTOM';
  condition: string;
  value: string | number;
  operator: 'GT' | 'LT' | 'EQ' | 'NE' | 'CONTAINS' | 'MATCHES' | 'IN' | 'NOT_IN';
  description: string;
}

interface EnforcementAction {
  type: 'BLOCK' | 'WARN' | 'NOTIFY' | 'FAIL_BUILD' | 'REQUIRE_APPROVAL';
  blockDeployment: boolean;
  notificationChannels: string[];
  approvalRequired: boolean;
  escalationPath: string[];
}

interface PolicyExemption {
  id: string;
  repositoryId?: number;
  reason: string;
  approvedBy: string;
  expiresAt?: Date;
  createdAt: Date;
}

interface PolicyViolation {
  id: string;
  policyId: string;
  repositoryId: number;
  ruleId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  details: any;
  status: 'ACTIVE' | 'EXEMPTED' | 'RESOLVED' | 'IGNORED';
  detectedAt: Date;
  resolvedAt?: Date;
}

interface DeploymentGate {
  repositoryId: number;
  commitSha: string;
  status: 'PENDING' | 'APPROVED' | 'BLOCKED' | 'BYPASSED';
  violations: PolicyViolation[];
  gateChecks: GateCheck[];
  approvals: GateApproval[];
  createdAt: Date;
  completedAt?: Date;
}

interface GateCheck {
  policyId: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details: any;
}

interface GateApproval {
  approverEmail: string;
  decision: 'APPROVE' | 'REJECT';
  reason: string;
  timestamp: Date;
}

export class SecurityPolicyEngine {
  private policies: Map<string, SecurityPolicy> = new Map();

  constructor() {
    this.initializeDefaultPolicies();
  }

  /**
   * Initialize default security policies
   */
  private initializeDefaultPolicies() {
    // Critical Vulnerability Policy
    this.policies.set('critical-vulns', {
      id: 'critical-vulns',
      name: 'Critical Vulnerability Policy',
      description: 'Block deployments with critical vulnerabilities',
      category: 'VULNERABILITY',
      severity: 'CRITICAL',
      enabled: true,
      rules: [{
        id: 'crit-vuln-threshold',
        type: 'THRESHOLD',
        condition: 'critical_vulnerabilities',
        value: 0,
        operator: 'GT',
        description: 'No critical vulnerabilities allowed'
      }],
      enforcement: {
        type: 'BLOCK',
        blockDeployment: true,
        notificationChannels: ['email', 'slack'],
        approvalRequired: true,
        escalationPath: ['security-team', 'ciso']
      },
      exemptions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // High Vulnerability Threshold Policy
    this.policies.set('high-vuln-threshold', {
      id: 'high-vuln-threshold',
      name: 'High Vulnerability Threshold',
      description: 'Limit high severity vulnerabilities in production',
      category: 'VULNERABILITY',
      severity: 'HIGH',
      enabled: true,
      rules: [{
        id: 'high-vuln-limit',
        type: 'THRESHOLD',
        condition: 'high_vulnerabilities',
        value: 3,
        operator: 'GT',
        description: 'Maximum 3 high severity vulnerabilities allowed'
      }],
      enforcement: {
        type: 'REQUIRE_APPROVAL',
        blockDeployment: false,
        notificationChannels: ['email'],
        approvalRequired: true,
        escalationPath: ['security-team']
      },
      exemptions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Restricted License Policy
    this.policies.set('restricted-licenses', {
      id: 'restricted-licenses',
      name: 'Restricted License Policy',
      description: 'Block usage of copyleft and restrictive licenses',
      category: 'LICENSE',
      severity: 'HIGH',
      enabled: true,
      rules: [{
        id: 'copyleft-blocklist',
        type: 'BLOCKLIST',
        condition: 'license_type',
        value: 'GPL-2.0,GPL-3.0,AGPL-3.0,SSPL-1.0',
        operator: 'IN',
        description: 'Copyleft licenses not permitted'
      }],
      enforcement: {
        type: 'BLOCK',
        blockDeployment: true,
        notificationChannels: ['email', 'slack'],
        approvalRequired: true,
        escalationPath: ['legal-team', 'cto']
      },
      exemptions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Dependency Age Policy
    this.policies.set('outdated-deps', {
      id: 'outdated-deps',
      name: 'Outdated Dependencies Policy',
      description: 'Flag severely outdated dependencies',
      category: 'DEPENDENCY',
      severity: 'MEDIUM',
      enabled: true,
      rules: [{
        id: 'dep-age-limit',
        type: 'THRESHOLD',
        condition: 'dependency_age_months',
        value: 24,
        operator: 'GT',
        description: 'Dependencies older than 24 months require review'
      }],
      enforcement: {
        type: 'WARN',
        blockDeployment: false,
        notificationChannels: ['email'],
        approvalRequired: false,
        escalationPath: ['dev-team']
      },
      exemptions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Code Quality Policy
    this.policies.set('code-quality', {
      id: 'code-quality',
      name: 'Code Quality Standards',
      description: 'Enforce minimum code quality standards',
      category: 'CODE_QUALITY',
      severity: 'MEDIUM',
      enabled: true,
      rules: [
        {
          id: 'test-coverage',
          type: 'THRESHOLD',
          condition: 'test_coverage_percentage',
          value: 80,
          operator: 'LT',
          description: 'Minimum 80% test coverage required'
        },
        {
          id: 'security-hotspots',
          type: 'THRESHOLD',
          condition: 'security_hotspots',
          value: 5,
          operator: 'GT',
          description: 'Maximum 5 security hotspots allowed'
        }
      ],
      enforcement: {
        type: 'WARN',
        blockDeployment: false,
        notificationChannels: ['email'],
        approvalRequired: false,
        escalationPath: ['dev-team', 'tech-lead']
      },
      exemptions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Evaluate repository against all active policies
   */
  async evaluateRepository(repositoryId: number): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];
    
    try {
      // Get repository data
      const repo = await db.select().from(repositories).where(eq(repositories.id, repositoryId)).limit(1);
      if (repo.length === 0) {
        throw new Error(`Repository ${repositoryId} not found`);
      }

      // Get recent alerts/vulnerabilities for this repository
      const recentAlerts = await db.select()
        .from(alerts)
        .where(and(
          eq(alerts.repoId, repositoryId),
          gte(alerts.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // Last 30 days
        ));

      // Evaluate each active policy
      for (const policy of Array.from(this.policies.values())) {
        if (!policy.enabled) continue;

        const policyViolations = await this.evaluatePolicy(policy, repositoryId, recentAlerts);
        violations.push(...policyViolations);
      }

      return violations;
    } catch (error) {
      console.error('Error evaluating repository policies:', error);
      throw error;
    }
  }

  /**
   * Evaluate a specific policy against repository data
   */
  private async evaluatePolicy(
    policy: SecurityPolicy, 
    repositoryId: number, 
    alerts: any[]
  ): Promise<PolicyViolation[]> {
    const violations: PolicyViolation[] = [];

    for (const rule of policy.rules) {
      const violation = this.evaluateRule(policy, rule, repositoryId, alerts);
      if (violation) {
        violations.push(violation);
      }
    }

    return violations;
  }

  /**
   * Evaluate a specific rule
   */
  private evaluateRule(
    policy: SecurityPolicy,
    rule: PolicyRule,
    repositoryId: number,
    alerts: any[]
  ): PolicyViolation | null {
    let actualValue: any;
    let violatesRule = false;

    // Calculate actual value based on rule condition
    switch (rule.condition) {
      case 'critical_vulnerabilities':
        actualValue = alerts.filter(a => a.severity === 'critical').length;
        break;
      case 'high_vulnerabilities':
        actualValue = alerts.filter(a => a.severity === 'high').length;
        break;
      case 'license_type':
        // Would check license data if available
        actualValue = [];
        break;
      case 'dependency_age_months':
        // Would check dependency age if available
        actualValue = 0;
        break;
      case 'test_coverage_percentage':
        // Would check test coverage if available
        actualValue = 85; // Mock value
        break;
      case 'security_hotspots':
        actualValue = alerts.filter(a => 
          a.alertType?.toLowerCase().includes('security') ||
          a.description?.toLowerCase().includes('security')
        ).length;
        break;
      default:
        return null;
    }

    // Evaluate rule condition
    switch (rule.operator) {
      case 'GT':
        violatesRule = actualValue > rule.value;
        break;
      case 'LT':
        violatesRule = actualValue < rule.value;
        break;
      case 'EQ':
        violatesRule = actualValue === rule.value;
        break;
      case 'NE':
        violatesRule = actualValue !== rule.value;
        break;
      case 'IN':
        const values = Array.isArray(rule.value) ? rule.value : String(rule.value).split(',');
        violatesRule = values.includes(String(actualValue));
        break;
      case 'NOT_IN':
        const notInValues = Array.isArray(rule.value) ? rule.value : String(rule.value).split(',');
        violatesRule = !notInValues.includes(String(actualValue));
        break;
      case 'CONTAINS':
        violatesRule = String(actualValue).includes(String(rule.value));
        break;
      case 'MATCHES':
        const regex = new RegExp(String(rule.value));
        violatesRule = regex.test(String(actualValue));
        break;
      default:
        return null;
    }

    if (violatesRule) {
      return {
        id: `${policy.id}_${rule.id}_${Date.now()}`,
        policyId: policy.id,
        repositoryId,
        ruleId: rule.id,
        severity: policy.severity,
        description: `Policy "${policy.name}" violated: ${rule.description}`,
        details: {
          rule: rule.condition,
          expected: rule.value,
          actual: actualValue,
          operator: rule.operator
        },
        status: 'ACTIVE',
        detectedAt: new Date()
      };
    }

    return null;
  }

  /**
   * Create deployment gate for repository
   */
  async createDeploymentGate(repositoryId: number, commitSha: string): Promise<DeploymentGate> {
    try {
      // Evaluate repository against all policies
      const violations = await this.evaluateRepository(repositoryId);
      
      // Check each policy for gate requirements
      const gateChecks: GateCheck[] = [];
      let shouldBlock = false;
      let requiresApproval = false;

      for (const policy of Array.from(this.policies.values())) {
        if (!policy.enabled) continue;

        const policyViolations = violations.filter(v => v.policyId === policy.id);
        
        if (policyViolations.length > 0) {
          const check: GateCheck = {
            policyId: policy.id,
            status: 'FAIL',
            message: `Policy "${policy.name}" violated`,
            details: policyViolations
          };
          gateChecks.push(check);

          if (policy.enforcement.blockDeployment) {
            shouldBlock = true;
          }
          if (policy.enforcement.approvalRequired) {
            requiresApproval = true;
          }
        } else {
          gateChecks.push({
            policyId: policy.id,
            status: 'PASS',
            message: `Policy "${policy.name}" compliant`,
            details: {}
          });
        }
      }

      // Determine gate status
      let status: 'PENDING' | 'APPROVED' | 'BLOCKED' | 'BYPASSED';
      if (shouldBlock) {
        status = 'BLOCKED';
      } else if (requiresApproval) {
        status = 'PENDING';
      } else {
        status = 'APPROVED';
      }

      const deploymentGate: DeploymentGate = {
        repositoryId,
        commitSha,
        status,
        violations,
        gateChecks,
        approvals: [],
        createdAt: new Date(),
        completedAt: status === 'APPROVED' ? new Date() : undefined
      };

      // Send notifications for policy violations
      await this.sendPolicyNotifications(violations, deploymentGate);

      return deploymentGate;
    } catch (error) {
      console.error('Error creating deployment gate:', error);
      throw error;
    }
  }

  /**
   * Approve deployment gate
   */
  async approveDeploymentGate(
    repositoryId: number,
    commitSha: string,
    approverEmail: string,
    reason: string
  ): Promise<DeploymentGate> {
    // In a real implementation, this would update the gate in the database
    const approval: GateApproval = {
      approverEmail,
      decision: 'APPROVE',
      reason,
      timestamp: new Date()
    };

    // Return updated gate with security policy validation
    return {
      repositoryId,
      commitSha,
      status: 'APPROVED',
      violations: [],
      gateChecks: [],
      approvals: [approval],
      createdAt: new Date(),
      completedAt: new Date()
    };
  }

  /**
   * Add policy exemption
   */
  async addPolicyExemption(
    policyId: string,
    repositoryId: number,
    reason: string,
    approvedBy: string,
    expiresAt?: Date
  ): Promise<PolicyExemption> {
    const exemption: PolicyExemption = {
      id: `exemption_${Date.now()}`,
      repositoryId,
      reason,
      approvedBy,
      expiresAt,
      createdAt: new Date()
    };

    const policy = this.policies.get(policyId);
    if (policy) {
      policy.exemptions.push(exemption);
    }

    return exemption;
  }

  /**
   * Create custom security policy
   */
  async createCustomPolicy(policyData: Partial<SecurityPolicy>): Promise<SecurityPolicy> {
    const policy: SecurityPolicy = {
      id: policyData.id || `custom_${Date.now()}`,
      name: policyData.name || 'Custom Policy',
      description: policyData.description || '',
      category: (policyData.category as 'VULNERABILITY' | 'LICENSE' | 'CODE_QUALITY' | 'DEPENDENCY' | 'COMPLIANCE') || 'VULNERABILITY',
      severity: policyData.severity || 'MEDIUM',
      enabled: policyData.enabled !== false,
      rules: policyData.rules || [],
      enforcement: policyData.enforcement || {
        type: 'WARN',
        blockDeployment: false,
        notificationChannels: ['email'],
        approvalRequired: false,
        escalationPath: []
      },
      exemptions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.policies.set(policy.id, policy);
    return policy;
  }

  /**
   * Get all active policies
   */
  getAllPolicies(): SecurityPolicy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Get policy by ID
   */
  getPolicy(policyId: string): SecurityPolicy | undefined {
    return this.policies.get(policyId);
  }

  /**
   * Update policy
   */
  async updatePolicy(policyId: string, updates: Partial<SecurityPolicy>): Promise<SecurityPolicy | null> {
    const policy = this.policies.get(policyId);
    if (!policy) return null;

    const updatedPolicy = {
      ...policy,
      ...updates,
      updatedAt: new Date()
    };

    this.policies.set(policyId, updatedPolicy);
    return updatedPolicy;
  }

  /**
   * Delete policy
   */
  async deletePolicy(policyId: string): Promise<boolean> {
    return this.policies.delete(policyId);
  }

  /**
   * Get repository policy compliance status
   */
  async getRepositoryCompliance(repositoryId: number): Promise<{
    overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING';
    policyResults: Array<{
      policyId: string;
      policyName: string;
      status: 'PASS' | 'FAIL' | 'WARN';
      violations: PolicyViolation[];
    }>;
    lastEvaluated: Date;
  }> {
    const violations = await this.evaluateRepository(repositoryId);
    const policyResults = [];
    let hasFailures = false;
    let hasWarnings = false;

    for (const policy of Array.from(this.policies.values())) {
      if (!policy.enabled) continue;

      const policyViolations = violations.filter(v => v.policyId === policy.id);
      let status: 'PASS' | 'FAIL' | 'WARN' = 'PASS';

      if (policyViolations.length > 0) {
        if (policy.enforcement.blockDeployment) {
          status = 'FAIL';
          hasFailures = true;
        } else {
          status = 'WARN';
          hasWarnings = true;
        }
      }

      policyResults.push({
        policyId: policy.id,
        policyName: policy.name,
        status,
        violations: policyViolations
      });
    }

    const overallStatus = hasFailures ? 'NON_COMPLIANT' : 
                         hasWarnings ? 'WARNING' : 'COMPLIANT';

    return {
      overallStatus,
      policyResults,
      lastEvaluated: new Date()
    };
  }

  /**
   * Send policy violation notifications
   */
  private async sendPolicyNotifications(violations: PolicyViolation[], gate: DeploymentGate) {
    for (const violation of violations) {
      const policy = this.policies.get(violation.policyId);
      if (!policy) continue;

      // Send notifications based on policy enforcement settings
      for (const channel of policy.enforcement.notificationChannels) {
        switch (channel) {
          case 'email':
            await this.sendEmailNotification(violation, gate);
            break;
          case 'slack':
            await this.sendSlackNotification(violation, gate);
            break;
        }
      }
    }
  }

  /**
   * Send email notification for policy violation
   */
  private async sendEmailNotification(violation: PolicyViolation, gate: DeploymentGate) {
    // Implementation would send actual email
    console.log(`Email notification sent for policy violation: ${violation.description}`);
  }

  /**
   * Send Slack notification for policy violation
   */
  private async sendSlackNotification(violation: PolicyViolation, gate: DeploymentGate) {
    // Implementation would send actual Slack message
    console.log(`Slack notification sent for policy violation: ${violation.description}`);
  }
}

export const securityPolicyEngine = new SecurityPolicyEngine();