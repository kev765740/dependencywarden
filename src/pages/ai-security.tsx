import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, AlertTriangle, Shield, Brain, Send, Wifi, WifiOff, RefreshCw, User, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequestWithRetry } from '@/utils/apiRequest';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  confidence?: number;
  suggestions?: string[];
  followUpQuestions?: string[];
  isError?: boolean;
  isTyping?: boolean;
}

interface Vulnerability {
  id: string;
  cve: string;
  package: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  affectedVersions?: string[];
  patchedVersions?: string[];
}

// Enhanced mock vulnerabilities with more realistic data
const mockVulnerabilities: Vulnerability[] = [
  {
    id: '1',
    cve: 'CVE-2024-23897',
    package: 'jenkins',
    severity: 'critical',
    description: 'Arbitrary file read vulnerability through CLI commands',
    affectedVersions: ['< 2.441'],
    patchedVersions: ['2.441', '2.426.3']
  },
  {
    id: '2',
    cve: 'CVE-2024-1597',
    package: 'postgresql',
    severity: 'high',
    description: 'SQL injection in extension scripts when trusted extensions are compromised',
    affectedVersions: ['< 16.2', '< 15.6', '< 14.11'],
    patchedVersions: ['16.2', '15.6', '14.11']
  },
  {
    id: '3',
    cve: 'CVE-2024-0567',
    package: 'gnutls',
    severity: 'medium',
    description: 'Timing side-channel attack in RSA key operations',
    affectedVersions: ['< 3.8.3'],
    patchedVersions: ['3.8.3']
  }
];

