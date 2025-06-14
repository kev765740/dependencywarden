import { Request, Response } from 'express';
import { db } from './db';
import { users } from '@shared/schema';
import { sql } from 'drizzle-orm';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime: number;
      error?: string;
    };
    memory: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      usage: number;
      limit: number;
      percentage: number;
    };
    disk: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      usage?: number;
      available?: number;
      percentage?: number;
    };
    external_services: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      services: {
        npm_registry: boolean;
        osv_api: boolean;
      };
    };
  };
}

export class HealthCheckService {
  private startTime = Date.now();

  async performHealthCheck(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkMemory(),
      this.checkDisk(),
      this.checkExternalServices()
    ]);

    const [databaseResult, memoryResult, diskResult, externalResult] = checks;

    const database = databaseResult.status === 'fulfilled' ? databaseResult.value : {
      status: 'unhealthy' as const,
      responseTime: -1,
      error: databaseResult.reason?.message || 'Unknown database error'
    };

    const memory = memoryResult.status === 'fulfilled' ? memoryResult.value : {
      status: 'unhealthy' as const,
      usage: -1,
      limit: -1,
      percentage: -1
    };

    const disk = diskResult.status === 'fulfilled' ? diskResult.value : {
      status: 'unhealthy' as const,
      usage: -1,
      available: -1,
      percentage: -1
    };

    const external_services = externalResult.status === 'fulfilled' ? externalResult.value : {
      status: 'unhealthy' as const,
      services: {
        npm_registry: false,
        osv_api: false
      }
    };

    // Determine overall status
    const allChecks = [database.status, memory.status, disk.status, external_services.status];
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';

    if (allChecks.every(status => status === 'healthy')) {
      overallStatus = 'healthy';
    } else if (allChecks.some(status => status === 'unhealthy')) {
      overallStatus = 'unhealthy';
    } else {
      overallStatus = 'degraded';
    }

    return {
      status: overallStatus,
      timestamp,
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime,
      checks: {
        database,
        memory,
        disk,
        external_services
      }
    };
  }

  private async checkDatabase() {
    const startTime = Date.now();
    try {
      // Simple query to check database connectivity
      await db.select({ count: sql`count(*)` }).from(users);
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy' as const,
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy' as const,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
    }
  }

  private async checkMemory() {
    const memUsage = process.memoryUsage();
    const totalMem = memUsage.heapTotal;
    const usedMem = memUsage.heapUsed;
    const percentage = (usedMem / totalMem) * 100;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (percentage < 70) {
      status = 'healthy';
    } else if (percentage < 90) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      usage: usedMem,
      limit: totalMem,
      percentage: Math.round(percentage * 100) / 100
    };
  }

  private async checkDisk() {
    try {
      // For containerized environments, we'll check basic filesystem availability
      const fs = await import('fs/promises');
      const stats = await fs.stat('.');
      
      return {
        status: 'healthy' as const,
        usage: 0, // In a real implementation, you'd check actual disk usage
        available: 1000000, // Placeholder
        percentage: 0
      };
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        usage: -1,
        available: -1,
        percentage: -1
      };
    }
  }

  private async checkExternalServices() {
    const checks = await Promise.allSettled([
      this.checkNpmRegistry(),
      this.checkOSVAPI()
    ]);

    const [npmResult, osvResult] = checks;
    
    const npmHealthy = npmResult.status === 'fulfilled' && npmResult.value;
    const osvHealthy = osvResult.status === 'fulfilled' && osvResult.value;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (npmHealthy && osvHealthy) {
      status = 'healthy';
    } else if (npmHealthy || osvHealthy) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      services: {
        npm_registry: npmHealthy,
        osv_api: osvHealthy
      }
    };
  }

  private async checkNpmRegistry(): Promise<boolean> {
    try {
      const response = await fetch('https://registry.npmjs.org/express', {
        method: 'HEAD',
        timeout: 5000
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async checkOSVAPI(): Promise<boolean> {
    try {
      const response = await fetch('https://api.osv.dev/v1/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package: { name: 'express', ecosystem: 'npm' },
          version: '4.0.0'
        }),
        timeout: 5000
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const healthCheckService = new HealthCheckService();

export async function healthCheckHandler(req: Request, res: Response) {
  try {
    const healthCheck = await healthCheckService.performHealthCheck();
    
    // Set appropriate HTTP status code based on health
    let statusCode = 200;
    if (healthCheck.status === 'degraded') {
      statusCode = 207; // Multi-Status
    } else if (healthCheck.status === 'unhealthy') {
      statusCode = 503; // Service Unavailable
    }

    res.status(statusCode).json(healthCheck);
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Health check failed'
    });
  }
}

export async function readinessHandler(req: Request, res: Response) {
  try {
    const checks = await Promise.allSettled([
      healthCheckService['checkDatabase'](),
      healthCheckService['checkExternalServices']()
    ]);

    const [dbResult, externalResult] = checks;
    
    const dbHealthy = dbResult.status === 'fulfilled' && dbResult.value.status === 'healthy';
    const externalHealthy = externalResult.status === 'fulfilled' && 
      (externalResult.value.status === 'healthy' || externalResult.value.status === 'degraded');

    if (dbHealthy && externalHealthy) {
      res.status(200).json({ status: 'ready' });
    } else {
      res.status(503).json({ status: 'not ready' });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: error instanceof Error ? error.message : 'Readiness check failed'
    });
  }
}

export async function livenessHandler(req: Request, res: Response) {
  // Simple liveness check - if we can respond, we're alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
}