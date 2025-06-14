import simpleGit from 'simple-git';
import fs from 'fs-extra';
import path from 'path';
import fetch from 'node-fetch';
import semver from 'semver';
import { db } from './db';
import { repositories, dependencies, alerts, dependencyUsage } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { emailService } from './emailService';
import { slackService } from './slackService';

interface PackageInfo {
  name: string;
  version: string;
  license?: string;
}

interface NpmPackageResponse {
  name: string;
  license?: string;
  versions: Record<string, any>;
  'dist-tags': {
    latest: string;
  };
}

interface OSVResponse {
  vulns: Array<{
    id: string;
    summary: string;
    details: string;
    severity?: Array<{
      type: string;
      score: string;
    }>;
  }>;
}

export class RepositoryScanner {
  private tempDir = path.join(process.cwd(), 'temp-repos');

  constructor() {
    // Ensure temp directory exists
    fs.ensureDirSync(this.tempDir);
  }

  async scanRepository(repoId: number): Promise<{
    licenseChanges: number;
    vulnerabilities: number;
    filesScanned: number;
  }> {
    const [repo] = await db.select().from(repositories).where(eq(repositories.id, repoId));
    
    if (!repo) {
      throw new Error('Repository not found');
    }

    const repoPath = path.join(this.tempDir, `repo-${repoId}`);
    
    try {
      // Clean up previous clone if exists
      if (await fs.pathExists(repoPath)) {
        await fs.remove(repoPath);
      }

      // Clone repository
      await this.cloneRepository(repo.gitUrl, repoPath, repo.authToken || undefined, repo.defaultBranch || undefined);

      // Parse package.json
      const packageInfo = await this.parsePackageJson(repoPath);
      
      if (!packageInfo) {
        console.log(`No package.json found in repository ${repoId}`);
        return {
          licenseChanges: 0,
          vulnerabilities: 0,
          filesScanned: 0
        };
      }

      if (!packageInfo.dependencies || Object.keys(packageInfo.dependencies).length === 0) {
        console.log(`No dependencies found in package.json for repository ${repoId}`);
        return {
          licenseChanges: 0,
          vulnerabilities: 0,
          filesScanned: 0
        };
      }

      // Scan dependencies for license changes and vulnerabilities
      const { licenseChanges, vulnerabilities } = await this.scanDependencies(
        repoId, 
        packageInfo.dependencies
      );

      // Scan files for dependency usage
      const filesScanned = await this.scanFileUsage(repoId, repoPath, Object.keys(packageInfo.dependencies));

      // Update repository last scanned timestamp
      await db.update(repositories)
        .set({ lastScannedAt: new Date() })
        .where(eq(repositories.id, repoId));

      return {
        licenseChanges,
        vulnerabilities,
        filesScanned
      };

    } finally {
      // Clean up cloned repository
      if (await fs.pathExists(repoPath)) {
        await fs.remove(repoPath);
      }
    }
  }

  private async cloneRepository(gitUrl: string, targetPath: string, authToken?: string, branch = 'main'): Promise<void> {
    const git = simpleGit();
    
    let cloneUrl = gitUrl;
    if (authToken && gitUrl.includes('github.com')) {
      // Add token to URL for authentication
      cloneUrl = gitUrl.replace('https://github.com/', `https://${authToken}@github.com/`);
    }

    await git.clone(cloneUrl, targetPath, ['--depth', '1', '--branch', branch]);
  }

  private async parsePackageJson(repoPath: string): Promise<any> {
    const packageJsonPath = path.join(repoPath, 'package.json');
    
    if (!await fs.pathExists(packageJsonPath)) {
      return null;
    }

    const packageJson = await fs.readJson(packageJsonPath);
    return packageJson;
  }

  private async scanDependencies(repoId: number, deps: Record<string, string>): Promise<{
    licenseChanges: number;
    vulnerabilities: number;
  }> {
    let licenseChanges = 0;
    let vulnerabilities = 0;

    for (const [depName, depVersion] of Object.entries(deps)) {
      try {
        // Get current dependency info from database
        const [existingDep] = await db.select()
          .from(dependencies)
          .where(and(
            eq(dependencies.repoId, repoId),
            eq(dependencies.name, depName)
          ));

        // Fetch latest package info from npm
        const npmInfo = await this.fetchNpmPackageInfo(depName);
        if (!npmInfo) continue;

        const currentLicense = npmInfo.license || 'Unknown';
        const resolvedVersion = this.resolveVersion(depVersion, npmInfo['dist-tags'].latest);

        // Check for license changes
        if (existingDep && existingDep.currentLicense !== currentLicense) {
          await this.createLicenseAlert(repoId, depName, existingDep.currentLicense, currentLicense);
          licenseChanges++;
        }

        // Check for vulnerabilities with usage analysis
        const vulns = await this.checkVulnerabilities(depName, resolvedVersion);
        if (vulns.length > 0) {
          const usageInfo = await this.analyzeDependencyUsage(repoId, depName);
          for (const vuln of vulns) {
            await this.createVulnerabilityAlert(repoId, depName, vuln, usageInfo);
            vulnerabilities++;
          }
        }

        // Update or insert dependency record
        await db.insert(dependencies)
          .values({
            repoId,
            name: depName,
            currentVersion: resolvedVersion,
            currentLicense,
            lastScannedAt: new Date()
          })
          .onConflictDoUpdate({
            target: [dependencies.repoId, dependencies.name],
            set: {
              currentVersion: resolvedVersion,
              currentLicense,
              lastScannedAt: new Date()
            }
          });

      } catch (error) {
        console.error(`Error scanning dependency ${depName}:`, error);
      }
    }

    return { licenseChanges, vulnerabilities };
  }

