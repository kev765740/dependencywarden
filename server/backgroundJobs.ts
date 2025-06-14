/**
 * Background Jobs for Repository Scanning and Monitoring
 * Ensures all repositories are automatically scanned and up-to-date
 */

import { storage } from "./storage";
import { realTimeScanner } from "./realTimeScanner";

export class BackgroundJobProcessor {
  private isRunning = false;
  private scanInterval: NodeJS.Timeout | null = null;

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting background job processor...');
    
    // Scan existing repositories on startup
    await this.scanExistingRepositories();
    
    // Set up periodic scanning
    this.scanInterval = setInterval(async () => {
      await this.periodicScan();
    }, 5 * 60 * 1000); // Every 5 minutes
    
    console.log('Background job processor started');
  }

  async stop() {
    this.isRunning = false;
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    console.log('Background job processor stopped');
  }

  async scanExistingRepositories() {
    try {
      console.log('Scanning existing repositories...');
      
      const repositories = await storage.getRepositories();
      console.log(`Found ${repositories.length} repositories to process`);
      
      for (const repo of repositories) {
        // Check if repository needs scanning
        const needsScan = !repo.lastScannedAt || 
          new Date(repo.lastScannedAt || 0).getTime() < Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
        
        if (needsScan) {
          console.log(`Queuing scan for repository: ${repo.name}`);
          await realTimeScanner.queueScan(repo.id);
        }
      }
      
    } catch (error) {
      console.error('Error scanning existing repositories:', error);
    }
  }

  async periodicScan() {
    try {
      // Check for repositories that need periodic scans
      const repositories = await storage.getRepositories();
      
      for (const repo of repositories) {
        if (repo.autoScanEnabled) {
          const lastScan = repo.lastScannedAt ? new Date(repo.lastScannedAt).getTime() : 0;
          const now = Date.now();
          const scanIntervalMs = this.getScanIntervalMs(repo.scanFrequency || 'daily');
          
          if (now - lastScan > scanIntervalMs) {
            console.log(`Periodic scan triggered for repository: ${repo.name}`);
            await realTimeScanner.queueScan(repo.id);
          }
        }
      }
      
    } catch (error) {
      console.error('Error in periodic scan:', error);
    }
  }

  private getScanIntervalMs(frequency: string): number {
    switch (frequency) {
      case 'hourly': return 60 * 60 * 1000;
      case 'daily': return 24 * 60 * 60 * 1000;
      case 'weekly': return 7 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000; // Default to daily
    }
  }

  async generateSampleData() {
    try {
      console.log('Generating sample security alerts for demonstration...');
      
      const repositories = await storage.getRepositories();
      
      for (const repo of repositories.slice(0, 2)) { // Limit to first 2 repos
        // Create sample vulnerabilities
        const sampleVulnerabilities = [
          {
            repositoryId: repo.id,
            alertType: 'vulnerability',
            severity: 'critical',
            title: 'Remote Code Execution in Express.js',
            description: 'Critical vulnerability allowing remote code execution through prototype pollution',
            packageName: 'express',
            packageVersion: '4.17.1',
            cveId: 'CVE-2024-1001',
            cvssScore: '9.8',
            fixVersion: '4.18.2'
          },
          {
            repositoryId: repo.id,
            alertType: 'vulnerability',
            severity: 'high',
            title: 'SQL Injection Vulnerability',
            description: 'High severity SQL injection vulnerability in database driver',
            packageName: 'mysql2',
            packageVersion: '2.3.3',
            cveId: 'CVE-2024-1002',
            cvssScore: '8.1',
            fixVersion: '2.3.4'
          }
        ];

        for (const vuln of sampleVulnerabilities) {
          await storage.createSecurityAlert(vuln);
        }
      }
      
      console.log('Sample data generation completed');
      
    } catch (error) {
      console.error('Error generating sample data:', error);
    }
  }
}

export const backgroundJobProcessor = new BackgroundJobProcessor();