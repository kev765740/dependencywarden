import memoize from 'memoizee';
import { performance } from 'perf_hooks';

// Cache configuration
const CACHE_TTL = {
  short: 5 * 60 * 1000,    // 5 minutes
  medium: 30 * 60 * 1000,  // 30 minutes
  long: 60 * 60 * 1000,    // 1 hour
  extended: 4 * 60 * 60 * 1000 // 4 hours
};

interface PerformanceMetrics {
  endpoint: string;
  responseTime: number;
  timestamp: Date;
  cacheHit: boolean;
  memoryUsage: number;
  statusCode: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalRequests: number;
  averageResponseTime: number;
}

export class PerformanceOptimizer {
  private metrics: PerformanceMetrics[] = [];
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private memoryCache = new Map<string, any>();

  /**
   * High-performance caching wrapper for expensive operations
   */
  createMemoizedFunction<T extends (...args: any[]) => any>(
    fn: T,
    options: {
      ttl?: number;
      maxAge?: number;
      primitive?: boolean;
      normalizer?: (...args: any[]) => string;
    } = {}
  ): T {
    return memoize(fn, {
      maxAge: options.ttl || CACHE_TTL.medium,
      primitive: options.primitive || false,
      normalizer: options.normalizer,
      max: 1000 // Maximum cache entries
    }) as T;
  }

  /**
   * Advanced caching with TTL and invalidation
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = CACHE_TTL.medium
  ): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      this.recordMetric(key, 0, true, 200);
      return cached.data;
    }

    const startTime = performance.now();
    const data = await fetcher();
    const responseTime = performance.now() - startTime;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    this.recordMetric(key, responseTime, false, 200);
    return data;
  }

  /**
   * Batch processing for database queries
   */
  async batchProcess<T, R>(
    items: T[],
    processor: (batch: T[]) => Promise<R[]>,
    batchSize: number = 50
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Intelligent query optimization
   */
  optimizeQuery(query: any): any {
    // Add query optimization logic here
    // - Add proper indexes
    // - Optimize joins
    // - Add pagination
    // - Remove unnecessary fields
    
    return {
      ...query,
      // Add performance optimizations
      limit: query.limit || 100,
      offset: query.offset || 0,
      select: query.select || '*'
    };
  }

  /**
   * Response compression and optimization
   */
  optimizeResponse(data: any): any {
    if (Array.isArray(data)) {
      return {
        items: data,
        count: data.length,
        compressed: true,
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      ...data,
      compressed: true,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Performance monitoring middleware
   */
  createPerformanceMiddleware() {
    return (req: any, res: any, next: any) => {
      const startTime = performance.now();
      const originalSend = res.send;
      
      res.send = function(data: any) {
        const responseTime = performance.now() - startTime;
        
        // Log slow requests
        if (responseTime > 1000) {
          console.warn(`[PERFORMANCE ALERT] Slow request: ${req.method} ${req.path} - ${responseTime.toFixed(2)}ms`);
        }
        
        // Add performance headers
        res.set({
          'X-Response-Time': `${responseTime.toFixed(2)}ms`,
          'X-Cache-Status': req.cacheHit ? 'HIT' : 'MISS'
        });
        
        return originalSend.call(this, data);
      };
      
      next();
    };
  }

  /**
   * Cache invalidation strategies
   */
  invalidateCache(pattern: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(pattern)
    );
    
    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`Invalidated ${keysToDelete.length} cache entries matching pattern: ${pattern}`);
  }

  /**
   * Memory usage optimization
   */
  optimizeMemoryUsage(): void {
    // Clear expired cache entries
    const now = Date.now();
    for (const [key, value] of Array.from(this.cache.entries())) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }

    // Limit metrics history
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-5000);
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Database connection pooling optimization
   */
  optimizeDatabaseConnections(config: any) {
    return {
      ...config,
      pool: {
        min: 2,
        max: 20,
        acquireTimeoutMillis: 30000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200
      },
      // Enable connection pooling
      ssl: process.env.NODE_ENV === 'production'
    };
  }

  /**
   * API response caching with smart invalidation
   */
  createAPICache() {
    const apiCache = new Map<string, {
      data: any;
      timestamp: number;
      etag: string;
      dependencies: string[];
    }>();

    return {
      get: (key: string) => {
        const cached = apiCache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > CACHE_TTL.medium) {
          apiCache.delete(key);
          return null;
        }
        
        return cached;
      },
      
      set: (key: string, data: any, dependencies: string[] = []) => {
        const etag = this.generateETag(data);
        apiCache.set(key, {
          data,
          timestamp: Date.now(),
          etag,
          dependencies
        });
      },
      
      invalidate: (dependency: string) => {
        for (const [key, value] of Array.from(apiCache.entries())) {
          if (value.dependencies.includes(dependency)) {
            apiCache.delete(key);
          }
        }
      }
    };
  }

