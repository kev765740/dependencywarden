import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Brain,
  MessageSquare,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink,
  Copy,
  Sparkles,
  Search,
  FileText,
  Code,
  Lightbulb,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VulnerabilityContext {
  id: string;
  cve: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  package: string;
  version: string;
  description: string;
  affectedRepositories: string[];
  exploitability: number;
  businessImpact: string;
}

interface CopilotResponse {
  explanation: string;
  riskAssessment: {
    score: number;
    factors: string[];
    businessContext: string;
  };
  mitigationSteps: Array<{
    priority: 'immediate' | 'high' | 'medium' | 'low';
    action: string;
    description: string;
    estimatedTime: string;
    complexity: 'simple' | 'moderate' | 'complex';
  }>;
  codeExamples: Array<{
    type: 'before' | 'after' | 'config';
    language: string;
    code: string;
    description: string;
  }>;
  relatedThreats: string[];
  compliance: Array<{
    framework: string;
    requirement: string;
    status: 'compliant' | 'non-compliant' | 'partial';
  }>;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  vulnerability?: VulnerabilityContext;
  response?: CopilotResponse;
}

export default function SecurityCopilot() {
  const { toast } = useToast();
  const [selectedVulnerability, setSelectedVulnerability] = useState<VulnerabilityContext | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Check for URL parameters to pre-fill prompt
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const promptFromUrl = urlParams.get('prompt');
    if (promptFromUrl) {
      setInputMessage(decodeURIComponent(promptFromUrl));
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Fetch authentic vulnerabilities from backend
  const { data: vulnerabilities = [], isLoading: vulnerabilitiesLoading } = useQuery({
    queryKey: ['/api/vulnerabilities']
  });

  const explainVulnerability = useMutation({
    mutationFn: async (vulnerability: VulnerabilityContext) => {
      const response = await apiRequest("POST", "/api/security-copilot/analyze", {
        vulnerabilityId: vulnerability.id,
        cve: vulnerability.cve,
        userMessage: `Explain this vulnerability and provide mitigation steps`
      });
      return await response.json() as CopilotResponse;
    },
    onSuccess: (response: CopilotResponse, vulnerability) => {
      const messageId = Date.now().toString();
      setChatMessages(prev => [
        ...prev,
        {
          id: messageId,
          type: "assistant",
          content: `I've analyzed ${vulnerability.cve} in ${vulnerability.package}. Here's my assessment:`,
          timestamp: new Date(),
          vulnerability,
          response
        }
      ]);
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze vulnerability. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/security-copilot/analyze", {
        message: message,
        userMessage: message,
        vulnerabilityId: selectedVulnerability?.id,
        cve: selectedVulnerability?.cve,
        context: {
          selectedVulnerability,
          conversationLength: chatMessages.length,
          timestamp: new Date().toISOString()
        }
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const userMessageId = Date.now().toString();
      const assistantMessageId = (Date.now() + 1).toString();
      
      setChatMessages(prev => [
        ...prev,
        {
          id: userMessageId,
          type: "user",
          content: inputMessage,
          timestamp: new Date()
        },
        {
          id: assistantMessageId,
          type: "assistant", 
          content: data.message || "I've completed my analysis. Here are my findings and recommendations.",
          timestamp: new Date(),
          response: data.analysis // Store the full analysis for detailed display
        }
      ]);
      setInputMessage("");
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: "Unable to process your security query. Please try again or contact support.",
        variant: "destructive",
      });
      
      // Add error message to chat
      const errorMessageId = Date.now().toString();
      setChatMessages(prev => [
        ...prev,
        {
          id: errorMessageId,
          type: "assistant",
          content: "I encountered an error while analyzing your request. Please try rephrasing your question or check your connection.",
          timestamp: new Date()
        }
      ]);
    },
  });

  const handleVulnerabilitySelect = (vulnerability: VulnerabilityContext) => {
    setSelectedVulnerability(vulnerability);
    explainVulnerability.mutate(vulnerability);
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    sendMessage.mutate(inputMessage);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'immediate': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const filteredVulnerabilities = (vulnerabilities as any)?.filter?.((vuln: any) =>
    searchQuery === "" || 
    vuln.cve?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
    vuln.package?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
    vuln.description?.toLowerCase()?.includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security Copilot</h1>
            <p className="text-gray-600 dark:text-gray-400">AI-powered vulnerability analysis and mitigation guidance</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          <Sparkles className="h-3 w-3 mr-1" />
          AI Powered
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vulnerability List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Vulnerabilities</span>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search vulnerabilities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              <div className="space-y-2 p-4">
                {filteredVulnerabilities?.map?.((vulnerability: any) => (
                  <div
                    key={vulnerability.id}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedVulnerability?.id === vulnerability.id
                        ? "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                    onClick={() => handleVulnerabilitySelect(vulnerability)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Badge className={cn("text-xs", getSeverityColor(vulnerability.severity))}>
                            {vulnerability.severity.toUpperCase()}
                          </Badge>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {vulnerability.cve}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {vulnerability.package} v{vulnerability.version}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2">
                          {vulnerability.description}
                        </p>
                      </div>
                      <AlertTriangle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Interface */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>AI Security Assistant</span>
              {selectedVulnerability && (
                <Badge variant="outline">
                  Analyzing {selectedVulnerability.cve}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Chat Messages */}
            <ScrollArea className="h-96 border rounded-lg p-4">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <Brain className="h-12 w-12 text-gray-400" />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Welcome to Security Copilot</h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Select a vulnerability to get AI-powered analysis and mitigation guidance
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatMessages.map((message) => (
                    <div key={message.id} className="space-y-3">
                      <div className={cn(
                        "flex items-start space-x-3",
                        message.type === "user" ? "justify-end" : "justify-start"
                      )}>
                        {message.type === "assistant" && (
                          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                            <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          </div>
                        )}
                        <div className={cn(
                          "max-w-[80%] rounded-lg p-3",
                          message.type === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
                        )}>
                          <p className="text-sm">{message.content}</p>
                          <span className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      {/* Detailed Analysis */}
                      {message.response && (
                        <div className="ml-12 space-y-4">
                          {/* Risk Assessment */}
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center space-x-2">
                                <TrendingUp className="h-4 w-4" />
                                <span>Risk Assessment</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-medium">Risk Score:</span>
                                <Badge className={cn(
                                  message.response.riskAssessment.score >= 8 ? "bg-red-100 text-red-800" :
                                  message.response.riskAssessment.score >= 6 ? "bg-orange-100 text-orange-800" :
                                  message.response.riskAssessment.score >= 4 ? "bg-yellow-100 text-yellow-800" :
                                  "bg-green-100 text-green-800"
                                )}>
                                  {message.response.riskAssessment.score}/10
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {message.response.riskAssessment.businessContext}
                              </p>
                            </CardContent>
                          </Card>

                          {/* Mitigation Steps */}
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center space-x-2">
                                <Lightbulb className="h-4 w-4" />
                                <span>Mitigation Steps</span>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {message.response.mitigationSteps.map((step, index) => (
                                <div key={index} className="border rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <Badge className={cn("text-xs", getPriorityColor(step.priority))}>
                                      {step.priority.toUpperCase()}
                                    </Badge>
                                    <span className="text-xs text-gray-500">{step.estimatedTime}</span>
                                  </div>
                                  <h4 className="font-medium text-sm">{step.action}</h4>
                                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {step.description}
                                  </p>
                                </div>
                              ))}
                            </CardContent>
                          </Card>

                          {/* Code Examples */}
                          {message.response.codeExamples.length > 0 && (
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm flex items-center space-x-2">
                                  <Code className="h-4 w-4" />
                                  <span>Code Examples</span>
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                {message.response.codeExamples.map((example, index) => (
                                  <div key={index} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Badge variant="outline" className="text-xs">
                                        {example.type} - {example.language}
                                      </Badge>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">
                                      {example.description}
                                    </p>
                                    <pre className="bg-gray-100 dark:bg-gray-800 rounded p-2 text-xs overflow-x-auto">
                                      <code>{example.code}</code>
                                    </pre>
                                  </div>
                                ))}
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Input */}
            <div className="flex space-x-2">
              <Textarea
                placeholder="Ask me about this vulnerability, mitigation strategies, or security best practices..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="min-h-[60px]"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || sendMessage.isPending}
                className="px-6"
              >
                {sendMessage.isPending ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  "Send"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}