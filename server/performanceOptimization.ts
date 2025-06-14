/**
 * Performance Optimization Module
 * Implements caching, query optimization, and background job queue management
 */

import { storage } from "./storage";

class PerformanceOptimizer {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly MAX_CACHE_SIZE = 1000; // Limit cache size to prevent memory issues
  private readonly CACHE_TTL = {
    dashboard: 5 * 1000, // 5 seconds for immediate updates
    repositories: 5 * 1000, // 5 seconds for immediate updates
    notifications: 5 * 1000, // 5 seconds for immediate updates
    stats: 5 * 1000 // 5 seconds for immediate updates
  };

  // Cache management with memory optimization
  set(key: string, data: any, ttl: number = this.CACHE_TTL.dashboard) {
    // Check cache size and perform cleanup if needed
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.performCacheCleanup();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private performCacheCleanup() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Remove expired entries first
    for (const [key, value] of entries) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
    
    // If still too large, remove oldest entries
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const sortedEntries = entries
        .filter(([key]) => this.cache.has(key)) // Only entries that weren't deleted
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = sortedEntries.slice(0, Math.floor(this.MAX_CACHE_SIZE * 0.2)); // Remove 20%
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear(pattern?: string) {
    if (pattern) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => key.includes(pattern));
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
  }

  clearCache() {
    this.cache.clear();
  }

  // Invalidate specific cache patterns
  invalidateCache(patterns: string[]) {
    patterns.forEach(pattern => {
      this.clear(pattern);
    });
  }

  // Clear all data-related caches
  invalidateDataCaches() {
    // Clear all user-specific and global cache keys
    Object.keys(this.cache).forEach(key => {
      if (key.startsWith('dashboard_stats_') || 
          key.startsWith('repositories_') ||
          key.startsWith('notifications_') ||
          key.includes('job_stats') ||
          key.includes('sboms') ||
          key.includes('alerts') ||
          key.includes('dependencies') ||
          key.includes('stats')) {
        this.delete(key);
      }
    });
    console.log('All data caches invalidated');
  }

  // Optimized data fetching methods
  async getOptimizedDashboardStats(userId?: string): Promise<any> {
    const cacheKey = `dashboard_stats_${userId || 'global'}`;
    let stats = this.get(cacheKey);

    if (!stats) {
      stats = await storage.getDashboardStats(userId);
      this.set(cacheKey, stats, this.CACHE_TTL.dashboard);
    }

    return stats;
  }

  async getOptimizedRepositories(userId?: string): Promise<any[]> {
    const cacheKey = `repositories_${userId || 'global'}`;
    let repositories = this.get(cacheKey);

    if (!repositories) {
      repositories = await storage.getRepositories();
      this.set(cacheKey, repositories, this.CACHE_TTL.repositories);
    }

    return repositories;
  }

  async getOptimizedNotifications(userId?: string): Promise<any[]> {
    const cacheKey = `notifications_${userId || 'global'}`;
    let notifications = this.get(cacheKey);

    if (!notifications) {
      notifications = await storage.getNotifications(userId);
      this.set(cacheKey, notifications, this.CACHE_TTL.notifications);
    }

    return notifications;
  }

  async getOptimizedJobStats(): Promise<any> {
    const cacheKey = 'job_stats';
    let stats = this.get(cacheKey);

    if (!stats) {
      stats = await storage.getJobStats();
      this.set(cacheKey, stats, this.CACHE_TTL.stats);
    }

    return stats;
  }

  // Cache invalidation on data changes
  invalidateCacheOnRepositoryChange(repositoryId?: number) {
    this.clear('repositories');
    this.clear('dashboard_stats');
    if (repositoryId) {
      this.clear(`repo_${repositoryId}`);
    }
  }

  invalidateCacheOnSecurityAlert() {
    this.clear('notifications');
    this.clear('dashboard_stats');
    this.clear('job_stats');
  }

  invalidateCacheOnScanComplete(repositoryId: number) {
    this.clear('job_stats');
    this.clear('dashboard_stats');
    this.clear(`repo_${repositoryId}`);
  }

  // Performance metrics
  getCacheStats() {
    const total = this.cache.size;
    let hit = 0;
    let expired = 0;

    const entries = Array.from(this.cache.entries());
    for (const [key, value] of entries) {
      const age = Date.now() - value.timestamp;
      if (age > value.ttl) {
        expired++;
      } else {
        hit++;
      }
    }

    return {
      total,
      active: hit,
      expired,
      hitRate: total > 0 ? (hit / total * 100).toFixed(1) + '%' : '0%'
    };
  }

  // Database query optimization
  async batchRepositoryOperations(operations: Array<() => Promise<any>>): Promise<any[]> {
    // Execute database operations in parallel for better performance
    try {
      const results = await Promise.allSettled(operations.map(op => op()));
      return results.map(result => 
        result.status === 'fulfilled' ? result.value : null
      );
    } catch (error) {
      console.error('Batch operation failed:', error);
      throw error;
    }
  }

  // Background job queue optimization
  private jobQueue: Array<{ id: string; task: () => Promise<any>; priority: number }> = [];
  private processingJobs = false;

  queueJob(id: string, task: () => Promise<any>, priority: number = 1) {
    this.jobQueue.push({ id, task, priority });
    this.jobQueue.sort((a, b) => b.priority - a.priority); // Higher priority first
    
    if (!this.processingJobs) {
      this.processJobQueue();
    }
  }

  private async processJobQueue() {
    if (this.processingJobs || this.jobQueue.length === 0) return;

    this.processingJobs = true;
    
    while (this.jobQueue.length > 0) {
      const job = this.jobQueue.shift();
      if (job) {
        try {
          await job.task();
          console.log(`Completed background job: ${job.id}`);
        } catch (error) {
          console.error(`Background job failed: ${job.id}`, error);
        }
      }
    }

    this.processingJobs = false;
  }

  getQueueStats() {
    return {
      pending: this.jobQueue.length,
      processing: this.processingJobs,
      highPriority: this.jobQueue.filter(job => job.priority > 5).length
    };
  }
}

export const performanceOptimizer = new PerformanceOptimizer();