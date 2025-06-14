/**
 * Memory Optimization and Monitoring Module
 * Implements memory management, garbage collection optimization, and leak detection
 */

export class MemoryOptimizer {
  private memoryThreshold = (parseInt(process.env.MEMORY_THRESHOLD_MB || '512')) * 1024 * 1024;
  private gcInterval: NodeJS.Timeout | null = null;
  private memoryStats: Array<{ timestamp: number; usage: NodeJS.MemoryUsage }> = [];
  private maxStatsHistory = 100;
  private scanningProcesses = new Map<string, { start: number; repoId: number }>();
  private memoryLeakDetection = true;

  constructor() {
    this.startMemoryMonitoring();
    this.setupScanningMemoryManagement();
  }

  private setupScanningMemoryManagement() {
    // Monitor scanning processes for memory leaks
    setInterval(() => {
      this.checkScanningProcesses();
    }, 60000); // Check every minute
  }

  // Track scanning process start
  startScanningProcess(scanId: string, repoId: number) {
    this.scanningProcesses.set(scanId, {
      start: Date.now(),
      repoId
    });
    
    // Proactive memory cleanup before large operations
    if (this.scanningProcesses.size > 5) {
      console.warn('[MEMORY] Multiple scanning processes detected, performing cleanup');
      this.performGarbageCollection();
    }
  }

  // Track scanning process completion
  completeScanningProcess(scanId: string) {
    const process = this.scanningProcesses.get(scanId);
    if (process) {
      const duration = Date.now() - process.start;
      console.log(`[MEMORY] Scan ${scanId} completed in ${duration}ms`);
      this.scanningProcesses.delete(scanId);
      
      // Cleanup after long-running scans
      if (duration > 120000) { // 2 minutes
        setTimeout(() => this.performGarbageCollection(), 5000);
      }
    }
  }

  private checkScanningProcesses() {
    const now = Date.now();
    const staleProcesses = Array.from(this.scanningProcesses.entries())
      .filter(([_, process]) => now - process.start > 300000); // 5 minutes
    
    if (staleProcesses.length > 0) {
      console.warn(`[MEMORY] Found ${staleProcesses.length} stale scanning processes`);
      staleProcesses.forEach(([scanId]) => {
        this.scanningProcesses.delete(scanId);
      });
      this.performAggressiveCleanup();
    }
  }

  startMemoryMonitoring() {
    const interval = parseInt(process.env.GC_INTERVAL_MS || '30000');
    // Monitor memory based on environment configuration
    this.gcInterval = setInterval(() => {
      this.collectMemoryStats();
      this.checkMemoryUsage();
      this.optimizeForProduction();
    }, interval);
  }

  private optimizeForProduction() {
    if (process.env.NODE_ENV !== 'production') return;
    
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    
    // More aggressive cleanup in production
    if (heapUsedMB > 400) { // 400MB threshold for production
      console.log(`[MEMORY PROD] High memory usage: ${heapUsedMB.toFixed(2)}MB, performing cleanup`);
      this.performAggressiveCleanup();
    }
    
    // Clear scanning processes older than 10 minutes in production
    const cutoffTime = Date.now() - 600000;
    for (const [scanId, process] of Array.from(this.scanningProcesses.entries())) {
      if (process.start < cutoffTime) {
        console.warn(`[MEMORY PROD] Removing stuck scanning process: ${scanId}`);
        this.scanningProcesses.delete(scanId);
      }
    }
  }

