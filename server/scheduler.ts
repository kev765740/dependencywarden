import * as cron from 'node-cron';
import { db } from './db';
import { repositories } from '@shared/schema';
import { scanner } from './scanner';
import { jobQueue } from './jobQueue';

export class TaskScheduler {
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.initializeScheduler();
  }

  private initializeScheduler(): void {
    // Schedule daily scans at 2 AM UTC
    const dailyScanTask = cron.schedule('0 2 * * *', async () => {
      console.log('Starting scheduled daily scan of all repositories...');
      await this.scanAllRepositories();
    });

    // Schedule hourly scans for Pro users (if implemented)
    const hourlyScanTask = cron.schedule('0 * * * *', async () => {
      console.log('Starting scheduled hourly scan for Pro repositories...');
      await this.scanProRepositories();
    });

    // Stop the tasks initially - they will be started when server starts
    dailyScanTask.stop();
    hourlyScanTask.stop();

    this.scheduledTasks.set('dailyScan', dailyScanTask);
    this.scheduledTasks.set('hourlyScan', hourlyScanTask);
  }

  public startScheduler(): void {
    this.scheduledTasks.forEach((task, name) => {
      task.start();
      console.log(`Scheduler started: ${name}`);
    });
  }

  public stopScheduler(): void {
    this.scheduledTasks.forEach((task, name) => {
      task.stop();
      console.log(`Scheduler stopped: ${name}`);
    });
  }

  private async scanAllRepositories(): Promise<void> {
    try {
      const repos = await db.select().from(repositories);
      console.log(`Found ${repos.length} repositories to scan via job queue`);

      for (const repo of repos) {
        try {
          console.log(`Queuing scan job for repository: ${repo.name} (ID: ${repo.id})`);
          const jobId = jobQueue.addJob(repo.id, 'scheduled', 'normal');
          console.log(`Scan job ${jobId} queued for ${repo.name}`);
          
          // Small delay between job queuing to prevent overwhelming the system
          await this.delay(1000);
          
        } catch (error) {
          console.error(`Failed to queue scan for repository ${repo.name}:`, error);
        }
      }

      console.log('Daily scan jobs queued for all repositories');
    } catch (error) {
      console.error('Failed to execute scheduled scan:', error);
    }
  }

  private async scanProRepositories(): Promise<void> {
    try {
      // For now, scan all repositories - in future, filter by user subscription status
      const repos = await db.select().from(repositories);
      
      for (const repo of repos) {
        try {
          // Skip if repository was scanned recently (less than 1 hour ago)
          if (repo.lastScannedAt) {
            const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
            if (new Date(repo.lastScannedAt) > hourAgo) {
              continue;
            }
          }

          console.log(`Hourly scan for repository: ${repo.name}`);
          await scanner.scanRepository(repo.id);
          
          // Add delay between scans
          await this.delay(3000);
          
        } catch (error) {
          console.error(`Failed to scan repository ${repo.name} in hourly scan:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to execute hourly scan:', error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Manual trigger methods for testing
  public async triggerDailyScan(): Promise<void> {
    console.log('Manually triggering daily scan...');
    await this.scanAllRepositories();
  }

  public async triggerHourlyScan(): Promise<void> {
    console.log('Manually triggering hourly scan...');
    await this.scanProRepositories();
  }

  public getSchedulerStatus(): { [key: string]: boolean } {
    const status: { [key: string]: boolean } = {};
    this.scheduledTasks.forEach((task, name) => {
      status[name] = task.getStatus() === 'scheduled';
    });
    return status;
  }
}

export const taskScheduler = new TaskScheduler();