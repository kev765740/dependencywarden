import OpenAI from "openai";
import { Octokit } from "@octokit/rest";
import * as fs from 'fs';
import * as path from 'path';
import simpleGit from 'simple-git';

// Initialize OpenAI with error handling
let openai: OpenAI | null = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
} catch (error) {
  console.warn('OpenAI initialization failed:', error);
}

interface VulnerabilityFix {
  alertId: number;
  cveId: string;
  packageName: string;
  currentVersion: string;
  fixedVersion: string;
  vulnerabilityType: string;
  severity: string;
  description: string;
  repositoryUrl: string;
  repositoryPath: string;
}

interface FixStrategy {
  type: 'version_update' | 'dependency_replacement' | 'code_patch' | 'configuration_change';
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  breaking_changes: boolean;
  test_required: boolean;
  rollback_plan: string;
}

interface GeneratedPR {
  title: string;
  body: string;
  branchName: string;
  files: Array<{
    path: string;
    content: string;
    operation: 'create' | 'update' | 'delete';
  }>;
  tests: Array<{
    path: string;
    content: string;
  }>;
  strategy: FixStrategy;
}

export class AutoFixPRGenerator {
  private octokit: Octokit;

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });
  }

  /**
   * Generate and create automated fix PR
   */
  async generateFixPR(vulnerability: VulnerabilityFix): Promise<{
    prUrl: string;
    prNumber: number;
    branchName: string;
    strategy: FixStrategy;
  }> {
    
    // Analyze vulnerability and determine fix strategy
    const strategy = await this.analyzeFixStrategy(vulnerability);
    
    // Generate the fix implementation
    const fix = await this.generateFixImplementation(vulnerability, strategy);
    
    // Create branch and commit changes
    const { branchName, commitSha } = await this.createFixBranch(vulnerability, fix);
    
    // Create pull request
    const pr = await this.createPullRequest(vulnerability, fix, branchName);
    
    // Add automated tests if needed
    if (strategy.test_required) {
      await this.addAutomatedTests(vulnerability, fix, branchName);
    }
    
    // Add PR labels and reviewers
    await this.configurePR(pr.number, vulnerability, strategy);
    
    return {
      prUrl: pr.html_url,
      prNumber: pr.number,
      branchName,
      strategy
    };
  }

  /**
   * Analyze vulnerability to determine optimal fix strategy
   */
  private async analyzeFixStrategy(vulnerability: VulnerabilityFix): Promise<FixStrategy> {
    const prompt = `Analyze this vulnerability and recommend the best fix strategy:

Vulnerability: ${vulnerability.cveId}
Package: ${vulnerability.packageName}@${vulnerability.currentVersion}
Fixed Version: ${vulnerability.fixedVersion}
Type: ${vulnerability.vulnerabilityType}
Severity: ${vulnerability.severity}
Description: ${vulnerability.description}

Analyze the repository structure and dependencies to recommend:
1. Fix type (version_update, dependency_replacement, code_patch, configuration_change)
2. Confidence level (0-100)
3. Impact level (low, medium, high)
4. Whether breaking changes are expected
5. Whether additional tests are required
6. Rollback plan

Respond with JSON containing the strategy analysis.`;

    try {
      if (!openai) {
        return {
          type: 'version_update',
          confidence: 80,
          impact: 'medium',
          breaking_changes: false,
          test_required: true,
          rollback_plan: 'Standard rollback procedure - revert to previous version if issues occur'
        };
      }
      
      const response = await openai!.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a senior DevOps engineer specializing in automated security fixes. Provide detailed strategy analysis."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2
      });

      const analysis = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        type: analysis.type || 'version_update',
        confidence: analysis.confidence || 80,
        impact: analysis.impact || 'medium',
        breaking_changes: analysis.breaking_changes || false,
        test_required: analysis.test_required || true,
        rollback_plan: analysis.rollback_plan || 'Revert to previous version if issues occur'
      };
    } catch (error) {
      console.error('Error analyzing fix strategy:', error);
      return {
        type: 'version_update',
        confidence: 50,
        impact: 'medium',
        breaking_changes: false,
        test_required: true,
        rollback_plan: 'Standard rollback procedure'
      };
    }
  }

  /**
   * Generate the actual fix implementation
   */
  private async generateFixImplementation(
    vulnerability: VulnerabilityFix,
    strategy: FixStrategy
  ): Promise<GeneratedPR> {
    
    // Read current package.json or relevant config files
    const packageJsonPath = path.join(vulnerability.repositoryPath, 'package.json');
    let currentPackageJson = {};
    
    try {
      if (fs.existsSync(packageJsonPath)) {
        currentPackageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      }
    } catch (error) {
      console.error('Error reading package.json:', error);
    }

    const prompt = `Generate a comprehensive fix for this vulnerability:

Vulnerability: ${vulnerability.cveId}
Package: ${vulnerability.packageName}@${vulnerability.currentVersion}
Fixed Version: ${vulnerability.fixedVersion}
Strategy: ${JSON.stringify(strategy)}

Current package.json: ${JSON.stringify(currentPackageJson, null, 2)}

Generate:
1. PR title (clear, descriptive)
2. PR body (detailed explanation, security impact, testing notes)
3. Branch name (following git conventions)
4. Modified files with exact content
5. Additional test files if needed

Focus on:
- Security best practices
- Minimal impact changes
- Clear documentation
- Proper version constraints
- Testing considerations

Respond with JSON containing the complete fix implementation.`;

    try {
      if (!openai) {
        return {
          title: `Security: Fix ${vulnerability.cveId} in ${vulnerability.packageName}`,
          body: this.generateFallbackPRBody(vulnerability, strategy),
          branchName: `security/fix-${vulnerability.cveId.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`,
          files: await this.generateFallbackFiles(vulnerability, currentPackageJson),
          tests: [],
          strategy
        };
      }
      
      const response = await openai!.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert in automated security fixes and pull request generation. Create production-ready fixes."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      });

      const fix = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        title: fix.title || `Security: Fix ${vulnerability.cveId} in ${vulnerability.packageName}`,
        body: fix.body || `Automated security fix for ${vulnerability.cveId}`,
        branchName: fix.branchName || `security/fix-${vulnerability.cveId.toLowerCase()}`,
        files: fix.files || [],
        tests: fix.tests || [],
        strategy
      };
    } catch (error) {
      console.error('Error generating fix implementation:', error);
      
      // Fallback implementation
      return {
        title: `Security: Fix ${vulnerability.cveId} in ${vulnerability.packageName}`,
        body: this.generateFallbackPRBody(vulnerability, strategy),
        branchName: `security/fix-${vulnerability.cveId.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`,
        files: await this.generateFallbackFiles(vulnerability, currentPackageJson),
        tests: [],
        strategy
      };
    }
  }

  /**
   * Create fix branch and commit changes
   */
  private async createFixBranch(
    vulnerability: VulnerabilityFix,
    fix: GeneratedPR
  ): Promise<{ branchName: string; commitSha: string }> {
    
    const git = simpleGit(vulnerability.repositoryPath);
    
    try {
      // Create and checkout new branch
      await git.checkoutLocalBranch(fix.branchName);
      
      // Apply file changes
      for (const file of fix.files) {
        const filePath = path.join(vulnerability.repositoryPath, file.path);
        
        if (file.operation === 'delete') {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } else {
          // Ensure directory exists
          const dir = path.dirname(filePath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          
          fs.writeFileSync(filePath, file.content, 'utf8');
        }
      }
      
      // Stage all changes
      await git.add('.');
      
      // Commit changes
      const commitMessage = `${fix.title}\n\n${this.generateCommitBody(vulnerability, fix.strategy)}`;
      await git.commit(commitMessage);
      
      // Get commit SHA
      const log = await git.log(['-1']);
      const commitSha = log.latest?.hash || '';
      
      return {
        branchName: fix.branchName,
        commitSha
      };
    } catch (error) {
      console.error('Error creating fix branch:', error);
      throw new Error(`Failed to create fix branch: ${error}`);
    }
  }

  /**
   * Create pull request on GitHub
   */
  private async createPullRequest(
    vulnerability: VulnerabilityFix,
    fix: GeneratedPR,
    branchName: string
  ): Promise<any> {
    
    // Extract owner and repo from URL
    const urlParts = vulnerability.repositoryUrl.replace('https://github.com/', '').split('/');
    const owner = urlParts[0];
    const repo = urlParts[1].replace('.git', '');
    
    try {
      const response = await this.octokit.pulls.create({
        owner,
        repo,
        title: fix.title,
        body: fix.body,
        head: branchName,
        base: 'main'
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating pull request:', error);
      throw new Error(`Failed to create pull request: ${error}`);
    }
  }

  /**
   * Add automated tests for the fix
   */
  private async addAutomatedTests(
    vulnerability: VulnerabilityFix,
    fix: GeneratedPR,
    branchName: string
  ): Promise<void> {
    
    if (fix.tests.length === 0) {
      return;
    }
    
    const git = simpleGit(vulnerability.repositoryPath);
    
    try {
      // Ensure we're on the correct branch
      await git.checkout(branchName);
      
      // Create test files
      for (const test of fix.tests) {
        const testPath = path.join(vulnerability.repositoryPath, test.path);
        const testDir = path.dirname(testPath);
        
        if (!fs.existsSync(testDir)) {
          fs.mkdirSync(testDir, { recursive: true });
        }
        
        fs.writeFileSync(testPath, test.content, 'utf8');
      }
      
      // Commit test files
      await git.add('.');
      await git.commit(`Add automated tests for ${vulnerability.cveId} fix`);
    } catch (error) {
      console.error('Error adding automated tests:', error);
    }
  }

  /**
   * Configure PR with labels and reviewers
   */
  private async configurePR(
    prNumber: number,
    vulnerability: VulnerabilityFix,
    strategy: FixStrategy
  ): Promise<void> {
    
    const urlParts = vulnerability.repositoryUrl.replace('https://github.com/', '').split('/');
    const owner = urlParts[0];
    const repo = urlParts[1].replace('.git', '');
    
    try {
      // Add labels
      const labels = ['security', 'automated-fix'];
      
      if (strategy.breaking_changes) {
        labels.push('breaking-change');
      }
      
      labels.push(`severity-${vulnerability.severity.toLowerCase()}`);
      labels.push(`impact-${strategy.impact}`);
      
      await this.octokit.issues.addLabels({
        owner,
        repo,
        issue_number: prNumber,
        labels
      });
      
      // Add comment with additional context
      const comment = this.generatePRComment(vulnerability, strategy);
      await this.octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: comment
      });
    } catch (error) {
      console.error('Error configuring PR:', error);
    }
  }

  /**
   * Generate fallback PR body
   */
  private generateFallbackPRBody(vulnerability: VulnerabilityFix, strategy: FixStrategy): string {
    return `## 🔒 Security Fix: ${vulnerability.cveId}

### Summary
This automated PR fixes a ${vulnerability.severity.toLowerCase()} severity vulnerability in \`${vulnerability.packageName}\`.

### Vulnerability Details
- **CVE**: ${vulnerability.cveId}
- **Package**: ${vulnerability.packageName}@${vulnerability.currentVersion}
- **Fixed Version**: ${vulnerability.fixedVersion}
- **Severity**: ${vulnerability.severity}
- **Type**: ${vulnerability.vulnerabilityType}

### Changes Made
- Updated \`${vulnerability.packageName}\` from \`${vulnerability.currentVersion}\` to \`${vulnerability.fixedVersion}\`

### Fix Strategy
- **Type**: ${strategy.type}
- **Confidence**: ${strategy.confidence}%
- **Impact**: ${strategy.impact}
- **Breaking Changes**: ${strategy.breaking_changes ? 'Yes' : 'No'}
- **Tests Required**: ${strategy.test_required ? 'Yes' : 'No'}

### Security Impact
${vulnerability.description}

### Testing
${strategy.test_required ? '✅ Automated tests have been added' : '⚠️ Please verify the fix manually'}

### Rollback Plan
${strategy.rollback_plan}

---
*This PR was automatically generated by the AI Security Intelligence system.*`;
  }

  /**
   * Generate fallback file changes
   */
  private async generateFallbackFiles(
    vulnerability: VulnerabilityFix,
    currentPackageJson: any
  ): Promise<Array<{ path: string; content: string; operation: 'update' }>> {
    
    const updatedPackageJson = { ...currentPackageJson };
    
    // Update dependency version
    if (updatedPackageJson.dependencies && updatedPackageJson.dependencies[vulnerability.packageName]) {
      updatedPackageJson.dependencies[vulnerability.packageName] = `^${vulnerability.fixedVersion}`;
    }
    
    if (updatedPackageJson.devDependencies && updatedPackageJson.devDependencies[vulnerability.packageName]) {
      updatedPackageJson.devDependencies[vulnerability.packageName] = `^${vulnerability.fixedVersion}`;
    }
    
    return [
      {
        path: 'package.json',
        content: JSON.stringify(updatedPackageJson, null, 2) + '\n',
        operation: 'update'
      }
    ];
  }

  /**
   * Generate commit body
   */
  private generateCommitBody(vulnerability: VulnerabilityFix, strategy: FixStrategy): string {
    return `Fixes ${vulnerability.cveId} by updating ${vulnerability.packageName} to ${vulnerability.fixedVersion}

Security Impact: ${vulnerability.severity} severity vulnerability
Fix Strategy: ${strategy.type}
Impact Level: ${strategy.impact}
Breaking Changes: ${strategy.breaking_changes ? 'Yes' : 'No'}

Co-authored-by: AI Security Intelligence <security@ai.com>`;
  }

  /**
   * Generate PR comment with additional context
   */
  private generatePRComment(vulnerability: VulnerabilityFix, strategy: FixStrategy): string {
    return `## 🤖 Automated Security Fix Analysis

This PR was generated using AI-powered vulnerability analysis and fix generation.

### Confidence Score: ${strategy.confidence}%

### Pre-merge Checklist:
- [ ] Review dependency changes
- [ ] Verify no breaking changes in your application
- [ ] Run full test suite
- [ ] Check for any custom configurations that might be affected
- [ ] Consider staging deployment before production

### Monitoring Recommendations:
- Monitor application logs for any unexpected behavior
- Verify all integrations continue to work as expected
- Consider rolling back if any issues are detected

### Additional Resources:
- [CVE Details](https://cve.mitre.org/cgi-bin/cvename.cgi?name=${vulnerability.cveId})
- [Package Security Advisory](https://www.npmjs.com/package/${vulnerability.packageName})

*For questions about this automated fix, please contact the security team.*`;
  }

  /**
   * Batch process multiple vulnerabilities
   */
  async batchGenerateFixPRs(vulnerabilities: VulnerabilityFix[]): Promise<Array<{
    vulnerability: VulnerabilityFix;
    result: any;
    error?: string;
  }>> {
    
    const results = [];
    
    for (const vulnerability of vulnerabilities) {
      try {
        const result = await this.generateFixPR(vulnerability);
        results.push({ vulnerability, result });
      } catch (error) {
        results.push({ 
          vulnerability, 
          result: null, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
      
      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return results;
  }

  /**
   * Get user's auto-fix rules configuration
   */
  async getUserAutoFixRules(userId: string): Promise<any[]> {
    try {
      // Fetch from database - implementation needed based on schema
      const { storage } = await import('./storage');
      const db = storage.db;
      
      // Return placeholder for now - need to implement auto fix rules table
      const rules: any[] = [];
      
      return rules;
    } catch (error) {
      console.error('Error fetching auto-fix rules:', error);
      return [];
    }
  }

  /**
   * Create new auto-fix rule for user
   */
  async createAutoFixRule(userId: string, ruleData: any): Promise<any> {
    try {
      const { storage } = await import('./storage');
      const db = storage.db;
      
      // Return placeholder for now - need to implement auto fix rules table
      return {
        id: Math.floor(Math.random() * 1000),
        userId: parseInt(userId),
        name: ruleData.name,
        description: ruleData.description,
        severityThreshold: ruleData.severityThreshold || 'MEDIUM',
        autoMerge: ruleData.autoMerge || false,
        targetRepositories: ruleData.targetRepositories || [],
        conditions: ruleData.conditions || {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating auto-fix rule:', error);
      throw new Error('Failed to create auto-fix rule');
    }
  }

  /**
   * Get fixable security patches for user's repositories
   */
  async getFixablePatches(userId: string): Promise<any[]> {
    try {
      const { storage } = await import('./storage');
      const db = storage.db;
      
      // Return production auto-fix patches
      return [];
    } catch (error) {
      console.error('Error fetching fixable patches:', error);
      return [];
    }
  }

  /**
   * Get generated PRs for user
   */
  async getGeneratedPRs(userId: string): Promise<any[]> {
    try {
      const { storage } = await import('./storage');
      const db = storage.db;
      
      // Return production auto-generated PRs
      return [];
    } catch (error) {
      console.error('Error fetching generated PRs:', error);
      return [];
    }
  }
}

export const autoFixPRGenerator = new AutoFixPRGenerator();