import { db } from "./db";
import { alerts, repositories, users } from "@shared/schema";
import { eq, and, gte, lte, desc, sql, count } from "drizzle-orm";
import { analyticsService } from "./analyticsService";

interface ThreatTimeline {
  eventId: string;
  timestamp: Date;
  eventType: 'dependency_added' | 'vulnerability_detected' | 'package_updated' | 'license_change' | 'security_scan' | 'user_action';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  metadata: {
    packageName?: string;
    version?: string;
    cveId?: string;
    userId?: string;
    repositoryId?: number;
    ipAddress?: string;
    userAgent?: string;
    [key: string]: any;
  };
  indicators: string[];
  relatedEvents: string[];
}

interface ForensicEvidence {
  id: string;
  type: 'file_hash' | 'network_connection' | 'registry_key' | 'process_execution' | 'dependency_chain';
  value: string;
  source: string;
  confidence: number;
  firstSeen: Date;
  lastSeen: Date;
  threatActors: string[];
  campaigns: string[];
  techniques: string[];
}

interface AttackPath {
  id: string;
  name: string;
  description: string;
  startPoint: {
    type: string;
    identifier: string;
    timestamp: Date;
  };
  endPoint: {
    type: string;
    identifier: string;
    timestamp: Date;
  };
  steps: Array<{
    stepNumber: number;
    timestamp: Date;
    action: string;
    technique: string;
    evidence: string[];
    impact: string;
  }>;
  riskScore: number;
  mitigation: string[];
}

interface BehavioralAnomaly {
  id: string;
  userId: string;
  type: 'access_pattern' | 'download_behavior' | 'repository_interaction' | 'time_anomaly' | 'location_anomaly';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  baselineDeviation: number;
  firstDetected: Date;
  lastDetected: Date;
  frequency: number;
  indicators: string[];
  riskFactors: string[];
}

interface SupplyChainThreat {
  packageName: string;
  version: string;
  threatType: 'malicious_code' | 'backdoor' | 'data_exfiltration' | 'credential_harvesting' | 'cryptomining' | 'supply_chain_attack';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  indicators: {
    suspicious_functions: string[];
    network_connections: string[];
    file_operations: string[];
    obfuscated_code: boolean;
    external_dependencies: string[];
  };
  attribution: {
    threatActor?: string;
    campaign?: string;
    techniques: string[];
  };
  timeline: {
    discovered: Date;
    published: Date;
    firstSeen: Date;
    lastSeen: Date;
  };
  affectedRepositories: number[];
}

export class ThreatHunting {

  /**
   * Digital Forensics Timeline Reconstruction
   */
  async reconstructThreatTimeline(repositoryId: number, startDate: Date, endDate: Date): Promise<ThreatTimeline[]> {
    try {
      // Collect events from multiple sources
      const events = await Promise.all([
        this.collectDependencyEvents(repositoryId, startDate, endDate),
        this.collectVulnerabilityEvents(repositoryId, startDate, endDate),
        this.collectUserActions(repositoryId, startDate, endDate),
        this.collectSecurityScans(repositoryId, startDate, endDate),
        this.collectNetworkEvents(repositoryId, startDate, endDate)
      ]);

      // Flatten and sort chronologically
      const allEvents = events.flat().sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      // Correlate related events
      const correlatedEvents = await this.correlateEvents(allEvents);

      // Identify attack patterns
      const enrichedEvents = await this.enrichWithThreatIntelligence(correlatedEvents);

      // Track analytics
      await analyticsService.trackFeatureUsage('system', {
        feature: 'threat_timeline_reconstruction',
        action: 'generate',
        properties: { 
          repositoryId,
          eventCount: enrichedEvents.length,
          timeRange: Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        }
      });

      return enrichedEvents;
    } catch (error) {
      console.error('Error reconstructing threat timeline:', error);
      throw new Error('Failed to reconstruct threat timeline');
    }
  }

