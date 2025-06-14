import type { Request, Response, NextFunction } from 'express';
import { performance } from 'perf_hooks';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
}

interface LoadTestMetrics {
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private loadTestResults: Map<string, LoadTestMetrics> = new Map();
  private alertThresholds = {
    responseTime: 2000, // 2 seconds
    errorRate: 5, // 5%
    memoryUsage: 512 * 1024 * 1024, // 512MB
    cpuUsage: 80 // 80%
  };

  // Middleware to track performance metrics
  performanceMiddleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const startTime = performance.now();
      const startCpuUsage = process.cpuUsage();
      const startMemory = process.memoryUsage();

      // Use response finish event instead of overriding res.end
      res.on('finish', () => {
        try {
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          const endCpuUsage = process.cpuUsage(startCpuUsage);
          const endMemory = process.memoryUsage();

          const metrics: PerformanceMetrics = {
            endpoint: req.path,
            method: req.method,
            responseTime,
            statusCode: res.statusCode,
            timestamp: new Date(),
            memoryUsage: endMemory,
            cpuUsage: endCpuUsage
          };

          this.recordMetrics(metrics);
        } catch (error) {
          console.warn('Performance metrics recording failed:', error);
        }
      });

      next();
    };
  }

  recordMetrics(metrics: PerformanceMetrics) {
    this.metrics.push(metrics);
    
    // Keep only last 10000 metrics to prevent memory bloat
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-5000);
    }

    // Check for performance alerts
    this.checkPerformanceAlerts(metrics);
  }

  private checkPerformanceAlerts(metrics: PerformanceMetrics) {
    const alerts: string[] = [];

    // Response time alert
    if (metrics.responseTime > this.alertThresholds.responseTime) {
      alerts.push(`High response time: ${metrics.responseTime.toFixed(2)}ms for ${metrics.endpoint}`);
    }

    // Memory usage alert
    if (metrics.memoryUsage.heapUsed > this.alertThresholds.memoryUsage) {
      alerts.push(`High memory usage: ${(metrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    }

    // CPU usage alert (simplified check)
    const cpuPercent = (metrics.cpuUsage.user + metrics.cpuUsage.system) / 1000000; // Convert to seconds
    if (cpuPercent > this.alertThresholds.cpuUsage) {
      alerts.push(`High CPU usage detected`);
    }

    if (alerts.length > 0) {
      console.warn('[PERFORMANCE ALERT]', alerts.join(', '));
      // In production, send to monitoring service
      this.sendAlertToMonitoring(alerts);
    }
  }

  private async sendAlertToMonitoring(alerts: string[]) {
    // Integration with monitoring services
    try {
      // Example: Send to Sentry
      if (process.env.SENTRY_DSN) {
        const Sentry = await import('@sentry/node');
        Sentry.captureMessage(`Performance Alert: ${alerts.join(', ')}`, 'warning');
      }

      // Example: Send to PostHog
      if (process.env.POSTHOG_API_KEY) {
        const { PostHog } = await import('posthog-node');
        const posthog = new PostHog(process.env.POSTHOG_API_KEY);
        posthog.capture({
          distinctId: 'system',
          event: 'performance_alert',
          properties: { alerts }
        });
      }
    } catch (error) {
      console.error('Failed to send performance alert:', error);
    }
  }

  // Get performance statistics
  getPerformanceStats(timeWindow: number = 3600000) { // Default 1 hour
    const cutoff = new Date(Date.now() - timeWindow);
    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        throughput: 0
      };
    }

    const totalRequests = recentMetrics.length;
    const successfulRequests = recentMetrics.filter(m => m.statusCode < 400).length;
    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const errorRate = ((totalRequests - successfulRequests) / totalRequests) * 100;
    const throughput = totalRequests / (timeWindow / 1000); // requests per second

    return {
      totalRequests,
      successfulRequests,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      errorRate: Math.round(errorRate * 100) / 100,
      throughput: Math.round(throughput * 100) / 100,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
  }

  // Endpoint-specific performance analysis
  getEndpointStats(endpoint: string, timeWindow: number = 3600000) {
    const cutoff = new Date(Date.now() - timeWindow);
    const endpointMetrics = this.metrics.filter(m => 
      m.endpoint === endpoint && m.timestamp > cutoff
    );

    if (endpointMetrics.length === 0) {
      return null;
    }

    const responseTimes = endpointMetrics.map(m => m.responseTime);
    const successfulRequests = endpointMetrics.filter(m => m.statusCode < 400).length;

    return {
      totalRequests: endpointMetrics.length,
      successfulRequests,
      errorRate: ((endpointMetrics.length - successfulRequests) / endpointMetrics.length) * 100,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      p95ResponseTime: this.calculatePercentile(responseTimes, 0.95),
      p99ResponseTime: this.calculatePercentile(responseTimes, 0.99)
    };
  }

  private calculatePercentile(arr: number[], percentile: number): number {
    const sorted = arr.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[index] || 0;
  }

  // Load testing simulation
  async runLoadTest(endpoint: string, concurrency: number, duration: number) {
    console.log(`Starting load test for ${endpoint} with ${concurrency} concurrent requests for ${duration}ms`);
    
    const startTime = Date.now();
    const requests: Promise<{ responseTime: number; success: boolean }>[] = [];
    let requestCount = 0;

    const makeRequest = async (): Promise<{ responseTime: number; success: boolean }> => {
      const start = performance.now();
      try {
        const response = await fetch(`http://localhost:5000${endpoint}`, {
          method: 'GET',
          headers: { 'User-Agent': 'LoadTest/1.0' }
        });
        const end = performance.now();
        return {
          responseTime: end - start,
          success: response.ok
        };
      } catch (error) {
        const end = performance.now();
        return {
          responseTime: end - start,
          success: false
        };
      }
    };

    // Run load test
    while (Date.now() - startTime < duration) {
      // Maintain concurrency level
      while (requests.length < concurrency) {
        requests.push(makeRequest());
        requestCount++;
      }

      // Wait for some requests to complete
      await Promise.race(requests);
      
      // Remove completed requests
      const completedIndices: number[] = [];
      for (let i = 0; i < requests.length; i++) {
        const request = requests[i];
        if (await Promise.race([request, Promise.resolve(null)]) !== null) {
          completedIndices.push(i);
        }
      }
      
      // Remove completed requests in reverse order to maintain indices
      completedIndices.reverse().forEach(index => {
        requests.splice(index, 1);
      });
    }

    // Wait for remaining requests
    const results = await Promise.all(requests);
    const actualDuration = Date.now() - startTime;
    
    const successfulRequests = results.filter(r => r.success).length;
    const responseTimes = results.map(r => r.responseTime);
    
    const metrics: LoadTestMetrics = {
      endpoint,
      totalRequests: requestCount,
      successfulRequests,
      failedRequests: requestCount - successfulRequests,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      requestsPerSecond: (requestCount / actualDuration) * 1000,
      errorRate: ((requestCount - successfulRequests) / requestCount) * 100
    };

    this.loadTestResults.set(endpoint, metrics);
    console.log('Load test completed:', metrics);
    
    return metrics;
  }

  // Health check with performance metrics
  getHealthStatus() {
    const stats = this.getPerformanceStats();
    const memoryUsage = process.memoryUsage();
    const memoryUtilization = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    return {
      status: stats.errorRate < 5 && stats.averageResponseTime < 2000 ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      memory: {
        used: memoryUsage.heapUsed,
        total: memoryUsage.heapTotal,
        utilization: Math.round(memoryUtilization * 100) / 100
      },
      performance: {
        averageResponseTime: stats.averageResponseTime,
        errorRate: stats.errorRate,
        throughput: stats.throughput
      },
      timestamp: new Date().toISOString()
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Express middleware export
export const performanceMiddleware = performanceMonitor.performanceMiddleware();

// Graceful shutdown handler
export function setupGracefulShutdown(server: any) {
  const shutdown = (signal: string) => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    
    server.close((err: Error) => {
      if (err) {
        console.error('Error during server shutdown:', err);
        process.exit(1);
      }
      
      console.log('Server shut down gracefully');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.log('Forcing shutdown...');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}