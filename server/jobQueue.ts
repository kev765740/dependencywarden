import { EventEmitter } from 'events';
import { scanner } from './scanner';
import { storage } from './storage';
import WebSocket from 'ws';

export interface ScanJob {
  id: string;
  repositoryId: number;
  type: 'manual' | 'scheduled' | 'webhook';
  priority: 'low' | 'normal' | 'high';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  result?: {
    licenseChanges: number;
    vulnerabilities: number;
    filesScanned: number;
  };
}

export class JobQueue extends EventEmitter {
  private jobs: Map<string, ScanJob> = new Map();
  private runningJobs: Set<string> = new Set();
  private maxConcurrentJobs: number = 3;
  private processingInterval?: NodeJS.Timeout;
  private isProcessing: boolean = false;
  private wsClients: Set<WebSocket> = new Set();

  constructor() {
    super();
    this.startProcessing();
  }

  addWebSocketClient(ws: WebSocket) {
    this.wsClients.add(ws);
    ws.on('close', () => {
      this.wsClients.delete(ws);
    });
  }

  private broadcastJobUpdate(job: ScanJob) {
    const message = JSON.stringify({
      type: 'job_update',
      job
    });
    
    this.wsClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  addJob(repositoryId: number, type: 'manual' | 'scheduled' | 'webhook' = 'manual', priority: 'low' | 'normal' | 'high' = 'normal'): string {
    const jobId = `scan_${repositoryId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const job: ScanJob = {
      id: jobId,
      repositoryId,
      type,
      priority,
      createdAt: new Date(),
      status: 'pending'
    };

    this.jobs.set(jobId, job);
    
    console.log(`[JobQueue] Added job ${jobId} for repository ${repositoryId} (type: ${type}, priority: ${priority})`);
    this.emit('jobAdded', job);
    
    // Try to process immediately if we have capacity
    this.processJobs();
    
    return jobId;
  }

  getJob(jobId: string): ScanJob | undefined {
    return this.jobs.get(jobId);
  }

  getJobsByRepository(repositoryId: number): ScanJob[] {
    return Array.from(this.jobs.values()).filter(job => job.repositoryId === repositoryId);
  }

  getActiveJobs(): ScanJob[] {
    return Array.from(this.jobs.values()).filter(job => 
      job.status === 'pending' || job.status === 'running'
    );
  }

  getRecentJobs(limit: number = 50): ScanJob[] {
    return Array.from(this.jobs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  private startProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    
    // Process jobs every 2 seconds
    this.processingInterval = setInterval(() => {
      this.processJobs();
    }, 2000);
    
    console.log('[JobQueue] Started job processing');
  }

  private async processJobs(): Promise<void> {
    if (this.isProcessing || this.runningJobs.size >= this.maxConcurrentJobs) {
      return;
    }

    this.isProcessing = true;

    try {
      // Get pending jobs sorted by priority and creation time
      const pendingJobs = Array.from(this.jobs.values())
        .filter(job => job.status === 'pending')
        .sort((a, b) => {
          // Priority order: high > normal > low
          const priorityOrder = { high: 3, normal: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          
          // Then by creation time (older first)
          return a.createdAt.getTime() - b.createdAt.getTime();
        });

      const availableSlots = this.maxConcurrentJobs - this.runningJobs.size;
      const jobsToProcess = pendingJobs.slice(0, availableSlots);

      for (const job of jobsToProcess) {
        this.executeJob(job);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async executeJob(job: ScanJob): Promise<void> {
    if (this.runningJobs.has(job.id)) {
      return;
    }

    this.runningJobs.add(job.id);
    job.status = 'running';
    job.startedAt = new Date();
    
    console.log(`[JobQueue] Started executing job ${job.id} for repository ${job.repositoryId}`);
    this.emit('jobStarted', job);
    this.broadcastJobUpdate(job);

    try {
      // Import here to avoid circular dependencies
      const { storage } = await import('./storage');
      const result = await storage.performRealScan(job.repositoryId);
      
      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;
      
      console.log(`[JobQueue] Completed job ${job.id} for repository ${job.repositoryId}:`, result);
      this.emit('jobCompleted', job);
      this.broadcastJobUpdate(job);
      
    } catch (error: any) {
      job.status = 'failed';
      job.completedAt = new Date();
      job.error = error.message;
      
      console.error(`[JobQueue] Failed job ${job.id} for repository ${job.repositoryId}:`, error.message);
      this.emit('jobFailed', job);
      this.broadcastJobUpdate(job);
    } finally {
      this.runningJobs.delete(job.id);
    }
  }

  // Clean up old completed jobs (keep last 100)
  cleanup(): void {
    const allJobs = Array.from(this.jobs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    const jobsToKeep = allJobs.slice(0, 100);
    const jobsToRemove = allJobs.slice(100);
    
    for (const job of jobsToRemove) {
      if (job.status !== 'running') {
        this.jobs.delete(job.id);
      }
    }
    
    if (jobsToRemove.length > 0) {
      console.log(`[JobQueue] Cleaned up ${jobsToRemove.length} old jobs`);
    }
  }

  getStats() {
    const jobs = Array.from(this.jobs.values());
    return {
      total: jobs.length,
      pending: jobs.filter(j => j.status === 'pending').length,
      running: jobs.filter(j => j.status === 'running').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
      maxConcurrent: this.maxConcurrentJobs,
      currentConcurrent: this.runningJobs.size
    };
  }

  stop(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = undefined;
    }
    console.log('[JobQueue] Stopped job processing');
  }
}

export const jobQueue = new JobQueue();

// Cleanup every hour
setInterval(() => {
  jobQueue.cleanup();
}, 60 * 60 * 1000);