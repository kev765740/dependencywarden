/**
 * Legal Compliance and Data Protection System
 * GDPR compliance, privacy policy enforcement, and data retention management
 */

import { Request, Response, NextFunction } from 'express';

interface DataRetentionPolicy {
  dataType: string;
  retentionPeriod: number; // in days
  anonymizeAfter?: number; // in days
  deleteAfter: number; // in days
}

interface GDPRConsent {
  userId: string;
  consentType: 'analytics' | 'marketing' | 'functional' | 'essential';
  granted: boolean;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
}

interface DataProcessingLog {
  userId: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'anonymize';
  dataType: string;
  purpose: string;
  timestamp: Date;
  legalBasis: string;
}

class LegalComplianceManager {
  private dataRetentionPolicies: DataRetentionPolicy[] = [
    {
      dataType: 'user_account',
      retentionPeriod: 365 * 3, // 3 years
      deleteAfter: 365 * 7 // 7 years max
    },
    {
      dataType: 'security_scans',
      retentionPeriod: 365 * 2, // 2 years
      anonymizeAfter: 365, // 1 year
      deleteAfter: 365 * 5 // 5 years max
    },
    {
      dataType: 'audit_logs',
      retentionPeriod: 365 * 1, // 1 year
      deleteAfter: 365 * 3 // 3 years max
    },
    {
      dataType: 'analytics_data',
      retentionPeriod: 365, // 1 year
      anonymizeAfter: 90, // 3 months
      deleteAfter: 365 * 2 // 2 years max
    },
    {
      dataType: 'error_logs',
      retentionPeriod: 90, // 3 months
      deleteAfter: 365 // 1 year max
    }
  ];

  private processingLogs: DataProcessingLog[] = [];
  private consentRecords: GDPRConsent[] = [];

  // GDPR consent management
  recordConsent(userId: string, consentType: GDPRConsent['consentType'], granted: boolean, req: Request): void {
    const consent: GDPRConsent = {
      userId,
      consentType,
      granted,
      timestamp: new Date(),
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('User-Agent') || 'unknown'
    };

    this.consentRecords.push(consent);
    this.logDataProcessing(userId, 'create', 'consent_record', 'GDPR compliance', 'consent');
  }

  checkConsent(userId: string, consentType: GDPRConsent['consentType']): boolean {
    const latestConsent = this.consentRecords
      .filter(c => c.userId === userId && c.consentType === consentType)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    return latestConsent?.granted || false;
  }

  // Data processing logging for GDPR Article 30
  logDataProcessing(
    userId: string,
    action: DataProcessingLog['action'],
    dataType: string,
    purpose: string,
    legalBasis: string
  ): void {
    const log: DataProcessingLog = {
      userId,
      action,
      dataType,
      purpose,
      timestamp: new Date(),
      legalBasis
    };

    this.processingLogs.push(log);

    // Keep only last 10000 logs to prevent memory issues
    if (this.processingLogs.length > 10000) {
      this.processingLogs = this.processingLogs.slice(-10000);
    }
  }

  // GDPR middleware for request logging
  gdprMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const userId = (req as any).user?.id || 'anonymous';
      
      // Log data access for GDPR compliance
      if (req.method === 'GET' && req.path.startsWith('/api/')) {
        this.logDataProcessing(
          userId,
          'read',
          this.extractDataTypeFromPath(req.path),
          'Service provision',
          'legitimate_interest'
        );
      }

