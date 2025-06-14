import type { Alert } from '@shared/schema';

interface SlackAttachment {
  color: string;
  title: string;
  text: string;
  fields: Array<{
    title: string;
    value: string;
    short: boolean;
  }>;
  footer: string;
  ts: number;
  actions?: Array<{
    type: string;
    text: string;
    url: string;
    style?: string;
  }>;
}

interface SlackMessage {
  text: string;
  attachments: SlackAttachment[];
}

export class SlackService {
  private getSeverityColor(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical':
        return '#dc2626'; // red
      case 'high':
        return '#ea580c'; // orange
      case 'medium':
        return '#d97706'; // yellow
      case 'low':
        return '#16a34a'; // green
      default:
        return '#6b7280'; // gray
    }
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical':
        return '🚨';
      case 'high':
        return '⚠️';
      case 'medium':
        return '🔶';
      case 'low':
        return 'ℹ️';
      default:
        return '📋';
    }
  }

  private generateSlackMessage(repositoryName: string, alert: Alert, frontendUrl: string): SlackMessage {
    const emoji = this.getSeverityEmoji(alert.severity);
    const alertType = alert.alertType === 'vuln' ? 'Security Vulnerability' : 'License Change';
    
    const attachment: SlackAttachment = {
      color: this.getSeverityColor(alert.severity),
      title: `${emoji} ${alertType} Detected`,
      text: alert.description,
      fields: [
        {
          title: 'Repository',
          value: `<${frontendUrl}/repositories/${alert.repoId}|${repositoryName}>`,
          short: true
        },
        {
          title: 'Dependency',
          value: `\`${alert.dependencyName}\``,
          short: true
        },
        {
          title: 'Severity',
          value: alert.severity.toUpperCase(),
          short: true
        },
        {
          title: 'Detected',
          value: `<!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toLocaleString()}>`,
          short: true
        }
      ],
      footer: 'Dependency Monitor • Automated Security Scanning',
      ts: Math.floor(Date.now() / 1000)
    };

    if (alert.oldValue && alert.newValue) {
      attachment.fields.push({
        title: alert.alertType === 'license' ? 'License Change' : 'Change Details',
        value: `${alert.oldValue || 'Unknown'} → ${alert.newValue}`,
        short: false
      });
    }

    if (alert.alertType === 'vuln' && alert.newValue) {
      attachment.fields.push({
        title: 'Vulnerability ID',
        value: `<https://osv.dev/vulnerability/${alert.newValue}|${alert.newValue}>`,
        short: true
      });
    }

    // Add action buttons
    attachment.actions = [
      {
        type: 'button',
        text: 'View Details',
        url: `${frontendUrl}/repositories/${alert.repoId}`,
        style: 'primary'
      }
    ];

    if (alert.alertType === 'vuln' && alert.newValue) {
      attachment.actions.push({
        type: 'button',
        text: 'View CVE',
        url: `https://osv.dev/vulnerability/${alert.newValue}`
      });
    }

    return {
      text: `${emoji} ${alertType} detected in ${repositoryName}`,
      attachments: [attachment]
    };
  }

  async sendSlackNotification(
    webhookUrl: string,
    repositoryName: string,
    alert: Alert,
    frontendUrl: string
  ): Promise<void> {
    try {
      const message = this.generateSlackMessage(repositoryName, alert, frontendUrl);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Slack webhook request failed: ${response.status} ${response.statusText}`);
      }

      console.log(`Slack notification sent successfully for ${alert.alertType} alert`);
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
      throw error;
    }
  }

  async sendScanSummaryNotification(
    webhookUrl: string,
    repositoryName: string,
    scanResults: {
      vulnerabilities: number;
      licenseChanges: number;
      dependenciesScanned: number;
      filesScanned: number;
    },
    frontendUrl: string
  ): Promise<void> {
    try {
      const totalIssues = scanResults.vulnerabilities + scanResults.licenseChanges;
      const color = totalIssues > 0 ? (totalIssues > 5 ? '#dc2626' : '#d97706') : '#16a34a';
      const emoji = totalIssues > 0 ? '⚠️' : '✅';
      
      const message = {
        text: `${emoji} Scan completed for ${repositoryName}`,
        attachments: [{
          color,
          title: `Repository Scan Summary: ${repositoryName}`,
          text: totalIssues > 0 ? 
            `Found ${totalIssues} security issue${totalIssues === 1 ? '' : 's'} that need attention.` : 
            'No security issues detected. All dependencies are up to date.',
          fields: [
            {
              title: 'Vulnerabilities',
              value: scanResults.vulnerabilities.toString(),
              short: true
            },
            {
              title: 'License Changes',
              value: scanResults.licenseChanges.toString(),
              short: true
            },
            {
              title: 'Dependencies Scanned',
              value: scanResults.dependenciesScanned.toString(),
              short: true
            },
            {
              title: 'Files Analyzed',
              value: scanResults.filesScanned.toString(),
              short: true
            }
          ],
          actions: [{
            type: 'button',
            text: 'View Repository',
            url: `${frontendUrl}/repositories/${repositoryName}`,
            style: 'primary'
          }],
          footer: 'Dependency Monitor • Automated Security Scanning',
          ts: Math.floor(Date.now() / 1000)
        }]
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Slack webhook request failed: ${response.status}`);
      }

      console.log(`Slack scan summary sent for ${repositoryName}`);
    } catch (error) {
      console.error('Failed to send Slack scan summary:', error);
      throw error;
    }
  }

  async sendBatchAlertNotification(
    webhookUrl: string,
    repositoryName: string,
    alerts: Alert[],
    frontendUrl: string
  ): Promise<void> {
    try {
      const vulnerabilities = alerts.filter(a => a.alertType === 'vuln');
      const licenseChanges = alerts.filter(a => a.alertType === 'license');
      
      const color = vulnerabilities.length > 0 ? '#dc2626' : '#d97706';
      const emoji = vulnerabilities.length > 0 ? '🚨' : '⚠️';
      
      let text = `${emoji} Multiple security issues detected in ${repositoryName}\n`;
      if (vulnerabilities.length > 0) {
        text += `• ${vulnerabilities.length} vulnerabilit${vulnerabilities.length === 1 ? 'y' : 'ies'}\n`;
      }
      if (licenseChanges.length > 0) {
        text += `• ${licenseChanges.length} license change${licenseChanges.length === 1 ? '' : 's'}\n`;
      }

      const fields = [];
      
      if (vulnerabilities.length > 0) {
        const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical');
        const highVulns = vulnerabilities.filter(v => v.severity === 'high');
        
        fields.push({
          title: 'Critical Vulnerabilities',
          value: criticalVulns.length > 0 ? 
            criticalVulns.map(v => `• \`${v.dependencyName}\` - ${v.newValue}`).join('\n') :
            'None',
          short: false
        });

        if (highVulns.length > 0) {
          fields.push({
            title: 'High Severity Vulnerabilities',
            value: highVulns.slice(0, 5).map(v => `• \`${v.dependencyName}\` - ${v.newValue}`).join('\n') +
              (highVulns.length > 5 ? `\n... and ${highVulns.length - 5} more` : ''),
            short: false
          });
        }
      }

      if (licenseChanges.length > 0) {
        fields.push({
          title: 'License Changes',
          value: licenseChanges.slice(0, 3).map(l => 
            `• \`${l.dependencyName}\`: ${l.oldValue} → ${l.newValue}`
          ).join('\n') + (licenseChanges.length > 3 ? `\n... and ${licenseChanges.length - 3} more` : ''),
          short: false
        });
      }

      const message = {
        text,
        attachments: [{
          color,
          title: `Security Alert: ${repositoryName}`,
          text: `${alerts.length} issue${alerts.length === 1 ? '' : 's'} detected during automated scan`,
          fields,
          actions: [{
            type: 'button',
            text: 'View All Alerts',
            url: `${frontendUrl}/repositories/${repositoryName}`,
            style: 'danger'
          }],
          footer: 'Dependency Monitor • Automated Security Scanning',
          ts: Math.floor(Date.now() / 1000)
        }]
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Slack webhook request failed: ${response.status}`);
      }

      console.log(`Slack batch alert sent for ${repositoryName} (${alerts.length} alerts)`);
    } catch (error) {
      console.error('Failed to send Slack batch alert:', error);
      throw error;
    }
  }

  async testSlackWebhook(webhookUrl: string): Promise<boolean> {
    try {
      const testMessage = {
        text: '✅ Dependency Monitor - Slack integration test successful',
        attachments: [{
          color: '#16a34a',
          title: 'Test Notification',
          text: 'Your Slack webhook is properly configured and ready to receive dependency monitoring alerts.',
          fields: [
            {
              title: 'Notification Types',
              value: '• Individual vulnerability alerts\n• License change notifications\n• Scan summary reports\n• Batch security alerts',
              short: false
            }
          ],
          footer: 'Dependency Monitor • Automated Security Scanning',
          ts: Math.floor(Date.now() / 1000)
        }]
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMessage),
      });

      return response.ok;
    } catch (error) {
      console.error('Slack webhook test failed:', error);
      return false;
    }
  }
}

export const slackService = new SlackService();