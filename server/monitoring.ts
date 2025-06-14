/**
 * Production Monitoring and Alerting System
 * Comprehensive monitoring for error tracking, uptime, and performance
 */

import { Request, Response, NextFunction } from 'express';
import { captureException } from './sentry';

interface ErrorLog {
  timestamp: Date;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

interface UptimeMetrics {
  startTime: Date;
  requests: number;
  errors: number;
  lastError?: Date;
  uptime: number;
}

class ProductionMonitoring {
  private errorLogs: ErrorLog[] = [];
  private uptimeMetrics: UptimeMetrics;
  private healthChecks: Map<string, () => Promise<boolean>> = new Map();

  constructor() {
    this.uptimeMetrics = {
      startTime: new Date(),
      requests: 0,
      errors: 0,
      uptime: 0
    };

    // Register default health checks
    this.registerHealthCheck('database', this.checkDatabase.bind(this));
    this.registerHealthCheck('disk_space', this.checkDiskSpace.bind(this));
    this.registerHealthCheck('memory', this.checkMemory.bind(this));
  }

  // Error logging and tracking
  logError(error: Error | string, metadata?: Record<string, any>, userId?: string) {
    const errorLog: ErrorLog = {
      timestamp: new Date(),
      level: 'error',
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      userId,
      requestId: this.generateRequestId(),
      metadata
    };

    this.errorLogs.push(errorLog);
    
    // Keep only last 1000 error logs to prevent memory issues
    if (this.errorLogs.length > 1000) {
      this.errorLogs = this.errorLogs.slice(-1000);
    }

    // Send to external monitoring services
    this.sendToSentry(error, metadata);
    this.checkErrorThreshold();

    console.error(`[PRODUCTION ERROR] ${errorLog.message}`, {
      stack: errorLog.stack,
      metadata: errorLog.metadata,
      userId: errorLog.userId,
      requestId: errorLog.requestId
    });
  }

  // Request tracking middleware
  trackRequest() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      const requestId = this.generateRequestId();
      
      // Add request ID to request object
      (req as any).requestId = requestId;
      
      this.uptimeMetrics.requests++;

      res.on('finish', () => {
        const duration = Date.now() - startTime;
        
        if (res.statusCode >= 400) {
          this.uptimeMetrics.errors++;
          this.uptimeMetrics.lastError = new Date();
        }

        // Log slow requests
        if (duration > 5000) { // 5 seconds
          this.logError(`Slow request detected: ${req.method} ${req.path} took ${duration}ms`, {
            method: req.method,
            path: req.path,
            duration,
            statusCode: res.statusCode,
            userAgent: req.get('User-Agent'),
            ip: req.ip
          });
        }
      });

