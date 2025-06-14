
/**
 * Per-Repository Auto-Fix Configuration
 * Manages repository-specific auto-fix settings
 */

export class AutoFixRepositoryConfig {
  private static instance: AutoFixRepositoryConfig;
  
  static getInstance(): AutoFixRepositoryConfig {
    if (!AutoFixRepositoryConfig.instance) {
      AutoFixRepositoryConfig.instance = new AutoFixRepositoryConfig();
    }
    return AutoFixRepositoryConfig.instance;
  }

  async getRepositoryConfig(repositoryId: number): Promise<RepositoryAutoFixConfig> {
    try {
      const { db } = await import('./db');
      const { autoFixRules } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');

      const rules = await db.query.autoFixRules.findMany({
        where: eq(autoFixRules.repositoryId, repositoryId)
      });

      if (rules.length === 0) {
        return this.getDefaultConfig(repositoryId);
      }

      return this.buildConfigFromRules(rules, repositoryId);
    } catch (error) {
      console.error('Error getting repository config:', error);
      return this.getDefaultConfig(repositoryId);
    }
  }

  async updateRepositoryConfig(
    repositoryId: number, 
    config: Partial<RepositoryAutoFixConfig>
  ): Promise<RepositoryAutoFixConfig> {
    try {
      const { db } = await import('./db');
      const { autoFixRules } = await import('../shared/schema');
      const { eq } = await import('drizzle-orm');

      // Update or create repository-specific rule
      const existingRule = await db.query.autoFixRules.findFirst({
        where: eq(autoFixRules.repositoryId, repositoryId)
      });

      if (existingRule) {
        await db.update(autoFixRules)
          .set({
            enabled: config.enabled,
            severity: config.allowedSeverities,
            autoMerge: config.autoMerge,
            requiresReview: config.requiresReview,
            maxDailyPRs: config.maxDailyPRs,
            testRequired: config.testRequired,
            allowedPackages: config.allowedPackages,
            excludedPackages: config.excludedPackages,
            updatedAt: new Date()
          })
          .where(eq(autoFixRules.id, existingRule.id));
      } else {
        await db.insert(autoFixRules).values({
          userId: 1, // Should come from context
          repositoryId,
          name: `Repository ${repositoryId} Auto-Fix Config`,
          description: 'Repository-specific auto-fix configuration',
          enabled: config.enabled ?? true,
          severity: config.allowedSeverities ?? ['critical', 'high'],
          autoMerge: config.autoMerge ?? false,
          requiresReview: config.requiresReview ?? true,
          maxDailyPRs: config.maxDailyPRs ?? 5,
          testRequired: config.testRequired ?? true,
          allowedPackages: config.allowedPackages ?? [],
          excludedPackages: config.excludedPackages ?? []
        });
      }

      return await this.getRepositoryConfig(repositoryId);
    } catch (error) {
      console.error('Error updating repository config:', error);
      throw new Error('Failed to update repository configuration');
    }
  }

  async createPackageSpecificRule(
    repositoryId: number,
    packageRule: PackageSpecificRule
  ): Promise<void> {
    try {
      const { db } = await import('./db');
      const { autoFixRules } = await import('../shared/schema');

      await db.insert(autoFixRules).values({
        userId: 1, // Should come from context
        repositoryId,
        name: `${packageRule.packageName} Rule`,
        description: `Auto-fix rule for ${packageRule.packageName}`,
        enabled: packageRule.enabled,
        severity: packageRule.allowedSeverities,
        autoMerge: packageRule.autoMerge,
        requiresReview: packageRule.requiresReview,
        testRequired: packageRule.testRequired,
        allowedPackages: [packageRule.packageName],
        conditions: {
          packageSpecific: true,
          maxVersionChange: packageRule.maxVersionChange
        }
      });
    } catch (error) {
      console.error('Error creating package-specific rule:', error);
      throw new Error('Failed to create package-specific rule');
    }
  }

  async validateConfiguration(config: RepositoryAutoFixConfig): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate basic settings
    if (config.maxDailyPRs && (config.maxDailyPRs < 1 || config.maxDailyPRs > 50)) {
      errors.push('Max daily PRs must be between 1 and 50');
    }

