import { Request, Response } from 'express';
import { db } from './db';
import { issueIntegrations, autoTickets, alerts, repositories } from '@shared/schema';
import { eq } from 'drizzle-orm';

interface JiraConfig {
  baseUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
  issueType: string;
}

interface LinearConfig {
  apiKey: string;
  teamId: string;
  labelIds?: string[];
}

interface GitHubIssuesConfig {
  token: string;
  owner: string;
  repo: string;
}

interface TicketData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  labels?: string[];
  assignee?: string;
  metadata?: any;
}

export class IssueTrackingService {

  /**
   * Create ticket in external system based on alert
   */
  async createTicketFromAlert(alertId: number): Promise<void> {
    try {
      // Get alert details
      const alert = await db.query.alerts.findFirst({
        where: eq(alerts.id, alertId),
        with: {
          repository: true
        }
      });

      if (!alert) {
        console.error('Alert not found:', alertId);
        return;
      }

      // Get issue integrations for this repository
      const integrations = await db.query.issueIntegrations.findMany({
        where: eq(issueIntegrations.repositoryId, alert.repositoryId)
      });

      // Create tickets in all configured platforms
      for (const integration of integrations) {
        if (!integration.isActive) continue;

        try {
          const ticketData = this.formatAlertAsTicket(alert);
          const ticketId = await this.createTicket(integration, ticketData);
          
          if (ticketId) {
            // Track the auto-created ticket
            await db.insert(autoTickets).values({
              alertId: alert.id,
              integrationId: integration.id,
              externalId: ticketId.id,
              externalUrl: ticketId.url,
              status: 'open'
            });

            console.log(`Created ${integration.platform} ticket: ${ticketId.id} for alert ${alert.id}`);
          }
        } catch (error) {
          console.error(`Error creating ticket in ${integration.platform}:`, error);
        }
      }
    } catch (error) {
      console.error('Error creating tickets from alert:', error);
    }
  }

  /**
   * Create ticket in specific platform
   */
  private async createTicket(integration: any, ticketData: TicketData): Promise<{ id: string; url: string } | null> {
    switch (integration.platform) {
      case 'jira':
        return await this.createJiraTicket(integration.config, ticketData);
      case 'linear':
        return await this.createLinearTicket(integration.config, ticketData);
      case 'github_issues':
        return await this.createGitHubIssue(integration.config, ticketData);
      default:
        console.error('Unsupported issue tracking platform:', integration.platform);
        return null;
    }
  }

