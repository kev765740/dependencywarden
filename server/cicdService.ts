import { Request, Response } from 'express';
import { db } from './db';
import { repositories, alerts, cicdIntegrations } from '@shared/schema';
import { scanner } from './scanner';
import { eq } from 'drizzle-orm';

interface CICDPipelineEvent {
  pipeline_id: string;
  repository: string;
  branch: string;
  commit_sha: string;
  stage: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  environment?: string;
  metadata?: any;
}

interface SecurityGateResult {
  passed: boolean;
  blocked: boolean;
  summary: {
    critical_vulnerabilities: number;
    high_vulnerabilities: number;
    medium_vulnerabilities: number;
    low_vulnerabilities: number;
    license_violations: number;
    policy_violations: number;
  };
  details: Array<{
    type: 'vulnerability' | 'license' | 'policy';
    severity: string;
    message: string;
    dependency?: string;
    fix_available?: boolean;
    remediation_steps?: string[];
  }>;
  recommendations: string[];
}

export class CICDService {
  
  /**
   * Security gate endpoint for CI/CD pipelines
   */
  async securityGate(req: Request, res: Response): Promise<void> {
    try {
      const { repository, branch = 'main', commit_sha, environment = 'production' } = req.body;
      
      if (!repository) {
        res.status(400).json({ error: 'Repository is required' });
        return;
      }

      // Find repository in database
      const repo = await db.query.repositories.findFirst({
        where: eq(repositories.gitUrl, repository)
      });

      if (!repo) {
        res.status(404).json({ 
          error: 'Repository not found',
          message: 'Repository must be added to security monitoring first'
        });
        return;
      }

      // Get CI/CD integration settings
      const integration = await db.query.cicdIntegrations.findFirst({
        where: eq(cicdIntegrations.repositoryId, repo.id)
      });

      // Run security scan
      const scanResult = await scanner.scanRepository(repo.id);
      
      // Evaluate security gate
      const gateResult = await this.evaluateSecurityGate(repo.id, scanResult, integration);
      
      // Log pipeline event
      await this.logPipelineEvent({
        pipeline_id: req.headers['x-pipeline-id'] as string || 'unknown',
        repository,
        branch,
        commit_sha: commit_sha || 'unknown',
        stage: 'security_gate',
        status: gateResult.passed ? 'success' : 'failed',
        environment,
        metadata: {
          vulnerabilities_found: gateResult.summary.critical_vulnerabilities + gateResult.summary.high_vulnerabilities,
          gate_result: gateResult
        }
      });

      // Return security gate result
      res.status(gateResult.passed ? 200 : 422).json({
        gate_passed: gateResult.passed,
        deployment_blocked: gateResult.blocked,
        scan_id: `scan_${Date.now()}`,
        repository,
        branch,
        commit_sha,
        environment,
        summary: gateResult.summary,
        details: gateResult.details,
        recommendations: gateResult.recommendations,
        next_steps: gateResult.blocked ? [
          'Fix critical and high severity vulnerabilities',
          'Update dependencies with security patches',
          'Review and approve license changes',
          'Ensure compliance with security policies'
        ] : []
      });

    } catch (error) {
      console.error('Security gate error:', error);
      res.status(500).json({ 
        error: 'Security gate failed',
        message: 'Internal server error during security evaluation'
      });
    }
  }