    if (config.allowedSeverities && config.allowedSeverities.length === 0) {
      errors.push('At least one severity level must be allowed');
    }

    // Validate package settings
    if (config.allowedPackages && config.excludedPackages) {
      const overlap = config.allowedPackages.filter(pkg => 
        config.excludedPackages?.includes(pkg)
      );
      if (overlap.length > 0) {
        errors.push(`Packages cannot be both allowed and excluded: ${overlap.join(', ')}`);
      }
    }

    // Warnings
    if (config.autoMerge && !config.testRequired) {
      warnings.push('Auto-merge without required testing is not recommended');
    }

    if (!config.requiresReview && config.allowedSeverities?.includes('critical')) {
      warnings.push('Critical vulnerabilities should require manual review');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private getDefaultConfig(repositoryId: number): RepositoryAutoFixConfig {
    return {
      repositoryId,
      enabled: true,
      allowedSeverities: ['critical', 'high'],
      autoMerge: false,
      requiresReview: true,
      maxDailyPRs: 5,
      testRequired: true,
      allowedPackages: [],
      excludedPackages: ['webpack', 'babel-core', 'typescript'],
      branchPrefix: 'security-fix',
      notificationSettings: {
        onSuccess: true,
        onFailure: true,
        onReview: true
      },
      scheduleSettings: {
        enabled: true,
        hours: [9, 14], // 9 AM and 2 PM
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      }
    };
  }

  private buildConfigFromRules(rules: any[], repositoryId: number): RepositoryAutoFixConfig {
    const primaryRule = rules[0]; // Use first rule as primary
    
    return {
      repositoryId,
      enabled: primaryRule.enabled,
      allowedSeverities: primaryRule.severity,
      autoMerge: primaryRule.autoMerge,
      requiresReview: primaryRule.requiresReview,
      maxDailyPRs: primaryRule.maxDailyPRs,
      testRequired: primaryRule.testRequired,
      allowedPackages: primaryRule.allowedPackages || [],
      excludedPackages: primaryRule.excludedPackages || [],
      branchPrefix: 'security-fix',
      notificationSettings: {
        onSuccess: true,
        onFailure: true,
        onReview: true
      },
      scheduleSettings: {
        enabled: true,
        hours: [9, 14],
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      }
    };
  }

  // Get all repository configurations for a user
  async getUserRepositoryConfigs(userId: string): Promise<RepositoryAutoFixConfig[]> {
    try {
      const { storage } = await import('./storage');
      const repositories = await storage.getRepositories(); // Should filter by user
      
      const configs = await Promise.all(
        repositories.map(repo => this.getRepositoryConfig(repo.id))
      );
      
      return configs;
    } catch (error) {
      console.error('Error getting user repository configs:', error);
      return [];
    }
  }

  // Bulk update multiple repositories
  async bulkUpdateConfigs(
    updates: Array<{ repositoryId: number; config: Partial<RepositoryAutoFixConfig> }>
  ): Promise<{ successful: number; failed: number; errors: string[] }> {
    let successful = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const update of updates) {
      try {
        await this.updateRepositoryConfig(update.repositoryId, update.config);
        successful++;
      } catch (error) {
        failed++;
        errors.push(`Repository ${update.repositoryId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return { successful, failed, errors };
  }
}

// Types
interface RepositoryAutoFixConfig {
  repositoryId: number;
  enabled: boolean;
  allowedSeverities: string[];
  autoMerge: boolean;
  requiresReview: boolean;
  maxDailyPRs: number;
  testRequired: boolean;
  allowedPackages: string[];
  excludedPackages: string[];
  branchPrefix: string;
  notificationSettings: {
    onSuccess: boolean;
    onFailure: boolean;
    onReview: boolean;
  };
  scheduleSettings: {
    enabled: boolean;
    hours: number[];
    days: string[];
  };
}

interface PackageSpecificRule {
  packageName: string;
  enabled: boolean;
  allowedSeverities: string[];
  autoMerge: boolean;
  requiresReview: boolean;
  testRequired: boolean;
  maxVersionChange: 'patch' | 'minor' | 'major';
}

export const autoFixRepositoryConfig = AutoFixRepositoryConfig.getInstance();