  private async fetchNpmPackageInfo(packageName: string): Promise<NpmPackageResponse | null> {
    try {
      const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`);
      if (!response.ok) return null;
      return await response.json() as NpmPackageResponse;
    } catch (error) {
      console.error(`Error fetching npm info for ${packageName}:`, error);
      return null;
    }
  }

  private resolveVersion(versionRange: string, latestVersion: string): string {
    try {
      // Try to resolve the version range to a specific version
      const cleanRange = versionRange.replace(/^[\^~]/, '');
      if (semver.valid(cleanRange)) {
        return cleanRange;
      }
      return latestVersion;
    } catch {
      return latestVersion;
    }
  }

  private async checkVulnerabilities(packageName: string, version: string): Promise<Array<{
    id: string;
    summary: string;
    severity: string;
  }>> {
    try {
      const response = await fetch('https://api.osv.dev/v1/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package: {
            name: packageName,
            ecosystem: 'npm'
          },
          version
        })
      });

      if (!response.ok) return [];

      const data = await response.json() as OSVResponse;
      
      return (data.vulns || []).map(vuln => ({
        id: vuln.id,
        summary: vuln.summary || vuln.details || 'Security vulnerability detected',
        severity: this.determineSeverity(vuln)
      }));

    } catch (error) {
      console.error(`Error checking vulnerabilities for ${packageName}:`, error);
      return [];
    }
  }

  private determineSeverity(vuln: any): string {
    if (vuln.severity && vuln.severity.length > 0) {
      const score = parseFloat(vuln.severity[0].score);
      if (score >= 9.0) return 'critical';
      if (score >= 7.0) return 'high';
      if (score >= 4.0) return 'medium';
      return 'low';
    }
    return 'medium'; // Default severity
  }

  private async createLicenseAlert(repoId: number, depName: string, oldLicense: string | null, newLicense: string): Promise<void> {
    const severity = this.getLicenseSeverity(oldLicense, newLicense);
    
    const [alert] = await db.insert(alerts).values({
      repoId,
      dependencyName: depName,
      alertType: 'license',
      oldValue: oldLicense,
      newValue: newLicense,
      severity,
      description: `License changed from ${oldLicense || 'Unknown'} to ${newLicense}`
    }).returning();

    // Send email notification
    await this.sendAlertNotification(alert);
  }

  private getLicenseSeverity(oldLicense: string | null, newLicense: string): string {
    const copyleftLicenses = ['GPL-2.0', 'GPL-3.0', 'AGPL-3.0', 'LGPL-2.1', 'LGPL-3.0'];
    
    if (copyleftLicenses.includes(newLicense)) {
      return 'critical';
    }
    
    if (oldLicense && oldLicense !== newLicense) {
      return 'medium';
    }
    
    return 'low';
  }

  private async scanFileUsage(repoId: number, repoPath: string, dependencies: string[]): Promise<number> {
    let filesScanned = 0;

    // Clear existing dependency usage for this repo
    await db.delete(dependencyUsage).where(eq(dependencyUsage.repoId, repoId));

    const scanDirectory = async (dirPath: string): Promise<void> => {
      const items = await fs.readdir(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = await fs.stat(itemPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          await scanDirectory(itemPath);
        } else if (stat.isFile() && this.isScannableFile(item)) {
          await this.scanFile(repoId, itemPath, repoPath, dependencies);
          filesScanned++;
        }
      }
    };

    await scanDirectory(repoPath);
    return filesScanned;
  }

  private isScannableFile(filename: string): boolean {
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte'];
    return extensions.some(ext => filename.endsWith(ext));
  }

  private async scanFile(repoId: number, filePath: string, repoPath: string, dependencies: string[]): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const relativePath = path.relative(repoPath, filePath);
      const lines = content.split('\n');

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        
        for (const dep of dependencies) {
          if (this.lineContainsDependency(line, dep)) {
            await db.insert(dependencyUsage).values({
              repoId,
              dependencyName: dep,
              filePath: relativePath,
              lineNumber: lineIndex + 1
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning file ${filePath}:`, error);
    }
  }

  private lineContainsDependency(line: string, dependency: string): boolean {
    // Check for various import/require patterns
    const patterns = [
      `import.*from\\s+['"\`]${dependency}['"\`]`,
      `import\\s+['"\`]${dependency}['"\`]`,
      `require\\s*\\(\\s*['"\`]${dependency}['"\`]\\s*\\)`,
      `from\\s+['"\`]${dependency}['"\`]`
    ];

    return patterns.some(pattern => new RegExp(pattern).test(line));
  }

  private async sendAlertNotification(alert: any): Promise<void> {
    try {
      // Get repository information for notifications
      const [repo] = await db.select().from(repositories).where(eq(repositories.id, alert.repoId));
      
      if (!repo) return;
      
      const frontendUrl = process.env.FRONTEND_URL || process.env.REPLIT_DEV_DOMAIN || 'https://your-app.replit.app';
      
      // Send email notification if configured
      if (repo.ownerEmail) {
        try {
          await emailService.sendAlertEmail(
            repo.ownerEmail,
            repo.name,
            alert,
            frontendUrl
          );
          console.log(`Email notification sent for ${alert.alertType} alert`);
        } catch (emailError: any) {
          console.log('Email notification not configured or failed:', emailError?.message || emailError);
        }
      }
      
      // Send Slack notification if webhook is configured
      if (repo.slackWebhookUrl) {
        try {
          await slackService.sendSlackNotification(
            repo.slackWebhookUrl,
            repo.name,
            alert,
            frontendUrl
          );
          console.log(`Slack notification sent for ${alert.alertType} alert`);
        } catch (slackError: any) {
          console.error('Failed to send Slack notification:', slackError?.message || slackError);
        }
      }
      
      if (!repo.ownerEmail && !repo.slackWebhookUrl) {
        console.log('No notification methods configured for repository:', repo.name);
      }
    } catch (error) {
      console.error('Failed to send alert notification:', error);
    }
  }

  // Enhanced dependency usage analysis for competitive advantage
  private async analyzeDependencyUsage(repoId: number, dependencyName: string): Promise<{ isUsed: boolean; count: number }> {
    try {
      const repoPath = path.join(this.tempDir, `repo-${repoId}`);
      
      if (!fs.existsSync(repoPath)) {
        return { isUsed: false, count: 0 };
      }

      let usageCount = 0;
      const scanDirectory = async (dirPath: string): Promise<void> => {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
          const fullPath = path.join(dirPath, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !this.shouldSkipDirectory(item)) {
            await scanDirectory(fullPath);
          } else if (stat.isFile() && this.isScannableFile(item)) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const fileUsages = this.countDependencyUsage(content, dependencyName);
            usageCount += fileUsages;
          }
        }
      };

      await scanDirectory(repoPath);
      return { isUsed: usageCount > 0, count: usageCount };
    } catch (error) {
      console.error(`Error analyzing dependency usage for ${dependencyName}:`, error);
      return { isUsed: false, count: 0 };
    }
  }

  private shouldSkipDirectory(dirName: string): boolean {
    const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.nyc_output'];
    return skipDirs.includes(dirName) || dirName.startsWith('.');
  }

  private countDependencyUsage(content: string, dependencyName: string): number {
    let count = 0;
    const lines = content.split('\n');
    
    for (const line of lines) {
      const importPatterns = [
        `import.*from.*['"\`]${dependencyName}['"\`]`,
        `import.*['"\`]${dependencyName}['"\`]`,
        `require\\(['"\`]${dependencyName}['"\`]\\)`,
        `import\\(['"\`]${dependencyName}['"\`]\\)`,
        `from.*['"\`]${dependencyName}/`,
        `require\\(['"\`]${dependencyName}/`
      ];
      
      for (const pattern of importPatterns) {
        const regex = new RegExp(pattern, 'g');
        const matches = line.match(regex);
        if (matches) count += matches.length;
      }
    }
    
    return count;
  }

  // AI-powered risk scoring algorithm
  private calculateRiskScore(severity: string, isUsed: boolean, usageCount: number): number {
    const severityScores = {
      'critical': 90,
      'high': 70,
      'medium': 50,
      'low': 30
    };
    
    let baseScore = severityScores[severity as keyof typeof severityScores] || 50;
    
    if (!isUsed) {
      baseScore *= 0.3; // Unused dependencies get reduced risk scores
    } else {
      const usageMultiplier = Math.min(1 + (usageCount * 0.1), 2.0);
      baseScore *= usageMultiplier;
    }
    
    return Math.min(Math.max(Math.round(baseScore), 0), 100);
  }

  private async createVulnerabilityAlert(repoId: number, depName: string, vuln: {
    id: string;
    summary: string;
    severity: string;
  }, usageInfo?: { isUsed: boolean; count: number }): Promise<void> {
    const riskScore = this.calculateRiskScore(vuln.severity, usageInfo?.isUsed || false, usageInfo?.count || 0);
    
    const [alert] = await db.insert(alerts).values({
      repoId,
      dependencyName: depName,
      alertType: 'vuln',
      oldValue: null,
      newValue: vuln.id,
      severity: vuln.severity,
      description: vuln.summary,
      isUsedInCode: usageInfo?.isUsed || false,
      usageCount: usageInfo?.count || 0,
      riskScore,
    }).returning();

    await this.sendAlertNotification(alert);
  }
}

export const scanner = new RepositoryScanner();