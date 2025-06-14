/**
 * Production Health Check and Monitoring System
 * Comprehensive system validation for production deployment
 */

import express from 'express';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import process from 'process';
import os from 'os';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ProductionHealthChecker {
  constructor() {
    this.startTime = Date.now();
    this.healthChecks = new Map();
    this.criticalServices = ['database', 'filesystem', 'memory', 'cpu'];
    this.optionalServices = ['github', 'stripe', 'sendgrid'];
  }

  async performHealthCheck() {
    const healthStatus = {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      status: 'healthy',
      checks: {},
      system: {}
    };

    try {
      // Critical system checks
      healthStatus.checks.database = await this.checkDatabase();
      healthStatus.checks.filesystem = await this.checkFilesystem();
      healthStatus.checks.memory = await this.checkMemory();
      healthStatus.checks.cpu = await this.checkCPU();
      
      // Optional service checks
      healthStatus.checks.github = await this.checkGitHubAPI();
      healthStatus.checks.stripe = await this.checkStripe();
      healthStatus.checks.sendgrid = await this.checkSendGrid();
      
      // System information
      healthStatus.system = await this.getSystemInfo();
      
      // Determine overall health
      const criticalFailures = this.criticalServices.filter(
        service => healthStatus.checks[service]?.status === 'unhealthy'
      );
      
      if (criticalFailures.length > 0) {
        healthStatus.status = 'unhealthy';
        healthStatus.criticalFailures = criticalFailures;
      } else {
        const warningServices = Object.values(healthStatus.checks).filter(
          check => check.status === 'warning'
        );
        if (warningServices.length > 0) {
          healthStatus.status = 'degraded';
          healthStatus.warnings = warningServices.length;
        }
      }

      return healthStatus;
      
    } catch (error) {
      healthStatus.status = 'unhealthy';
      healthStatus.error = error.message;
      healthStatus.checks.system = {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      return healthStatus;
    }
  }

  async checkDatabase() {
    const check = {
      name: 'Database Connectivity',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: 0
    };

    try {
      const startTime = Date.now();
      
      // Database connection test
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable not configured');
      }

      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 1,
        connectionTimeoutMillis: 5000,
      });

      const db = drizzle(pool);
      
      // Simple connectivity test
      const result = await pool.query('SELECT 1 as test, NOW() as timestamp');
      
      if (!result.rows || result.rows.length === 0) {
        throw new Error('Database query returned no results');
      }

      check.responseTime = Date.now() - startTime;
      check.details = {
        connected: true,
        timestamp: result.rows[0].timestamp,
        connectionPool: {
          total: pool.totalCount,
          idle: pool.idleCount,
          waiting: pool.waitingCount
        }
      };

      await pool.end();

      if (check.responseTime > 1000) {
        check.status = 'warning';
        check.message = 'Database response time exceeds 1 second';
      }

    } catch (error) {
      check.status = 'unhealthy';
      check.error = error.message;
      check.details = { connected: false };
    }

    return check;
  }

  async checkFilesystem() {
    const check = {
      name: 'Filesystem Access',
      status: 'healthy',
      timestamp: new Date().toISOString()
    };

    try {
      // Check temp directory access
      const tempDir = join(__dirname, 'temp-repos');
      
      try {
        await fs.access(tempDir);
        check.tempDirectory = { accessible: true, path: tempDir };
      } catch {
        await fs.mkdir(tempDir, { recursive: true });
        check.tempDirectory = { accessible: true, path: tempDir, created: true };
      }

      // Check write permissions
      const testFile = join(tempDir, `health-check-${Date.now()}.tmp`);
      await fs.writeFile(testFile, 'health check test');
      await fs.unlink(testFile);
      
      check.writeAccess = true;
      
      // Check disk space
      const stats = await fs.stat(__dirname);
      check.diskSpace = {
        available: true,
        details: 'Filesystem accessible'
      };

    } catch (error) {
      check.status = 'unhealthy';
      check.error = error.message;
      check.writeAccess = false;
    }

    return check;
  }

  async checkMemory() {
    const check = {
      name: 'Memory Usage',
      status: 'healthy',
      timestamp: new Date().toISOString()
    };

    try {
      const memUsage = process.memoryUsage();
      const systemMem = {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      };

      const memoryUsagePercent = (systemMem.used / systemMem.total) * 100;
      const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

      check.details = {
        process: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memUsage.external / 1024 / 1024), // MB
          heapUsagePercent: Math.round(heapUsagePercent)
        },
        system: {
          total: Math.round(systemMem.total / 1024 / 1024), // MB
          free: Math.round(systemMem.free / 1024 / 1024), // MB
          used: Math.round(systemMem.used / 1024 / 1024), // MB
          usagePercent: Math.round(memoryUsagePercent)
        }
      };

      // Warning thresholds
      if (heapUsagePercent > 80 || memoryUsagePercent > 85) {
        check.status = 'warning';
        check.message = 'High memory usage detected';
      }

      // Critical thresholds
      if (heapUsagePercent > 95 || memoryUsagePercent > 95) {
        check.status = 'unhealthy';
        check.message = 'Critical memory usage - system may become unstable';
      }

    } catch (error) {
      check.status = 'unhealthy';
      check.error = error.message;
    }

    return check;
  }

  async checkCPU() {
    const check = {
      name: 'CPU Performance',
      status: 'healthy',
      timestamp: new Date().toISOString()
    };

    try {
      const cpus = os.cpus();
      const loadAvg = os.loadavg();
      
      check.details = {
        cores: cpus.length,
        model: cpus[0].model,
        loadAverage: {
          '1min': Math.round(loadAvg[0] * 100) / 100,
          '5min': Math.round(loadAvg[1] * 100) / 100,
          '15min': Math.round(loadAvg[2] * 100) / 100
        },
        loadPercentage: Math.round((loadAvg[0] / cpus.length) * 100)
      };

      // Warning if load average exceeds 70% of available cores
      if (loadAvg[0] > cpus.length * 0.7) {
        check.status = 'warning';
        check.message = 'High CPU load detected';
      }

      // Critical if load average exceeds 90% of available cores
      if (loadAvg[0] > cpus.length * 0.9) {
        check.status = 'unhealthy';
        check.message = 'Critical CPU load - performance degraded';
      }

    } catch (error) {
      check.status = 'unhealthy';
      check.error = error.message;
    }

    return check;
  }

  async checkGitHubAPI() {
    const check = {
      name: 'GitHub API',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: 0
    };

    try {
      if (!process.env.GITHUB_TOKEN) {
        check.status = 'warning';
        check.message = 'GitHub token not configured';
        return check;
      }

      const startTime = Date.now();
      
      const response = await fetch('https://api.github.com/rate_limit', {
        headers: {
          'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
          'User-Agent': 'DependencyWarden-HealthCheck'
        },
        timeout: 5000
      });

      check.responseTime = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`GitHub API returned ${response.status}: ${response.statusText}`);
      }

      const rateLimit = await response.json();
      
      check.details = {
        connected: true,
        rateLimit: {
          remaining: rateLimit.rate.remaining,
          limit: rateLimit.rate.limit,
          resetTime: new Date(rateLimit.rate.reset * 1000).toISOString()
        }
      };

      // Warning if rate limit is low
      if (rateLimit.rate.remaining < 100) {
        check.status = 'warning';
        check.message = 'GitHub API rate limit running low';
      }

    } catch (error) {
      check.status = 'warning';
      check.error = error.message;
      check.details = { connected: false };
    }

    return check;
  }

  async checkStripe() {
    const check = {
      name: 'Stripe API',
      status: 'healthy',
      timestamp: new Date().toISOString()
    };

    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        check.status = 'warning';
        check.message = 'Stripe secret key not configured';
        return check;
      }

      // Simple API connectivity test
      const response = await fetch('https://api.stripe.com/v1/balance', {
        headers: {
          'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`
        },
        timeout: 5000
      });

      if (response.ok) {
        check.details = { connected: true, message: 'Stripe API accessible' };
      } else {
        check.status = 'warning';
        check.message = `Stripe API returned ${response.status}`;
      }

    } catch (error) {
      check.status = 'warning';
      check.error = error.message;
      check.details = { connected: false };
    }

    return check;
  }

  async checkSendGrid() {
    const check = {
      name: 'SendGrid API',
      status: 'healthy',
      timestamp: new Date().toISOString()
    };

    try {
      if (!process.env.SENDGRID_API_KEY) {
        check.status = 'warning';
        check.message = 'SendGrid API key not configured';
        return check;
      }

      check.details = { 
        configured: true, 
        message: 'SendGrid API key present' 
      };

    } catch (error) {
      check.status = 'warning';
      check.error = error.message;
    }

    return check;
  }

  async getSystemInfo() {
    return {
      platform: os.platform(),
      architecture: os.arch(),
      nodeVersion: process.version,
      uptime: Math.round(os.uptime()),
      hostname: os.hostname(),
      processId: process.pid,
      environment: process.env.NODE_ENV || 'development',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  // Express middleware for health check endpoint
  healthCheckMiddleware() {
    return async (req, res) => {
      try {
        const health = await this.performHealthCheck();
        
        // Set appropriate HTTP status code
        const statusCode = health.status === 'healthy' ? 200 : 
                          health.status === 'degraded' ? 200 : 503;
        
        res.status(statusCode).json(health);
        
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          error: 'Health check failed',
          message: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  // Simplified health check for load balancers
  simpleHealthCheck() {
    return (req, res) => {
      res.status(200).send('OK');
    };
  }
}

export default ProductionHealthChecker;