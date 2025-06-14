export interface ErrorEvent {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  userId?: string;
  sessionId: string;
  userAgent: string;
  url: string;
  tags: Record<string, string>;
  context: Record<string, any>;
  fingerprint: string;
  resolved: boolean;
}

export interface AnalyticsEvent {
  id: string;
  timestamp: string;
  event: string;
  userId?: string;
  sessionId: string;
  properties: Record<string, any>;
  page: string;
  referrer?: string;
  userAgent: string;
}

export interface PerformanceMetric {
  id: string;
  timestamp: string;
  metric: 'page_load' | 'api_response' | 'scan_duration' | 'query_time';
  value: number;
  unit: 'ms' | 'seconds' | 'bytes';
  tags: Record<string, string>;
  context: Record<string, any>;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  message: string;
  service: string;
  userId?: string;
  sessionId?: string;
  metadata: Record<string, any>;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  version: string;
  services: {
    api: 'up' | 'down' | 'degraded';
    database: 'up' | 'down' | 'degraded';
    cache: 'up' | 'down' | 'degraded';
    monitoring: 'up' | 'down' | 'degraded';
  };
  metrics: {
    errorRate: number;
    averageResponseTime: number;
    activeUsers: number;
    requestsPerMinute: number;
  };
  lastUpdated: string;
}

