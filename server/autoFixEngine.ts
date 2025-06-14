import { Octokit } from "@octokit/rest";
import { storage } from "./storage";
import fs from 'fs';
import path from 'path';
import { db } from './db';
import { alerts, repositories, autoFixExecutions, autoFixRules } from '../shared/schema';
import { eq, and, desc, count, gte, lte } from 'drizzle-orm';

export interface VulnerabilityFix {
  id: number;
  cve: string;
  packageName: string;
  currentVersion: string;
  fixedVersion: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  repositoryId: number;
  description: string;
}

export interface AutoFixRule {
  id: string;
  name: string;
  enabled: boolean;
  severity: ('critical' | 'high' | 'medium' | 'low')[];
  repositories: string[];
  autoMerge: boolean;
  requiresReview: boolean;
  maxDailyPRs: number;
  testRequired: boolean;
  description: string;
  conditions?: {
    severity?: string[];
  };
}

export interface GeneratedPR {
  id: string;
  repository: string;
  prNumber: number;
  title: string;
  status: 'draft' | 'open' | 'merged' | 'closed';
  branch: string;
  url: string;
  createdAt: Date;
  vulnerability: {
    cve: string;
    severity: string;
    package: string;
  };
  changes: {
    files: number;
    additions: number;
    deletions: number;
  };
  tests: {
    total: number;
    passed: number;
    failed: number;
  };
  reviewStatus: 'pending' | 'approved' | 'changes_requested' | 'dismissed';
}

export interface ExecutionStats {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  averageTime: number;
  trends: {
    daily: Array<{ date: string; count: number; success: number }>;
    weekly: Array<{ week: string; count: number; success: number }>;
  };
}

class AutoFixEngine {
  private octokit: Octokit;

  constructor() {
    const githubToken = process.env.GITHUB_TOKEN;
    if (githubToken && githubToken.trim() !== '') {
      console.log('GitHub token found, initializing Octokit...');
      this.octokit = new Octokit({
        auth: githubToken.trim(),
      });
    } else {
      console.warn('GitHub token not found or empty. Auto-fix PRs will not work.');
      this.octokit = new Octokit({
        auth: '',
      });
    }
  }

  async getAutoFixRules(): Promise<AutoFixRule[]> {
    try {
      const rules = await db.query.autoFixRules.findMany({
        orderBy: [desc(autoFixRules.createdAt)]
      });

      if (rules.length === 0) {
        // Create default rules if none exist
        const defaultRules = await this.createDefaultRules();
        return defaultRules;
      }

      return rules.map(rule => ({
        id: rule.id.toString(),
        name: rule.name,
        enabled: rule.enabled,
        severity: rule.severity as ('critical' | 'high' | 'medium' | 'low')[],
        repositories: rule.repositories || ['*'],
        autoMerge: rule.autoMerge,
        requiresReview: rule.requiresReview,
        maxDailyPRs: rule.maxDailyPRs,
        testRequired: rule.testRequired,
        description: rule.description,
        conditions: rule.conditions ? JSON.parse(rule.conditions) : undefined
      }));
    } catch (error) {
      console.error('Error fetching auto-fix rules:', error);
      return this.getDefaultRules();
    }
  }

