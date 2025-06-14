import nodemailer from 'nodemailer';
import type { Alert } from '@shared/schema';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.setupTransporter();
  }

  private setupTransporter() {
    const emailConfig = this.getEmailConfig();
    if (emailConfig) {
      this.transporter = nodemailer.createTransport(emailConfig);
    }
  }

  private getEmailConfig(): EmailConfig | null {
    // Support multiple email providers via environment variables
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      return {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      };
    }

    // Gmail configuration
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      return {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      };
    }

    // SendGrid configuration
    if (process.env.SENDGRID_API_KEY) {
      return {
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      };
    }

    return null;
  }

  async sendAlertEmail(
    recipientEmail: string,
    repositoryName: string,
    alert: Alert,
    frontendUrl: string
  ): Promise<boolean> {
    if (!this.transporter) {
      console.warn('Email service not configured - skipping email notification');
      return false;
    }

    try {
      const subject = this.generateSubject(repositoryName, alert);
      const htmlContent = this.generateHtmlContent(repositoryName, alert, frontendUrl);
      const textContent = this.generateTextContent(repositoryName, alert, frontendUrl);

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.GMAIL_USER,
        to: recipientEmail,
        subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`Alert email sent to ${recipientEmail} for ${repositoryName}`);
      return true;
    } catch (error) {
      console.error('Failed to send alert email:', error);
      return false;
    }
  }

  private generateSubject(repositoryName: string, alert: Alert): string {
    const typeLabel = alert.alertType === 'license' ? 'License Change' : 'Security Vulnerability';
    const severityEmoji = this.getSeverityEmoji(alert.severity);
    
    return `${severityEmoji} ${typeLabel} Alert: ${alert.dependencyName} in ${repositoryName}`;
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚠️';
    }
  }

  private generateHtmlContent(repositoryName: string, alert: Alert, frontendUrl: string): string {
    const isLicenseAlert = alert.alertType === 'license';
    const severityColor = this.getSeverityColor(alert.severity);
    const viewUrl = `${frontendUrl}/repositories/${alert.repoId}`;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dependency Alert</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e2e8f0; border-top: none; }
        .alert-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .severity-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; border-radius: 0 0 8px 8px; }
        .change-indicator { font-family: monospace; background: #f1f5f9; padding: 8px; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ Dependency Alert</h1>
            <p>Security monitoring for ${repositoryName}</p>
        </div>
        
        <div class="content">
            <div class="alert-box">
                <h2>${isLicenseAlert ? '📜 License Change Detected' : '🔒 Security Vulnerability Found'}</h2>
                
                <p><strong>Dependency:</strong> ${alert.dependencyName}</p>
                <p><strong>Severity:</strong> <span class="severity-badge" style="background-color: ${severityColor}; color: white;">${alert.severity}</span></p>
                <p><strong>Detected:</strong> ${new Date(alert.createdAt!).toLocaleDateString()}</p>
                
                ${isLicenseAlert ? `
                <div class="change-indicator">
                    <strong>License Change:</strong><br>
                    ${alert.oldValue || 'Unknown'} → <strong>${alert.newValue}</strong>
                </div>
                <p><strong>Impact:</strong> This license change may affect your project's licensing requirements and commercial use permissions.</p>
                ` : `
                <div class="change-indicator">
                    <strong>Vulnerability ID:</strong> ${alert.newValue}<br>
                    ${alert.description ? `<strong>Description:</strong> ${alert.description}` : ''}
                </div>
                <p><strong>Action Required:</strong> Review and update the affected dependency to a patched version.</p>
                `}
            </div>
            
            <h3>Recommended Actions:</h3>
            <ul>
                ${isLicenseAlert ? `
                <li>Review the new license terms and compatibility with your project</li>
                <li>Consult with your legal team if necessary</li>
                <li>Consider alternative dependencies with compatible licenses</li>
                <li>Update your project's license documentation</li>
                ` : `
                <li>Update ${alert.dependencyName} to the latest secure version</li>
                <li>Review the vulnerability details and assess impact</li>
                <li>Test your application after updating</li>
                <li>Monitor for additional security patches</li>
                `}
            </ul>
            
            <a href="${viewUrl}" class="button">View Full Details →</a>
        </div>
        
        <div class="footer">
            <p>This alert was generated by DepWatch - Dependency Security Monitoring</p>
            <p>Visit your dashboard to manage notifications and repository settings</p>
        </div>
    </div>
</body>
</html>`;
  }

  private generateTextContent(repositoryName: string, alert: Alert, frontendUrl: string): string {
    const isLicenseAlert = alert.alertType === 'license';
    const viewUrl = `${frontendUrl}/repositories/${alert.repoId}`;

    return `
DEPENDENCY ALERT - ${repositoryName}

${isLicenseAlert ? 'LICENSE CHANGE DETECTED' : 'SECURITY VULNERABILITY FOUND'}

Dependency: ${alert.dependencyName}
Severity: ${alert.severity.toUpperCase()}
Detected: ${new Date(alert.createdAt!).toLocaleDateString()}

${isLicenseAlert 
  ? `License Change: ${alert.oldValue || 'Unknown'} → ${alert.newValue}
Impact: This license change may affect your project's licensing requirements.`
  : `Vulnerability: ${alert.newValue}
${alert.description ? `Description: ${alert.description}` : ''}
Action Required: Review and update the affected dependency.`
}

RECOMMENDED ACTIONS:
${isLicenseAlert 
  ? `• Review the new license terms and compatibility
• Consult with your legal team if necessary
• Consider alternative dependencies
• Update license documentation`
  : `• Update ${alert.dependencyName} to latest secure version
• Review vulnerability details and assess impact
• Test application after updating
• Monitor for additional security patches`
}

View full details: ${viewUrl}

---
This alert was generated by DepWatch - Dependency Security Monitoring
`;
  }

  private getSeverityColor(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#65a30d';
      default: return '#6b7280';
    }
  }

  async testEmailConfiguration(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Email configuration test failed:', error);
      return false;
    }
  }

  async sendFeedbackNotification(
    feedback: any,
    userEmail: string,
    retryCount: number = 0
  ): Promise<boolean> {
    if (!this.transporter) {
      console.log('Email not configured, skipping feedback notification');
      return false;
    }

    const maxRetries = 3;
    
    try {
      // Sanitize feedback data
      const sanitizedFeedback = {
        title: this.sanitizeHtml(feedback.title || 'No Title'),
        description: this.sanitizeHtml(feedback.description || 'No Description'),
        type: feedback.type,
        priority: feedback.priority,
        createdAt: feedback.createdAt
      };
      
      const sanitizedUserEmail = this.sanitizeEmail(userEmail);
      
      const subject = `New Feedback: ${sanitizedFeedback.title}`;
      const typeIcon = this.getFeedbackTypeIcon(feedback.type);
      const priorityColor = this.getPriorityColor(feedback.priority);

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">New Feedback Received</h1>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <div style="background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="display: flex; align-items: center; margin-bottom: 20px;">
                <span style="font-size: 24px; margin-right: 10px;">${typeIcon}</span>
                <div>
                  <h2 style="margin: 0; color: #333; font-size: 20px;">${sanitizedFeedback.title}</h2>
                  <div style="margin-top: 5px;">
                    <span style="background: ${priorityColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; text-transform: uppercase;">${sanitizedFeedback.priority}</span>
                    <span style="background: #6c757d; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 5px; text-transform: uppercase;">${sanitizedFeedback.type}</span>
                  </div>
                </div>
              </div>

              <div style="margin-bottom: 20px;">
                <h3 style="color: #495057; margin-bottom: 10px;">Description:</h3>
                <p style="background: #f8f9fa; padding: 15px; border-radius: 4px; color: #333; line-height: 1.6; margin: 0;">${sanitizedFeedback.description}</p>
              </div>

              <div style="border-top: 1px solid #dee2e6; padding-top: 20px; margin-top: 20px;">
                <h3 style="color: #495057; margin-bottom: 15px;">Feedback Details:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6c757d; font-weight: bold; width: 30%;">User Email:</td>
                    <td style="padding: 8px 0; color: #333;">${sanitizedUserEmail}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6c757d; font-weight: bold;">Submitted:</td>
                    <td style="padding: 8px 0; color: #333;">${new Date(sanitizedFeedback.createdAt).toLocaleString()}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                <p style="color: #6c757d; margin: 0; font-size: 14px;">
                  This feedback was automatically sent from your Dependency Watcher application.
                </p>
              </div>
            </div>
          </div>
        </div>
      `;

      const textContent = `
New Feedback Received

Title: ${sanitizedFeedback.title}
Type: ${sanitizedFeedback.type}
Priority: ${sanitizedFeedback.priority}
User Email: ${sanitizedUserEmail}
Submitted: ${new Date(sanitizedFeedback.createdAt).toLocaleString()}

Description:
${sanitizedFeedback.description}

---
This feedback was automatically sent from your Dependency Watcher application.
      `;

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ALERT_EMAIL || process.env.EMAIL_USER,
        subject,
        text: textContent,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Feedback notification email sent successfully');
      return true;
    } catch (error) {
      console.error(`Failed to send feedback notification email (attempt ${retryCount + 1}):`, error);
      
      // Retry mechanism for transient failures
      if (retryCount < maxRetries) {
        console.log(`Retrying email send in ${(retryCount + 1) * 2} seconds...`);
        await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
        return this.sendFeedbackNotification(feedback, userEmail, retryCount + 1);
      }
      
      return false;
    }
  }

  private getFeedbackTypeIcon(type: string): string {
    switch (type) {
      case 'bug':
        return '🐛';
      case 'feature':
        return '💡';
      case 'general':
        return '💬';
      default:
        return '📝';
    }
  }

  private getPriorityColor(priority: string): string {
    switch (priority) {
      case 'critical':
        return '#dc3545';
      case 'high':
        return '#fd7e14';
      case 'medium':
        return '#ffc107';
      case 'low':
        return '#28a745';
      default:
        return '#6c757d';
    }
  }

  // Sanitization methods for security
  private sanitizeHtml(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }

  private sanitizeEmail(email: string): string {
    if (typeof email !== 'string') return '';
    
    // Basic email validation and sanitization
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitized = email.trim().toLowerCase();
    
    return emailRegex.test(sanitized) ? this.sanitizeHtml(sanitized) : 'Invalid Email';
  }
}

export const emailService = new EmailService();