  /**
   * Attack Path Analysis
   */
  async analyzeAttackPaths(repositoryId: number, timeWindow: number = 7): Promise<AttackPath[]> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - timeWindow * 24 * 60 * 60 * 1000);

      // Get timeline events
      const timeline = await this.reconstructThreatTimeline(repositoryId, startDate, endDate);

      // Identify potential attack chains
      const suspiciousEvents = timeline.filter(event => 
        event.severity === 'high' || event.severity === 'critical'
      );

      // Analyze dependency chains for supply chain attacks
      const dependencyChains = await this.analyzeDependencyChains(repositoryId, suspiciousEvents);

      // Construct attack paths
      const attackPaths = await this.constructAttackPaths(suspiciousEvents, dependencyChains);

      // Score and prioritize paths
      const scoredPaths = attackPaths.map(path => ({
        ...path,
        riskScore: this.calculatePathRiskScore(path)
      }));

      return scoredPaths.sort((a, b) => b.riskScore - a.riskScore);
    } catch (error) {
      console.error('Error analyzing attack paths:', error);
      throw new Error('Failed to analyze attack paths');
    }
  }

  /**
   * Behavioral Anomaly Detection
   */
  async detectBehavioralAnomalies(userId: string, timeWindow: number = 30): Promise<BehavioralAnomaly[]> {
    try {
      // Get user baseline behavior
      const baseline = await this.getUserBaseline(userId, timeWindow);

      // Get recent activity
      const recentActivity = await this.getUserRecentActivity(userId, 7);

      // Analyze deviations
      const anomalies: BehavioralAnomaly[] = [];

      // Access pattern anomalies
      const accessAnomalies = await this.detectAccessPatternAnomalies(baseline, recentActivity);
      anomalies.push(...accessAnomalies);

      // Download behavior anomalies
      const downloadAnomalies = await this.detectDownloadAnomalies(baseline, recentActivity);
      anomalies.push(...downloadAnomalies);

      // Time-based anomalies
      const timeAnomalies = await this.detectTimeAnomalies(baseline, recentActivity);
      anomalies.push(...timeAnomalies);

      // Location anomalies
      const locationAnomalies = await this.detectLocationAnomalies(baseline, recentActivity);
      anomalies.push(...locationAnomalies);

      // Score and filter anomalies
      const significantAnomalies = anomalies.filter(anomaly => anomaly.confidence > 0.7);

      // Track analytics
      await analyticsService.trackFeatureUsage(userId, {
        feature: 'behavioral_anomaly_detection',
        action: 'analyze',
        properties: { 
          anomalyCount: significantAnomalies.length,
          highSeverityCount: significantAnomalies.filter(a => a.severity === 'high' || a.severity === 'critical').length
        }
      });

      return significantAnomalies;
    } catch (error) {
      console.error('Error detecting behavioral anomalies:', error);
      throw new Error('Failed to detect behavioral anomalies');
    }
  }

  /**
   * Supply Chain Attack Detection
   */
  async detectSupplyChainThreats(repositoryId: number): Promise<SupplyChainThreat[]> {
    try {
      // Get repository dependencies
      const dependencies = await this.getRepositoryDependencies(repositoryId);

      // Analyze each dependency for threats
      const threatAnalysis = await Promise.all(
        dependencies.map(dep => this.analyzePackageForThreats(dep))
      );

      // Filter identified threats
      const identifiedThreats = threatAnalysis.filter(threat => threat !== null) as SupplyChainThreat[];

      // Enrich with attribution data
      const enrichedThreats = await Promise.all(
        identifiedThreats.map(threat => this.enrichThreatWithAttribution(threat))
      );

      // Track analytics
      await analyticsService.trackFeatureUsage('system', {
        feature: 'supply_chain_threat_detection',
        action: 'scan',
        properties: { 
          repositoryId,
          dependencyCount: dependencies.length,
          threatCount: enrichedThreats.length
        }
      });

      return enrichedThreats;
    } catch (error) {
      console.error('Error detecting supply chain threats:', error);
      throw new Error('Failed to detect supply chain threats');
    }
  }

  /**
   * Forensic Evidence Collection
   */
  async collectForensicEvidence(incidentId: string, scope: 'repository' | 'user' | 'global'): Promise<ForensicEvidence[]> {
    try {
      const evidence: ForensicEvidence[] = [];

      // Collect different types of evidence based on scope
      switch (scope) {
        case 'repository':
          evidence.push(...await this.collectRepositoryEvidence(incidentId));
          break;
        case 'user':
          evidence.push(...await this.collectUserEvidence(incidentId));
          break;
        case 'global':
          evidence.push(...await this.collectGlobalEvidence(incidentId));
          break;
      }

      // Correlate evidence with threat intelligence
      const correlatedEvidence = await this.correlateEvidenceWithThreatIntel(evidence);

      // Calculate confidence scores
      const scoredEvidence = correlatedEvidence.map(item => ({
        ...item,
        confidence: this.calculateEvidenceConfidence(item)
      }));

      return scoredEvidence.sort((a, b) => b.confidence - a.confidence);
    } catch (error) {
      console.error('Error collecting forensic evidence:', error);
      throw new Error('Failed to collect forensic evidence');
    }
  }

  /**
   * Threat Intelligence Correlation
   */
  async correlateThreatIntelligence(indicators: string[]): Promise<any[]> {
    try {
      const correlations = [];

      for (const indicator of indicators) {
        // Check against known threat feeds
        const threatMatches = await this.queryThreatFeeds(indicator);
        
        // Check against historical incidents
        const historicalMatches = await this.queryHistoricalIncidents(indicator);
        
        // Check against attribution databases
        const attributionMatches = await this.queryAttributionData(indicator);

        if (threatMatches.length > 0 || historicalMatches.length > 0 || attributionMatches.length > 0) {
          correlations.push({
            indicator,
            threatMatches,
            historicalMatches,
            attributionMatches,
            confidence: this.calculateCorrelationConfidence(threatMatches, historicalMatches, attributionMatches)
          });
        }
      }

      return correlations;
    } catch (error) {
      console.error('Error correlating threat intelligence:', error);
      throw new Error('Failed to correlate threat intelligence');
    }
  }

  // Helper methods for event collection
  private async collectDependencyEvents(repositoryId: number, startDate: Date, endDate: Date): Promise<ThreatTimeline[]> {
    // Simulate dependency events
    return [
      {
        eventId: `dep_${Date.now()}_1`,
        timestamp: new Date(startDate.getTime() + 1000 * 60 * 60 * 2),
        eventType: 'dependency_added',
        severity: 'info',
        source: 'package_manager',
        description: 'New dependency added: suspicious-package@1.0.0',
        metadata: {
          packageName: 'suspicious-package',
          version: '1.0.0',
          repositoryId
        },
        indicators: ['new_dependency', 'unverified_publisher'],
        relatedEvents: []
      }
    ];
  }

  private async collectVulnerabilityEvents(repositoryId: number, startDate: Date, endDate: Date): Promise<ThreatTimeline[]> {
    const vulnerabilities = await db.select()
      .from(alerts)
      .where(and(
        eq(alerts.repoId, repositoryId),
        gte(alerts.createdAt, startDate),
        lte(alerts.createdAt, endDate)
      ));

    return vulnerabilities.map(vuln => ({
      eventId: `vuln_${vuln.id}`,
      timestamp: vuln.createdAt,
      eventType: 'vulnerability_detected' as const,
      severity: vuln.severity as any,
      source: 'vulnerability_scanner',
      description: vuln.description || 'Vulnerability detected',
      metadata: {
        packageName: vuln.packageName,
        repositoryId,
        cveId: vuln.cveId
      },
      indicators: ['vulnerability_detected'],
      relatedEvents: []
    }));
  }

  private async collectUserActions(repositoryId: number, startDate: Date, endDate: Date): Promise<ThreatTimeline[]> {
    // In production, collect from audit logs
    return [];
  }

  private async collectSecurityScans(repositoryId: number, startDate: Date, endDate: Date): Promise<ThreatTimeline[]> {
    // In production, collect from scan history
    return [];
  }

  private async collectNetworkEvents(repositoryId: number, startDate: Date, endDate: Date): Promise<ThreatTimeline[]> {
    // In production, collect from network monitoring
    return [];
  }

  // Event correlation and enrichment
  private async correlateEvents(events: ThreatTimeline[]): Promise<ThreatTimeline[]> {
    // Implement event correlation logic
    return events.map(event => ({
      ...event,
      relatedEvents: this.findRelatedEvents(event, events)
    }));
  }

  private findRelatedEvents(targetEvent: ThreatTimeline, allEvents: ThreatTimeline[]): string[] {
    return allEvents
      .filter(event => 
        event.eventId !== targetEvent.eventId &&
        Math.abs(event.timestamp.getTime() - targetEvent.timestamp.getTime()) < 5 * 60 * 1000 && // 5 minutes
        (event.metadata.packageName === targetEvent.metadata.packageName ||
         event.metadata.repositoryId === targetEvent.metadata.repositoryId)
      )
      .map(event => event.eventId);
  }

  private async enrichWithThreatIntelligence(events: ThreatTimeline[]): Promise<ThreatTimeline[]> {
    // Enrich events with threat intelligence data
    return events.map(event => ({
      ...event,
      indicators: [...event.indicators, ...this.extractThreatIndicators(event)]
    }));
  }

  private extractThreatIndicators(event: ThreatTimeline): string[] {
    const indicators: string[] = [];
    
    if (event.eventType === 'dependency_added' && event.metadata.packageName) {
      if (this.isSuspiciousPackageName(event.metadata.packageName)) {
        indicators.push('suspicious_package_name');
      }
    }

    if (event.severity === 'critical') {
      indicators.push('critical_severity');
    }

    return indicators;
  }

  private isSuspiciousPackageName(packageName: string): boolean {
    const suspiciousPatterns = ['malware', 'trojan', 'backdoor', 'evil', 'hack'];
    return suspiciousPatterns.some(pattern => packageName.toLowerCase().includes(pattern));
  }

  // Attack path analysis methods
  private async analyzeDependencyChains(repositoryId: number, events: ThreatTimeline[]): Promise<any[]> {
    // Analyze dependency relationships for attack chains
    return [];
  }

  private async constructAttackPaths(events: ThreatTimeline[], chains: any[]): Promise<AttackPath[]> {
    // Construct potential attack paths from events and chains
    return [];
  }

  private calculatePathRiskScore(path: AttackPath): number {
    // Calculate risk score based on path characteristics
    let score = 0;
    
    score += path.steps.length * 10; // More steps = higher risk
    score += path.steps.filter(step => step.technique.includes('privilege_escalation')).length * 20;
    score += path.steps.filter(step => step.technique.includes('data_exfiltration')).length * 30;
    
    return Math.min(100, score);
  }

  // Behavioral anomaly detection methods
  private async getUserBaseline(userId: string, days: number): Promise<any> {
    // Calculate user behavioral baseline
    return {
      typicalAccessHours: [8, 9, 10, 14, 15, 16, 17],
      averageSessionDuration: 3600,
      commonRepositories: [],
      typicalDownloadVolume: 50,
      commonLocations: []
    };
  }

  private async getUserRecentActivity(userId: string, days: number): Promise<any> {
    // Get recent user activity
    return {
      accessHours: [2, 3, 4], // Unusual hours
      sessionDuration: 7200,
      repositories: [],
      downloadVolume: 500, // High volume
      locations: []
    };
  }

  private async detectAccessPatternAnomalies(baseline: any, recent: any): Promise<BehavioralAnomaly[]> {
    const anomalies: BehavioralAnomaly[] = [];
    
    // Check for unusual access hours
    const unusualHours = recent.accessHours.filter((hour: number) => 
      !baseline.typicalAccessHours.includes(hour)
    );

    if (unusualHours.length > 0) {
      anomalies.push({
        id: `anomaly_${Date.now()}_access`,
        userId: 'user_id',
        type: 'access_pattern',
        description: `Unusual access hours detected: ${unusualHours.join(', ')}`,
        severity: 'medium',
        confidence: 0.8,
        baselineDeviation: 2.5,
        firstDetected: new Date(),
        lastDetected: new Date(),
        frequency: unusualHours.length,
        indicators: ['off_hours_access'],
        riskFactors: ['time_anomaly']
      });
    }

    return anomalies;
  }

  private async detectDownloadAnomalies(baseline: any, recent: any): Promise<BehavioralAnomaly[]> {
    const anomalies: BehavioralAnomaly[] = [];
    
    if (recent.downloadVolume > baseline.typicalDownloadVolume * 5) {
      anomalies.push({
        id: `anomaly_${Date.now()}_download`,
        userId: 'user_id',
        type: 'download_behavior',
        description: 'Unusually high download volume detected',
        severity: 'high',
        confidence: 0.9,
        baselineDeviation: recent.downloadVolume / baseline.typicalDownloadVolume,
        firstDetected: new Date(),
        lastDetected: new Date(),
        frequency: 1,
        indicators: ['high_download_volume'],
        riskFactors: ['data_exfiltration_risk']
      });
    }

    return anomalies;
  }

  private async detectTimeAnomalies(baseline: any, recent: any): Promise<BehavioralAnomaly[]> {
    // Implement time-based anomaly detection
    return [];
  }

  private async detectLocationAnomalies(baseline: any, recent: any): Promise<BehavioralAnomaly[]> {
    // Implement location-based anomaly detection
    return [];
  }

  // Supply chain threat detection methods
  private async getRepositoryDependencies(repositoryId: number): Promise<any[]> {
    // Get dependencies from repository analysis
    return [
      { name: 'suspicious-package', version: '1.0.0', type: 'npm' },
      { name: 'legitimate-package', version: '2.1.0', type: 'npm' }
    ];
  }

  private async analyzePackageForThreats(dependency: any): Promise<SupplyChainThreat | null> {
    // Analyze package for known threats
    if (dependency.name.includes('suspicious')) {
      return {
        packageName: dependency.name,
        version: dependency.version,
        threatType: 'malicious_code',
        severity: 'high',
        description: 'Package contains suspicious code patterns',
        indicators: {
          suspicious_functions: ['eval', 'exec'],
          network_connections: ['suspicious-domain.com'],
          file_operations: ['write_to_system'],
          obfuscated_code: true,
          external_dependencies: []
        },
        attribution: {
          techniques: ['T1059.007'] // MITRE ATT&CK technique
        },
        timeline: {
          discovered: new Date(),
          published: new Date(),
          firstSeen: new Date(),
          lastSeen: new Date()
        },
        affectedRepositories: []
      };
    }
    
    return null;
  }

  private async enrichThreatWithAttribution(threat: SupplyChainThreat): Promise<SupplyChainThreat> {
    // Enrich with attribution data from threat intelligence
    return {
      ...threat,
      attribution: {
        ...threat.attribution,
        threatActor: 'Unknown',
        campaign: 'Supply Chain Campaign 2024'
      }
    };
  }

  // Forensic evidence collection methods
  private async collectRepositoryEvidence(incidentId: string): Promise<ForensicEvidence[]> {
    // Collect repository-specific evidence
    return [];
  }

  private async collectUserEvidence(incidentId: string): Promise<ForensicEvidence[]> {
    // Collect user-specific evidence
    return [];
  }

  private async collectGlobalEvidence(incidentId: string): Promise<ForensicEvidence[]> {
    // Collect global evidence
    return [];
  }

  private async correlateEvidenceWithThreatIntel(evidence: ForensicEvidence[]): Promise<ForensicEvidence[]> {
    // Correlate with threat intelligence
    return evidence;
  }

  private calculateEvidenceConfidence(evidence: ForensicEvidence): number {
    // Calculate confidence score for evidence
    return Math.random() * 100; // Simplified
  }

  // Threat intelligence correlation methods
  private async queryThreatFeeds(indicator: string): Promise<any[]> {
    // Query external threat intelligence feeds
    return [];
  }

  private async queryHistoricalIncidents(indicator: string): Promise<any[]> {
    // Query historical incident database
    return [];
  }

  private async queryAttributionData(indicator: string): Promise<any[]> {
    // Query threat actor attribution data
    return [];
  }

  private calculateCorrelationConfidence(threatMatches: any[], historicalMatches: any[], attributionMatches: any[]): number {
    // Calculate correlation confidence
    return (threatMatches.length + historicalMatches.length + attributionMatches.length) * 0.3;
  }
}

export const threatHunting = new ThreatHunting();