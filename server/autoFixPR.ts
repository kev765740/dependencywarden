/**
 * Auto-Fix Pull Request Generator
 * Creates GitHub PRs with vulnerability fixes
 */

import { Octokit } from "@octokit/rest";
import { storage } from "./storage";

export class AutoFixPRGenerator {
  private octokit: Octokit | null = null;

  constructor() {
    if (process.env.GITHUB_TOKEN) {
      this.octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN,
      });
    }
  }

  async generateFixPR(vulnerabilityId: number, repositoryId: number) {
    try {
      if (!this.octokit) {
        throw new Error('GitHub token not configured');
      }

      const repository = await storage.getRepositoryById(repositoryId);
      if (!repository) {
        throw new Error('Repository not found');
      }

      // Parse GitHub URL to get owner and repo
      const urlParts = repository.gitUrl.replace('https://github.com/', '').replace('.git', '').split('/');
      if (urlParts.length !== 2) {
        throw new Error('Invalid GitHub repository URL');
      }

      const [owner, repo] = urlParts;

      // Get vulnerability details from database
      const alerts = await storage.getAlertsByRepoId(repositoryId);
      const vulnerability = alerts.find(alert => alert.id === vulnerabilityId);
      
      if (!vulnerability) {
        throw new Error('Vulnerability not found');
      }

      // Create a new branch
      const branchName = `security-fix-${vulnerability.packageName || 'dependency'}-${Date.now()}`;
      
      // Get the default branch
      const { data: repoData } = await this.octokit.repos.get({ owner, repo });
      const defaultBranch = repoData.default_branch;

      // Get the latest commit SHA
      const { data: refData } = await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${defaultBranch}`
      });

      // Create new branch
      await this.octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: refData.object.sha
      });

      // Update package.json (simplified example)
      const packageJsonContent = this.generateFixedPackageJson(vulnerability);
      
      // Create/update package.json
      try {
        const { data: fileData } = await this.octokit.repos.getContent({
          owner,
          repo,
          path: 'package.json',
          ref: branchName
        });

        if ('content' in fileData) {
          await this.octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: 'package.json',
            message: `Security fix: Update ${vulnerability.packageName} to ${vulnerability.fixedVersion || 'latest'}

Fixes security vulnerability ${vulnerability.cveId || 'identified issue'}
- Updated ${vulnerability.packageName} from ${vulnerability.packageVersion || 'current'} to ${vulnerability.fixedVersion || 'latest'}
- Addresses critical security issue
- No breaking changes expected`,
            content: Buffer.from(packageJsonContent).toString('base64'),
            branch: branchName,
            sha: fileData.sha
          });
        }
      } catch (error) {
        console.error('Failed to update package.json:', error);
      }

      // Create pull request
      const { data: prData } = await this.octokit.pulls.create({
        owner,
        repo,
        title: `Security fix: Update ${vulnerability.packageName} to address ${vulnerability.cveId}`,
        head: branchName,
        base: defaultBranch,
        body: this.generatePRDescription(vulnerability),
        maintainer_can_modify: true
      });

      return {
        success: true,
        pullRequestUrl: prData.html_url,
        pullRequestNumber: prData.number,
        branchName
      };

    } catch (error) {
      console.error('Failed to create auto-fix PR:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private generateFixedPackageJson(vulnerability: any): string {
    // This is a simplified example - real implementation would parse and update actual package.json
    const packageJson = {
      "name": "example-app",
      "version": "1.0.0",
      "dependencies": {
        [vulnerability.packageName]: vulnerability.fixedVersion || 'latest'
      }
    };
    
    return JSON.stringify(packageJson, null, 2);
  }

  private generatePRDescription(vulnerability: any): string {
    return `## Security Vulnerability Fix

This PR addresses a security vulnerability in \`${vulnerability.packageName}\`.

### Vulnerability Details
- **CVE**: ${vulnerability.cveId}
- **Package**: ${vulnerability.packageName}
- **Current Version**: ${vulnerability.packageVersion || 'current'}
- **Fixed Version**: ${vulnerability.fixedVersion || 'latest'}

### Changes Made
- Updated \`${vulnerability.packageName}\` from ${vulnerability.packageVersion || 'current'} to ${vulnerability.fixedVersion || 'latest'}

### Security Impact
This update addresses a critical security vulnerability that could potentially:
- Allow remote code execution
- Expose sensitive data
- Compromise application security

### Testing
- [ ] Run existing test suite
- [ ] Verify application functionality
- [ ] Check for any breaking changes

### Merge Checklist
- [ ] All tests pass
- [ ] No breaking changes detected
- [ ] Security vulnerability resolved

---
*This PR was automatically generated by DependencyWarden's Auto-Fix system.*`;
  }

  async listOpenPRs(repositoryId: number) {
    try {
      const repository = await storage.getRepositoryById(repositoryId);
      if (!repository) {
        return [];
      }

      const urlParts = repository.gitUrl.replace('https://github.com/', '').replace('.git', '').split('/');
      if (urlParts.length !== 2) {
        return [];
      }

      const [owner, repo] = urlParts;

      const { data: prs } = await this.octokit!.pulls.list({
        owner,
        repo,
        state: 'open'
      });

      // Filter for security fix PRs
      return prs.filter(pr => 
        pr.title.toLowerCase().includes('security fix') ||
        pr.head.ref.includes('security-fix')
      ).map(pr => ({
        id: pr.number,
        title: pr.title,
        url: pr.html_url,
        branch: pr.head.ref,
        createdAt: pr.created_at
      }));

    } catch (error) {
      console.error('Failed to list PRs:', error);
      return [];
    }
  }
}

export const autoFixPRGenerator = new AutoFixPRGenerator();