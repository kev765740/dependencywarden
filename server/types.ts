export interface User {
  id: string;
  email: string;
  username: string;
  githubId: string;
  githubToken: string;
  slackWebhookUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Repository {
  id: string;
  owner: string;
  name: string;
  url: string;
  userId: string;
  isPrivate: boolean;
  slackChannel: string | null;
  emailNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PackageInfo {
  name: string;
  ecosystem: 'npm' | 'pip' | 'maven';
  version: string;
}

export interface AffectedRange {
  type: 'SEMVER' | 'GIT';
  events: Array<{
    introduced?: string;
    fixed?: string;
  }>;
}

export interface Vulnerability {
  id: string;
  summary: string;
  details: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  package: {
    name: string;
    ecosystem: string;
    version: string;
  };
  affects: {
    ranges: Array<{
      type: string;
      events: Array<{
        introduced?: string;
        fixed?: string;
      }>;
    }>;
  };
  published: Date;
  modified: Date;
}

export interface ScanResult {
  id: string;
  repositoryId: string;
  branch: string;
  commitSha: string;
  status: 'pending' | 'completed' | 'failed';
  vulnerabilitiesFound: number;
  vulnerabilities: Vulnerability[];
  startedAt: Date;
  completedAt: Date;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RepositoryUpdate {
  slackChannel?: string;
  isPrivate?: boolean;
  defaultBranch?: string;
}