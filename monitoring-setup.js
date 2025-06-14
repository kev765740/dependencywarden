/**
 * Production Monitoring Setup
 * Comprehensive monitoring system for the Dependency License & Security Change Watcher
 */

const https = require('https');
const fs = require('fs');

class ProductionMonitor {
  constructor() {
    this.baseUrl = process.env.MONITOR_BASE_URL || 'http://localhost:5000';
    this.alertThresholds = {
      responseTime: 2000, // ms
      errorRate: 5, // percentage
      memoryUsage: 85, // percentage
      diskUsage: 90, // percentage
      dbResponseTime: 1000 // ms
    };
    this.checkInterval = 30000; // 30 seconds
    this.alertCooldown = 300000; // 5 minutes
    this.lastAlerts = new Map();
    this.metrics = {
      checks: 0,
      failures: 0,
      alerts: 0
    };
  }

  async start() {
    console.log('[Monitor] Starting production monitoring system...');
    console.log(`[Monitor] Base URL: ${this.baseUrl}`);
    console.log(`[Monitor] Check interval: ${this.checkInterval / 1000}s`);
    
    // Initial health check
    await this.performHealthCheck();
    
    // Start continuous monitoring
    setInterval(() => {
      this.performHealthCheck().catch(error => {
        console.error('[Monitor] Health check failed:', error.message);
      });
    }, this.checkInterval);
    
    // Generate daily reports
    setInterval(() => {
      this.generateDailyReport();
    }, 24 * 60 * 60 * 1000); // 24 hours
    
    console.log('[Monitor] Production monitoring started successfully');
  }