class MonitoringService {
  private sessionId: string;
  private userId?: string;
  private errors: ErrorEvent[] = [];
  private analytics: AnalyticsEvent[] = [];
  private performance: PerformanceMetric[] = [];
  private logs: LogEntry[] = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeErrorHandler();
    this.initializePerformanceObserver();
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2);
  }

  private initializeErrorHandler(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.captureError(event.error, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        });
      });

      window.addEventListener('unhandledrejection', (event) => {
        this.captureError(new Error(event.reason), {
          type: 'unhandled_promise_rejection'
        });
      });
    }
  }

  private initializePerformanceObserver(): void {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            this.capturePerformanceMetric({
              metric: 'page_load',
              value: entry.duration,
              unit: 'ms',
              tags: {
                type: entry.entryType,
                name: entry.name
              },
              context: {
                startTime: entry.startTime,
                duration: entry.duration
              }
            });
          });
        });

        observer.observe({ entryTypes: ['navigation', 'resource'] });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }
  }

  setUser(userId: string): void {
    this.userId = userId;
  }

  clearUser(): void {
    this.userId = undefined;
  }

  captureError(error: Error, context: Record<string, any> = {}): void {
    const errorEvent: ErrorEvent = {
      id: 'err_' + Date.now() + '_' + Math.random().toString(36).substring(2),
      timestamp: new Date().toISOString(),
      level: 'error',
      message: error.message,
      stack: error.stack,
      userId: this.userId,
      sessionId: this.sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      tags: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.VITE_APP_VERSION || '1.0.0'
      },
      context,
      fingerprint: this.generateFingerprint(error),
      resolved: false
    };

    this.errors.push(errorEvent);
    this.sendToSentry(errorEvent);
    
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100);
    }
  }

  captureException(error: Error, context: Record<string, any> = {}): void {
    this.captureError(error, context);
  }

  captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context: Record<string, any> = {}): void {
    const errorEvent: ErrorEvent = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2),
      timestamp: new Date().toISOString(),
      level,
      message,
      userId: this.userId,
      sessionId: this.sessionId,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      tags: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.VITE_APP_VERSION || '1.0.0'
      },
      context,
      fingerprint: this.generateFingerprint(new Error(message)),
      resolved: false
    };

    this.errors.push(errorEvent);
    this.sendToSentry(errorEvent);
  }

  captureAnalyticsEvent(event: string, properties: Record<string, any> = {}): void {
    const analyticsEvent: AnalyticsEvent = {
      id: 'analytics_' + Date.now() + '_' + Math.random().toString(36).substring(2),
      timestamp: new Date().toISOString(),
      event,
      userId: this.userId,
      sessionId: this.sessionId,
      properties,
      page: typeof window !== 'undefined' ? window.location.pathname : 'unknown',
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };

    this.analytics.push(analyticsEvent);
    this.sendToAnalytics(analyticsEvent);

    if (this.analytics.length > 1000) {
      this.analytics = this.analytics.slice(-1000);
    }
  }

  capturePerformanceMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    const performanceMetric: PerformanceMetric = {
      id: 'perf_' + Date.now() + '_' + Math.random().toString(36).substring(2),
      timestamp: new Date().toISOString(),
      ...metric
    };

    this.performance.push(performanceMetric);
    this.sendToAnalytics(performanceMetric);

    if (this.performance.length > 500) {
      this.performance = this.performance.slice(-500);
    }
  }

  log(level: LogEntry['level'], message: string, service: string = 'frontend', metadata: Record<string, any> = {}): void {
    const logEntry: LogEntry = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2),
      timestamp: new Date().toISOString(),
      level,
      message,
      service,
      userId: this.userId,
      sessionId: this.sessionId,
      metadata
    };

    this.logs.push(logEntry);
    this.sendToLoggingService(logEntry);

    if (process.env.NODE_ENV === 'development') {
      const logMethod = level === 'error' || level === 'fatal' ? 'error' : 
                       level === 'warn' ? 'warn' : 'log';
      console[logMethod](`[${level.toUpperCase()}] ${service}: ${message}`, metadata);
    }

    if (this.logs.length > 200) {
      this.logs = this.logs.slice(-200);
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const mockHealth: SystemHealth = {
      status: 'healthy',
      uptime: Date.now() - (Date.now() - 86400000),
      version: process.env.VITE_APP_VERSION || '1.0.0',
      services: {
        api: 'up',
        database: 'up',
        cache: 'up',
        monitoring: 'up'
      },
      metrics: {
        errorRate: 0.1,
        averageResponseTime: 245,
        activeUsers: 127,
        requestsPerMinute: 1450
      },
      lastUpdated: new Date().toISOString()
    };

    return mockHealth;
  }

  getRecentErrors(limit: number = 50): ErrorEvent[] {
    return this.errors.slice(-limit);
  }

  getRecentAnalytics(limit: number = 100): AnalyticsEvent[] {
    return this.analytics.slice(-limit);
  }

  getRecentPerformanceMetrics(limit: number = 50): PerformanceMetric[] {
    return this.performance.slice(-limit);
  }

  getRecentLogs(limit: number = 100): LogEntry[] {
    return this.logs.slice(-limit);
  }

  private async sendToSentry(error: ErrorEvent): Promise<void> {
    try {
      if (process.env.VITE_SENTRY_DSN) {
        console.log('Would send to Sentry:', error);
      }
    } catch (err) {
      console.error('Failed to send error to Sentry:', err);
    }
  }

  private async sendToAnalytics(event: AnalyticsEvent | PerformanceMetric): Promise<void> {
    try {
      if (process.env.VITE_ANALYTICS_ID) {
        console.log('Would send to analytics:', event);
      }
    } catch (err) {
      console.error('Failed to send to analytics:', err);
    }
  }

  private async sendToLoggingService(log: LogEntry): Promise<void> {
    try {
      if (process.env.VITE_LOGGING_ENDPOINT) {
        console.log('Would send to logging service:', log);
      }
    } catch (err) {
      console.error('Failed to send to logging service:', err);
    }
  }

  private generateFingerprint(error: Error): string {
    const message = error.message || 'Unknown error';
    const stack = error.stack || '';
    const stackLine = stack.split('\n')[1] || '';
    
    return btoa(message + stackLine).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  trackPageView(page: string, properties: Record<string, any> = {}): void {
    this.captureAnalyticsEvent('page_view', {
      page,
      ...properties
    });
  }

  trackUserAction(action: string, properties: Record<string, any> = {}): void {
    this.captureAnalyticsEvent('user_action', {
      action,
      ...properties
    });
  }

  trackAPICall(endpoint: string, method: string, duration: number, status: number): void {
    this.capturePerformanceMetric({
      metric: 'api_response',
      value: duration,
      unit: 'ms',
      tags: {
        endpoint,
        method,
        status: status.toString()
      },
      context: {}
    });

    if (status >= 400) {
      this.captureMessage(`API call failed: ${method} ${endpoint}`, 'warning', {
        endpoint,
        method,
        status,
        duration
      });
    }
  }

  startTransaction(name: string): { finish: (status?: string) => void } {
    const startTime = Date.now();
    
    return {
      finish: (status: string = 'ok') => {
        const duration = Date.now() - startTime;
        this.capturePerformanceMetric({
          metric: 'scan_duration',
          value: duration,
          unit: 'ms',
          tags: {
            transaction: name,
            status
          },
          context: {}
        });
      }
    };
  }
}

export const monitoringService = new MonitoringService(); 