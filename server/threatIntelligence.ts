import { db } from './db';
import { alerts } from '@shared/schema';
import { eq, and, gte } from 'drizzle-orm';

interface CVEDetails {
  id: string;
  description: string;
  cvssV3Score: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  published: Date;
  lastModified: Date;
  cweIds: string[];
  references: string[];
  affectedProducts: string[];
  exploitability: {
    hasExploit: boolean;
    exploitMaturity: 'UNPROVEN' | 'PROOF_OF_CONCEPT' | 'FUNCTIONAL' | 'WEAPONIZED';
    threatActorActivity: boolean;
  };
  businessImpact: {
    dataExfiltration: boolean;
    serviceDisruption: boolean;
    privilegeEscalation: boolean;
    remoteCodeExecution: boolean;
  };
}

interface ThreatFeed {
  source: string;
  lastUpdated: Date;
  cveCount: number;
  criticalCount: number;
}

export class ThreatIntelligenceService {
  private nvdApiKey: string | null = null;
  private cisaApiEnabled = true;
  private mitreApiEnabled = true;

  constructor() {
    // Check for NVD API key in environment
    this.nvdApiKey = process.env.NVD_API_KEY || null;
  }

  /**
   * Fetch latest CVE data from multiple authoritative sources
   */
  async fetchLatestThreatIntelligence(): Promise<CVEDetails[]> {
    const sources = await Promise.allSettled([
      this.fetchFromNVD(),
      this.fetchFromCISA(),
      this.fetchFromMITRE(),
      this.fetchFromGitHubAdvisories()
    ]);

    const allCves: CVEDetails[] = [];
    
    sources.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allCves.push(...result.value);
      } else {
        console.warn(`Threat intelligence source ${index} failed:`, result.reason);
      }
    });

    return this.deduplicateAndEnrich(allCves);
  }

  /**
   * Fetch CVE data from NIST NVD (National Vulnerability Database)
   */
  private async fetchFromNVD(): Promise<CVEDetails[]> {
    const baseUrl = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const params = new URLSearchParams({
      lastModStartDate: twentyFourHoursAgo.toISOString(),
      lastModEndDate: new Date().toISOString(),
      resultsPerPage: '100'
    });

    const headers: Record<string, string> = {
      'User-Agent': 'Security-Monitor/1.0'
    };

    if (this.nvdApiKey) {
      headers['apiKey'] = this.nvdApiKey;
    }

    try {
      const response = await fetch(`${baseUrl}?${params}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`NVD API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return this.parseNVDResponse(data);
    } catch (error) {
      console.error('Error fetching from NVD:', error);
      throw error;
    }
  }

  /**
   * Fetch CVE data from CISA Known Exploited Vulnerabilities
   */
  private async fetchFromCISA(): Promise<CVEDetails[]> {
    try {
      const response = await fetch('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json');
      
      if (!response.ok) {
        throw new Error(`CISA API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseCISAResponse(data);
    } catch (error) {
      console.error('Error fetching from CISA:', error);
      throw error;
    }
  }

  /**
   * Fetch CVE data from MITRE ATT&CK framework
   */
  private async fetchFromMITRE(): Promise<CVEDetails[]> {
    try {
      // MITRE ATT&CK STIX data
      const response = await fetch('https://raw.githubusercontent.com/mitre/cti/master/enterprise-attack/enterprise-attack.json');
      
      if (!response.ok) {
        throw new Error(`MITRE API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseMITREResponse(data);
    } catch (error) {
      console.error('Error fetching from MITRE:', error);
      return []; // MITRE data is supplementary, don't fail the entire process
    }
  }

  /**
   * Fetch CVE data from GitHub Security Advisories
   */
  private async fetchFromGitHubAdvisories(): Promise<CVEDetails[]> {
    try {
      const query = `
        query {
          securityAdvisories(first: 50, orderBy: {field: PUBLISHED_AT, direction: DESC}) {
            nodes {
              ghsaId
              summary
              description
              severity
              publishedAt
              updatedAt
              cvss {
                score
                vectorString
              }
              identifiers {
                type
                value
              }
              references {
                url
              }
              vulnerabilities(first: 10) {
                nodes {
                  package {
                    name
                    ecosystem
                  }
                  vulnerableVersionRange
                }
              }
            }
          }
        }
      `;

      const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN || ''}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Security-Monitor/1.0'
        },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseGitHubResponse(data);
    } catch (error) {
      console.error('Error fetching from GitHub:', error);
      return [];
    }
  }

  /**
   * Parse NVD API response
   */
  private parseNVDResponse(data: any): CVEDetails[] {
    if (!data.vulnerabilities) return [];

    return data.vulnerabilities.map((vuln: any) => {
      const cve = vuln.cve;
      const metrics = cve.metrics?.cvssMetricV31?.[0] || cve.metrics?.cvssMetricV30?.[0];
      
      return {
        id: cve.id,
        description: cve.descriptions?.[0]?.value || 'No description available',
        cvssV3Score: metrics?.cvssData?.baseScore || 0,
        severity: this.mapCVSSToSeverity(metrics?.cvssData?.baseScore || 0),
        published: new Date(cve.published),
        lastModified: new Date(cve.lastModified),
        cweIds: cve.weaknesses?.map((w: any) => w.description?.[0]?.value).filter(Boolean) || [],
        references: cve.references?.map((r: any) => r.url).filter(Boolean) || [],
        affectedProducts: this.extractAffectedProducts(cve),
        exploitability: {
          hasExploit: false, // Will be enriched later
          exploitMaturity: 'UNPROVEN',
          threatActorActivity: false
        },
        businessImpact: this.assessBusinessImpact(cve)
      };
    });
  }

  /**
   * Parse CISA KEV response
   */
  private parseCISAResponse(data: any): CVEDetails[] {
    if (!data.vulnerabilities) return [];

    return data.vulnerabilities
      .filter((vuln: any) => {
        const addedDate = new Date(vuln.dateAdded);
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return addedDate >= twentyFourHoursAgo;
      })
      .map((vuln: any) => ({
        id: vuln.cveID,
        description: vuln.shortDescription || 'CISA Known Exploited Vulnerability',
        cvssV3Score: 8.5, // CISA KEV are high priority
        severity: 'HIGH' as const,
        published: new Date(vuln.dateAdded),
        lastModified: new Date(vuln.dateAdded),
        cweIds: [],
        references: [vuln.product ? `Product: ${vuln.product}` : ''].filter(Boolean),
        affectedProducts: [vuln.vendorProject, vuln.product].filter(Boolean),
        exploitability: {
          hasExploit: true, // CISA KEV means exploit exists
          exploitMaturity: 'FUNCTIONAL',
          threatActorActivity: true
        },
        businessImpact: {
          dataExfiltration: true,
          serviceDisruption: true,
          privilegeEscalation: true,
          remoteCodeExecution: true
        }
      }));
  }

  /**
   * Parse MITRE ATT&CK response
   */
  private parseMITREResponse(data: any): CVEDetails[] {
    // MITRE data is primarily for technique mapping
    // Return empty array as CVE data comes from other sources
    return [];
  }

  /**
   * Parse GitHub Security Advisories response
   */
  private parseGitHubResponse(data: any): CVEDetails[] {
    if (!data.data?.securityAdvisories?.nodes) return [];

    return data.data.securityAdvisories.nodes
      .filter((advisory: any) => {
        const publishedDate = new Date(advisory.publishedAt);
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return publishedDate >= twentyFourHoursAgo;
      })
      .map((advisory: any) => {
        const cveId = advisory.identifiers?.find((id: any) => id.type === 'CVE')?.value || advisory.ghsaId;
        
        return {
          id: cveId,
          description: advisory.summary || advisory.description || 'GitHub Security Advisory',
          cvssV3Score: advisory.cvss?.score || 0,
          severity: this.mapGitHubSeverity(advisory.severity),
          published: new Date(advisory.publishedAt),
          lastModified: new Date(advisory.updatedAt),
          cweIds: [],
          references: advisory.references?.map((r: any) => r.url) || [],
          affectedProducts: advisory.vulnerabilities?.nodes?.map((v: any) => 
            `${v.package?.ecosystem}:${v.package?.name}`
          ).filter(Boolean) || [],
          exploitability: {
            hasExploit: false,
            exploitMaturity: 'UNPROVEN',
            threatActorActivity: false
          },
          businessImpact: this.assessBusinessImpactFromSeverity(advisory.severity)
        };
      });
  }

  /**
   * Remove duplicates and enrich CVE data
   */
  private deduplicateAndEnrich(cves: CVEDetails[]): CVEDetails[] {
    const uniqueCves = new Map<string, CVEDetails>();

    cves.forEach(cve => {
      const existing = uniqueCves.get(cve.id);
      if (!existing || cve.lastModified > existing.lastModified) {
        uniqueCves.set(cve.id, cve);
      }
    });

    return Array.from(uniqueCves.values())
      .sort((a, b) => b.cvssV3Score - a.cvssV3Score)
      .slice(0, 100); // Limit to top 100 most critical
  }

  /**
   * Map CVSS score to severity
   */
  private mapCVSSToSeverity(score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (score >= 9.0) return 'CRITICAL';
    if (score >= 7.0) return 'HIGH';
    if (score >= 4.0) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Map GitHub severity to our format
   */
  private mapGitHubSeverity(severity: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'CRITICAL';
      case 'HIGH': return 'HIGH';
      case 'MODERATE': return 'MEDIUM';
      case 'LOW': return 'LOW';
      default: return 'MEDIUM';
    }
  }

  /**
   * Extract affected products from CVE data
   */
  private extractAffectedProducts(cve: any): string[] {
    const products: string[] = [];
    
    if (cve.configurations) {
      cve.configurations.forEach((config: any) => {
        config.nodes?.forEach((node: any) => {
          node.cpeMatch?.forEach((match: any) => {
            if (match.criteria) {
              const parts = match.criteria.split(':');
              if (parts.length >= 5) {
                products.push(`${parts[3]}:${parts[4]}`);
              }
            }
          });
        });
      });
    }

    return Array.from(new Set(products));
  }

  /**
   * Assess business impact from CVE data
   */
  private assessBusinessImpact(cve: any): CVEDetails['businessImpact'] {
    const description = (cve.descriptions?.[0]?.value || '').toLowerCase();
    
    return {
      dataExfiltration: description.includes('data') || description.includes('information disclosure'),
      serviceDisruption: description.includes('denial of service') || description.includes('crash'),
      privilegeEscalation: description.includes('privilege') || description.includes('escalation'),
      remoteCodeExecution: description.includes('remote code execution') || description.includes('rce')
    };
  }

  /**
   * Assess business impact from severity
   */
  private assessBusinessImpactFromSeverity(severity: string): CVEDetails['businessImpact'] {
    const isCritical = severity?.toUpperCase() === 'CRITICAL';
    const isHigh = severity?.toUpperCase() === 'HIGH';
    
    return {
      dataExfiltration: isCritical || isHigh,
      serviceDisruption: isCritical || isHigh,
      privilegeEscalation: isCritical,
      remoteCodeExecution: isCritical
    };
  }

  /**
   * Get threat feed status
   */
  async getThreatFeedStatus(): Promise<ThreatFeed[]> {
    const feeds: ThreatFeed[] = [
      {
        source: 'NIST NVD',
        lastUpdated: new Date(),
        cveCount: 0,
        criticalCount: 0
      },
      {
        source: 'CISA KEV',
        lastUpdated: new Date(),
        cveCount: 0,
        criticalCount: 0
      },
      {
        source: 'GitHub Advisories',
        lastUpdated: new Date(),
        cveCount: 0,
        criticalCount: 0
      }
    ];

    // In a production system, you would track actual feed statistics
    return feeds;
  }

  /**
   * Check if CVE affects any monitored repositories
   */
  async checkCVEImpact(cve: CVEDetails): Promise<{
    affectedRepositories: number[];
    riskScore: number;
    immediateAction: boolean;
  }> {
    try {
      // This would check against your monitored dependencies
      const affectedRepos: number[] = [];
      
      // Calculate risk score based on multiple factors
      const riskScore = this.calculateRiskScore(cve);
      
      // Determine if immediate action is required
      const immediateAction = cve.severity === 'CRITICAL' || 
                            cve.exploitability.hasExploit ||
                            cve.businessImpact.remoteCodeExecution;

      return {
        affectedRepositories: affectedRepos,
        riskScore,
        immediateAction
      };
    } catch (error) {
      console.error('Error checking CVE impact:', error);
      return {
        affectedRepositories: [],
        riskScore: 0,
        immediateAction: false
      };
    }
  }

  /**
   * Calculate comprehensive risk score
   */
  private calculateRiskScore(cve: CVEDetails): number {
    let score = cve.cvssV3Score * 10; // Base score out of 100

    // Exploitability multipliers
    if (cve.exploitability.hasExploit) score *= 1.5;
    if (cve.exploitability.threatActorActivity) score *= 1.3;
    
    // Business impact multipliers
    if (cve.businessImpact.remoteCodeExecution) score *= 1.4;
    if (cve.businessImpact.privilegeEscalation) score *= 1.2;
    if (cve.businessImpact.dataExfiltration) score *= 1.3;
    
    // Age factor (newer CVEs are riskier)
    const ageInDays = (Date.now() - cve.published.getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays <= 7) score *= 1.2;
    else if (ageInDays <= 30) score *= 1.1;

    return Math.min(Math.round(score), 100);
  }
}

export const threatIntelligenceService = new ThreatIntelligenceService();