export default function AISecurityCopilot() {
  const authContext = useAuth();
  const { toast } = useToast();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [selectedVulnerability, setSelectedVulnerability] = useState<Vulnerability | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const user = authContext?.user;
  const isAuthenticated = authContext?.isAuthenticated;

  // Use mock data instead of API call for now
  const vulnerabilities = mockVulnerabilities;
  const vulnerabilitiesLoading = false;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Add enhanced welcome message on mount
  useEffect(() => {
    if (chatMessages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'assistant',
        content: `🤖 **Welcome to AI Security Copilot!**

I'm your intelligent security assistant powered by advanced AI. I can help you with:

• **Vulnerability Analysis** - Deep dive into CVE details and impact assessment
• **Risk Assessment** - Evaluate threats based on your specific environment  
• **Remediation Strategies** - Step-by-step fix guidance with code examples
• **Security Best Practices** - Proactive security recommendations
• **Compliance Guidance** - Help with regulatory requirements

**Current Security Status:**
- ${vulnerabilities.length} vulnerabilities detected
- ${vulnerabilities.filter(v => v.severity === 'critical').length} critical issues requiring immediate attention
- ${vulnerabilities.filter(v => v.severity === 'high').length} high-priority vulnerabilities

Select a vulnerability below or ask me any security question!`,
        timestamp: new Date(),
        confidence: 0.95,
        followUpQuestions: [
          'What are the most critical vulnerabilities in my environment?',
          'How should I prioritize vulnerability remediation?',
          'Show me step-by-step fix for CVE-2024-23897',
          'What are the latest security best practices for 2024?'
        ]
      };
      setChatMessages([welcomeMessage]);
    }
  }, [vulnerabilities.length]);

  // Enhanced AI response generation
  const generateAIResponse = useCallback((userMessage: string, context?: Vulnerability) => {
    const message = userMessage.toLowerCase();
    
    if (context) {
      return {
        response: `🔍 **Analysis of ${context.cve} in ${context.package}**

**Vulnerability Overview:**
${context.description}

**Severity Assessment:** ${context.severity.toUpperCase()}
- **Risk Level:** ${context.severity === 'critical' ? 'IMMEDIATE ACTION REQUIRED' : 
                   context.severity === 'high' ? 'High Priority - Address within 24-48 hours' :
                   context.severity === 'medium' ? 'Medium Priority - Address within 1 week' :
                   'Low Priority - Address in next maintenance cycle'}

**Affected Versions:** ${context.affectedVersions?.join(', ') || 'Version information not available'}
**Patched Versions:** ${context.patchedVersions?.join(', ') || 'Patch information not available'}

**Recommended Actions:**
1. **Immediate:** Verify if your current version is affected
2. **Update:** Upgrade to patched version: ${context.patchedVersions?.[0] || 'latest'}
3. **Test:** Run comprehensive tests after upgrade
4. **Monitor:** Watch for any related security bulletins

**Implementation Code Example:**
\`\`\`bash
# Update package
npm update ${context.package}@${context.patchedVersions?.[0] || 'latest'}

# Verify version
npm list ${context.package}
\`\`\`

Would you like me to explain the attack vector or provide additional mitigation strategies?`,
        confidence: 0.92,
        suggestions: [
          'Explain the attack vector in detail',
          'Show me mitigation strategies',
          'Generate an automated fix PR',
          'Check for similar vulnerabilities'
        ],
        followUpQuestions: [
          `How does the ${context.cve} attack work?`,
          'What temporary workarounds are available?',
          'Are there any related vulnerabilities I should check?'
        ]
      };
    }

    // Enhanced general responses
    if (message.includes('critical') || message.includes('priority')) {
      const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical');
      return {
        response: `🚨 **Critical Security Alert**

You have **${criticalVulns.length} critical vulnerabilities** that require immediate attention:

${criticalVulns.map((v, i) => `${i + 1}. **${v.cve}** in ${v.package}
   - Impact: ${v.description}
   - Action: Update to ${v.patchedVersions?.[0] || 'latest version'}`).join('\n\n')}

**Recommended Prioritization:**
1. **CVE-2024-23897** (Jenkins) - Arbitrary file read, immediate patch required
2. Address other critical issues in order of exposure risk
3. Implement automated vulnerability scanning

**Emergency Response Plan:**
1. Patch critical vulnerabilities within 4 hours
2. Notify security team and stakeholders
3. Monitor for signs of exploitation
4. Document all changes for audit trail`,
        confidence: 0.96,
        suggestions: [
          'Show detailed fix for CVE-2024-23897',
          'Generate emergency response checklist',
          'Set up automated scanning',
          'Create security incident report'
        ]
      };
    }

    if (message.includes('best practice') || message.includes('recommend')) {
      return {
        response: `📋 **Security Best Practices for 2024**

**Dependency Management:**
• Use automated dependency scanning (daily)
• Implement Software Bill of Materials (SBOM)
• Pin dependency versions in production
• Regular security audits (monthly)

**Vulnerability Management:**
• Critical: Patch within 4 hours
• High: Patch within 24-48 hours
• Medium: Patch within 1 week
• Implement staged rollouts for patches

**Development Security:**
• Use secure coding practices
• Implement SAST/DAST tools in CI/CD
• Regular security training for developers
• Code review for all security-related changes

**Infrastructure Security:**
• Network segmentation
• Principle of least privilege
• Multi-factor authentication
• Regular security assessments`,
        confidence: 0.89,
        suggestions: [
          'Set up automated scanning',
          'Create security training plan',
          'Implement SBOM generation',
          'Design security architecture'
        ]
      };
    }

    // Default intelligent response
    return {
      response: `I understand you're asking about "${userMessage}". Let me provide you with relevant security guidance:

**Based on your current environment:**
- Monitoring ${vulnerabilities.length} dependencies across your repositories
- ${vulnerabilities.filter(v => v.severity === 'critical' || v.severity === 'high').length} high-priority security issues detected
- Latest threat intelligence suggests focusing on supply chain vulnerabilities

**How I can help:**
• Analyze specific CVEs and their impact on your systems
• Provide step-by-step remediation guides
• Risk assessment and prioritization
• Security architecture recommendations
• Compliance and regulatory guidance

Could you be more specific about what security aspect you'd like me to focus on?`,
      confidence: 0.75,
      suggestions: [
        'Analyze all critical vulnerabilities',
        'Show vulnerability trends',
        'Explain security frameworks',
        'Help with compliance requirements'
      ]
    };
  }, [vulnerabilities]);

  const sendChatMessage = useCallback(async (message: string) => {
    if (!message.trim() || isAiTyping) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsAiTyping(true);
    setConnectionStatus('connected');

    // Add typing indicator
    const typingMessage: ChatMessage = {
      id: `typing-${Date.now()}`,
      type: 'assistant',
      content: '🤖 Analyzing your request...',
      timestamp: new Date(),
      isTyping: true
    };
    setChatMessages(prev => [...prev, typingMessage]);

    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2000));

      // Generate enhanced AI response
      const aiResponseData = generateAIResponse(message, selectedVulnerability);

      // Remove typing indicator and add real response
      setChatMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.isTyping);
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          type: 'assistant',
          content: aiResponseData.response,
          timestamp: new Date(),
          confidence: aiResponseData.confidence,
          suggestions: aiResponseData.suggestions,
          followUpQuestions: aiResponseData.followUpQuestions,
        };
        return [...withoutTyping, aiMessage];
      });

    } catch (error) {
      console.error('Chat error:', error);
      setConnectionStatus('disconnected');
      
      setChatMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.isTyping);
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          type: 'assistant',
          content: '⚠️ I\'m experiencing connectivity issues. Please check your internet connection and try again. If the problem persists, our AI service might be temporarily unavailable.',
          timestamp: new Date(),
          isError: true,
          followUpQuestions: ['Try asking your question again', 'Contact support for assistance']
        };
        return [...withoutTyping, errorMessage];
      });
    } finally {
      setIsAiTyping(false);
    }
  }, [selectedVulnerability, isAiTyping, generateAIResponse]);

  const handleVulnerabilitySelect = useCallback((vuln: Vulnerability) => {
    setSelectedVulnerability(vuln);
    
    const contextMessage: ChatMessage = {
      id: `context-${Date.now()}`,
      type: 'system',
      content: `🎯 **Selected vulnerability:** ${vuln.cve} in ${vuln.package} (${vuln.severity.toUpperCase()} severity)`,
      timestamp: new Date(),
    };
    
    const aiMessage: ChatMessage = {
      id: `ai-context-${Date.now()}`,
      type: 'assistant',
      content: generateAIResponse('analyze vulnerability', vuln).response,
      timestamp: new Date(),
      confidence: 0.92,
      followUpQuestions: [
        'What\'s the attack vector for this vulnerability?',
        'Show me step-by-step remediation',
        'Are there any workarounds available?',
        'How can I prevent similar vulnerabilities?'
      ]
    };
    
    setChatMessages(prev => [...prev, contextMessage, aiMessage]);
  }, [generateAIResponse]);

  const handleQuickQuestion = useCallback((question: string) => {
    sendChatMessage(question);
  }, [sendChatMessage]);

  const handleCopyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied to clipboard",
      description: "Message content has been copied",
    });
  }, [toast]);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Security Copilot
            </h1>
            <p className="text-gray-600 text-lg">
              Intelligent vulnerability analysis and security guidance powered by advanced AI
            </p>
          </div>
          <div className={`px-3 py-2 rounded-full text-sm font-medium ${
            connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
            connectionStatus === 'reconnecting' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {connectionStatus === 'connected' ? (
              <><Wifi className="w-4 h-4 inline mr-2" />Online</>
            ) : connectionStatus === 'reconnecting' ? (
              <><RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />Reconnecting</>
            ) : (
              <><WifiOff className="w-4 h-4 inline mr-2" />Offline</>
            )}
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Critical Vulnerabilities</p>
                  <p className="text-2xl font-bold text-red-600">
                    {vulnerabilities.filter(v => v.severity === 'critical').length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">High Priority</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {vulnerabilities.filter(v => v.severity === 'high').length}
                  </p>
                </div>
                <Shield className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">AI Confidence</p>
                  <p className="text-2xl font-bold text-green-600">96%</p>
                </div>
                <Brain className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enhanced Vulnerabilities List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Active Vulnerabilities</span>
              <Badge variant="destructive">{vulnerabilities.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vulnerabilitiesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {vulnerabilities.map((vuln) => (
                    <div
                      key={vuln.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedVulnerability?.id === vuln.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => handleVulnerabilitySelect(vuln)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getSeverityIcon(vuln.severity)}
                          <span className="font-medium text-sm">{vuln.cve}</span>
                        </div>
                        <Badge className={getSeverityColor(vuln.severity)}>
                          {vuln.severity.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{vuln.package}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{vuln.description}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Chat Interface */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-blue-600" />
              <span>AI Security Assistant</span>
              {selectedVulnerability && (
                <Badge variant="outline" className="ml-2">
                  Analyzing {selectedVulnerability.cve}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Enhanced Chat Messages */}
            <ScrollArea className="h-96 border rounded-lg p-4">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <Brain className="h-12 w-12 text-gray-400" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Welcome to AI Security Copilot</h3>
                    <p className="text-gray-600">
                      Select a vulnerability or ask me any security-related question
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                        <div className={`p-3 rounded-lg ${
                          message.type === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : message.isError
                            ? 'bg-red-50 border-red-200 border'
                            : message.type === 'system'
                            ? 'bg-gray-100 border'
                            : 'bg-gray-50 border'
                        }`}>
                          {message.type !== 'user' && (
                            <div className="flex items-center space-x-2 mb-2">
                              {message.type === 'assistant' ? (
                                <Bot className="h-4 w-4 text-blue-600" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 text-gray-500" />
                              )}
                              <span className="text-xs font-medium text-gray-600">
                                {message.type === 'assistant' ? 'AI Security Copilot' : 'System'}
                              </span>
                              {message.confidence && (
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(message.confidence * 100)}% confident
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          <div className="prose prose-sm max-w-none">
                            <div className="whitespace-pre-wrap">{message.content}</div>
                          </div>
                          
                          {message.type !== 'user' && (
                            <div className="flex items-center justify-between mt-3 pt-2 border-t">
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyMessage(message.content)}
                                  className="h-6 px-2"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 px-2">
                                  <ThumbsUp className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-6 px-2">
                                  <ThumbsDown className="h-3 w-3" />
                                </Button>
                              </div>
                              <span className="text-xs text-gray-400">
                                {message.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Enhanced Follow-up Questions */}
                        {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
                            {message.followUpQuestions.map((question, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickQuestion(question)}
                                className="mr-2 mb-1 h-7 text-xs"
                                disabled={isAiTyping}
                              >
                                {question}
                              </Button>
                            ))}
                          </div>
                        )}
                        
                        {/* AI Suggestions */}
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs text-gray-500 mb-2">I can also help with:</p>
                            {message.suggestions.map((suggestion, idx) => (
                              <Button
                                key={idx}
                                variant="ghost"
                                size="sm"
                                onClick={() => handleQuickQuestion(suggestion)}
                                className="mr-2 mb-1 h-7 text-xs text-blue-600"
                                disabled={isAiTyping}
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Enhanced Input Section */}
            <div className="space-y-3">
              <div className="flex space-x-2">
                <Input
                  ref={inputRef}
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Ask me about vulnerabilities, security best practices, or remediation strategies..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage(currentMessage);
                    }
                  }}
                  disabled={isAiTyping}
                  className="flex-1"
                />
                <Button 
                  onClick={() => sendChatMessage(currentMessage)}
                  disabled={!currentMessage.trim() || isAiTyping}
                  className="px-6"
                >
                  {isAiTyping ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Quick Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickQuestion("What are my most critical vulnerabilities?")}
                  disabled={isAiTyping}
                >
                  🚨 Critical Issues
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickQuestion("Show me security best practices for 2024")}
                  disabled={isAiTyping}
                >
                  📋 Best Practices
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickQuestion("Help me prioritize vulnerability fixes")}
                  disabled={isAiTyping}
                >
                  📊 Prioritization
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickQuestion("Explain supply chain security")}
                  disabled={isAiTyping}
                >
                  🔗 Supply Chain
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}