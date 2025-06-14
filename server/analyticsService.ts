import { PostHog } from 'posthog-node';

export class AnalyticsService {
  private posthog: PostHog | null = null;
  private isEnabled: boolean = false;

  constructor() {
    this.initializePostHog();
  }

  private initializePostHog(): void {
    if (!process.env.POSTHOG_API_KEY) {
      console.log('PostHog API key not configured, analytics tracking disabled');
      return;
    }

    this.posthog = new PostHog(process.env.POSTHOG_API_KEY, {
      host: process.env.POSTHOG_HOST || 'https://app.posthog.com',
      flushAt: 20,
      flushInterval: 10000,
    });

    this.isEnabled = true;
    console.log('PostHog analytics initialized');
  }

  // User identification and properties
  async identifyUser(userId: string, properties: {
    email?: string;
    firstName?: string;
    lastName?: string;
    subscriptionStatus?: string;
    subscriptionTier?: string;
    createdAt?: Date;
  }): Promise<void> {
    if (!this.isEnabled || !this.posthog) return;

    try {
      this.posthog.identify({
        distinctId: userId,
        properties: {
          ...properties,
          $name: properties.firstName && properties.lastName 
            ? `${properties.firstName} ${properties.lastName}` 
            : properties.email,
          $email: properties.email,
        },
      });
    } catch (error) {
      console.error('PostHog identify error:', error);
    }
  }