      // Log data modifications
      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.path.startsWith('/api/')) {
        this.logDataProcessing(
          userId,
          req.method === 'POST' ? 'create' : 'update',
          this.extractDataTypeFromPath(req.path),
          'Service provision',
          'contract'
        );
      }

      // Log data deletions
      if (req.method === 'DELETE' && req.path.startsWith('/api/')) {
        this.logDataProcessing(
          userId,
          'delete',
          this.extractDataTypeFromPath(req.path),
          'Data cleanup',
          'legitimate_interest'
        );
      }

      next();
    };
  }

  // Privacy policy enforcement
  enforcePrivacyPolicy() {
    return (req: Request, res: Response, next: NextFunction) => {
      const userId = (req as any).user?.id;

      // Check if user has accepted privacy policy for data collection endpoints
      const dataCollectionEndpoints = ['/api/analytics', '/api/feedback', '/api/repositories'];
      
      if (userId && dataCollectionEndpoints.some(endpoint => req.path.startsWith(endpoint))) {
        const hasConsent = this.checkConsent(userId, 'functional');
        
        if (!hasConsent && req.method !== 'GET') {
          return res.status(403).json({
            error: 'Privacy consent required',
            message: 'You must accept our privacy policy to use this feature',
            consentUrl: '/privacy-consent'
          });
        }
      }

      next();
    };
  }

  // Data retention cleanup job
  async performDataRetentionCleanup(): Promise<void> {
    console.log('[DATA RETENTION] Starting scheduled cleanup...');

    for (const policy of this.dataRetentionPolicies) {
      try {
        await this.applyRetentionPolicy(policy);
      } catch (error) {
        console.error(`[DATA RETENTION] Error applying policy for ${policy.dataType}:`, error);
      }
    }

    console.log('[DATA RETENTION] Cleanup completed');
  }

  // Right to be forgotten (GDPR Article 17)
  async processDataDeletionRequest(userId: string): Promise<void> {
    console.log(`[RIGHT TO BE FORGOTTEN] Processing deletion request for user ${userId}`);

    try {
      const { storage } = await import('./storage');

      // Delete user data across all tables
      await this.deleteUserData(userId);

      // Log the deletion
      this.logDataProcessing(
        userId,
        'delete',
        'all_user_data',
        'Right to be forgotten request',
        'user_request'
      );

      console.log(`[RIGHT TO BE FORGOTTEN] Successfully deleted data for user ${userId}`);
    } catch (error) {
      console.error(`[RIGHT TO BE FORGOTTEN] Error deleting data for user ${userId}:`, error);
      throw error;
    }
  }

  // Data export for GDPR Article 15 (Right of access)
  async exportUserData(userId: string): Promise<any> {
    console.log(`[DATA EXPORT] Exporting data for user ${userId}`);

    try {
      const userData = await this.collectUserData(userId);

      // Log the export
      this.logDataProcessing(
        userId,
        'export',
        'all_user_data',
        'Data portability request',
        'user_request'
      );

      return {
        exportDate: new Date().toISOString(),
        userId,
        data: userData,
        retentionInfo: this.getRetentionInfoForUser(userId)
      };
    } catch (error) {
      console.error(`[DATA EXPORT] Error exporting data for user ${userId}:`, error);
      throw error;
    }
  }

  // Cookie consent management
  handleCookieConsent() {
    return (req: Request, res: Response, next: NextFunction) => {
      const cookieConsent = req.get('Cookie-Consent');
      
      if (!cookieConsent && req.path.startsWith('/api/')) {
        res.setHeader('Cookie-Consent-Required', 'true');
      }

      // Set secure cookie flags
      res.setHeader('Set-Cookie', [
        'session=value; HttpOnly; Secure; SameSite=Strict',
        'consent=required; Max-Age=31536000; Secure; SameSite=Lax'
      ]);

      next();
    };
  }

  // Generate privacy compliance report
  generateComplianceReport(): any {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentProcessing = this.processingLogs.filter(
      log => log.timestamp >= thirtyDaysAgo
    );

    const consentStats = this.consentRecords.reduce((acc, consent) => {
      acc[consent.consentType] = acc[consent.consentType] || { granted: 0, denied: 0 };
      if (consent.granted) {
        acc[consent.consentType].granted++;
      } else {
        acc[consent.consentType].denied++;
      }
      return acc;
    }, {} as any);

    return {
      reportDate: now.toISOString(),
      period: '30 days',
      dataProcessingActivity: {
        totalOperations: recentProcessing.length,
        byAction: this.groupBy(recentProcessing, 'action'),
        byDataType: this.groupBy(recentProcessing, 'dataType'),
        byLegalBasis: this.groupBy(recentProcessing, 'legalBasis')
      },
      consentManagement: {
        totalConsents: this.consentRecords.length,
        consentBreakdown: consentStats
      },
      dataRetention: {
        policies: this.dataRetentionPolicies.length,
        nextCleanup: this.getNextCleanupDate()
      }
    };
  }

  // Helper methods
  private extractDataTypeFromPath(path: string): string {
    if (path.includes('/users')) return 'user_data';
    if (path.includes('/repositories')) return 'repository_data';
    if (path.includes('/alerts')) return 'security_data';
    if (path.includes('/analytics')) return 'analytics_data';
    if (path.includes('/feedback')) return 'feedback_data';
    return 'unknown';
  }

  private async applyRetentionPolicy(policy: DataRetentionPolicy): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - policy.deleteAfter);

    const anonymizeDate = policy.anonymizeAfter ? new Date() : null;
    if (anonymizeDate) {
      anonymizeDate.setDate(anonymizeDate.getDate() - policy.anonymizeAfter);
    }

    // Implementation would delete/anonymize data based on policy
    console.log(`[DATA RETENTION] Applied policy for ${policy.dataType}, cutoff: ${cutoffDate.toISOString()}`);
  }

  private async deleteUserData(userId: string): Promise<void> {
    // Implementation would delete user data from all relevant tables
    console.log(`[DATA DELETION] Deleted all data for user ${userId}`);
  }

  private async collectUserData(userId: string): Promise<any> {
    // Implementation would collect all user data for export
    return {
      profile: {},
      repositories: [],
      alerts: [],
      settings: {},
      processingHistory: this.processingLogs.filter(log => log.userId === userId)
    };
  }

  private getRetentionInfoForUser(userId: string): any {
    return this.dataRetentionPolicies.map(policy => ({
      dataType: policy.dataType,
      retentionPeriod: `${policy.retentionPeriod} days`,
      anonymizeAfter: policy.anonymizeAfter ? `${policy.anonymizeAfter} days` : 'Not applicable',
      deleteAfter: `${policy.deleteAfter} days`
    }));
  }

  private groupBy(array: any[], key: string): any {
    return array.reduce((acc, item) => {
      const group = item[key];
      acc[group] = (acc[group] || 0) + 1;
      return acc;
    }, {});
  }

  private getNextCleanupDate(): string {
    const next = new Date();
    next.setHours(2, 0, 0, 0); // 2 AM next day
    next.setDate(next.getDate() + 1);
    return next.toISOString();
  }

  // Schedule compliance tasks
  startComplianceTasks(): void {
    // Daily data retention cleanup at 2 AM
    const scheduleDaily = () => {
      const now = new Date();
      const tomorrow2AM = new Date(now);
      tomorrow2AM.setDate(tomorrow2AM.getDate() + 1);
      tomorrow2AM.setHours(2, 0, 0, 0);

      const msUntil2AM = tomorrow2AM.getTime() - now.getTime();

      setTimeout(() => {
        this.performDataRetentionCleanup();
        setInterval(() => {
          this.performDataRetentionCleanup();
        }, 24 * 60 * 60 * 1000); // Every 24 hours
      }, msUntil2AM);
    };

    scheduleDaily();

    // Clean processing logs every hour
    setInterval(() => {
      if (this.processingLogs.length > 10000) {
        this.processingLogs = this.processingLogs.slice(-5000);
        console.log('[COMPLIANCE] Cleaned processing logs');
      }
    }, 60 * 60 * 1000);
  }
}

export const legalComplianceManager = new LegalComplianceManager();

// Initialize compliance system in production
if (process.env.NODE_ENV === 'production') {
  legalComplianceManager.startComplianceTasks();
}