      next();
    };
  }

  // Health check system
  registerHealthCheck(name: string, check: () => Promise<boolean>) {
    this.healthChecks.set(name, check);
  }

  async runHealthChecks(): Promise<{ [key: string]: boolean }> {
    const results: { [key: string]: boolean } = {};
    
    for (const [name, check] of this.healthChecks) {
      try {
        results[name] = await check();
      } catch (error) {
        results[name] = false;
        this.logError(`Health check failed: ${name}`, { error: error instanceof Error ? error.message : String(error) });
      }
    }

    return results;
  }

  // Built-in health checks
  private async checkDatabase(): Promise<boolean> {
    try {
      // Simple database connectivity check
      const { db } = await import('./db');
      await db.execute('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }

  private async checkDiskSpace(): Promise<boolean> {
    try {
      const fs = await import('fs');
      const stats = fs.statSync('.');
      // Check if we have at least 100MB free space (simplified check)
      return true; // In a real implementation, you'd check actual disk space
    } catch (error) {
      return false;
    }
  }

  private async checkMemory(): Promise<boolean> {
    const memUsage = process.memoryUsage();
    const maxHeapSize = memUsage.heapTotal * 0.9; // 90% threshold
    return memUsage.heapUsed < maxHeapSize;
  }

  // Uptime and metrics
  getUptimeMetrics(): UptimeMetrics {
    this.uptimeMetrics.uptime = Date.now() - this.uptimeMetrics.startTime.getTime();
    return { ...this.uptimeMetrics };
  }

  // Get recent error logs
  getRecentErrors(count: number = 50): ErrorLog[] {
    return this.errorLogs.slice(-count);
  }

  // Error threshold monitoring
  private checkErrorThreshold() {
    const recentErrors = this.errorLogs.filter(
      log => Date.now() - log.timestamp.getTime() < 15 * 60 * 1000 // Last 15 minutes
    );

    // Alert if more than 10 errors in 15 minutes
    if (recentErrors.length > 10) {
      this.sendAlert('HIGH_ERROR_RATE', `High error rate detected: ${recentErrors.length} errors in 15 minutes`);
    }
  }

  // Alert system
  private async sendAlert(type: string, message: string) {
    console.error(`[PRODUCTION ALERT] ${type}: ${message}`);
    
    // Here you would integrate with your alerting system
    // Examples: email, Slack, PagerDuty, etc.
    
    try {
      // Log to error tracking
      this.logError(`Production Alert: ${type}`, { alertMessage: message });
    } catch (error) {
      console.error('Failed to send alert:', error);
    }
  }

  // Backup and disaster recovery monitoring
  async checkBackupStatus(): Promise<{ lastBackup: Date | null; isHealthy: boolean }> {
    try {
      // In a real implementation, you'd check your backup system status
      return {
        lastBackup: new Date(), // Placeholder
        isHealthy: true
      };
    } catch (error) {
      return {
        lastBackup: null,
        isHealthy: false
      };
    }
  }

  // Performance monitoring
  trackPerformanceMetric(name: string, value: number, unit: string = 'ms') {
    console.info(`[PERFORMANCE] ${name}: ${value}${unit}`);
    
    // Store performance metrics for analysis
    const metric = {
      name,
      value,
      unit,
      timestamp: new Date()
    };

    // Here you would send to your metrics collection system
    // Examples: DataDog, New Relic, CloudWatch, etc.
  }

  // Database connection pool monitoring
  monitorDatabaseConnections() {
    setInterval(async () => {
      try {
        const startTime = Date.now();
        await this.checkDatabase();
        const responseTime = Date.now() - startTime;
        
        this.trackPerformanceMetric('database_response_time', responseTime);
        
        if (responseTime > 1000) { // 1 second threshold
          this.logError(`Slow database response: ${responseTime}ms`);
        }
      } catch (error) {
        this.logError('Database connection monitoring failed', { error: String(error) });
      }
    }, 30000); // Check every 30 seconds
  }

  // External service monitoring
  async monitorExternalServices() {
    const services = [
      { name: 'GitHub API', url: 'https://api.github.com/rate_limit' },
      { name: 'OpenAI API', url: 'https://api.openai.com/v1/models', headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` } }
    ];

    for (const service of services) {
      try {
        const startTime = Date.now();
        const response = await fetch(service.url, {
          headers: service.headers,
          timeout: 10000 // 10 second timeout
        } as any);
        
        const responseTime = Date.now() - startTime;
        this.trackPerformanceMetric(`${service.name.toLowerCase().replace(' ', '_')}_response_time`, responseTime);
        
        if (!response.ok) {
          this.logError(`External service error: ${service.name}`, {
            status: response.status,
            statusText: response.statusText
          });
        }
      } catch (error) {
        this.logError(`External service unreachable: ${service.name}`, { error: String(error) });
      }
    }
  }

  // Utility methods
  private generateRequestId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private sendToSentry(error: Error | string, metadata?: Record<string, any>) {
    try {
      if (typeof error === 'string') {
        captureException(new Error(error), { extra: metadata });
      } else {
        captureException(error, { extra: metadata });
      }
    } catch (sentryError) {
      console.error('Failed to send error to Sentry:', sentryError);
    }
  }

  // Graceful shutdown monitoring
  setupGracefulShutdown() {
    const shutdown = (signal: string) => {
      console.log(`[SHUTDOWN] Received ${signal}, starting graceful shutdown...`);
      
      // Log shutdown event
      this.logError(`Application shutdown initiated by ${signal}`, { signal, uptime: this.getUptimeMetrics().uptime });
      
      // Give time for cleanup
      setTimeout(() => {
        console.log('[SHUTDOWN] Graceful shutdown completed');
        process.exit(0);
      }, 10000); // 10 second grace period
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGQUIT', () => shutdown('SIGQUIT'));
  }
}

export const productionMonitoring = new ProductionMonitoring();

// Initialize monitoring systems
if (process.env.NODE_ENV === 'production') {
  productionMonitoring.monitorDatabaseConnections();
  productionMonitoring.setupGracefulShutdown();
  
  // Monitor external services every 5 minutes
  setInterval(() => {
    productionMonitoring.monitorExternalServices();
  }, 5 * 60 * 1000);
}