  /**
   * Create Jira ticket
   */
  private async createJiraTicket(config: JiraConfig, ticketData: TicketData): Promise<{ id: string; url: string } | null> {
    try {
      const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
      
      const issuePayload = {
        fields: {
          project: { key: config.projectKey },
          summary: ticketData.title,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: ticketData.description
                  }
                ]
              }
            ]
          },
          issuetype: { name: config.issueType || 'Bug' },
          priority: { name: this.mapPriorityToJira(ticketData.priority) },
          labels: ticketData.labels || ['security', 'dependency']
        }
      };

      const response = await fetch(`${config.baseUrl}/rest/api/3/issue`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(issuePayload)
      });

      if (!response.ok) {
        throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return {
        id: result.key,
        url: `${config.baseUrl}/browse/${result.key}`
      };
    } catch (error) {
      console.error('Error creating Jira ticket:', error);
      return null;
    }
  }

  /**
   * Create Linear ticket
   */
  private async createLinearTicket(config: LinearConfig, ticketData: TicketData): Promise<{ id: string; url: string } | null> {
    try {
      const mutation = `
        mutation IssueCreate($input: IssueCreateInput!) {
          issueCreate(input: $input) {
            success
            issue {
              id
              identifier
              url
            }
          }
        }
      `;

      const variables = {
        input: {
          teamId: config.teamId,
          title: ticketData.title,
          description: ticketData.description,
          priority: this.mapPriorityToLinear(ticketData.priority),
          labelIds: config.labelIds || []
        }
      };

      const response = await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: {
          'Authorization': config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: mutation, variables })
      });

      if (!response.ok) {
        throw new Error(`Linear API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.data?.issueCreate?.success) {
        const issue = result.data.issueCreate.issue;
        return {
          id: issue.identifier,
          url: issue.url
        };
      } else {
        throw new Error('Linear issue creation failed');
      }
    } catch (error) {
      console.error('Error creating Linear ticket:', error);
      return null;
    }
  }

  /**
   * Create GitHub issue
   */
  private async createGitHubIssue(config: GitHubIssuesConfig, ticketData: TicketData): Promise<{ id: string; url: string } | null> {
    try {
      const issuePayload = {
        title: ticketData.title,
        body: ticketData.description,
        labels: ticketData.labels || ['security', 'dependency']
      };

      if (ticketData.assignee) {
        issuePayload.assignees = [ticketData.assignee];
      }

      const response = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/issues`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${config.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify(issuePayload)
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return {
        id: result.number.toString(),
        url: result.html_url
      };
    } catch (error) {
      console.error('Error creating GitHub issue:', error);
      return null;
    }
  }

  /**
   * Format alert as ticket
   */
  private formatAlertAsTicket(alert: any): TicketData {
    const repository = alert.repository;
    
    let title = '';
    let description = '';
    
    switch (alert.type) {
      case 'vulnerability':
        title = `Security Vulnerability: ${alert.dependency} in ${repository.repositoryName}`;
        description = `**Security Alert**: A ${alert.severity} severity vulnerability has been detected in your repository.

**Repository**: ${repository.repositoryName}
**Dependency**: ${alert.dependency}
**Current Version**: ${alert.currentVersion}
**Recommended Version**: ${alert.recommendedVersion}
**Severity**: ${alert.severity.toUpperCase()}

**Description**: ${alert.description}

**Remediation Steps**:
${alert.metadata?.remediationSteps ? alert.metadata.remediationSteps.map((step: string) => `- ${step}`).join('\n') : '- Update the dependency to the recommended version'}

**Reference**: ${alert.metadata?.referenceUrl || 'N/A'}

---
*This ticket was automatically created by the Dependency Security Monitor*`;
        break;
        
      case 'license_change':
        title = `License Change: ${alert.dependency} in ${repository.repositoryName}`;
        description = `**License Change Alert**: A dependency license change has been detected that may require review.

**Repository**: ${repository.repositoryName}
**Dependency**: ${alert.dependency}
**Version**: ${alert.currentVersion}
**License Change**: ${alert.metadata?.oldLicense || 'Unknown'} → ${alert.metadata?.newLicense || 'Unknown'}
**Risk Level**: ${alert.severity.toUpperCase()}

**Description**: ${alert.description}

**Action Required**: Review the new license terms for compliance with your organization's policies.

---
*This ticket was automatically created by the Dependency Security Monitor*`;
        break;
        
      default:
        title = `Security Alert: ${alert.title}`;
        description = `**Security Alert**: ${alert.description}

**Repository**: ${repository.repositoryName}
**Alert Type**: ${alert.type}
**Severity**: ${alert.severity.toUpperCase()}

---
*This ticket was automatically created by the Dependency Security Monitor*`;
    }

    return {
      title,
      description,
      priority: alert.severity as 'low' | 'medium' | 'high' | 'critical',
      labels: ['security', 'dependency', alert.type, alert.severity],
      metadata: {
        alertId: alert.id,
        repositoryId: alert.repositoryId,
        dependency: alert.dependency
      }
    };
  }

  /**
   * Map priority to Jira priority names
   */
  private mapPriorityToJira(priority: string): string {
    const priorityMap: { [key: string]: string } = {
      'critical': 'Highest',
      'high': 'High',
      'medium': 'Medium',
      'low': 'Low'
    };
    return priorityMap[priority] || 'Medium';
  }

  /**
   * Map priority to Linear priority numbers
   */
  private mapPriorityToLinear(priority: string): number {
    const priorityMap: { [key: string]: number } = {
      'critical': 1, // Urgent
      'high': 2,     // High
      'medium': 3,   // Medium
      'low': 4       // Low
    };
    return priorityMap[priority] || 3;
  }

  /**
   * Configure issue integration for repository
   */
  async configureIntegration(req: Request, res: Response): Promise<void> {
    try {
      const { repositoryId } = req.params;
      const { platform, config } = req.body;

      // Validate repository exists
      const repo = await db.query.repositories.findFirst({
        where: eq(repositories.id, parseInt(repositoryId))
      });

      if (!repo) {
        res.status(404).json({ error: 'Repository not found' });
        return;
      }

      // Validate configuration based on platform
      const validationError = this.validatePlatformConfig(platform, config);
      if (validationError) {
        res.status(400).json({ error: validationError });
        return;
      }

      // Create or update integration
      const existingIntegration = await db.query.issueIntegrations.findFirst({
        where: eq(issueIntegrations.repositoryId, parseInt(repositoryId))
      });

      if (existingIntegration) {
        // Update existing integration
        await db.update(issueIntegrations)
          .set({
            platform,
            config,
            updatedAt: new Date()
          })
          .where(eq(issueIntegrations.id, existingIntegration.id));
      } else {
        // Create new integration
        await db.insert(issueIntegrations).values({
          repositoryId: parseInt(repositoryId),
          platform,
          config,
          isActive: true
        });
      }

      res.json({
        message: 'Issue tracking integration configured successfully',
        platform,
        features: [
          'Automatic ticket creation for critical vulnerabilities',
          'License change notifications',
          'Security policy violations',
          'Remediation tracking'
        ]
      });

    } catch (error) {
      console.error('Error configuring issue integration:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get integration status
   */
  async getIntegrationStatus(req: Request, res: Response): Promise<void> {
    try {
      const { repositoryId } = req.params;
      
      const integrations = await db.query.issueIntegrations.findMany({
        where: eq(issueIntegrations.repositoryId, parseInt(repositoryId)),
        with: {
          autoTickets: true
        }
      });

      const ticketStats = await this.getTicketStatistics(parseInt(repositoryId));

      res.json({
        integrations: integrations.map(integration => ({
          id: integration.id,
          platform: integration.platform,
          is_active: integration.isActive,
          created_at: integration.createdAt,
          ticket_count: integration.autoTickets?.length || 0
        })),
        statistics: ticketStats
      });

    } catch (error) {
      console.error('Error getting integration status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get ticket statistics
   */
  private async getTicketStatistics(repositoryId: number): Promise<any> {
    try {
      const tickets = await db.query.autoTickets.findMany({
        where: eq(autoTickets.alertId, repositoryId) // This would need proper join
      });

      return {
        total_tickets: tickets.length,
        open_tickets: tickets.filter(t => t.status === 'open').length,
        closed_tickets: tickets.filter(t => t.status === 'closed').length,
        in_progress_tickets: tickets.filter(t => t.status === 'in_progress').length
      };
    } catch (error) {
      console.error('Error getting ticket statistics:', error);
      return {
        total_tickets: 0,
        open_tickets: 0,
        closed_tickets: 0,
        in_progress_tickets: 0
      };
    }
  }

  /**
   * Validate platform configuration
   */
  private validatePlatformConfig(platform: string, config: any): string | null {
    switch (platform) {
      case 'jira':
        if (!config.baseUrl || !config.email || !config.apiToken || !config.projectKey) {
          return 'Jira configuration requires baseUrl, email, apiToken, and projectKey';
        }
        break;
      case 'linear':
        if (!config.apiKey || !config.teamId) {
          return 'Linear configuration requires apiKey and teamId';
        }
        break;
      case 'github_issues':
        if (!config.token || !config.owner || !config.repo) {
          return 'GitHub Issues configuration requires token, owner, and repo';
        }
        break;
      default:
        return `Unsupported platform: ${platform}`;
    }
    return null;
  }

  /**
   * Setup issue tracking routes
   */
  setupRoutes(app: any): void {
    // Configure integration
    app.post('/api/issue-tracking/integrations/:repositoryId', (req: Request, res: Response) => {
      this.configureIntegration(req, res);
    });

    // Get integration status
    app.get('/api/issue-tracking/integrations/:repositoryId', (req: Request, res: Response) => {
      this.getIntegrationStatus(req, res);
    });

    // Test integration
    app.post('/api/issue-tracking/test/:repositoryId', async (req: Request, res: Response) => {
      try {
        const { repositoryId } = req.params;
        
        // Create a test ticket
        const testTicketData: TicketData = {
          title: 'Test Security Alert - Integration Test',
          description: 'This is a test ticket created to verify the issue tracking integration is working correctly.',
          priority: 'low',
          labels: ['test', 'integration']
        };

        const integration = await db.query.issueIntegrations.findFirst({
          where: eq(issueIntegrations.repositoryId, parseInt(repositoryId))
        });

        if (!integration) {
          res.status(404).json({ error: 'No integration configured for this repository' });
          return;
        }

        const result = await this.createTicket(integration, testTicketData);
        
        if (result) {
          res.json({
            success: true,
            ticket_id: result.id,
            ticket_url: result.url,
            message: 'Test ticket created successfully'
          });
        } else {
          res.status(500).json({ error: 'Failed to create test ticket' });
        }
      } catch (error) {
        console.error('Error testing integration:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  }
}

export const issueTrackingService = new IssueTrackingService();