  stopMemoryMonitoring() {
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }
  }

  private collectMemoryStats() {
    const usage = process.memoryUsage();
    this.memoryStats.push({
      timestamp: Date.now(),
      usage
    });

    // Keep only recent stats
    if (this.memoryStats.length > this.maxStatsHistory) {
      this.memoryStats = this.memoryStats.slice(-this.maxStatsHistory);
    }
  }

  private checkMemoryUsage() {
    const usage = process.memoryUsage();
    
    if (usage.heapUsed > this.memoryThreshold) {
      console.warn(`[MEMORY WARNING] High memory usage: ${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      this.performGarbageCollection();
    }

    // Check for memory leaks (continuously increasing memory)
    if (this.memoryStats.length >= 10) {
      const recent = this.memoryStats.slice(-10);
      const trend = this.calculateMemoryTrend(recent);
      
      if (trend > 0.1) { // More than 10% increase over recent samples
        console.warn('[MEMORY LEAK DETECTION] Potential memory leak detected');
        this.performAggressiveCleanup();
      }
    }
  }

  private calculateMemoryTrend(stats: Array<{ timestamp: number; usage: NodeJS.MemoryUsage }>): number {
    if (stats.length < 2) return 0;
    
    const first = stats[0].usage.heapUsed;
    const last = stats[stats.length - 1].usage.heapUsed;
    
    return (last - first) / first;
  }

  private performGarbageCollection() {
    if (global.gc) {
      console.log('[MEMORY OPTIMIZATION] Performing garbage collection');
      global.gc();
    } else {
      console.warn('[MEMORY OPTIMIZATION] Garbage collection not available. Start with --expose-gc flag.');
    }
  }

  private performAggressiveCleanup() {
    console.log('[MEMORY OPTIMIZATION] Performing aggressive cleanup');
    
    // Force garbage collection multiple times
    if (global.gc) {
      global.gc();
      setTimeout(() => global.gc?.(), 100);
      setTimeout(() => global.gc?.(), 500);
    }
    
    // Clear internal caches
    this.clearInternalCaches();
  }

  private clearInternalCaches() {
    // Clear performance optimizer cache
    try {
      const { performanceOptimizer } = require('./performanceOptimization');
      performanceOptimizer.clear();
      console.log('[MEMORY OPTIMIZATION] Cleared performance cache');
    } catch (error) {
      // Ignore if not available
    }
  }

  // Manual memory cleanup for specific operations
  async optimizeForOperation<T>(operation: () => Promise<T>): Promise<T> {
    // Pre-operation cleanup
    this.performGarbageCollection();
    
    try {
      const result = await operation();
      return result;
    } finally {
      // Post-operation cleanup
      setTimeout(() => {
        this.performGarbageCollection();
      }, 1000);
    }
  }

  // Get memory statistics
  getMemoryStats() {
    const current = process.memoryUsage();
    const trend = this.memoryStats.length >= 2 ? 
      this.calculateMemoryTrend(this.memoryStats.slice(-5)) : 0;

    return {
      current: {
        heapUsed: Math.round(current.heapUsed / 1024 / 1024 * 100) / 100, // MB
        heapTotal: Math.round(current.heapTotal / 1024 / 1024 * 100) / 100, // MB
        external: Math.round(current.external / 1024 / 1024 * 100) / 100, // MB
        rss: Math.round(current.rss / 1024 / 1024 * 100) / 100 // MB
      },
      threshold: Math.round(this.memoryThreshold / 1024 / 1024 * 100) / 100, // MB
      trend: Math.round(trend * 100 * 100) / 100, // Percentage
      isHigh: current.heapUsed > this.memoryThreshold,
      history: this.memoryStats.slice(-10).map(stat => ({
        timestamp: stat.timestamp,
        heapUsed: Math.round(stat.usage.heapUsed / 1024 / 1024 * 100) / 100
      }))
    };
  }

  // Set custom memory threshold
  setMemoryThreshold(thresholdMB: number) {
    this.memoryThreshold = thresholdMB * 1024 * 1024;
    console.log(`[MEMORY OPTIMIZATION] Memory threshold set to ${thresholdMB}MB`);
  }

  // Emergency memory cleanup
  emergencyCleanup() {
    console.warn('[MEMORY OPTIMIZATION] Emergency cleanup initiated');
    
    // Multiple GC passes
    for (let i = 0; i < 5; i++) {
      if (global.gc) {
        global.gc();
      }
    }
    
    // Clear all caches
    this.clearInternalCaches();
    
    // Reset memory statistics
    this.memoryStats = [];
    
    console.log('[MEMORY OPTIMIZATION] Emergency cleanup completed');
  }
}

export const memoryOptimizer = new MemoryOptimizer();

// Process event handlers for memory monitoring
process.on('warning', (warning) => {
  if (warning.name === 'MaxListenersExceededWarning') {
    console.warn('[MEMORY WARNING] Memory leak detected - too many event listeners');
    memoryOptimizer.emergencyCleanup();
  }
});

process.on('uncaughtException', (error) => {
  if (error.message.includes('out of memory')) {
    console.error('[MEMORY CRITICAL] Out of memory error detected');
    memoryOptimizer.emergencyCleanup();
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  memoryOptimizer.stopMemoryMonitoring();
});

process.on('SIGINT', () => {
  memoryOptimizer.stopMemoryMonitoring();
});