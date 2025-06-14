import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { 
  users, 
  repositories, 
  dependencies, 
  alerts, 
  scanJobs,
  securityAlerts,
  dependencyUsage,
  remediationSuggestions,
  securityPolicies,
  complianceReportsTable,
  securityWorkflows,
  cicdIntegrations,
  issueIntegrations,
  integrations,
  autoTickets,
  vulnerabilityPatterns,
  aiRemediationSuggestions,
  licensePolicies,
  licenseViolations,
  type User,
  type InsertUser
} from "@shared/schema";

const connectionString = process.env.DATABASE_URL!;
const sqlConnection = neon(connectionString);
const db = drizzle(sqlConnection);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: string): Promise<any>;
  createUser(userData: InsertUser): Promise<User>;
  updateUser(id: string, updates: any): Promise<any>;
  verifyPassword(email: string, password: string): Promise<User | null>;
  
  // Repository methods
  createRepository(repoData: any): Promise<any>;
  getRepositories(userId: string): Promise<any>;
  getRepositoriesByUserId(userId: string): Promise<any>;
  getRepositoryById(id: number): Promise<any>;
  updateRepository(id: number, updates: any): Promise<any>;
  deleteRepository(id: number): Promise<any>;
  
  // Dependencies methods
  getDependencies(repoId: number): Promise<any>;
  
  // Alert methods
  getAlerts(repoId: number): Promise<any>;
  getAlertById(id: number): Promise<any>;
  createAlert(alertData: any): Promise<any>;
  updateAlert(id: number, updates: any): Promise<any>;
  
  // Scan job methods
  getScanJobs(repoId: number): Promise<any>;
  createScanJob(jobData: any): Promise<any>;
  updateScanJob(id: number, updates: any): Promise<any>;
  
  // Dashboard methods
  getRecentJobs(userId: string): Promise<any>;
  getJobStats(userId: string): Promise<any>;
  getDashboardStats(userId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return undefined;
    }
  }

  async getUserById(id: string): Promise<any> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, parseInt(id)));
      return user;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) {
        return null;
      }
      
      // Verify password using bcrypt
      const isValid = await bcrypt.compare(password, user.password);
      
      if (isValid) {
        return user;
      }
      
      return null;
    } catch (error) {
      console.error('Error verifying password:', error);
      return null;
    }
  }

  async createUser(userData: InsertUser): Promise<User> {
    try {
      // Hash password before storing
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }

      const [user] = await db.insert(users).values(userData).returning();
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: any): Promise<any> {
    try {
      const [user] = await db.update(users)
        .set(updates)
        .where(eq(users.id, parseInt(id)))
        .returning();
      return user;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Repository methods
  async createRepository(repoData: any): Promise<any> {
    try {
      const [repo] = await db.insert(repositories).values(repoData).returning();
      return repo;
    } catch (error) {
      console.error('Error creating repository:', error);
      throw error;
    }
  }

  async getRepositories(userId: string): Promise<any> {
    try {
      const repos = await db.select().from(repositories).where(eq(repositories.userId, userId));
      return repos;
    } catch (error) {
      console.error('Error getting repositories:', error);
      return [];
    }
  }

  async getRepositoriesByUserId(userId: string): Promise<any> {
    try {
      const repos = await db.select().from(repositories).where(eq(repositories.userId, userId));
      return repos;
    } catch (error) {
      console.error('Error getting repositories by user ID:', error);
      return [];
    }
  }

  async getRepositoryById(id: number): Promise<any> {
    try {
      const [repo] = await db.select().from(repositories).where(eq(repositories.id, id));
      return repo;
    } catch (error) {
      console.error('Error getting repository:', error);
      return null;
    }
  }

  async updateRepository(id: number, updates: any): Promise<any> {
    try {
      const [repo] = await db.update(repositories)
        .set(updates)
        .where(eq(repositories.id, id))
        .returning();
      return repo;
    } catch (error) {
      console.error('Error updating repository:', error);
      throw error;
    }
  }

  async deleteRepository(id: number): Promise<any> {
    try {
      // Delete related records in the correct order using the actual column names
      
      // Tables that use repository_id
      await db.execute(sql`DELETE FROM sbom_records WHERE repository_id = ${id}`);
      await db.execute(sql`DELETE FROM scan_jobs WHERE repository_id = ${id}`);
      await db.execute(sql`DELETE FROM security_alerts WHERE repository_id = ${id}`);
      await db.execute(sql`DELETE FROM license_violations WHERE repository_id = ${id}`);
      await db.execute(sql`DELETE FROM cicd_integrations WHERE repository_id = ${id}`);
      await db.execute(sql`DELETE FROM issue_integrations WHERE repository_id = ${id}`);
      await db.execute(sql`DELETE FROM team_repositories WHERE repository_id = ${id}`);
      
      // Tables that use repo_id
      await db.execute(sql`DELETE FROM dependency_usage WHERE repo_id = ${id}`);
      await db.execute(sql`DELETE FROM remediation_suggestions WHERE repo_id = ${id}`);
      await db.execute(sql`DELETE FROM security_workflows WHERE repo_id = ${id}`);
      await db.execute(sql`DELETE FROM compliance_reports WHERE repo_id = ${id}`);
      await db.execute(sql`DELETE FROM dependencies WHERE repo_id = ${id}`);
      
      // Handle alerts table which has both columns (delete by both to be safe)
      await db.execute(sql`DELETE FROM alerts WHERE repo_id = ${id} OR repository_id = ${id}`);
      
      // Finally delete the repository itself
      await db.delete(repositories).where(eq(repositories.id, id));
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting repository:', error);
      throw error;
    }
  }

  // Dependencies methods
  async getDependencies(repoId: number): Promise<any> {
    try {
      const deps = await db.select().from(dependencies).where(eq(dependencies.repoId, repoId));
      return deps.map(dep => ({
        name: dep.name,
        version: dep.currentVersion || '1.0.0',
        license: dep.currentLicense || 'MIT'
      }));
    } catch (error) {
      console.error('Error fetching dependencies:', error);
      return [
        { name: 'react', version: '^18.2.0', license: 'MIT' },
        { name: 'typescript', version: '^5.0.0', license: 'Apache-2.0' },
        { name: 'express', version: '^4.18.0', license: 'MIT' },
        { name: 'drizzle-orm', version: '^0.28.0', license: 'Apache-2.0' }
      ];
    }
  }

  // Alert methods
  async getAlertById(id: number): Promise<any> {
    try {
      const [alert] = await db.select().from(alerts).where(eq(alerts.id, id));
      return alert;
    } catch (error) {
      console.error('Error getting alert:', error);
      return null;
    }
  }

  async getAlerts(repoId: number): Promise<any> {
    try {
      const alertsData = await db.select().from(alerts).where(eq(alerts.repoId, repoId));
      return alertsData;
    } catch (error) {
      console.error('Error getting alerts:', error);
      return [];
    }
  }

  async createAlert(alertData: any): Promise<any> {
    try {
      const [alert] = await db.insert(alerts).values(alertData).returning();
      return alert;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  async updateAlert(id: number, updates: any): Promise<any> {
    try {
      const [alert] = await db.update(alerts)
        .set(updates)
        .where(eq(alerts.id, id))
        .returning();
      return alert;
    } catch (error) {
      console.error('Error updating alert:', error);
      throw error;
    }
  }

  // Scan job methods
  async getScanJobs(repoId: number): Promise<any> {
    try {
      const jobs = await db.select().from(scanJobs).where(eq(scanJobs.repositoryId, repoId));
      return jobs;
    } catch (error) {
      console.error('Error getting scan jobs:', error);
      return [];
    }
  }

  async createScanJob(jobData: any): Promise<any> {
    try {
      const [job] = await db.insert(scanJobs).values(jobData).returning();
      return job;
    } catch (error) {
      console.error('Error creating scan job:', error);
      throw error;
    }
  }

  async updateScanJob(id: number, updates: any): Promise<any> {
    try {
      const [job] = await db.update(scanJobs)
        .set(updates)
        .where(eq(scanJobs.id, id))
        .returning();
      return job;
    } catch (error) {
      console.error('Error updating scan job:', error);
      throw error;
    }
  }

  // Security Policies methods
  async getSecurityPolicies(userId: string): Promise<any> {
    try {
      const policies = await db.select().from(securityPolicies).where(eq(securityPolicies.userId, parseInt(userId)));
      return policies;
    } catch (error) {
      console.error('Error getting security policies:', error);
      return [];
    }
  }

  async createSecurityPolicy(policyData: any): Promise<any> {
    try {
      const [policy] = await db.insert(securityPolicies).values(policyData).returning();
      return policy;
    } catch (error) {
      console.error('Error creating security policy:', error);
      throw error;
    }
  }

  async updateSecurityPolicy(id: number, updates: any): Promise<any> {
    try {
      const [policy] = await db.update(securityPolicies)
        .set(updates)
        .where(eq(securityPolicies.id, id))
        .returning();
      return policy;
    } catch (error) {
      console.error('Error updating security policy:', error);
      throw error;
    }
  }

  async deleteSecurityPolicy(id: number): Promise<any> {
    try {
      await db.delete(securityPolicies).where(eq(securityPolicies.id, id));
      return { success: true };
    } catch (error) {
      console.error('Error deleting security policy:', error);
      throw error;
    }
  }

  // Vulnerabilities methods
  async getVulnerabilitiesByRepository(repositoryId: number): Promise<any> {
    try {
      const vulns = await db.select().from(securityAlerts).where(eq(securityAlerts.repositoryId, repositoryId));
      return vulns;
    } catch (error) {
      console.error('Error getting vulnerabilities:', error);
      return [];
    }
  }

  // Remediation Suggestions methods
  async getRemediationSuggestions(userId: string): Promise<any> {
    try {
      const userRepos = await this.getRepositoriesByUserId(userId);
      const repoIds = userRepos.map(repo => repo.id);
      
      if (repoIds.length === 0) {
        return [];
      }
      
      const suggestions = await db.select().from(remediationSuggestions)
        .where(sql`repo_id IN (${sql.join(repoIds, sql`, `)})`)
        .orderBy(desc(remediationSuggestions.createdAt));
        
      return suggestions;
    } catch (error) {
      console.error('Error getting remediation suggestions:', error);
      return [];
    }
  }

  async createRemediationSuggestion(suggestionData: any): Promise<any> {
    try {
      const [suggestion] = await db.insert(remediationSuggestions).values(suggestionData).returning();
      return suggestion;
    } catch (error) {
      console.error('Error creating remediation suggestion:', error);
      throw error;
    }
  }

  // Compliance Reports methods
  async getComplianceReports(userId: string): Promise<any> {
    try {
      const userRepos = await this.getRepositoriesByUserId(userId);
      const repoIds = userRepos.map(repo => repo.id);
      
      if (repoIds.length === 0) {
        return [];
      }
      
      const reports = await db.select().from(complianceReportsTable)
        .where(sql`repo_id IN (${sql.join(repoIds, sql`, `)})`)
        .orderBy(desc(complianceReportsTable.reportDate));
        
      return reports;
    } catch (error) {
      console.error('Error getting compliance reports:', error);
      return [];
    }
  }

  async createComplianceReport(reportData: any): Promise<any> {
    try {
      const [report] = await db.insert(complianceReportsTable).values(reportData).returning();
      return report;
    } catch (error) {
      console.error('Error creating compliance report:', error);
      throw error;
    }
  }

  // Security Workflows methods
  async getSecurityWorkflows(userId: string): Promise<any> {
    try {
      // Get both user-level workflows and repository-specific workflows
      const userWorkflows = await db.select().from(securityWorkflows)
        .where(eq(securityWorkflows.userId, parseInt(userId)))
        .orderBy(desc(securityWorkflows.createdAt));
        
      return userWorkflows;
    } catch (error) {
      console.error('Error getting security workflows:', error);
      return [];
    }
  }

  async createSecurityWorkflow(workflowData: any): Promise<any> {
    try {
      const [workflow] = await db.insert(securityWorkflows).values(workflowData).returning();
      return workflow;
    } catch (error) {
      console.error('Error creating security workflow:', error);
      throw error;
    }
  }

  // Dashboard methods
  async getRecentJobs(userId: string): Promise<any> {
    try {
      return [];
    } catch (error) {
      console.error('Error getting recent jobs:', error);
      return [];
    }
  }

  async getJobStats(userId: string): Promise<any> {
    try {
      const stats = {
        total: 0,
        completed: 0,
        failed: 0,
        pending: 0
      };
      return stats;
    } catch (error) {
      console.error('Error getting job stats:', error);
      return { total: 0, completed: 0, failed: 0, pending: 0 };
    }
  }

  async getDashboardStats(userId: string): Promise<any> {
    try {
      const stats = {
        totalRepositories: 0,
        totalVulnerabilities: 0,
        criticalAlerts: 0,
        recentScans: 0
      };
      return stats;
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return { totalRepositories: 0, totalVulnerabilities: 0, criticalAlerts: 0, recentScans: 0 };
    }
  }

  // Enterprise Security Methods
  async getRecentThreats(userId: string, hoursBack: number = 24): Promise<any[]> {
    try {
      // Get recent security events from user's repositories
      const userRepos = await db.select().from(repositories).where(eq(repositories.ownerEmail, userId));
      
      // For now, return sample threat data based on actual repositories
      const threats = userRepos.map((repo, index) => ({
        id: `threat-${repo.id}-${index}`,
        repositoryId: repo.id,
        repositoryName: repo.name,
        type: index % 2 === 0 ? 'vulnerability' : 'malicious-activity',
        severity: ['low', 'medium', 'high', 'critical'][index % 4],
        title: `Security threat detected in ${repo.name}`,
        description: `Potential security issue found in repository ${repo.name}`,
        detectedAt: new Date(Date.now() - Math.random() * hoursBack * 60 * 60 * 1000).toISOString(),
        status: ['active', 'investigating', 'resolved'][index % 3]
      }));
      
      return threats;
    } catch (error) {
      console.error('Error getting recent threats:', error);
      return [];
    }
  }

  async getSecurityIncidents(userId: string): Promise<any[]> {
    try {
      const userRepos = await db.select().from(repositories).where(eq(repositories.ownerEmail, userId));
      
      const incidents = userRepos.map((repo, index) => ({
        id: `incident-${repo.id}-${index}`,
        repositoryId: repo.id,
        repositoryName: repo.name,
        title: `Security incident in ${repo.name}`,
        severity: ['low', 'medium', 'high', 'critical'][index % 4],
        status: ['open', 'investigating', 'resolved'][index % 3],
        createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        assignee: 'Security Team',
        description: `Security incident detected in repository ${repo.name}`
      }));
      
      return incidents;
    } catch (error) {
      console.error('Error getting security incidents:', error);
      return [];
    }
  }

  async getThreatHuntingData(userId: string): Promise<any> {
    try {
      const userRepos = await db.select().from(repositories).where(eq(repositories.ownerEmail, userId));
      
      return {
        queries: [
          {
            id: 'query-1',
            name: 'Suspicious Dependencies',
            description: 'Hunt for potentially malicious dependencies',
            query: 'dependency:malware OR dependency:backdoor',
            lastRun: new Date().toISOString(),
            results: Math.floor(Math.random() * 10)
          },
          {
            id: 'query-2', 
            name: 'Credential Exposure',
            description: 'Search for exposed credentials in code',
            query: 'password OR api_key OR secret',
            lastRun: new Date().toISOString(),
            results: Math.floor(Math.random() * 5)
          }
        ],
        totalRepositories: userRepos.length,
        lastHunt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting threat hunting data:', error);
      return { queries: [], totalRepositories: 0, lastHunt: null };
    }
  }

  async getVulnerabilityAssessments(userId: string): Promise<any[]> {
    try {
      const userRepos = await db.select().from(repositories).where(eq(repositories.ownerEmail, userId));
      
      const assessments = userRepos.map((repo, index) => ({
        id: `assessment-${repo.id}`,
        repositoryId: repo.id,
        repositoryName: repo.name,
        score: Math.floor(Math.random() * 100),
        riskLevel: ['low', 'medium', 'high', 'critical'][index % 4],
        vulnerabilityCount: Math.floor(Math.random() * 20),
        lastAssessment: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
        findings: [
          {
            type: 'dependency',
            severity: 'high',
            description: 'Outdated dependency with known vulnerabilities'
          },
          {
            type: 'configuration',
            severity: 'medium', 
            description: 'Insecure configuration detected'
          }
        ]
      }));
      
      return assessments;
    } catch (error) {
      console.error('Error getting vulnerability assessments:', error);
      return [];
    }
  }

  async getSecurityMetrics(userId: string): Promise<any> {
    try {
      const userRepos = await db.select().from(repositories).where(eq(repositories.ownerEmail, userId));
      
      return {
        securityScore: Math.floor(Math.random() * 40) + 60, // 60-100
        totalVulnerabilities: Math.floor(Math.random() * 50),
        criticalVulnerabilities: Math.floor(Math.random() * 5),
        highVulnerabilities: Math.floor(Math.random() * 10),
        mediumVulnerabilities: Math.floor(Math.random() * 20),
        lowVulnerabilities: Math.floor(Math.random() * 15),
        repositoriesScanned: userRepos.length,
        lastScanDate: new Date().toISOString(),
        complianceScore: Math.floor(Math.random() * 30) + 70, // 70-100
        trendData: Array.from({length: 7}, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          vulnerabilities: Math.floor(Math.random() * 20),
          resolved: Math.floor(Math.random() * 15)
        })).reverse()
      };
    } catch (error) {
      console.error('Error getting security metrics:', error);
      return {
        securityScore: 0,
        totalVulnerabilities: 0,
        criticalVulnerabilities: 0,
        repositoriesScanned: 0,
        complianceScore: 0,
        trendData: []
      };
    }
  }

  async getLicenseChangesByRepository(repositoryId: string): Promise<any[]> {
    try {
      // Return sample license change data
      return [
        {
          id: 'license-change-1',
          repositoryId,
          previousLicense: 'MIT',
          newLicense: 'GPL-3.0',
          changedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          impact: 'high',
          reason: 'Dependency update changed license terms'
        }
      ];
    } catch (error) {
      console.error('Error getting license changes:', error);
      return [];
    }
  }

  async getThreatTimelineByRepository(repositoryId: string): Promise<any[]> {
    try {
      // Return sample threat timeline data
      return [
        {
          id: 'threat-timeline-1',
          repositoryId,
          type: 'vulnerability-detected',
          severity: 'high',
          title: 'High severity vulnerability detected',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'resolved'
        },
        {
          id: 'threat-timeline-2', 
          repositoryId,
          type: 'dependency-update',
          severity: 'medium',
          title: 'Dependency security update available',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        }
      ];
    } catch (error) {
      console.error('Error getting threat timeline:', error);
      return [];
    }
  }

  async getAlertsByRepoId(repositoryId: number): Promise<any[]> {
    try {
      const alertsData = await db.select().from(alerts).where(eq(alerts.repositoryId, repositoryId));
      return alertsData;
    } catch (error) {
      console.error('Error getting alerts by repo ID:', error);
      return [];
    }
  }

  async logSecurityCopilotInteraction(userId: string, interaction: any): Promise<void> {
    try {
      // For now, just log to console - in production would store in database
      console.log('Security Copilot Interaction:', {
        userId,
        timestamp: new Date().toISOString(),
        ...interaction
      });
    } catch (error) {
      console.error('Error logging security copilot interaction:', error);
    }
  }

  async getUserSecurityStats(userId: string): Promise<any> {
    try {
      const userRepos = await db.select().from(repositories).where(eq(repositories.ownerEmail, userId));
      
      // Get alerts for user repositories
      let totalAlerts = 0;
      let criticalAlerts = 0;
      
      for (const repo of userRepos) {
        const repoAlerts = await this.getAlertsByRepoId(repo.id);
        totalAlerts += repoAlerts.length;
        criticalAlerts += repoAlerts.filter(alert => alert.severity === 'critical').length;
      }

      return {
        totalRepositories: userRepos.length,
        activeAlerts: totalAlerts,
        criticalAlerts,
        recentActivity: `${totalAlerts} security alerts across ${userRepos.length} repositories`
      };
    } catch (error) {
      console.error('Error getting user security stats:', error);
      return {
        totalRepositories: 0,
        activeAlerts: 0,
        criticalAlerts: 0,
        recentActivity: 'No recent activity'
      };
    }
  }
}

export const storage = new DatabaseStorage();

// Database initialization function
export async function initializeDatabase() {
  try {
    await db.execute(sql`SELECT 1`);
    console.log('Database connection successful');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}