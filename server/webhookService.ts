import { Request, Response } from 'express';
import { db } from './db';
import { repositories, alerts, teamNotifications } from '@shared/schema';
import { storage } from './storage';
import { scanner } from './scanner';
import { teamService } from './teamService';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

interface GitHubWebhookEvent {
  action: string;
  repository?: {
    id: number;
    name: string;
    full_name: string;
    clone_url: string;
    html_url: string;
    private: boolean;
    owner: {
      login: string;
      id: number;
    };
  };
  pusher?: {
    name: string;
    email: string;
  };
  commits?: Array<{
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
    modified: string[];
    added: string[];
    removed: string[];
  }>;
}

interface GitLabWebhookEvent {
  object_kind: string;
  project?: {
    id: number;
    name: string;
    path_with_namespace: string;
    http_url: string;
    web_url: string;
    visibility: string;
    namespace: {
      name: string;
      path: string;
    };
  };
  user?: {
    name: string;
    email: string;
  };
  commits?: Array<{
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
    modified: string[];
    added: string[];
    removed: string[];
  }>;
}

export class WebhookService {
  
  /**
   * Verify GitHub webhook signature
   */
  private verifyGitHubSignature(payload: string, signature: string, secret: string): boolean {
    if (!signature || !signature.startsWith('sha256=')) {
      return false;
    }

    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Verify GitLab webhook signature
   */
  private verifyGitLabSignature(payload: string, signature: string, secret: string): boolean {
    if (!signature) {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Handle GitHub webhook events
   */
  async handleGitHubWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers['x-hub-signature-256'] as string;
    const event = req.headers['x-github-event'] as string;
    const payload = JSON.stringify(req.body);
    
    // Verify webhook signature if secret is configured
    if (process.env.GITHUB_WEBHOOK_SECRET) {
      if (!this.verifyGitHubSignature(payload, signature, process.env.GITHUB_WEBHOOK_SECRET)) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }
    }

    const webhookData: GitHubWebhookEvent = req.body;

    try {
      switch (event) {
        case 'repository':
          await this.handleGitHubRepositoryEvent(webhookData);
          break;
        case 'push':
          await this.handleGitHubPushEvent(webhookData);
          break;
        case 'pull_request':
          await this.handleGitHubPullRequestEvent(webhookData);
          break;
        default:
          console.log(`Unhandled GitHub event: ${event}`);
      }

      res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      console.error('Error processing GitHub webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Handle GitLab webhook events
   */
  async handleGitLabWebhook(req: Request, res: Response): Promise<void> {
    const token = req.headers['x-gitlab-token'] as string;
    const event = req.headers['x-gitlab-event'] as string;
    
    // Verify webhook token if configured
    if (process.env.GITLAB_WEBHOOK_SECRET && token !== process.env.GITLAB_WEBHOOK_SECRET) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    const webhookData: GitLabWebhookEvent = req.body;

    try {
      switch (webhookData.object_kind || event) {
        case 'project':
          await this.handleGitLabProjectEvent(webhookData);
          break;
        case 'push':
          await this.handleGitLabPushEvent(webhookData);
          break;
        case 'merge_request':
          await this.handleGitLabMergeRequestEvent(webhookData);
          break;
        default:
          console.log(`Unhandled GitLab event: ${webhookData.object_kind || event}`);
      }

      res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (error) {
      console.error('Error processing GitLab webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Handle GitHub repository events (created, deleted, etc.)
   */
  private async handleGitHubRepositoryEvent(data: GitHubWebhookEvent): Promise<void> {
    if (!data.repository) return;

    const { repository, action } = data;

    switch (action) {
      case 'created':
        await this.autoDiscoverRepository({
          name: repository.name,
          fullName: repository.full_name,
          cloneUrl: repository.clone_url,
          webUrl: repository.html_url,
          isPrivate: repository.private,
          platform: 'github',
          ownerId: repository.owner.id.toString(),
          ownerLogin: repository.owner.login
        });
        break;
      
      case 'deleted':
        await this.removeRepository(repository.full_name, 'github');
        break;
    }
  }

  /**
   * Handle GitLab project events
   */
  private async handleGitLabProjectEvent(data: GitLabWebhookEvent): Promise<void> {
    if (!data.project) return;

    const { project } = data;

    await this.autoDiscoverRepository({
      name: project.name,
      fullName: project.path_with_namespace,
      cloneUrl: project.http_url,
      webUrl: project.web_url,
      isPrivate: project.visibility === 'private',
      platform: 'gitlab',
      ownerId: project.namespace.path,
      ownerLogin: project.namespace.name
    });
  }

  /**
   * Handle GitHub push events
   */
  private async handleGitHubPushEvent(data: GitHubWebhookEvent): Promise<void> {
    if (!data.repository || !data.commits) return;

    // Check if package.json was modified
    const packageJsonModified = data.commits.some(commit => 
      commit.modified.includes('package.json') || 
      commit.added.includes('package.json')
    );

    if (packageJsonModified) {
      await this.triggerDependencyScan(data.repository.full_name, 'github');
    }
  }

  /**
   * Handle GitLab push events
   */
  private async handleGitLabPushEvent(data: GitLabWebhookEvent): Promise<void> {
    if (!data.project || !data.commits) return;

    // Check if package.json was modified
    const packageJsonModified = data.commits.some(commit => 
      commit.modified.includes('package.json') || 
      commit.added.includes('package.json')
    );

    if (packageJsonModified) {
      await this.triggerDependencyScan(data.project.path_with_namespace, 'gitlab');
    }
  }

  /**
   * Handle GitHub pull request events
   */
  private async handleGitHubPullRequestEvent(data: any): Promise<void> {
    if (data.action === 'opened' || data.action === 'synchronize') {
      // Trigger security scan on PR
      await this.triggerPullRequestScan(data.pull_request, 'github');
    }
  }

  /**
   * Handle GitLab merge request events
   */
  private async handleGitLabMergeRequestEvent(data: any): Promise<void> {
    if (data.object_attributes?.action === 'open' || data.object_attributes?.action === 'update') {
      // Trigger security scan on MR
      await this.triggerPullRequestScan(data.object_attributes, 'gitlab');
    }
  }

  /**
   * Auto-discover and add repository
   */
  private async autoDiscoverRepository(repoData: {
    name: string;
    fullName: string;
    cloneUrl: string;
    webUrl: string;
    isPrivate: boolean;
    platform: string;
    ownerId: string;
    ownerLogin: string;
  }): Promise<void> {
    try {
      // Check if repository already exists
      const existingRepo = await db.query.repositories.findFirst({
        where: eq(repositories.gitUrl, repoData.cloneUrl)
      });

      if (existingRepo) {
        console.log(`Repository ${repoData.fullName} already exists`);
        return;
      }

      // Find user by platform ID or create auto-discovery team
      let userId = await this.findUserByPlatformId(repoData.ownerId, repoData.platform);
      
      if (!userId) {
        // Create auto-discovery team for unclaimed repositories
        userId = 'auto-discovery';
      }

      // Add repository
      const newRepo = await storage.addRepository({
        repositoryName: repoData.name,
        gitUrl: repoData.cloneUrl,
        isPrivate: repoData.isPrivate,
        branch: 'main',
        authToken: '', // Will need authentication for private repos
        slackWebhookUrl: null,
        emailNotifications: true
      }, userId);

      console.log(`Auto-discovered repository: ${repoData.fullName}`);

      // Trigger initial scan
      await scanner.scanRepository(newRepo.id);

      // Send notification to relevant teams
      await this.notifyAutoDiscovery(repoData, newRepo.id);

    } catch (error) {
      console.error('Error auto-discovering repository:', error);
    }
  }

  /**
   * Remove repository
   */
  private async removeRepository(fullName: string, platform: string): Promise<void> {
    try {
      // Find and remove repository
      const repo = await db.query.repositories.findFirst({
        where: eq(repositories.repositoryName, fullName.split('/').pop() || fullName)
      });

      if (repo) {
        await storage.deleteRepository(repo.id);
        console.log(`Removed repository: ${fullName}`);
      }
    } catch (error) {
      console.error('Error removing repository:', error);
    }
  }

  /**
   * Trigger dependency scan
   */
  private async triggerDependencyScan(repoName: string, platform: string): Promise<void> {
    try {
      const repo = await db.query.repositories.findFirst({
        where: eq(repositories.repositoryName, repoName.split('/').pop() || repoName)
      });

      if (repo) {
        console.log(`Triggering dependency scan for: ${repoName}`);
        await scanner.scanRepository(repo.id);
      }
    } catch (error) {
      console.error('Error triggering dependency scan:', error);
    }
  }

  /**
   * Trigger pull request scan
   */
  private async triggerPullRequestScan(prData: any, platform: string): Promise<void> {
    try {
      const repoName = platform === 'github' 
        ? prData.base.repo.name 
        : prData.target.path_with_namespace.split('/').pop();

      const repo = await db.query.repositories.findFirst({
        where: eq(repositories.repositoryName, repoName)
      });

      if (repo) {
        console.log(`Triggering PR/MR scan for: ${repoName}`);
        
        // Run scan and check for critical vulnerabilities
        const scanResult = await scanner.scanRepository(repo.id);
        
        // If critical vulnerabilities found, comment on PR/MR
        if (scanResult && this.hasCriticalVulnerabilities(scanResult)) {
          await this.commentOnPullRequest(prData, platform, scanResult);
        }
      }
    } catch (error) {
      console.error('Error triggering PR scan:', error);
    }
  }

  /**
   * Check if scan has critical vulnerabilities
   */
  private hasCriticalVulnerabilities(scanResult: any): boolean {
    return scanResult.vulnerabilities?.some((vuln: any) => vuln.severity === 'critical') || false;
  }

  /**
   * Comment on pull request with security findings
   */
  private async commentOnPullRequest(prData: any, platform: string, scanResult: any): Promise<void> {
    // This would integrate with GitHub/GitLab API to post comments
    // For now, log the action
    console.log(`Would comment on ${platform} PR/MR ${prData.number || prData.iid} with security findings`);
    
    // Future implementation would use GitHub/GitLab API clients
    // await githubClient.issues.createComment() or gitlabClient.MergeRequestNotes.create()
  }

  /**
   * Find user by platform ID
   */
  private async findUserByPlatformId(platformId: string, platform: string): Promise<string | null> {
    // This would look up user by their GitHub/GitLab ID
    // For now, return null to use auto-discovery team
    return null;
  }

  /**
   * Notify about auto-discovery
   */
  private async notifyAutoDiscovery(repoData: any, repositoryId: number): Promise<void> {
    try {
      // Create notification for auto-discovery team
      await teamService.createTeamNotification(1, { // Assuming team ID 1 is auto-discovery team
        type: 'repository_discovered',
        title: 'Repository Auto-Discovered',
        message: `New repository "${repoData.fullName}" has been automatically discovered and added for monitoring.`,
        data: {
          repositoryId,
          platform: repoData.platform,
          isPrivate: repoData.isPrivate
        },
        severity: 'info',
        recipients: ['admin'],
        channels: ['in_app', 'email']
      });
    } catch (error) {
      console.error('Error sending auto-discovery notification:', error);
    }
  }

  /**
   * Setup webhook endpoints
   */
  setupWebhookEndpoints(app: any): void {
    // GitHub webhook endpoint
    app.post('/webhooks/github', (req: Request, res: Response) => {
      this.handleGitHubWebhook(req, res);
    });

    // GitLab webhook endpoint
    app.post('/webhooks/gitlab', (req: Request, res: Response) => {
      this.handleGitLabWebhook(req, res);
    });

    // Generic webhook endpoint for custom integrations
    app.post('/webhooks/generic', (req: Request, res: Response) => {
      this.handleGenericWebhook(req, res);
    });
  }

  /**
   * Handle generic webhook for custom integrations
   */
  private async handleGenericWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { type, repository, action, data } = req.body;

      switch (type) {
        case 'repository_scan':
          if (repository && action === 'trigger') {
            await this.triggerDependencyScan(repository, 'generic');
          }
          break;
        
        case 'security_alert':
          if (data) {
            await this.handleCustomSecurityAlert(data);
          }
          break;
        
        default:
          console.log(`Unhandled generic webhook type: ${type}`);
      }

      res.status(200).json({ message: 'Generic webhook processed' });
    } catch (error) {
      console.error('Error processing generic webhook:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Handle custom security alerts
   */
  private async handleCustomSecurityAlert(data: any): Promise<void> {
    // Process custom security alert data
    console.log('Processing custom security alert:', data);
  }
}

export const webhookService = new WebhookService();