  private async createDefaultRules(): Promise<AutoFixRule[]> {
    const defaultRulesData = [
      {
        name: "Critical Vulnerability Auto-Fix",
        enabled: true,
        severity: ["critical"],
        repositories: ["*"],
        autoMerge: false,
        requiresReview: true,
        maxDailyPRs: 5,
        testRequired: true,
        description: "Automatically generate PRs for critical vulnerabilities",
        conditions: JSON.stringify({ severity: ["critical"] })
      },
      {
        name: "High Severity Auto-Fix",
        enabled: true,
        severity: ["high"],
        repositories: ["*"],
        autoMerge: false,
        requiresReview: true,
        maxDailyPRs: 10,
        testRequired: true,
        description: "Automatically generate PRs for high severity vulnerabilities",
        conditions: JSON.stringify({ severity: ["high"] })
      }
    ];

    const createdRules = [];
    for (const ruleData of defaultRulesData) {
      try {
        const [rule] = await db.insert(autoFixRules).values({
          ...ruleData,
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();

        createdRules.push({
          id: rule.id.toString(),
          name: rule.name,
          enabled: rule.enabled,
          severity: rule.severity as ('critical' | 'high' | 'medium' | 'low')[],
          repositories: rule.repositories || ['*'],
          autoMerge: rule.autoMerge,
          requiresReview: rule.requiresReview,
          maxDailyPRs: rule.maxDailyPRs,
          testRequired: rule.testRequired,
          description: rule.description
        });
      } catch (error) {
        console.error('Error creating default rule:', error);
      }
    }

    return createdRules;
  }

  private getDefaultRules(): AutoFixRule[] {
    return [
      {
        id: "default-critical",
        name: "Critical Vulnerability Auto-Fix",
        enabled: true,
        severity: ["critical"],
        repositories: ["*"],
        autoMerge: false,
        requiresReview: true,
        maxDailyPRs: 5,
        testRequired: true,
        description: "Automatically generate PRs for critical vulnerabilities"
      },
      {
        id: "default-high",
        name: "High Severity Auto-Fix",
        enabled: true,
        severity: ["high"],
        repositories: ["*"],
        autoMerge: false,
        requiresReview: true,
        maxDailyPRs: 10,
        testRequired: true,
        description: "Automatically generate PRs for high severity vulnerabilities"
      }
    ];
  }

  async analyzeVulnerability(vulnerability: VulnerabilityFix): Promise<{
    canAutoFix: boolean;
    confidence: number;
    strategy: string;
    estimatedTime: string;
    breakingChanges: boolean;
    recommendations: string[];
    aiAnalysis?: {
      codeImpact: string;
      testRequirements: string[];
      migrationSteps: string[];
      alternativeFixes: string[];
    };
  }> {
    try {
      // Check rate limits first
      const { autoFixRateLimiter } = await import('./autoFixRateLimiter');
      const rateLimitCheck = await autoFixRateLimiter.checkRateLimit(
        '1', // userId - should come from context
        vulnerability.repositoryId,
        'get_repo'
      );

      if (!rateLimitCheck.allowed) {
        return {
          canAutoFix: false,
          confidence: 0,
          strategy: 'rate_limited',
          estimatedTime: `${rateLimitCheck.waitTime} seconds`,
          breakingChanges: false,
          recommendations: [`Rate limited. Wait ${rateLimitCheck.waitTime} seconds before retrying.`]
        };
      }

      // Enhanced AI-powered analysis
      const aiAnalysis = await this.performAIAnalysis(vulnerability);

      // Analyze if vulnerability can be auto-fixed
      const canAutoFix = this.canVulnerabilityBeAutoFixed(vulnerability);
      const confidence = this.calculateAdvancedFixConfidence(vulnerability, aiAnalysis);
      const strategy = this.determineFixStrategy(vulnerability);
      const breakingChanges = await this.assessBreakingChanges(vulnerability);

      return {
        canAutoFix,
        confidence,
        strategy,
        estimatedTime: this.estimateFixTime(vulnerability),
        breakingChanges,
        recommendations: this.generateSmartRecommendations(vulnerability, aiAnalysis),
        aiAnalysis
      };
    } catch (error) {
      console.error('Error analyzing vulnerability:', error);
      return {
        canAutoFix: false,
        confidence: 0,
        strategy: 'manual',
        estimatedTime: 'Unknown',
        breakingChanges: true,
        recommendations: ['Manual review required']
      };
    }
  }

  private async performAIAnalysis(vulnerability: VulnerabilityFix): Promise<{
    codeImpact: string;
    testRequirements: string[];
    migrationSteps: string[];
    alternativeFixes: string[];
  }> {
    try {
      // Get repository context
      const repository = await storage.getRepositoryById(vulnerability.repositoryId);
      if (!repository) {
        throw new Error('Repository not found');
      }

      // AI-powered analysis using Security Copilot
      const { securityCopilot } = await import('./securityCopilot');

      const analysisPrompt = `Analyze this security vulnerability fix:
CVE: ${vulnerability.cve}
Package: ${vulnerability.packageName}
Current: ${vulnerability.currentVersion}
Fixed: ${vulnerability.fixedVersion}
Repository: ${repository.name}

Provide detailed analysis including:
1. Code impact assessment
2. Required test modifications
3. Migration steps
4. Alternative fix approaches

Return JSON format with codeImpact, testRequirements, migrationSteps, alternativeFixes fields.`;

      const aiResponse = await securityCopilot.generateResponse(analysisPrompt, {
        includeContext: true,
        analysisType: 'vulnerability_fix',
        repositoryId: vulnerability.repositoryId
      });

      try {
        return JSON.parse(aiResponse.content);
      } catch {
        // Fallback structured analysis
        return {
          codeImpact: `Updating ${vulnerability.packageName} may affect dependent modules`,
          testRequirements: ['Update unit tests', 'Run integration tests', 'Validate API contracts'],
          migrationSteps: [
            `Update ${vulnerability.packageName} to ${vulnerability.fixedVersion}`,
            'Check for deprecated API usage',
            'Update import statements if needed'
          ],
          alternativeFixes: ['Manual patching', 'Vendor-specific security patch']
        };
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      return {
        codeImpact: 'Unable to determine impact automatically',
        testRequirements: ['Manual testing required'],
        migrationSteps: ['Manual review and implementation needed'],
        alternativeFixes: ['Contact security team for guidance']
      };
    }
  }

  private calculateAdvancedFixConfidence(vulnerability: VulnerabilityFix, aiAnalysis: any): number {
    let confidence = this.calculateFixConfidence(vulnerability);

    // Boost confidence for well-analyzed fixes
    if (aiAnalysis.codeImpact.includes('minimal impact') || 
        aiAnalysis.codeImpact.includes('low risk')) {
      confidence += 0.15;
    }

    // Reduce confidence for complex migrations
    if (aiAnalysis.migrationSteps.length > 5) {
      confidence -= 0.1;
    }

    // Factor in test coverage
    if (aiAnalysis.testRequirements.length <= 3) {
      confidence += 0.1;
    }

    return Math.min(0.98, Math.max(0.1, confidence));
  }

  private generateSmartRecommendations(vulnerability: VulnerabilityFix, aiAnalysis: any): string[] {
    const recommendations = this.generateRecommendations(vulnerability);

    // Add AI-generated recommendations
    if (aiAnalysis.alternativeFixes.length > 0) {
      recommendations.push(`Alternative approaches: ${aiAnalysis.alternativeFixes.join(', ')}`);
    }

    if (aiAnalysis.codeImpact.includes('breaking')) {
      recommendations.unshift('⚠️ Breaking changes detected - schedule maintenance window');
    }

    recommendations.push(`🤖 AI Impact: ${aiAnalysis.codeImpact}`);

    return recommendations;
  }

  async generateFixPR(vulnerability: VulnerabilityFix): Promise<GeneratedPR | null> {
    try {
      // Get repository details
      const repository = await db.query.repositories.findFirst({
        where: eq(repositories.id, vulnerability.repositoryId)
      });

      if (!repository) {
        throw new Error(`Repository with ID ${vulnerability.repositoryId} not found`);
      }

      // Extract owner and repo from git URL
      const gitUrlMatch = repository.gitUrl.match(/github\.com[\/:]([^\/]+)\/([^\/\.]+)/);
      if (!gitUrlMatch) {
        throw new Error(`Invalid GitHub URL: ${repository.gitUrl}`);
      }

      const [, owner, repo] = gitUrlMatch;

      // Get the default branch
      const { data: repoData } = await this.octokit.repos.get({ owner, repo });
      const defaultBranch = repoData.default_branch;

      // Get the latest commit SHA
      const { data: refData } = await this.octokit.git.getRef({
        owner,
        repo,
        ref: `heads/${defaultBranch}`,
      });

      const latestCommitSha = refData.object.sha;
      const branchName = `security-fix-${vulnerability.packageName}-${Date.now()}`;

      // Create a new branch
      await this.octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: latestCommitSha,
      });

      // Update package.json or requirements.txt based on repository type
      const updatedFiles = await this.updateDependencyFiles(
        owner,
        repo,
        branchName,
        vulnerability
      );

      // Create pull request
      const { data: prData } = await this.octokit.pulls.create({
        owner,
        repo,
        title: `Security fix: Update ${vulnerability.packageName} to resolve ${vulnerability.cve}`,
        head: branchName,
        base: defaultBranch,
        body: this.generatePRDescription(vulnerability),
      });

      // Record execution in database
      const [execution] = await db.insert(autoFixExecutions).values({
        vulnerabilityId: vulnerability.id,
        status: 'success',
        prNumber: prData.number,
        prUrl: prData.html_url,
        branch: branchName,
        confidence: this.calculateFixConfidence(vulnerability),
        breakingChanges: await this.assessBreakingChanges(vulnerability),
        testResults: JSON.stringify({
          summary: { total: 0, passed: 0, failed: 0 },
          details: []
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      return {
        id: `pr-${execution.id}`,
        repository: repository.name,
        prNumber: prData.number,
        title: prData.title,
        status: "open",
        branch: branchName,
        url: prData.html_url,
        createdAt: new Date(),
        vulnerability: {
          cve: vulnerability.cve,
          severity: vulnerability.severity,
          package: vulnerability.packageName
        },
        changes: {
          files: updatedFiles.length,
          additions: 12, // Would be calculated from actual diff
          deletions: 5
        },
        tests: {
          total: 0,
          passed: 0,
          failed: 0
        },
        reviewStatus: "pending"
      };
    } catch (error) {
      console.error('Error generating fix PR:', error);

      // Record failed execution
      await db.insert(autoFixExecutions).values({
        vulnerabilityId: vulnerability.id,
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        confidence: 0,
        breakingChanges: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return null;
    }
  }

  private async updateDependencyFiles(
    owner: string,
    repo: string,
    branch: string,
    vulnerability: VulnerabilityFix
  ): Promise<string[]> {
    const updatedFiles: string[] = [];

    try {
      // Try to update package.json
      const { data: packageFile } = await this.octokit.repos.getContent({
        owner,
        repo,
        path: 'package.json',
        ref: branch,
      });

      if ('content' in packageFile) {
        const packageContent = Buffer.from(packageFile.content, 'base64').toString();
        const packageJson = JSON.parse(packageContent);

        if (packageJson.dependencies && packageJson.dependencies[vulnerability.packageName]) {
          packageJson.dependencies[vulnerability.packageName] = vulnerability.fixedVersion;

          await this.octokit.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: 'package.json',
            message: `Update ${vulnerability.packageName} to ${vulnerability.fixedVersion}`,
            content: Buffer.from(JSON.stringify(packageJson, null, 2)).toString('base64'),
            branch,
            sha: packageFile.sha,
          });

          updatedFiles.push('package.json');
        }
      }
    } catch (error) {
      // File might not exist, that's okay
    }

    return updatedFiles;
  }

  private generatePRDescription(vulnerability: VulnerabilityFix): string {
    return `## Security Fix: ${vulnerability.cve}

This PR addresses a **${vulnerability.severity}** severity vulnerability in \`${vulnerability.packageName}\`.

### Summary
${vulnerability.description}

### Changes Made
- Updated \`${vulnerability.packageName}\` from \`${vulnerability.currentVersion}\` to \`${vulnerability.fixedVersion}\`

### Security Impact
- **CVE**: ${vulnerability.cve}
- **Severity**: ${vulnerability.severity.toUpperCase()}
- **Package**: ${vulnerability.packageName}

### Recommended Actions
1. Review the changes carefully
2. Run tests to ensure compatibility
3. Deploy to staging environment first
4. Monitor for any issues after deployment

**This is an automated security fix generated by DependencyWarden.**`;
  }

  private canVulnerabilityBeAutoFixed(vulnerability: VulnerabilityFix): boolean {
    // Check if fixed version is available
    if (!vulnerability.fixedVersion) {
      return false;
    }

    // Check severity rules
    const applicableRules = this.rules.filter(rule => 
      rule.enabled && rule.severity.includes(vulnerability.severity)
    );

    if (applicableRules.length === 0) {
      return false;
    }

    // Check package allowlist/blocklist
    for (const rule of applicableRules) {
      if (rule.excludedPackages?.includes(vulnerability.packageName)) {
        return false;
      }

      if (rule.allowedPackages?.length && 
          !rule.allowedPackages.includes(vulnerability.packageName)) {
        return false;
      }
    }

    return true;
  }

  private calculateFixConfidence(vulnerability: VulnerabilityFix): number {
    let confidence = 0.7; // Base confidence

    // Higher confidence for well-known packages
    if (['react', 'express', 'lodash', 'axios'].includes(vulnerability.packageName)) {
      confidence += 0.1;
    }

    // Higher confidence for patch versions
    if (vulnerability.fixedVersion.includes('.')) {
      const [major1, minor1, patch1] = vulnerability.currentVersion.split('.');
      const [major2, minor2, patch2] = vulnerability.fixedVersion.split('.');

      if (major1 === major2 && minor1 === minor2) {
        confidence += 0.15; // Patch version update
      } else if (major1 === major2) {
        confidence += 0.05; // Minor version update
      }
    }

    // Lower confidence for critical vulnerabilities (more risky)
    if (vulnerability.severity === 'critical') {
      confidence -= 0.05;
    }

    return Math.min(Math.max(confidence, 0), 1);
  }

  private getHistoricalSuccessRate(packageName: string): number {
    // In production, this would query the database for historical success rates
    const knownPackages: { [key: string]: number } = {
      'express': 0.95,
      'lodash': 0.90,
      'axios': 0.85,
      'react': 0.80,
      'vue': 0.85
    };

    return knownPackages[packageName] || 0.75; // Default 75% success rate
  }

  private determineFixStrategy(vulnerability: VulnerabilityFix): string {
    const currentVersion = vulnerability.currentVersion;
    const fixedVersion = vulnerability.fixedVersion;

    if (this.isPatchVersion(currentVersion, fixedVersion)) {
      return 'patch-update';
    } else if (this.isMinorVersion(currentVersion, fixedVersion)) {
      return 'minor-update';
    } else if (this.isMajorVersion(currentVersion, fixedVersion)) {
      return 'major-update';
    } else {
      return 'custom-fix';
    }
  }

  private async assessBreakingChanges(vulnerability: VulnerabilityFix): Promise<boolean> {
    const currentVersion = vulnerability.currentVersion;
    const fixedVersion = vulnerability.fixedVersion;

    // Major version changes are likely breaking
    if (this.isMajorVersion(currentVersion, fixedVersion)) {
      return true;
    }

    // Known breaking change patterns
    const breakingPackages = ['webpack', 'babel', 'typescript'];
    if (breakingPackages.includes(vulnerability.packageName)) {
      return this.isMinorVersion(currentVersion, fixedVersion);
    }

    return false;
  }

  private estimateFixTime(vulnerability: VulnerabilityFix): string {
    const strategy = this.determineFixStrategy(vulnerability);

    switch (strategy) {
      case 'patch-update': return '5-10 minutes';
      case 'minor-update': return '15-30 minutes';
      case 'major-update': return '1-2 hours';
      default: return '30-60 minutes';
    }
  }

  private generateRecommendations(vulnerability: VulnerabilityFix): string[] {
    const recommendations = [];

    if (vulnerability.severity === 'critical') {
      recommendations.push('Immediate deployment recommended');
      recommendations.push('Monitor application behavior post-deployment');
    }

    if (this.isMajorVersion(vulnerability.currentVersion, vulnerability.fixedVersion)) {
      recommendations.push('Review breaking changes documentation');
      recommendations.push('Update integration tests');
    }

    recommendations.push('Run full test suite before merging');

    return recommendations;
  }

  private async generateFixContent(vulnerability: VulnerabilityFix): Promise<{
    packageJson?: string;
    yarnLock?: string;
    packageLock?: string;
  }> {
    const content: any = {};

    // Generate updated package.json
    content.packageJson = JSON.stringify({
      dependencies: {
        [vulnerability.packageName]: vulnerability.fixedVersion
      }
    }, null, 2);

    return content;
  }

  private async updateRepositoryFiles(
    owner: string,
    repo: string,
    branch: string,
    content: any
  ): Promise<Array<{ path: string; additions: number; deletions: number }>> {
    const updatedFiles = [];

    try {
      // Update package.json
      if (content.packageJson) {
        const { data: fileData } = await this.octokit!.repos.getContent({
          owner,
          repo,
          path: 'package.json',
          ref: branch
        });

        if ('content' in fileData) {
          await this.octokit!.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: 'package.json',
            message: 'Security fix: Update dependencies',
            content: Buffer.from(content.packageJson).toString('base64'),
            branch,
            sha: fileData.sha
          });

          updatedFiles.push({
            path: 'package.json',
            additions: 1,
            deletions: 1
          });
        }
      }
    } catch (error) {
      console.error('Error updating repository files:', error);
    }

    return updatedFiles;
  }

  private generatePRDescriptionOld(vulnerability: VulnerabilityFix, testResults?: any): string {
    const testSection = testResults ? `

### Test Results
- **Total Tests**: ${testResults.summary.total}
- **Passed**: ${testResults.summary.passed}
- **Failed**: ${testResults.summary.failed}
- **Coverage**: ${testResults.summary.coverage}%
- **Status**: ${testResults.status.toUpperCase()}

${testResults.tests.map((test: any) => 
  `- [${test.status === 'passed' ? '✅' : '❌'}] ${test.name}: ${test.description}`
).join('\n')}` : '';

    return `## 🔒 Security Vulnerability Fix

This PR addresses a **${vulnerability.severity}** severity security vulnerability in \`${vulnerability.packageName}\`.

### Vulnerability Details
- **CVE**: ${vulnerability.cve}
- **Package**: ${vulnerability.packageName}
- **Current Version**: ${vulnerability.currentVersion}
- **Fixed Version**: ${vulnerability.fixedVersion}
- **Severity**: ${vulnerability.severity.toUpperCase()}

### Description
${vulnerability.description}

### Changes Made
- Updated \`${vulnerability.packageName}\` from ${vulnerability.currentVersion} to ${vulnerability.fixedVersion}
${testSection}

### Security Impact
This update addresses the security vulnerability and eliminates the identified risk.

### Testing Checklist
- [${testResults?.summary.passed > 0 ? 'x' : ' '}] Dependencies updated successfully
- [${testResults?.status === 'passed' ? 'x' : ' '}] Application builds without errors
- [${testResults?.summary.passed > 0 ? 'x' : ' '}] All existing tests pass
- [${!this.isMajorVersion(vulnerability.currentVersion, vulnerability.fixedVersion) ? 'x' : ' '}] No breaking changes detected
- [ ] Security scan shows vulnerability resolved

### Deployment Notes
- This is a ${this.determineFixStrategy(vulnerability)} change
- ${this.estimateFixTime(vulnerability)} estimated to test and deploy
- Review recommended before merging

---
*This PR was automatically generated by DependencyWarden's Auto-Fix system.*`;
  }

  private async recordExecution(vulnerability: VulnerabilityFix, prData: any, testResults: any) {
    try {
      const { db } = await import('./db');
      const { autoFixExecutions } = await import('../shared/schema');

      await db.insert(autoFixExecutions).values({
        ruleId: 1, // Default rule for now
        vulnerabilityId: vulnerability.id,
        repositoryId: vulnerability.repositoryId,
        status: 'success',
        prNumber: prData.number,
        prUrl: prData.html_url,
        branch: prData.head.ref,
        confidence: this.calculateFixConfidence(vulnerability),
        strategy: this.determineFixStrategy(vulnerability),
        estimatedTime: this.estimateFixTime(vulnerability),
        breakingChanges: await this.assessBreakingChanges(vulnerability),
        testResults: testResults,
        executionTime: testResults.duration
      });
    } catch (error) {
      console.error('Error recording execution:', error);
    }
  }

  private async recordFailedExecution(vulnerability: VulnerabilityFix, error: any) {
    try {
      const { db } = await import('./db');
      const { autoFixExecutions } = await import('../shared/schema');

      await db.insert(autoFixExecutions).values({
        ruleId: 1,
        vulnerabilityId: vulnerability.id,
        repositoryId: vulnerability.repositoryId,
        status: 'failed',
        confidence: 0,
        strategy: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0
      });
    } catch (dbError) {
      console.error('Error recording failed execution:', dbError);
    }
  }

  private isPatchVersion(current: string, fixed: string): boolean {
    const currentParts = current.split('.').map(Number);
    const fixedParts = fixed.split('.').map(Number);

    return currentParts[0] === fixedParts[0] && 
           currentParts[1] === fixedParts[1] && 
           fixedParts[2] > currentParts[2];
  }

  private isMinorVersion(current: string, fixed: string): boolean {
    const currentParts = current.split('.').map(Number);
    const fixedParts = fixed.split('.').map(Number);

    return currentParts[0] === fixedParts[0] && 
           fixedParts[1] > currentParts[1];
  }

  private isMajorVersion(current: string, fixed: string): boolean {
    const currentParts = current.split('.').map(Number);
    const fixedParts = fixed.split('.').map(Number);

    return fixedParts[0] > currentParts[0];
  }

  async updateAutoFixRule(ruleId: string, updates: Partial<AutoFixRule>): Promise<AutoFixRule | null> {
    try {
      const [updatedRule] = await db.update(autoFixRules)
        .set({
          ...updates,
          conditions: updates.conditions ? JSON.stringify(updates.conditions) : undefined,
          updatedAt: new Date()
        })
        .where(eq(autoFixRules.id, parseInt(ruleId)))
        .returning();

      if (!updatedRule) {
        return null;
      }

      return {
        id: updatedRule.id.toString(),
        name: updatedRule.name,
        enabled: updatedRule.enabled,
        severity: updatedRule.severity as ('critical' | 'high' | 'medium' | 'low')[],
        repositories: updatedRule.repositories || ['*'],
        autoMerge: updatedRule.autoMerge,
        requiresReview: updatedRule.requiresReview,
        maxDailyPRs: updatedRule.maxDailyPRs,
        testRequired: updatedRule.testRequired,
        description: updatedRule.description,
        conditions: updatedRule.conditions ? JSON.parse(updatedRule.conditions) : undefined
      };
    } catch (error) {
      console.error('Error updating auto-fix rule:', error);
      return null;
    }
  }

  async batchGenerateFixPRs(vulnerabilities: VulnerabilityFix[]): Promise<GeneratedPR[]> {
    const results = [];
    const { autoFixRateLimiter } = await import('./autoFixRateLimiter');

    for (const vulnerability of vulnerabilities) {
      try {
        const analysis = await this.analyzeVulnerability(vulnerability);

        if (analysis.canAutoFix && analysis.confidence > 0.6) {
          const pr = await this.generateFixPR(vulnerability);
          if (pr) {
            results.push(pr);
          }
        }

        // Rate limiting between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error processing vulnerability ${vulnerability.id}:`, error);
      }
    }

    return results;
  }

  async getExecutionStats(repositoryId?: number): Promise<ExecutionStats> {
    try {
      const whereClause = repositoryId 
        ? eq(autoFixExecutions.vulnerabilityId, repositoryId)
        : undefined;

      const executions = await db.query.autoFixExecutions.findMany({
        where: whereClause,
        orderBy: [desc(autoFixExecutions.createdAt)],
        limit: 1000
      });

      const total = executions.length;
      const successful = executions.filter(e => e.status === 'success').length;
      const failed = total - successful;
      const successRate = total > 0 ? (successful / total) * 100 : 0;

      // Calculate average execution time (mock for now)
      const averageTime = 2.5; // minutes

      // Generate daily trends for last 30 days
      const dailyTrends = [];
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        const dayExecutions = executions.filter(e => {
          const execDate = new Date(e.createdAt);
          return execDate.toISOString().split('T')[0] === dateStr;
        });

        dailyTrends.push({
          date: dateStr,
          count: dayExecutions.length,
          success: dayExecutions.filter(e => e.status === 'success').length
        });
      }

      // Generate weekly trends
      const weeklyTrends = [];
      for (let i = 11; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);

        const weekExecutions = executions.filter(e => {
          const execDate = new Date(e.createdAt);
          return execDate >= weekStart && execDate <= weekEnd;
        });

        weeklyTrends.push({
          week: `${weekStart.toISOString().split('T')[0]}`,
          count: weekExecutions.length,
          success: weekExecutions.filter(e => e.status === 'success').length
        });
      }

      return {
        total,
        successful,
        failed,
        successRate: Math.round(successRate * 100) / 100,
        averageTime,
        trends: {
          daily: dailyTrends,
          weekly: weeklyTrends
        }
      };
    } catch (error) {
      console.error('Error getting execution stats:', error);
      return {
        total: 0,
        successful: 0,
        failed: 0,
        successRate: 0,
        averageTime: 0,
        trends: {
          daily: [],
          weekly: []
        }
      };
    }
  }

  private isPatchVersion(current: string, fixed: string): boolean {
    const currentParts = current.split('.').map(Number);
    const fixedParts = fixed.split('.').map(Number);

    return currentParts[0] === fixedParts[0] && 
           currentParts[1] === fixedParts[1] && 
           fixedParts[2] > currentParts[2];
  }

  private isMinorVersion(current: string, fixed: string): boolean {
    const currentParts = current.split('.').map(Number);
    const fixedParts = fixed.split('.').map(Number);

    return currentParts[0] === fixedParts[0] && 
           fixedParts[1] > currentParts[1];
  }

  private isMajorVersion(current: string, fixed: string): boolean {
    const currentParts = current.split('.').map(Number);
    const fixedParts = fixed.split('.').map(Number);

    return fixedParts[0] > currentParts[0];
  }
}

export const autoFixEngine = new AutoFixEngine();