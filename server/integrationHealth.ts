/**
 * Integration Health Monitoring
 * Verifies external service connectivity and API key validity
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { Octokit } from "@octokit/rest";

export class IntegrationHealthMonitor {
  
  async checkAllIntegrations() {
    const results = {
      google: await this.checkGoogleAPI(),
      github: await this.checkGitHubAPI(),
      openai: await this.checkOpenAIAPI(),
      sendgrid: await this.checkSendGridAPI(),
      slack: await this.checkSlackAPI(),
      database: await this.checkDatabaseConnection()
    };

    const overallHealth = Object.values(results).every(r => r.status === 'healthy');
    
    return {
      overall: overallHealth ? 'healthy' : 'degraded',
      services: results,
      timestamp: new Date().toISOString()
    };
  }

  async checkGoogleAPI() {
    try {
      if (!process.env.GOOGLE_API_KEY) {
        return { status: 'missing', message: 'Google API key not configured' };
      }

      const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Test with a simple prompt
      const result = await model.generateContent("Test connectivity");
      
      if (result.response) {
        return { status: 'healthy', message: 'Google Gemini API operational' };
      } else {
        return { status: 'unhealthy', message: 'Google API returned empty response' };
      }
    } catch (error: any) {
      return { 
        status: 'unhealthy', 
        message: `Google API error: ${error.message}`,
        requiresAction: 'Verify GOOGLE_API_KEY is valid'
      };
    }
  }

  async checkGitHubAPI() {
    try {
      if (!process.env.GITHUB_TOKEN) {
        return { status: 'missing', message: 'GitHub token not configured' };
      }

      const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
      const { data } = await octokit.rest.users.getAuthenticated();
      
      return { 
        status: 'healthy', 
        message: `GitHub API operational (authenticated as ${data.login})` 
      };
    } catch (error: any) {
      return { 
        status: 'unhealthy', 
        message: `GitHub API error: ${error.message}`,
        requiresAction: 'Verify GITHUB_TOKEN has required permissions'
      };
    }
  }

  async checkOpenAIAPI() {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return { status: 'missing', message: 'OpenAI API key not configured' };
      }

      // Test OpenAI connection with a simple request
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return { status: 'healthy', message: 'OpenAI API operational' };
      } else {
        return { 
          status: 'unhealthy', 
          message: `OpenAI API returned ${response.status}`,
          requiresAction: 'Verify OPENAI_API_KEY is valid'
        };
      }
    } catch (error: any) {
      return { 
        status: 'unhealthy', 
        message: `OpenAI API error: ${error.message}`,
        requiresAction: 'Check OPENAI_API_KEY configuration'
      };
    }
  }

  async checkSendGridAPI() {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        return { status: 'missing', message: 'SendGrid API key not configured' };
      }

      // Test SendGrid API key validity
      const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return { status: 'healthy', message: 'SendGrid API operational' };
      } else {
        return { 
          status: 'unhealthy', 
          message: `SendGrid API returned ${response.status}`,
          requiresAction: 'Verify SENDGRID_API_KEY is valid'
        };
      }
    } catch (error: any) {
      return { 
        status: 'unhealthy', 
        message: `SendGrid API error: ${error.message}`,
        requiresAction: 'Check SENDGRID_API_KEY configuration'
      };
    }
  }

  async checkSlackAPI() {
    try {
      if (!process.env.SLACK_BOT_TOKEN) {
        return { status: 'missing', message: 'Slack bot token not configured' };
      }

      // Test Slack API
      const response = await fetch('https://slack.com/api/auth.test', {
        headers: {
          'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.ok) {
        return { 
          status: 'healthy', 
          message: `Slack API operational (team: ${data.team})` 
        };
      } else {
        return { 
          status: 'unhealthy', 
          message: `Slack API error: ${data.error}`,
          requiresAction: 'Verify SLACK_BOT_TOKEN permissions'
        };
      }
    } catch (error: any) {
      return { 
        status: 'unhealthy', 
        message: `Slack API error: ${error.message}`,
        requiresAction: 'Check SLACK_BOT_TOKEN configuration'
      };
    }
  }

  async checkDatabaseConnection() {
    try {
      const { storage } = await import('./storage');
      const stats = await storage.getDashboardStats(undefined);
      
      if (stats && typeof stats.totalRepos === 'number') {
        return { 
          status: 'healthy', 
          message: `Database operational (${stats.totalRepos} repositories tracked)` 
        };
      } else {
        return { status: 'unhealthy', message: 'Database returned invalid data' };
      }
    } catch (error: any) {
      return { 
        status: 'unhealthy', 
        message: `Database error: ${error.message}`,
        requiresAction: 'Check DATABASE_URL configuration'
      };
    }
  }
}

export const integrationHealthMonitor = new IntegrationHealthMonitor();