import { faker } from '@faker-js/faker';
import type { User, Repository, ScanResult, Vulnerability } from '../../server/types';

export class TestFactory {
  static userId = 1;
  static repoId = 1;
  static scanId = 1;

  static createUser(overrides: Partial<User> = {}): User {
    const id = overrides.id || `test-user`;
    return {
      id,
      email: overrides.email || 'test@example.com',
      username: faker.internet.userName(),
      githubId: faker.number.int({ min: 10000, max: 99999 }).toString(),
      githubToken: `gh_${faker.string.alphanumeric(40)}`,
      slackWebhookUrl: `https://hooks.slack.com/services/${faker.string.alphanumeric(8)}/${faker.string.alphanumeric(8)}/${faker.string.alphanumeric(24)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  static createRepository(overrides: Partial<Repository> = {}): Repository {
    const id = overrides.id || `repo-${this.repoId++}`;
    const owner = overrides.owner || faker.internet.userName();
    const name = overrides.name || faker.lorem.slug();
    const url = overrides.url || `https://github.com/${owner}/${name}`;
    
    return {
      id,
      owner,
      name,
      url,
      userId: overrides.userId || 'test-user',
      isPrivate: overrides.isPrivate || false,
      slackChannel: overrides.slackChannel || '#security-alerts',
      emailNotifications: overrides.emailNotifications || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  static createVulnerability(overrides: Partial<Vulnerability> = {}): Vulnerability {
    return {
      id: overrides.id || `OSV-${faker.string.alphanumeric(8)}`,
      summary: overrides.summary || faker.lorem.sentence(),
      details: overrides.details || faker.lorem.paragraph(),
      severity: overrides.severity || faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
      package: overrides.package || {
        name: faker.helpers.arrayElement(['lodash', 'express', 'axios', 'moment']),
        ecosystem: faker.helpers.arrayElement(['npm', 'pip', 'maven']),
        version: faker.system.semver()
      },
      affects: overrides.affects || {
        ranges: [{
          type: 'SEMVER',
          events: [
            { introduced: '0' },
            { fixed: faker.system.semver() }
          ]
        }]
      },
      published: overrides.published || faker.date.past(),
      modified: overrides.modified || faker.date.recent()
    };
  }

  static createScanResult(overrides: Partial<ScanResult> = {}): ScanResult {
    const id = overrides.id || `scan-${this.scanId++}`;
    const vulnerabilities = overrides.vulnerabilities || Array.from(
      { length: faker.number.int({ min: 1, max: 5 }) },
      () => this.createVulnerability()
    );

    return {
      id,
      repositoryId: overrides.repositoryId || `repo-${faker.number.int({ min: 1, max: 100 })}`,
      branch: overrides.branch || 'main',
      commitSha: overrides.commitSha || faker.git.commitSha(),
      status: overrides.status || 'completed',
      vulnerabilitiesFound: vulnerabilities.length,
      vulnerabilities,
      startedAt: overrides.startedAt || faker.date.recent(),
      completedAt: overrides.completedAt || new Date(),
      error: overrides.error || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  static createGitHubRepo(overrides: Partial<any> = {}) {
    const owner = overrides.owner?.login || faker.internet.userName();
    const name = overrides.name || faker.lorem.slug();
    
    return {
      id: overrides.id || faker.number.int({ min: 10000, max: 99999 }),
      name,
      owner: { login: owner },
      full_name: `${owner}/${name}`,
      html_url: `https://github.com/${owner}/${name}`,
      default_branch: overrides.default_branch || 'main',
      private: overrides.private || false,
      permissions: overrides.permissions || { push: true, pull: true },
      ...overrides
    };
  }

  static createOSVResponse(overrides: Partial<any> = {}) {
    const vulns = overrides.vulns || Array.from(
      { length: faker.number.int({ min: 1, max: 3 }) },
      () => this.createVulnerability({ severity: 'CRITICAL' })
    );

    return {
      vulns,
      ...overrides
    };
  }

  static reset() {
    this.userId = 1;
    this.repoId = 1;
    this.scanId = 1;
  }
} 