import { useAsyncData } from '@/hooks/use-async-data';
import { vulnerabilityService } from './vulnerabilityService';

interface License {
  id: string;
  name: string;
  spdx_id: string;
  url: string;
  permitted: string[];
  forbidden: string[];
  required: string[];
  risk_level: 'low' | 'medium' | 'high';
}

interface Dependency {
  name: string;
  version: string;
  latest_version: string;
  ecosystem: string;
  license: License;
  dependencies: Dependency[];
  is_dev: boolean;
  is_direct: boolean;
  update_available: boolean;
  breaking_update: boolean;
  vulnerabilities: any[];
  usage: {
    files: number;
    imports: number;
    last_used: string;
  };
}

interface DependencyUpdate {
  dependency: string;
  from_version: string;
  to_version: string;
  breaking: boolean;
  changes: {
    type: 'feature' | 'fix' | 'breaking' | 'security';
    description: string;
  }[];
  impact_analysis: {
    affected_files: string[];
    risk_level: 'low' | 'medium' | 'high';
    test_coverage: number;
  };
}

interface LicensePolicy {
  id: string;
  name: string;
  allowed_licenses: string[];
  forbidden_licenses: string[];
  allowed_dependencies: string[];
  forbidden_dependencies: string[];
  review_required_conditions: {
    license_type: string[];
    dependency_pattern: string[];
  };
}

class DependencyService {
  private readonly GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
  private readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.dependencywarden.com';

  // License definitions based on SPDX
  private licenses: Record<string, License> = {
    'MIT': {
      id: 'MIT',
      name: 'MIT License',
      spdx_id: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
      permitted: ['commercial-use', 'modifications', 'distribution', 'private-use'],
      forbidden: [],
      required: ['license-and-copyright-notice'],
      risk_level: 'low'
    },
    // Add more license definitions...
  };

  async analyzeDependencies(repositoryId: string, branch: string = 'main'): Promise<Dependency[]> {
    try {
      // Fetch repository dependencies
      const dependencies = await this.fetchDependencyTree(repositoryId, branch);
      
      // Analyze each dependency
      const analyzedDeps = await Promise.all(
        dependencies.map(dep => this.analyzeDependency(dep, repositoryId))
      );

      return analyzedDeps;
    } catch (error) {
      console.error('Error analyzing dependencies:', error);
      throw new Error('Dependency analysis failed');
    }
  }

  private async fetchDependencyTree(repositoryId: string, branch: string): Promise<Dependency[]> {
    // TODO: Implement actual dependency tree fetching
    // This would parse package.json, requirements.txt, etc.
    return [];
  }

  private async analyzeDependency(dependency: Dependency, repositoryId: string): Promise<Dependency> {
    const [
      latestVersion,
      vulnerabilities,
      usage,
      license
    ] = await Promise.all([
      this.checkLatestVersion(dependency),
      vulnerabilityService.scanRepository(repositoryId),
      this.analyzeDependencyUsage(dependency, repositoryId),
      this.analyzeLicense(dependency)
    ]);

    return {
      ...dependency,
      latest_version: latestVersion,
      update_available: latestVersion !== dependency.version,
      breaking_update: this.isBreakingUpdate(dependency.version, latestVersion),
      vulnerabilities: vulnerabilities.vulnerabilities.filter(v => 
        v.affected.package === dependency.name
      ),
      usage,
      license
    };
  }

  private async checkLatestVersion(dependency: Dependency): Promise<string> {
    // TODO: Implement version checking against package registries
    return dependency.version;
  }

  private async analyzeDependencyUsage(dependency: Dependency, repositoryId: string) {
    // TODO: Implement usage analysis
    return {
      files: 0,
      imports: 0,
      last_used: new Date().toISOString()
    };
  }

  private async analyzeLicense(dependency: Dependency): Promise<License> {
    // TODO: Implement license analysis
    return this.licenses['MIT'];
  }

  private isBreakingUpdate(currentVersion: string, latestVersion: string): boolean {
    // Simple semver major version check
    const current = currentVersion.split('.')[0];
    const latest = latestVersion.split('.')[0];
    return current !== latest;
  }

  async generateUpdatePlan(repositoryId: string): Promise<DependencyUpdate[]> {
    try {
      const dependencies = await this.analyzeDependencies(repositoryId);
      const updates: DependencyUpdate[] = [];

      for (const dep of dependencies) {
        if (dep.update_available) {
          updates.push({
            dependency: dep.name,
            from_version: dep.version,
            to_version: dep.latest_version,
            breaking: dep.breaking_update,
            changes: await this.fetchChangelog(dep),
            impact_analysis: await this.analyzeUpdateImpact(dep, repositoryId)
          });
        }
      }

      return this.prioritizeUpdates(updates);
    } catch (error) {
      console.error('Error generating update plan:', error);
      throw new Error('Update plan generation failed');
    }
  }