  /**
   * Pipeline status webhook endpoint
   */
  async pipelineWebhook(req: Request, res: Response): Promise<void> {
    try {
      const event: CICDPipelineEvent = req.body;
      
      // Log pipeline event
      await this.logPipelineEvent(event);
      
      // If pipeline failed at security gate, create alerts
      if (event.status === 'failed' && event.stage === 'security_gate') {
        await this.handleSecurityGateFailure(event);
      }
      
      res.status(200).json({ message: 'Pipeline event processed' });
    } catch (error) {
      console.error('Pipeline webhook error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Evaluate security gate based on scan results and integration settings
   */
  private async evaluateSecurityGate(
    repositoryId: number, 
    scanResult: any, 
    integration: any
  ): Promise<SecurityGateResult> {
    const result: SecurityGateResult = {
      passed: true,
      blocked: false,
      summary: {
        critical_vulnerabilities: 0,
        high_vulnerabilities: 0,
        medium_vulnerabilities: 0,
        low_vulnerabilities: 0,
        license_violations: 0,
        policy_violations: 0
      },
      details: [],
      recommendations: []
    };

    // Count vulnerabilities by severity
    if (scanResult.vulnerabilities) {
      for (const vuln of scanResult.vulnerabilities) {
        switch (vuln.severity) {
          case 'critical':
            result.summary.critical_vulnerabilities++;
            break;
          case 'high':
            result.summary.high_vulnerabilities++;
            break;
          case 'medium':
            result.summary.medium_vulnerabilities++;
            break;
          case 'low':
            result.summary.low_vulnerabilities++;
            break;
        }

        result.details.push({
          type: 'vulnerability',
          severity: vuln.severity,
          message: `${vuln.dependency}: ${vuln.title}`,
          dependency: vuln.dependency,
          fix_available: !!vuln.fixAvailable,
          remediation_steps: vuln.remediationSteps || []
        });
      }
    }

    // Count license violations
    if (scanResult.licenseChanges) {
      result.summary.license_violations = scanResult.licenseChanges.filter(
        (change: any) => change.severity === 'high' || change.severity === 'critical'
      ).length;

      for (const change of scanResult.licenseChanges) {
        if (change.severity === 'high' || change.severity === 'critical') {
          result.details.push({
            type: 'license',
            severity: change.severity,
            message: `${change.dependency}: License changed from ${change.oldLicense} to ${change.newLicense}`,
            dependency: change.dependency
          });
        }
      }
    }

    // Apply security gate rules based on integration settings
    const settings = integration?.settings || {};
    const blockOnCritical = settings.blockOnCritical !== false; // Default true
    const blockOnHigh = settings.blockOnHigh || false;
    const maxCritical = settings.maxCritical || 0;
    const maxHigh = settings.maxHigh || 5;
    const blockOnLicenseViolations = settings.blockOnLicenseViolations !== false; // Default true

    // Check if deployment should be blocked
    if (blockOnCritical && result.summary.critical_vulnerabilities > maxCritical) {
      result.passed = false;
      result.blocked = true;
      result.recommendations.push('Fix all critical vulnerabilities before deployment');
    }

    if (blockOnHigh && result.summary.high_vulnerabilities > maxHigh) {
      result.passed = false;
      result.blocked = true;
      result.recommendations.push(`Reduce high severity vulnerabilities to ${maxHigh} or fewer`);
    }

    if (blockOnLicenseViolations && result.summary.license_violations > 0) {
      result.passed = false;
      result.blocked = true;
      result.recommendations.push('Review and approve all license violations');
    }

    // Add general recommendations
    if (result.summary.critical_vulnerabilities > 0) {
      result.recommendations.push('Update dependencies to patch critical vulnerabilities');
    }
    if (result.summary.high_vulnerabilities > 0) {
      result.recommendations.push('Consider updating dependencies with high severity vulnerabilities');
    }
    if (result.summary.license_violations > 0) {
      result.recommendations.push('Review license changes for compliance requirements');
    }

    return result;
  }

  /**
   * Log pipeline event for monitoring
   */
  private async logPipelineEvent(event: CICDPipelineEvent): Promise<void> {
    try {
      // Store in database or logging system
      console.log('Pipeline event:', {
        timestamp: new Date().toISOString(),
        ...event
      });
    } catch (error) {
      console.error('Error logging pipeline event:', error);
    }
  }

  /**
   * Handle security gate failure
   */
  private async handleSecurityGateFailure(event: CICDPipelineEvent): Promise<void> {
    try {
      // Find repository
      const repo = await db.query.repositories.findFirst({
        where: eq(repositories.gitUrl, event.repository)
      });

      if (!repo) return;

      // Create alert for security gate failure
      await db.insert(alerts).values({
        repositoryId: repo.id,
        type: 'security_gate_failure',
        severity: 'high',
        title: 'CI/CD Security Gate Failed',
        description: `Security gate blocked deployment for ${event.repository} on branch ${event.branch}`,
        dependency: null,
        currentVersion: null,
        recommendedVersion: null,
        metadata: {
          pipeline_id: event.pipeline_id,
          branch: event.branch,
          commit_sha: event.commit_sha,
          environment: event.environment
        }
      });

    } catch (error) {
      console.error('Error handling security gate failure:', error);
    }
  }

  /**
   * Get CI/CD integration status for repository
   */
  async getIntegrationStatus(req: Request, res: Response): Promise<void> {
    try {
      const { repositoryId } = req.params;
      
      const integration = await db.query.cicdIntegrations.findFirst({
        where: eq(cicdIntegrations.repositoryId, parseInt(repositoryId))
      });

      if (!integration) {
        res.status(404).json({ error: 'CI/CD integration not found' });
        return;
      }

      res.json({
        id: integration.id,
        repository_id: integration.repositoryId,
        platform: integration.platform,
        webhook_url: `/api/cicd/security-gate`,
        settings: integration.settings,
        is_active: integration.isActive,
        created_at: integration.createdAt,
        updated_at: integration.updatedAt
      });

    } catch (error) {
      console.error('Error getting CI/CD integration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Configure CI/CD integration for repository
   */
  async configureIntegration(req: Request, res: Response): Promise<void> {
    try {
      const { repositoryId } = req.params;
      const { platform, settings } = req.body;

      // Validate repository exists
      const repo = await db.query.repositories.findFirst({
        where: eq(repositories.id, parseInt(repositoryId))
      });

      if (!repo) {
        res.status(404).json({ error: 'Repository not found' });
        return;
      }

      // Create or update CI/CD integration
      const existingIntegration = await db.query.cicdIntegrations.findFirst({
        where: eq(cicdIntegrations.repositoryId, parseInt(repositoryId))
      });

      if (existingIntegration) {
        // Update existing integration
        await db.update(cicdIntegrations)
          .set({
            platform,
            settings,
            updatedAt: new Date()
          })
          .where(eq(cicdIntegrations.id, existingIntegration.id));
      } else {
        // Create new integration
        await db.insert(cicdIntegrations).values({
          repositoryId: parseInt(repositoryId),
          platform,
          settings,
          isActive: true
        });
      }

      res.json({
        message: 'CI/CD integration configured successfully',
        webhook_url: `/api/cicd/security-gate`,
        documentation_url: '/docs/cicd-integration'
      });

    } catch (error) {
      console.error('Error configuring CI/CD integration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Setup CI/CD routes
   */
  setupRoutes(app: any): void {
    // Security gate endpoint (used by CI/CD pipelines)
    app.post('/api/cicd/security-gate', (req: Request, res: Response) => {
      this.securityGate(req, res);
    });

    // Pipeline webhook endpoint
    app.post('/api/cicd/pipeline-webhook', (req: Request, res: Response) => {
      this.pipelineWebhook(req, res);
    });

    // Get integration status
    app.get('/api/cicd/integrations/:repositoryId', (req: Request, res: Response) => {
      this.getIntegrationStatus(req, res);
    });

    // Configure integration
    app.post('/api/cicd/integrations/:repositoryId', (req: Request, res: Response) => {
      this.configureIntegration(req, res);
    });
  }
}

export const cicdService = new CICDService();