  async performHealthCheck() {
    this.metrics.checks++;
    const startTime = Date.now();
    
    try {
      const health = await this.makeHealthRequest();
      const responseTime = Date.now() - startTime;
      
      console.log(`[Monitor] Health check completed in ${responseTime}ms - Status: ${health.status}`);
      
      // Analyze health data
      await this.analyzeHealthData(health, responseTime);
      
      return health;
    } catch (error) {
      this.metrics.failures++;
      console.error('[Monitor] Health check failed:', error.message);
      
      await this.sendAlert('CRITICAL', `Health check failed: ${error.message}`, {
        error: error.message,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  makeHealthRequest() {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}/health`;
      const startTime = Date.now();
      
      const request = https.get(url, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
          data += chunk;
        });
        
        response.on('end', () => {
          try {
            const healthData = JSON.parse(data);
            healthData._responseTime = Date.now() - startTime;
            resolve(healthData);
          } catch (error) {
            reject(new Error(`Invalid JSON response: ${error.message}`));
          }
        });
      });
      
      request.on('error', (error) => {
        reject(new Error(`Request failed: ${error.message}`));
      });
      
      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Health check timeout (10s)'));
      });
    });
  }

  async analyzeHealthData(health, responseTime) {
    const alerts = [];
    
    // Check response time
    if (responseTime > this.alertThresholds.responseTime) {
      alerts.push({
        type: 'WARNING',
        message: `High response time: ${responseTime}ms (threshold: ${this.alertThresholds.responseTime}ms)`,
        metric: 'response_time',
        value: responseTime,
        threshold: this.alertThresholds.responseTime
      });
    }
    
    // Check overall system status
    if (health.status === 'unhealthy') {
      alerts.push({
        type: 'CRITICAL',
        message: 'System status is unhealthy',
        metric: 'system_status',
        value: health.status,
        details: health.checks
      });
    } else if (health.status === 'degraded') {
      alerts.push({
        type: 'WARNING',
        message: 'System status is degraded',
        metric: 'system_status',
        value: health.status,
        details: health.checks
      });
    }
    
    // Check database performance
    if (health.checks?.database?.responseTime > this.alertThresholds.dbResponseTime) {
      alerts.push({
        type: 'WARNING',
        message: `Database response time high: ${health.checks.database.responseTime}ms`,
        metric: 'db_response_time',
        value: health.checks.database.responseTime,
        threshold: this.alertThresholds.dbResponseTime
      });
    }
    
    // Check memory usage
    if (health.checks?.memory?.percentage > this.alertThresholds.memoryUsage) {
      alerts.push({
        type: 'WARNING',
        message: `High memory usage: ${health.checks.memory.percentage}%`,
        metric: 'memory_usage',
        value: health.checks.memory.percentage,
        threshold: this.alertThresholds.memoryUsage
      });
    }
    
    // Check external services
    if (health.checks?.external_services?.status === 'unhealthy') {
      alerts.push({
        type: 'WARNING',
        message: 'External services unavailable',
        metric: 'external_services',
        value: health.checks.external_services.status,
        details: health.checks.external_services.services
      });
    }
    
    // Send alerts with cooldown
    for (const alert of alerts) {
      await this.sendAlert(alert.type, alert.message, alert);
    }
  }

  async sendAlert(type, message, data = {}) {
    const alertKey = `${type}:${data.metric || 'general'}`;
    const now = Date.now();
    
    // Check cooldown
    if (this.lastAlerts.has(alertKey)) {
      const lastAlert = this.lastAlerts.get(alertKey);
      if (now - lastAlert < this.alertCooldown) {
        return; // Skip alert due to cooldown
      }
    }
    
    this.lastAlerts.set(alertKey, now);
    this.metrics.alerts++;
    
    const alert = {
      type,
      message,
      timestamp: new Date().toISOString(),
      data,
      environment: process.env.NODE_ENV || 'development'
    };
    
    console.log(`[Monitor] ALERT [${type}]: ${message}`);
    
    // Send to multiple channels
    await Promise.allSettled([
      this.sendSlackAlert(alert),
      this.logAlert(alert),
      this.sendEmailAlert(alert)
    ]);
  }

  async sendSlackAlert(alert) {
    if (!process.env.SLACK_WEBHOOK_URL) {
      return; // Slack not configured
    }
    
    const color = alert.type === 'CRITICAL' ? 'danger' : 'warning';
    const payload = {
      text: `🚨 ${alert.type} Alert`,
      attachments: [
        {
          color,
          title: 'Dependency Watcher Alert',
          text: alert.message,
          fields: [
            {
              title: 'Environment',
              value: alert.environment,
              short: true
            },
            {
              title: 'Timestamp',
              value: alert.timestamp,
              short: true
            }
          ],
          footer: 'Production Monitor'
        }
      ]
    };
    
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(payload);
      const url = new URL(process.env.SLACK_WEBHOOK_URL);
      
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };
      
      const req = https.request(options, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`Slack webhook failed: ${res.statusCode}`));
        }
      });
      
      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  async sendEmailAlert(alert) {
    // Email implementation would go here
    // For now, just log that we would send an email
    console.log(`[Monitor] Would send email alert: ${alert.message}`);
  }

  logAlert(alert) {
    const logEntry = {
      timestamp: alert.timestamp,
      level: alert.type,
      message: alert.message,
      data: alert.data,
      source: 'production_monitor'
    };
    
    // Write to alert log file
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync('./logs/alerts.log', logLine, 'utf8');
  }

  generateDailyReport() {
    const report = {
      date: new Date().toISOString().split('T')[0],
      metrics: { ...this.metrics },
      uptime: process.uptime(),
      alertSummary: {
        total: this.metrics.alerts,
        rate: this.metrics.alerts / this.metrics.checks * 100
      },
      healthRate: (1 - this.metrics.failures / this.metrics.checks) * 100
    };
    
    console.log('[Monitor] Daily Report:', JSON.stringify(report, null, 2));
    
    // Save report
    const reportFile = `./logs/daily-report-${report.date}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    // Reset daily metrics
    this.metrics.checks = 0;
    this.metrics.failures = 0;
    this.metrics.alerts = 0;
  }

  getStatus() {
    return {
      monitoring: true,
      checks: this.metrics.checks,
      failures: this.metrics.failures,
      alerts: this.metrics.alerts,
      successRate: this.metrics.checks > 0 ? 
        ((this.metrics.checks - this.metrics.failures) / this.metrics.checks * 100).toFixed(2) : 0,
      uptime: process.uptime()
    };
  }
}

// Validation and startup
function validateConfig() {
  const required = ['MONITOR_BASE_URL'];
  const optional = ['SLACK_WEBHOOK_URL', 'EMAIL_ALERT_TO'];
  
  console.log('[Monitor] Validating configuration...');
  
  for (const env of required) {
    if (!process.env[env]) {
      console.warn(`[Monitor] Warning: ${env} not set, using defaults`);
    }
  }
  
  for (const env of optional) {
    if (!process.env[env]) {
      console.log(`[Monitor] Optional: ${env} not configured`);
    }
  }
  
  // Ensure logs directory exists
  if (!fs.existsSync('./logs')) {
    fs.mkdirSync('./logs', { recursive: true });
  }
}

// Main execution
if (require.main === module) {
  validateConfig();
  
  const monitor = new ProductionMonitor();
  
  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[Monitor] Received SIGTERM, shutting down gracefully...');
    monitor.generateDailyReport();
    process.exit(0);
  });
  
  process.on('SIGINT', () => {
    console.log('[Monitor] Received SIGINT, shutting down gracefully...');
    monitor.generateDailyReport();
    process.exit(0);
  });
  
  // Start monitoring
  monitor.start().catch(error => {
    console.error('[Monitor] Failed to start:', error);
    process.exit(1);
  });
}

module.exports = { ProductionMonitor };