  private async fetchChangelog(dependency: Dependency) {
    // TODO: Implement changelog fetching
    return [];
  }

  private async analyzeUpdateImpact(dependency: Dependency, repositoryId: string) {
    // TODO: Implement impact analysis
    return {
      affected_files: [],
      risk_level: 'low' as const,
      test_coverage: 0
    };
  }

  private prioritizeUpdates(updates: DependencyUpdate[]): DependencyUpdate[] {
    return updates.sort((a, b) => {
      // Prioritize security updates
      const aHasSecurity = a.changes.some(c => c.type === 'security');
      const bHasSecurity = b.changes.some(c => c.type === 'security');
      if (aHasSecurity && !bHasSecurity) return -1;
      if (!aHasSecurity && bHasSecurity) return 1;

      // Then prioritize by risk level
      const riskLevels = { low: 0, medium: 1, high: 2 };
      return riskLevels[b.impact_analysis.risk_level] - riskLevels[a.impact_analysis.risk_level];
    });
  }

  async checkLicenseCompliance(repositoryId: string, policyId: string): Promise<{
    compliant: boolean;
    violations: Array<{
      dependency: string;
      license: string;
      violation_type: string;
      description: string;
    }>;
  }> {
    try {
      const [dependencies, policy] = await Promise.all([
        this.analyzeDependencies(repositoryId),
        this.fetchLicensePolicy(policyId)
      ]);

      const violations = [];

      for (const dep of dependencies) {
        // Check against forbidden licenses
        if (policy.forbidden_licenses.includes(dep.license.spdx_id)) {
          violations.push({
            dependency: dep.name,
            license: dep.license.spdx_id,
            violation_type: 'forbidden_license',
            description: `License ${dep.license.spdx_id} is forbidden by policy`
          });
        }

        // Check against forbidden dependencies
        if (policy.forbidden_dependencies.includes(dep.name)) {
          violations.push({
            dependency: dep.name,
            license: dep.license.spdx_id,
            violation_type: 'forbidden_dependency',
            description: `Dependency ${dep.name} is forbidden by policy`
          });
        }

        // Check review required conditions
        if (
          policy.review_required_conditions.license_type.includes(dep.license.spdx_id) ||
          policy.review_required_conditions.dependency_pattern.some(pattern => 
            new RegExp(pattern).test(dep.name)
          )
        ) {
          violations.push({
            dependency: dep.name,
            license: dep.license.spdx_id,
            violation_type: 'review_required',
            description: `Dependency ${dep.name} requires legal review`
          });
        }
      }

      return {
        compliant: violations.length === 0,
        violations
      };
    } catch (error) {
      console.error('Error checking license compliance:', error);
      throw new Error('License compliance check failed');
    }
  }

  private async fetchLicensePolicy(policyId: string): Promise<LicensePolicy> {
    // TODO: Implement policy fetching
    return {
      id: policyId,
      name: 'Default Policy',
      allowed_licenses: ['MIT', 'Apache-2.0'],
      forbidden_licenses: ['GPL-3.0'],
      allowed_dependencies: [],
      forbidden_dependencies: [],
      review_required_conditions: {
        license_type: ['AGPL-3.0'],
        dependency_pattern: []
      }
    };
  }

  // React hooks
  useDependencyAnalysis(repositoryId: string, branch: string = 'main') {
    return useAsyncData(
      () => this.analyzeDependencies(repositoryId, branch),
      [repositoryId, branch],
      {
        cacheKey: `dependency-analysis-${repositoryId}-${branch}`,
        cacheTime: 5 * 60 * 1000, // 5 minutes
      }
    );
  }

  useUpdatePlan(repositoryId: string) {
    return useAsyncData(
      () => this.generateUpdatePlan(repositoryId),
      [repositoryId],
      {
        cacheKey: `update-plan-${repositoryId}`,
        cacheTime: 5 * 60 * 1000, // 5 minutes
      }
    );
  }

  useLicenseCompliance(repositoryId: string, policyId: string) {
    return useAsyncData(
      () => this.checkLicenseCompliance(repositoryId, policyId),
      [repositoryId, policyId],
      {
        cacheKey: `license-compliance-${repositoryId}-${policyId}`,
        cacheTime: 5 * 60 * 1000, // 5 minutes
      }
    );
  }
}

export const dependencyService = new DependencyService(); 