  // Repository events
  async trackRepositoryAdded(userId: string, repositoryData: {
    repositoryId: number;
    repositoryName: string;
    gitUrl: string;
    isPrivate?: boolean;
  }): Promise<void> {
    if (!this.isEnabled || !this.posthog) return;

    try {
      this.posthog.capture({
        distinctId: userId,
        event: 'repository_added',
        properties: {
          repository_id: repositoryData.repositoryId,
          repository_name: repositoryData.repositoryName,
          git_url: repositoryData.gitUrl,
          is_private: repositoryData.isPrivate,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('PostHog track repository added error:', error);
    }
  }

  async trackRepositoryDeleted(userId: string, repositoryData: {
    repositoryId: number;
    repositoryName: string;
  }): Promise<void> {
    if (!this.isEnabled || !this.posthog) return;

    try {
      this.posthog.capture({
        distinctId: userId,
        event: 'repository_deleted',
        properties: {
          repository_id: repositoryData.repositoryId,
          repository_name: repositoryData.repositoryName,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('PostHog track repository deleted error:', error);
    }
  }

  // Scan events
  async trackScanTriggered(userId: string, scanData: {
    repositoryId: number;
    repositoryName: string;
    scanType: 'manual' | 'scheduled' | 'webhook';
    jobId: string;
  }): Promise<void> {
    if (!this.isEnabled || !this.posthog) return;

    try {
      this.posthog.capture({
        distinctId: userId,
        event: 'scan_triggered',
        properties: {
          repository_id: scanData.repositoryId,
          repository_name: scanData.repositoryName,
          scan_type: scanData.scanType,
          job_id: scanData.jobId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('PostHog track scan triggered error:', error);
    }
  }

  async trackScanCompleted(userId: string, scanData: {
    repositoryId: number;
    repositoryName: string;
    jobId: string;
    duration: number;
    vulnerabilities: number;
    licenseChanges: number;
    filesScanned: number;
    status: 'completed' | 'failed';
    errorMessage?: string;
  }): Promise<void> {
    if (!this.isEnabled || !this.posthog) return;

    try {
      this.posthog.capture({
        distinctId: userId,
        event: 'scan_completed',
        properties: {
          repository_id: scanData.repositoryId,
          repository_name: scanData.repositoryName,
          job_id: scanData.jobId,
          duration_seconds: scanData.duration,
          vulnerabilities_found: scanData.vulnerabilities,
          license_changes: scanData.licenseChanges,
          files_scanned: scanData.filesScanned,
          status: scanData.status,
          error_message: scanData.errorMessage,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('PostHog track scan completed error:', error);
    }
  }

  // Alert events
  async trackAlertGenerated(userId: string, alertData: {
    repositoryId: number;
    repositoryName: string;
    alertType: 'vulnerability' | 'license';
    severity: string;
    dependencyName: string;
    alertId: number;
  }): Promise<void> {
    if (!this.isEnabled || !this.posthog) return;

    try {
      this.posthog.capture({
        distinctId: userId,
        event: 'alert_generated',
        properties: {
          repository_id: alertData.repositoryId,
          repository_name: alertData.repositoryName,
          alert_type: alertData.alertType,
          severity: alertData.severity,
          dependency_name: alertData.dependencyName,
          alert_id: alertData.alertId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('PostHog track alert generated error:', error);
    }
  }

  async trackAlertNotificationSent(userId: string, notificationData: {
    alertId: number;
    notificationType: 'email' | 'slack';
    repositoryName: string;
    success: boolean;
    errorMessage?: string;
  }): Promise<void> {
    if (!this.isEnabled || !this.posthog) return;

    try {
      this.posthog.capture({
        distinctId: userId,
        event: 'alert_notification_sent',
        properties: {
          alert_id: notificationData.alertId,
          notification_type: notificationData.notificationType,
          repository_name: notificationData.repositoryName,
          success: notificationData.success,
          error_message: notificationData.errorMessage,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('PostHog track alert notification error:', error);
    }
  }

  // Billing and subscription events
  async trackSubscriptionUpgrade(userId: string, billingData: {
    fromTier: string;
    toTier: string;
    amount: number;
    stripeSessionId?: string;
    subscriptionId?: string;
  }): Promise<void> {
    if (!this.isEnabled || !this.posthog) return;

    try {
      this.posthog.capture({
        distinctId: userId,
        event: 'subscription_upgraded',
        properties: {
          from_tier: billingData.fromTier,
          to_tier: billingData.toTier,
          amount: billingData.amount,
          stripe_session_id: billingData.stripeSessionId,
          subscription_id: billingData.subscriptionId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('PostHog track subscription upgrade error:', error);
    }
  }

  async trackPaymentSucceeded(userId: string, paymentData: {
    amount: number;
    currency: string;
    subscriptionTier: string;
    stripeInvoiceId?: string;
  }): Promise<void> {
    if (!this.isEnabled || !this.posthog) return;

    try {
      this.posthog.capture({
        distinctId: userId,
        event: 'payment_succeeded',
        properties: {
          amount: paymentData.amount,
          currency: paymentData.currency,
          subscription_tier: paymentData.subscriptionTier,
          stripe_invoice_id: paymentData.stripeInvoiceId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('PostHog track payment succeeded error:', error);
    }
  }

  async trackPaymentFailed(userId: string, paymentData: {
    amount: number;
    currency: string;
    subscriptionTier: string;
    errorMessage?: string;
    stripeInvoiceId?: string;
  }): Promise<void> {
    if (!this.isEnabled || !this.posthog) return;

    try {
      this.posthog.capture({
        distinctId: userId,
        event: 'payment_failed',
        properties: {
          amount: paymentData.amount,
          currency: paymentData.currency,
          subscription_tier: paymentData.subscriptionTier,
          error_message: paymentData.errorMessage,
          stripe_invoice_id: paymentData.stripeInvoiceId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('PostHog track payment failed error:', error);
    }
  }

  // User engagement events
  async trackPageView(userId: string, pageData: {
    page: string;
    path: string;
    referrer?: string;
  }): Promise<void> {
    if (!this.isEnabled || !this.posthog) return;

    try {
      this.posthog.capture({
        distinctId: userId,
        event: '$pageview',
        properties: {
          $current_url: pageData.path,
          page_name: pageData.page,
          $referrer: pageData.referrer,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('PostHog track page view error:', error);
    }
  }

  async trackFeatureUsage(userId: string, featureData: {
    feature: string;
    action: string;
    properties?: Record<string, any>;
  }): Promise<void> {
    if (!this.isEnabled || !this.posthog) return;

    try {
      this.posthog.capture({
        distinctId: userId,
        event: 'feature_used',
        properties: {
          feature_name: featureData.feature,
          action: featureData.action,
          ...featureData.properties,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('PostHog track feature usage error:', error);
    }
  }

  // Feedback and support events
  async trackFeedbackSubmitted(userId: string, feedbackData: {
    type: string;
    title: string;
    repositoryId?: number;
    priority: string;
  }): Promise<void> {
    if (!this.isEnabled || !this.posthog) return;

    try {
      this.posthog.capture({
        distinctId: userId,
        event: 'feedback_submitted',
        properties: {
          feedback_type: feedbackData.type,
          feedback_title: feedbackData.title,
          repository_id: feedbackData.repositoryId,
          priority: feedbackData.priority,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('PostHog track feedback submitted error:', error);
    }
  }

  // Cleanup
  async trackReferralCompleted(userId: string, referralData: {
    referralCode: string;
    newUserId: string;
    referralCount: number;
  }): Promise<void> {
    if (!this.isEnabled || !this.posthog) return;

    try {
      this.posthog.capture({
        distinctId: userId,
        event: 'referral_completed',
        properties: {
          referral_code: referralData.referralCode,
          new_user_id: referralData.newUserId,
          referral_count: referralData.referralCount,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('PostHog track referral completed error:', error);
    }
  }

  async trackReferralRewardGranted(userId: string, rewardData: {
    rewardType: string;
    duration: string;
    referralCount: number;
  }): Promise<void> {
    if (!this.isEnabled || !this.posthog) return;

    try {
      this.posthog.capture({
        distinctId: userId,
        event: 'referral_reward_granted',
        properties: {
          reward_type: rewardData.rewardType,
          reward_duration: rewardData.duration,
          referral_count: rewardData.referralCount,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('PostHog track referral reward granted error:', error);
    }
  }

  async shutdown(): Promise<void> {
    if (this.posthog) {
      await this.posthog.shutdown();
    }
  }
}

export const analyticsService = new AnalyticsService();