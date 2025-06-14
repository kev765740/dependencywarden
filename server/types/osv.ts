export interface OSVPackage {
  name: string;
  ecosystem: string;
  version: string;
}

export interface OSVRange {
  type: string;
  events: Array<{
    introduced?: string;
    fixed?: string;
  }>;
}

export interface OSVVulnerability {
  id: string;
  summary: string;
  details: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  package: OSVPackage;
  affects: {
    ranges: OSVRange[];
  };
  published: Date;
  modified: Date;
}

export interface OSVResponse {
  vulns: OSVVulnerability[];
} 