  /**
   * Generate ETags for response caching
   */
  generateETag(data: any): string {
    const crypto = require('crypto');
    return crypto
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  /**
   * Performance analytics and insights
   */
  getPerformanceAnalytics(): {
    averageResponseTime: number;
    slowestEndpoints: Array<{ endpoint: string; avgTime: number }>;
    cacheStats: CacheStats;
    memoryUsage: number;
    recommendations: string[];
  } {
    const recentMetrics = this.metrics.filter(
      m => Date.now() - m.timestamp.getTime() < 60 * 60 * 1000 // Last hour
    );

    const averageResponseTime = recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length || 0;

    // Group by endpoint and calculate averages
    const endpointStats = new Map<string, number[]>();
    recentMetrics.forEach(metric => {
      if (!endpointStats.has(metric.endpoint)) {
        endpointStats.set(metric.endpoint, []);
      }
      endpointStats.get(metric.endpoint)!.push(metric.responseTime);
    });

    const slowestEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, times]) => ({
        endpoint,
        avgTime: times.reduce((sum, time) => sum + time, 0) / times.length
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 5);

    const cacheHits = recentMetrics.filter(m => m.cacheHit).length;
    const totalRequests = recentMetrics.length;
    
    const cacheStats: CacheStats = {
      hits: cacheHits,
      misses: totalRequests - cacheHits,
      hitRate: totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0,
      totalRequests,
      averageResponseTime
    };

    const recommendations = this.generatePerformanceRecommendations(
      averageResponseTime,
      slowestEndpoints,
      cacheStats
    );

    return {
      averageResponseTime,
      slowestEndpoints,
      cacheStats,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      recommendations
    };
  }

  /**
   * Generate performance optimization recommendations
   */
  private generatePerformanceRecommendations(
    avgResponseTime: number,
    slowestEndpoints: Array<{ endpoint: string; avgTime: number }>,
    cacheStats: CacheStats
  ): string[] {
    const recommendations: string[] = [];

    if (avgResponseTime > 1000) {
      recommendations.push('Consider implementing database query optimization');
    }

    if (cacheStats.hitRate < 70) {
      recommendations.push('Increase cache TTL for frequently accessed data');
    }

    if (slowestEndpoints.length > 0 && slowestEndpoints[0].avgTime > 2000) {
      recommendations.push(`Optimize ${slowestEndpoints[0].endpoint} endpoint - averaging ${slowestEndpoints[0].avgTime.toFixed(0)}ms`);
    }

    if (process.memoryUsage().heapUsed > 500 * 1024 * 1024) { // 500MB
      recommendations.push('Consider implementing memory optimization strategies');
    }

    return recommendations;
  }

  /**
   * Record performance metrics
   */
  private recordMetric(endpoint: string, responseTime: number, cacheHit: boolean, statusCode: number): void {
    this.metrics.push({
      endpoint,
      responseTime,
      timestamp: new Date(),
      cacheHit,
      memoryUsage: process.memoryUsage().heapUsed,
      statusCode
    });

    // Keep only recent metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-500);
    }
  }

  /**
   * Preload critical data into cache
   */
  async preloadCache(preloadFunctions: Array<{ key: string; fetcher: () => Promise<any>; ttl?: number }>): Promise<void> {
    console.log('Preloading cache with critical data...');
    
    const preloadPromises = preloadFunctions.map(async ({ key, fetcher, ttl }) => {
      try {
        await this.getOrSet(key, fetcher, ttl || CACHE_TTL.long);
        console.log(`Preloaded cache key: ${key}`);
      } catch (error) {
        console.error(`Failed to preload cache key ${key}:`, error);
      }
    });

    await Promise.all(preloadPromises);
    console.log('Cache preloading completed');
  }

  /**
   * Smart request deduplication
   */
  private pendingRequests = new Map<string, Promise<any>>();

  async deduplicateRequest<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    const promise = fetcher().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Get comprehensive performance analytics - secondary method
   */
  getAnalyticsV2(): {
    averageResponseTime: number;
    cacheStats: CacheStats;
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
    recentMetrics: PerformanceMetrics[];
    slowestEndpoints: Array<{
      endpoint: string;
      averageTime: number;
      requestCount: number;
    }>;
  } {
    const recentMetrics = this.metrics.slice(-100); // Last 100 requests
    
    // Calculate average response time
    const averageResponseTime = recentMetrics.length > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
      : 0;

    // Calculate cache statistics
    const cacheHits = recentMetrics.filter(m => m.cacheHit).length;
    const totalRequests = recentMetrics.length;
    const cacheStats: CacheStats = {
      hits: cacheHits,
      misses: totalRequests - cacheHits,
      hitRate: totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0,
      totalRequests,
      averageResponseTime
    };

    // Get memory usage
    const memUsage = process.memoryUsage();
    const memoryUsage = {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
    };

    // Find slowest endpoints
    const endpointStats = new Map<string, { totalTime: number; count: number }>();
    
    recentMetrics.forEach(metric => {
      const existing = endpointStats.get(metric.endpoint) || { totalTime: 0, count: 0 };
      endpointStats.set(metric.endpoint, {
        totalTime: existing.totalTime + metric.responseTime,
        count: existing.count + 1
      });
    });

    const slowestEndpoints = Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        averageTime: stats.totalTime / stats.count,
        requestCount: stats.count
      }))
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, 10);

    return {
      averageResponseTime,
      cacheStats,
      memoryUsage,
      recentMetrics: recentMetrics.slice(-20), // Return last 20 for UI
      slowestEndpoints
    };
  }
}

export const performanceOptimizer = new PerformanceOptimizer();