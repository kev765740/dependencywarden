/**
 * Auto-Fix Pull Request Service
 * Generates automated fixes for security vulnerabilities
 */

import { Octokit } from '@octokit/rest';

export class AutoFixService {
  private octokit: Octokit;

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }

  async createAutoFixPR(vulnerabilityId: number, repositoryUrl: string): Promise<any> {
    try {
      // Extract owner and repo from URL
      const urlParts = repositoryUrl.replace('https://github.com/', '').replace('.git', '').split('/');
      const owner = urlParts[0];
      const repo = urlParts[1];

      if (!owner || !repo) {
        throw new Error('Invalid repository URL format');
      }

      // Get vulnerability details from database
      const { storage } = await import('./storage');
      const alert = await storage.getAlertById(vulnerabilityId);
      
      if (!alert) {
        throw new Error('Vulnerability not found');
      }

      // Create a new branch for the fix
      const branchName = `auto-fix-${alert.dependencyName}-${Date.now()}`;
      
      // Get the default branch
      const { data: repoData } = await this.octokit.rest.repos.get({
        owner,
        repo,
      });
      
      const defaultBranch = repoData.default_branch;
      
      // Get the latest commit SHA
      const { data: refData } = await this.octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${defaultBranch}`,
      });
      
      const latestCommitSha = refData.object.sha;

      // Create new branch
      await this.octokit.rest.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: latestCommitSha,
      });

      // Generate fix based on vulnerability type
      const fixFiles = await this.generateFix(alert, owner, repo, defaultBranch);

      // Apply fixes to the branch
      for (const file of fixFiles) {
        await this.updateFile(owner, repo, branchName, file);
      }

      // Create pull request
      const { data: pr } = await this.octokit.rest.pulls.create({
        owner,
        repo,
        title: `🔒 Auto-fix: Update ${alert.dependencyName} to address ${alert.alertType}`,
        head: branchName,
        base: defaultBranch,
        body: this.generatePRDescription(alert),
      });

      // Update alert with PR information
      await storage.updateAlert(alert.id, {
        prUrl: pr.html_url,
        prNumber: pr.number,
        autoFixStatus: 'pr_created'
      });

      return {
        success: true,
        prUrl: pr.html_url,
        prNumber: pr.number,
        branchName,
        message: 'Auto-fix pull request created successfully'
      };

    } catch (error: any) {
      console.error('Error creating auto-fix PR:', error);
      
      // Update alert with error status
      try {
        const { storage } = await import('./storage');
        await storage.updateAlert(vulnerabilityId, {
          autoFixStatus: 'failed',
          autoFixError: error.message
        });
      } catch (updateError) {
        console.error('Error updating alert status:', updateError);
      }

      throw new Error(`Failed to create auto-fix PR: ${error.message}`);
    }
  }

  private async generateFix(alert: any, owner: string, repo: string, branch: string): Promise<any[]> {
    const fixes: any[] = [];

    try {
      // Get package.json content
      const { data: packageJsonData } = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path: 'package.json',
        ref: branch,
      });

      if ('content' in packageJsonData) {
        const packageJsonContent = Buffer.from(packageJsonData.content, 'base64').toString();
        const packageJson = JSON.parse(packageJsonContent);

        // Update dependency version
        const fixedVersion = this.getFixedVersion(alert);
        
        if (packageJson.dependencies && packageJson.dependencies[alert.dependencyName]) {
          packageJson.dependencies[alert.dependencyName] = fixedVersion;
        }
        
        if (packageJson.devDependencies && packageJson.devDependencies[alert.dependencyName]) {
          packageJson.devDependencies[alert.dependencyName] = fixedVersion;
        }

        fixes.push({
          path: 'package.json',
          content: JSON.stringify(packageJson, null, 2),
          sha: packageJsonData.sha,
          message: `Update ${alert.dependencyName} to ${fixedVersion}`
        });
      }

      // Check for package-lock.json
      try {
        const { data: lockData } = await this.octokit.rest.repos.getContent({
          owner,
          repo,
          path: 'package-lock.json',
          ref: branch,
        });

        if ('content' in lockData) {
          // For package-lock.json, we'll add a note to regenerate it
          fixes.push({
            path: 'SECURITY_FIX_NOTES.md',
            content: `# Security Fix Applied\n\n⚠️ **Important:** Please run \`npm install\` to regenerate package-lock.json after merging this PR.\n\n## Fix Details\n- Updated ${alert.dependencyName} to address ${alert.alertType}\n- Dependency: ${alert.dependencyName}\n- Fixed Version: ${this.getFixedVersion(alert)}\n- Vulnerability: ${alert.description || 'Security vulnerability'}\n\n## Next Steps\n1. Review the changes\n2. Run \`npm install\` to update package-lock.json\n3. Test your application\n4. Merge when ready\n`,
            sha: null,
            message: `Add security fix notes for ${alert.dependencyName}`
          });
        }
      } catch (error) {
        // package-lock.json might not exist, continue
      }

    } catch (error) {
      console.error('Error generating fix:', error);
      
      // Fallback: create a general security notice
      fixes.push({
        path: 'SECURITY_UPDATE_REQUIRED.md',
        content: `# Security Update Required\n\n🔒 **Security Alert:** ${alert.dependencyName}\n\n## Issue\n${alert.description || 'Security vulnerability detected'}\n\n## Recommended Action\nUpdate ${alert.dependencyName} to a secure version.\n\n## Manual Fix\n\`\`\`bash\nnpm update ${alert.dependencyName}\n\`\`\`\n\nGenerated by DependencyWarden on ${new Date().toISOString()}\n`,
        sha: null,
        message: `Security alert: Update ${alert.dependencyName}`
      });
    }

    return fixes;
  }

  private getFixedVersion(alert: any): string {
    // If we have a fixed version in the alert, use it
    if (alert.fixedVersion) {
      return `^${alert.fixedVersion}`;
    }

    // Otherwise, try to determine from the vulnerability info
    if (alert.description && alert.description.includes('>=')) {
      const match = alert.description.match(/>=\s*([0-9.]+)/);
      if (match) {
        return `^${match[1]}`;
      }
    }

    // Fallback: suggest updating to latest
    return 'latest';
  }

  private async updateFile(owner: string, repo: string, branch: string, file: any): Promise<void> {
    const params: any = {
      owner,
      repo,
      path: file.path,
      message: file.message,
      content: Buffer.from(file.content).toString('base64'),
      branch,
    };

    if (file.sha) {
      params.sha = file.sha;
    }

    await this.octokit.rest.repos.createOrUpdateFileContents(params);
  }

  private generatePRDescription(alert: any): string {
    return `## 🔒 Security Fix: ${alert.dependencyName}

**Vulnerability Type:** ${alert.alertType}
**Severity:** ${alert.severity || 'Unknown'}

### Description
${alert.description || 'Security vulnerability detected in dependency.'}

### Changes Made
- Updated \`${alert.dependencyName}\` to address security vulnerability
- Fixed version: ${this.getFixedVersion(alert)}

### Testing Required
Please verify that your application still works correctly after this update:
1. Install dependencies: \`npm install\`
2. Run tests: \`npm test\`
3. Test critical functionality

### Generated by DependencyWarden
This pull request was automatically generated by DependencyWarden's security monitoring system.

**Review Guidelines:**
- ✅ Verify the dependency update doesn't break functionality
- ✅ Run your test suite
- ✅ Test in a staging environment before merging
- ✅ Update package-lock.json if needed

---
*For questions about this automated fix, contact your security team or DependencyWarden support.*`;
  }
}

export const autoFixService = new AutoFixService();