import posthog from 'posthog-js';

export class AnalyticsClient {
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    // Disable PostHog analytics to prevent network fetch errors
    console.log('Analytics disabled to prevent runtime errors');
    this.isInitialized = false;
    return;
  }

  // User identification
  identify(userId: string, properties?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    subscriptionStatus?: string;
    subscriptionTier?: string;
  }): void {
    if (!this.isInitialized) return;

    posthog.identify(userId, {
      ...properties,
      $name: properties?.firstName && properties?.lastName 
        ? `${properties.firstName} ${properties.lastName}` 
        : properties?.email,
      $email: properties?.email,
    });
  }

  // Page tracking
  trackPageView(page: string, properties?: Record<string, any>): void {
    if (!this.isInitialized) return;

    posthog.capture('$pageview', {
      $current_url: window.location.href,
      page_name: page,
      ...properties,
    });
  }

  // Repository events
  trackRepositoryAdded(repositoryData: {
    repositoryId: number;
    repositoryName: string;
    gitUrl: string;
    isPrivate?: boolean;
  }): void {
    if (!this.isInitialized) return;

    posthog.capture('repository_added', {
      repository_id: repositoryData.repositoryId,
      repository_name: repositoryData.repositoryName,
      git_url: repositoryData.gitUrl,
      is_private: repositoryData.isPrivate,
    });
  }

  trackRepositoryDeleted(repositoryData: {
    repositoryId: number;
    repositoryName: string;
  }): void {
    if (!this.isInitialized) return;

    posthog.capture('repository_deleted', {
      repository_id: repositoryData.repositoryId,
      repository_name: repositoryData.repositoryName,
    });
  }

  trackRepositoryViewed(repositoryData: {
    repositoryId: number;
    repositoryName: string;
  }): void {
    if (!this.isInitialized) return;

    posthog.capture('repository_viewed', {
      repository_id: repositoryData.repositoryId,
      repository_name: repositoryData.repositoryName,
    });
  }

  // Scan events
  trackScanTriggered(scanData: {
    repositoryId: number;
    repositoryName: string;
    scanType: 'manual' | 'scheduled' | 'webhook';
  }): void {
    if (!this.isInitialized) return;

    posthog.capture('scan_triggered', {
      repository_id: scanData.repositoryId,
      repository_name: scanData.repositoryName,
      scan_type: scanData.scanType,
    });
  }

  // Alert events
  trackAlertViewed(alertData: {
    alertId: number;
    alertType: 'vulnerability' | 'license';
    severity: string;
    repositoryId: number;
  }): void {
    if (!this.isInitialized) return;

    posthog.capture('alert_viewed', {
      alert_id: alertData.alertId,
      alert_type: alertData.alertType,
      severity: alertData.severity,
      repository_id: alertData.repositoryId,
    });
  }

  trackAlertDismissed(alertData: {
    alertId: number;
    alertType: 'vulnerability' | 'license';
    repositoryId: number;
  }): void {
    if (!this.isInitialized) return;

    posthog.capture('alert_dismissed', {
      alert_id: alertData.alertId,
      alert_type: alertData.alertType,
      repository_id: alertData.repositoryId,
    });
  }

  // Billing events
  trackBillingPageViewed(): void {
    if (!this.isInitialized) return;

    posthog.capture('billing_page_viewed');
  }

  trackUpgradeAttempted(tier: string): void {
    if (!this.isInitialized) return;

    posthog.capture('upgrade_attempted', {
      target_tier: tier,
    });
  }

  trackSubscriptionCancelled(currentTier: string): void {
    if (!this.isInitialized) return;

    posthog.capture('subscription_cancelled', {
      previous_tier: currentTier,
    });
  }

  // Feature usage
  trackFeatureUsed(feature: string, action: string, properties?: Record<string, any>): void {
    if (!this.isInitialized) return;

    posthog.capture('feature_used', {
      feature_name: feature,
      action,
      ...properties,
    });
  }

  trackButtonClicked(buttonName: string, location: string, properties?: Record<string, any>): void {
    if (!this.isInitialized) return;

    posthog.capture('button_clicked', {
      button_name: buttonName,
      location,
      ...properties,
    });
  }

  // Settings and configuration
  trackSettingsChanged(settingType: string, oldValue: any, newValue: any): void {
    if (!this.isInitialized) return;

    posthog.capture('settings_changed', {
      setting_type: settingType,
      old_value: oldValue,
      new_value: newValue,
    });
  }

  trackNotificationSettingsChanged(settings: {
    emailEnabled: boolean;
    slackEnabled: boolean;
    webhookEnabled: boolean;
  }): void {
    if (!this.isInitialized) return;

    posthog.capture('notification_settings_changed', {
      email_enabled: settings.emailEnabled,
      slack_enabled: settings.slackEnabled,
      webhook_enabled: settings.webhookEnabled,
    });
  }

  // User engagement
  trackSearchPerformed(query: string, results: number): void {
    if (!this.isInitialized) return;

    posthog.capture('search_performed', {
      query,
      results_count: results,
    });
  }

  trackFilterApplied(filterType: string, filterValue: string): void {
    if (!this.isInitialized) return;

    posthog.capture('filter_applied', {
      filter_type: filterType,
      filter_value: filterValue,
    });
  }

  trackExportData(dataType: string, format: string): void {
    if (!this.isInitialized) return;

    posthog.capture('data_exported', {
      data_type: dataType,
      format,
    });
  }

  // Feedback and support
  trackFeedbackSubmitted(feedbackData: {
    type: string;
    title: string;
    repositoryId?: number;
    priority: string;
  }): void {
    if (!this.isInitialized) return;

    posthog.capture('feedback_submitted', {
      feedback_type: feedbackData.type,
      feedback_title: feedbackData.title,
      repository_id: feedbackData.repositoryId,
      priority: feedbackData.priority,
    });
  }

  trackDocumentationViewed(section: string): void {
    if (!this.isInitialized) return;

    posthog.capture('documentation_viewed', {
      section,
    });
  }

  // Error tracking
  trackError(error: string, context?: Record<string, any>): void {
    if (!this.isInitialized) return;

    posthog.capture('frontend_error', {
      error_message: error,
      ...context,
    });
  }

  // User session events
  trackSessionStart(): void {
    if (!this.isInitialized) return;

    posthog.capture('session_start');
  }

  trackLogout(): void {
    if (!this.isInitialized) return;

    posthog.capture('user_logout');
    posthog.reset(); // Clear user identification
  }

  // Performance tracking
  trackPerformance(metric: string, value: number, unit: string): void {
    if (!this.isInitialized) return;

    posthog.capture('performance_metric', {
      metric_name: metric,
      value,
      unit,
    });
  }

  // Admin events
  trackAdminAction(action: string, target?: string, properties?: Record<string, any>): void {
    if (!this.isInitialized) return;

    posthog.capture('admin_action', {
      action,
      target,
      ...properties,
    });
  }

  // User properties update
  setUserProperties(properties: Record<string, any>): void {
    if (!this.isInitialized) return;

    posthog.setPersonProperties(properties);
  }

  // Group analytics (for organizations/teams in the future)
  setGroup(groupType: string, groupKey: string, properties?: Record<string, any>): void {
    if (!this.isInitialized) return;

    posthog.group(groupType, groupKey, properties);
  }

  // Feature flags (for A/B testing)
  isFeatureEnabled(flagKey: string): boolean {
    if (!this.isInitialized) return false;

    return posthog.isFeatureEnabled(flagKey) || false;
  }

  getFeatureFlag(flagKey: string): string | boolean | undefined {
    if (!this.isInitialized) return undefined;

    return posthog.getFeatureFlag(flagKey);
  }
}

export const analytics = new AnalyticsClient();