import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Brain, MessageCircle, Zap, Send, X, Shield, AlertTriangle, CheckCircle, TrendingUp, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface SecurityCopilotFloatProps {
  prefilledMessage?: string;
  alertContext?: {
    repo: string;
    vulnerability: string;
    severity: string;
  };
}

interface AIResponse {
  response: string;
  contextualInsights?: {
    securityScore: number;
    riskLevel: string;
    trends: {
      improving: boolean;
      degrading: boolean;
      stable: boolean;
    };
    nextActions: string[];
    longTermGoals: string[];
  };
  intelligentSuggestions?: string[];
  relevantDocumentation?: string[];
  timestamp: string;
}

export function SecurityCopilotFloat({ prefilledMessage, alertContext }: SecurityCopilotFloatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState(prefilledMessage || "");
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    setAiResponse(null);

    try {
      // Enhanced context for better AI responses
      const enhancedContext = {
        ...alertContext,
        userIntent: detectUserIntent(message),
        timestamp: new Date().toISOString(),
        sessionId: Date.now().toString()
      };

      const response = await fetch('/api/security-copilot/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          message,
          userMessage: message,
          context: enhancedContext,
          vulnerabilityId: alertContext?.vulnerability,
          cve: alertContext?.repo
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to get response');
      }

      const data = await response.json();

      // Enhanced response with deep reasoning insights
      setAiResponse({
        response: data.message || data.analysis?.explanation || 'I have analyzed your request and prepared recommendations.',
        contextualInsights: data.analysis ? {
          securityScore: data.analysis.riskAssessment?.score || 7.0,
          riskLevel: data.analysis.riskAssessment?.score >= 8 ? 'high' : 
                    data.analysis.riskAssessment?.score >= 6 ? 'medium' : 'low',
          trends: {
            improving: false,
            degrading: data.analysis.riskAssessment?.score >= 8,
            stable: data.analysis.riskAssessment?.score < 8 && data.analysis.riskAssessment?.score >= 6
          },
          nextActions: data.analysis.mitigationSteps?.slice(0, 3).map((step: any) => step.action) || [],
          longTermGoals: data.analysis.longTermStrategy?.preventiveMeasures?.slice(0, 2) || []
        } : undefined,
        intelligentSuggestions: data.analysis?.relatedThreats || [
          "Review similar vulnerabilities",
          "Check for related security issues",
          "Consider implementing additional monitoring"
        ],
        relevantDocumentation: [
          "Security best practices guide",
          "Vulnerability remediation handbook",
          "Compliance requirements checklist"
        ],
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('AI request failed:', error);
      setAiResponse({
        response: `I encountered an error: ${error.message || 'Unknown error occurred'}. Please try rephrasing your question or contact support if the issue persists.`,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to detect user intent for better context
  const detectUserIntent = (message: string): string => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('fix') || lowerMessage.includes('resolve') || lowerMessage.includes('remediate')) {
      return 'remediation';
    } else if (lowerMessage.includes('risk') || lowerMessage.includes('impact') || lowerMessage.includes('assess')) {
      return 'risk_assessment';
    } else if (lowerMessage.includes('explain') || lowerMessage.includes('what') || lowerMessage.includes('how')) {
      return 'explanation';
    } else if (lowerMessage.includes('priority') || lowerMessage.includes('urgent') || lowerMessage.includes('critical')) {
      return 'prioritization';
    } else if (lowerMessage.includes('code') || lowerMessage.includes('implement') || lowerMessage.includes('example')) {
      return 'implementation';
    } else {
      return 'general_inquiry';
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium-high': return 'text-yellow-600 bg-yellow-50';
      case 'medium': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = (trends: any) => {
    if (trends?.improving) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trends?.degrading) return <AlertTriangle className="w-4 h-4 text-red-600" />;
    return <CheckCircle className="w-4 h-4 text-blue-600" />;
  };

  const handleSlashCommand = (command: string) => {
    const commands = {
      '/analyze': 'Analyze the security vulnerabilities in ',
      '/summarize': 'Summarize the current threat landscape for ',
      '/fix': 'How can I fix the security issues in ',
      '/impact': 'What is the business impact of vulnerabilities in ',
      '/remediate': 'Provide step-by-step remediation for '
    };

    if (commands[command as keyof typeof commands]) {
      setMessage(commands[command as keyof typeof commands]);
    }
  };

  const quickActions = [
    { label: "Analyze Repository", command: "/analyze" },
    { label: "Summarize Threats", command: "/summarize" },
    { label: "Fix Guidance", command: "/fix" },
    { label: "Impact Assessment", command: "/impact" }
  ];

  return (
    <>
      {/* Floating Button */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            className={cn(
              "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
              "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700",
              "text-white border-0 transition-all duration-300 hover:scale-110"
            )}
            size="lg"
          >
            <Brain className="h-6 w-6" />
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl h-[600px] flex flex-col">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold">Security Copilot</DialogTitle>
                  <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
                    AI-powered security assistant with slash commands
                  </DialogDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                AI
              </Badge>
            </div>
          </DialogHeader>

          <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
            {/* Alert Context */}
            {alertContext && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Alert Context</span>
                </div>
                <div className="text-sm text-amber-700 dark:text-amber-300">
                  <p><strong>Repository:</strong> {alertContext.repo}</p>
                  <p><strong>Vulnerability:</strong> {alertContext.vulnerability}</p>
                  <p><strong>Severity:</strong> {alertContext.severity}</p>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Actions:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.command}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSlashCommand(action.command)}
                    className="text-xs"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Enhanced Response Area with Contextual Insights */}
            {aiResponse && (
              <ScrollArea className="flex-1 h-96">
                <div className="space-y-4">
                  {/* AI Response */}
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-start space-x-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <Brain className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {aiResponse.response}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Contextual Security Insights */}
                  {aiResponse.contextualInsights && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center space-x-2 text-sm">
                          <Shield className="w-4 h-4" />
                          <span>Security Overview</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                              {aiResponse.contextualInsights.securityScore?.toFixed(1) || 'N/A'}
                            </div>
                            <div className="text-xs text-blue-600 dark:text-blue-400">Security Score</div>
                          </div>
                          <div className={`text-center p-2 rounded-lg ${getRiskLevelColor(aiResponse.contextualInsights.riskLevel)}`}>
                            <div className="flex items-center justify-center space-x-1">
                              {getTrendIcon(aiResponse.contextualInsights.trends)}
                              <span className="text-sm font-medium">{aiResponse.contextualInsights.riskLevel}</span>
                            </div>
                            <div className="text-xs">Risk Level</div>
                          </div>
                        </div>

                        {/* Immediate Actions */}
                        {aiResponse.contextualInsights.nextActions?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority Actions</h4>
                            <div className="space-y-1">
                              {aiResponse.contextualInsights.nextActions.slice(0, 3).map((action, index) => (
                                <div key={index} className="flex items-start space-x-2 text-xs">
                                  <AlertTriangle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-gray-600 dark:text-gray-400">{action}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Intelligent Suggestions */}
                  {aiResponse.intelligentSuggestions && aiResponse.intelligentSuggestions.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center space-x-2 text-sm">
                          <Zap className="w-4 h-4" />
                          <span>Smart Recommendations</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {aiResponse.intelligentSuggestions.map((suggestion, index) => (
                            <div key={index} className="flex items-start space-x-2 text-xs">
                              <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-600 dark:text-gray-400">{suggestion}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Relevant Documentation */}
                  {aiResponse.relevantDocumentation && aiResponse.relevantDocumentation.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center space-x-2 text-sm">
                          <BookOpen className="w-4 h-4" />
                          <span>Documentation</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1">
                          {aiResponse.relevantDocumentation.map((doc, index) => (
                            <div key={index} className="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                              {doc}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </ScrollArea>
            )}

            {/* Input Area */}
            <div className="space-y-3 pt-4 border-t">
              <Textarea
                placeholder="Ask me about security vulnerabilities, threat analysis, or type slash commands like /analyze..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[80px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Press Enter to send, Shift+Enter for new line
                </div>
                <Button 
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}