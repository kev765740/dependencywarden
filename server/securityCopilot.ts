/**
 * Security Copilot - AI-powered vulnerability analysis and guidance
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { storage } from "./storage";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

export class SecurityCopilot {
  private model = genAI.getGenerativeModel({ model: "gemini-pro" });

  async analyzeVulnerability(vulnerabilityData: any) {
    try {
      const prompt = `
As a cybersecurity expert, analyze this vulnerability and provide detailed guidance:

Vulnerability: ${vulnerabilityData.vulnerability || 'Unknown'}
Context: ${vulnerabilityData.context || 'General application security'}
Package: ${vulnerabilityData.packageName || 'N/A'}
Version: ${vulnerabilityData.version || 'N/A'}
CVE: ${vulnerabilityData.cveId || 'N/A'}

Provide a comprehensive analysis including:
1. Risk assessment and potential impact
2. Specific remediation steps
3. Code examples if applicable
4. Timeline for fixes (immediate, short-term, long-term)
5. Prevention strategies

Format the response as JSON with these fields:
{
  "riskLevel": "critical|high|medium|low",
  "impact": "description of potential impact",
  "remediation": ["step 1", "step 2", "step 3"],
  "codeExample": "example fix if applicable",
  "timeline": "recommended timeline",
  "prevention": "prevention strategies"
}
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      
      try {
        return JSON.parse(response.text());
      } catch (parseError) {
        // Fallback to structured text response
        return {
          riskLevel: "medium",
          impact: response.text(),
          remediation: ["Review the vulnerability details", "Update affected packages", "Test thoroughly"],
          codeExample: "",
          timeline: "Address within 1-2 weeks",
          prevention: "Keep dependencies updated and use security scanning tools"
        };
      }
    } catch (error) {
      console.error('Security analysis failed:', error);
      return {
        riskLevel: "unknown",
        impact: "Analysis unavailable - please check Google API configuration",
        remediation: ["Manually review vulnerability", "Consult security documentation", "Update packages"],
        codeExample: "",
        timeline: "Review immediately",
        prevention: "Regular security audits recommended"
      };
    }
  }

  async chatWithCopilot(message: string, context: any = {}) {
    try {
      const contextPrompt = this.buildContextPrompt(context);
      
      const prompt = `
You are a security expert assistant helping developers with vulnerability management and security questions.

${contextPrompt}

User question: ${message}

Provide a helpful, actionable response focusing on:
- Security best practices
- Specific remediation guidance
- Code examples when relevant
- Risk assessment
- Implementation steps

Keep responses concise but comprehensive.
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      
      return {
        message: response.text(),
        timestamp: new Date().toISOString(),
        context: context
      };
    } catch (error) {
      console.error('Copilot chat failed:', error);
      return {
        message: "I'm currently unable to process your request. Please ensure the Google API is properly configured, or try again later.",
        timestamp: new Date().toISOString(),
        context: context
      };
    }
  }

  private buildContextPrompt(context: any): string {
    let contextPrompt = "Current context:\n";
    
    if (context.repository) {
      contextPrompt += `- Repository: ${context.repository}\n`;
    }
    
    if (context.vulnerabilities && context.vulnerabilities.length > 0) {
      contextPrompt += `- Active vulnerabilities: ${context.vulnerabilities.length}\n`;
      contextPrompt += `- Critical issues: ${context.vulnerabilities.filter((v: any) => v.severity === 'critical').length}\n`;
    }
    
    if (context.recentScans) {
      contextPrompt += `- Recent scans: ${context.recentScans}\n`;
    }
    
    return contextPrompt;
  }

  async generateFixSuggestion(packageName: string, currentVersion: string, vulnerability: string) {
    try {
      const prompt = `
Generate a specific fix suggestion for this security vulnerability:

Package: ${packageName}
Current Version: ${currentVersion}
Vulnerability: ${vulnerability}

Provide:
1. Recommended version to upgrade to
2. Command to update the package
3. Any breaking changes to watch for
4. Testing recommendations

Format as JSON:
{
  "recommendedVersion": "version number",
  "updateCommand": "npm install command",
  "breakingChanges": ["list of potential breaking changes"],
  "testingSteps": ["testing recommendations"]
}
`;

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      
      try {
        return JSON.parse(response.text());
      } catch (parseError) {
        return {
          recommendedVersion: "latest",
          updateCommand: `npm install ${packageName}@latest`,
          breakingChanges: ["Review changelog for breaking changes"],
          testingSteps: ["Run existing test suite", "Manual testing recommended"]
        };
      }
    } catch (error) {
      console.error('Fix suggestion generation failed:', error);
      return {
        recommendedVersion: "latest",
        updateCommand: `npm install ${packageName}@latest`,
        breakingChanges: ["Check package documentation"],
        testingSteps: ["Comprehensive testing required"]
      };
    }
  }
}

export const securityCopilot = new SecurityCopilot();