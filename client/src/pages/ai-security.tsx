import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, AlertTriangle, Shield, Brain, Send, Wifi, WifiOff } from 'lucide-react';
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

  const { data: vulnerabilities = [], isLoading: vulnerabilitiesLoading } = useQuery({
    queryKey: ['/api/security-copilot/vulnerabilities'],
    enabled: isAuthenticated,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Add welcome message on mount
  useEffect(() => {
    if (chatMessages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'assistant',
        content: 'Hello! I\'m your AI Security Copilot. I can help you analyze vulnerabilities, suggest remediation strategies, and provide security best practices. Select a vulnerability below or ask me any security-related question!',
        timestamp: new Date(),
        followUpQuestions: [
          'What are the most critical vulnerabilities in my project?',
          'How should I prioritize vulnerability remediation?',
          'What are the current security best practices?'
        ]
      };
      setChatMessages([welcomeMessage]);
    }
  }, []);

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

    try {
      const requestBody = {
        message,
        context: selectedVulnerability,
        conversationHistory: chatMessages.slice(-10).map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      };

      const response = await apiRequestWithRetry('POST', '/api/security-copilot/chat', requestBody, 2);

      if (response.success && response.data) {
        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          type: 'assistant',
          content: response.data.response || 'I apologize, but I encountered an issue processing your request.',
          timestamp: new Date(),
          confidence: response.data.confidence,
          suggestions: response.data.suggestions,
          followUpQuestions: response.data.followUpQuestions,
        };
        setChatMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(response.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Chat error:', error);
      setConnectionStatus('disconnected');
      
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: 'I\'m currently experiencing connection issues. Please check your internet connection and try again. If the problem persists, contact support.',
        timestamp: new Date(),
        isError: true,
        followUpQuestions: ['Try asking your question again', 'Contact support for assistance']
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiTyping(false);
    }
  }, [selectedVulnerability, chatMessages, isAiTyping]);

  const handleVulnerabilitySelect = useCallback((vuln: Vulnerability) => {
    setSelectedVulnerability(vuln);
    
    const contextMessage: ChatMessage = {
      id: `context-${Date.now()}`,
      type: 'system',
      content: `Selected vulnerability: ${vuln.cve} in ${vuln.package} (${vuln.severity.toUpperCase()} severity)`,
      timestamp: new Date(),
    };
    
    const aiMessage: ChatMessage = {
      id: `ai-context-${Date.now()}`,
      type: 'assistant',
      content: `I've analyzed ${vuln.cve} in ${vuln.package}. This is a ${vuln.severity} severity vulnerability. I can help you understand its impact, provide remediation steps, or suggest preventive measures. What would you like to know?`,
      timestamp: new Date(),
      followUpQuestions: [
        'What\'s the impact of this vulnerability?',
        'How do I fix this vulnerability?',
        'Are there any workarounds available?',
        'How can I prevent similar vulnerabilities?'
      ]
    };
    
    setChatMessages(prev => [...prev, contextMessage, aiMessage]);
  }, []);

  const handleQuickQuestion = useCallback((question: string) => {
    sendChatMessage(question);
  }, [sendChatMessage]);

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Bot className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold">AI Security Copilot</h1>
          <div className={`ml-auto px-2 py-1 rounded-full text-xs ${
            connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
            connectionStatus === 'reconnecting' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {connectionStatus === 'connected' ? (
              <><Wifi className="w-3 h-3 inline mr-1" />Connected</>
            ) : connectionStatus === 'reconnecting' ? (
              <><Wifi className="w-3 h-3 inline mr-1" />Reconnecting</>
            ) : (
              <><WifiOff className="w-3 h-3 inline mr-1" />Disconnected</>
            )}
          </div>
        </div>
        <p className="text-gray-600 text-lg">
          AI-powered vulnerability analysis and mitigation guidance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vulnerability Sidebar */}
        <div className="lg:col-span-1">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Select Vulnerability
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {vulnerabilitiesLoading ? (
                <div className="animate-pulse space-y-2 p-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto p-4">
                  {Array.isArray(vulnerabilities) && vulnerabilities.length > 0 ? (
                    vulnerabilities.map((vuln: any) => (
                      <button
                        key={vuln.id}
                        onClick={() => handleVulnerabilitySelect(vuln)}
                        className={`w-full text-left p-3 rounded-lg border transition-all hover:shadow-sm ${
                          selectedVulnerability?.id === vuln.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-medium text-sm">{vuln.cve}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getSeverityColor(vuln.severity)}`}>
                            {vuln.severity.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">{vuln.package}</div>
                        {vuln.description && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2">{vuln.description}</div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <Shield className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No vulnerabilities found</p>
                      <p className="text-xs mt-1">Add repositories to see vulnerabilities</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="flex flex-col h-[600px]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-600" />
                AI Security Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                  <>
                    {chatMessages.map(message => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.type === 'user'
                              ? 'bg-blue-600 text-white'
                              : message.type === 'system'
                              ? 'bg-gray-100 text-gray-700 text-sm'
                              : message.isError
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <div className="whitespace-pre-wrap">{message.content}</div>
                          
                          {/* Confidence indicator */}
                          {message.confidence && (
                            <div className="mt-2 text-xs opacity-70">
                              Confidence: {Math.round(message.confidence * 100)}%
                            </div>
                          )}
                          
                          {/* Follow-up questions */}
                          {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                            <div className="mt-3 space-y-1">
                              <div className="text-xs opacity-70">Quick questions:</div>
                              {message.followUpQuestions.map((question, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleQuickQuestion(question)}
                                  className="block w-full text-left text-xs p-2 rounded bg-white bg-opacity-20 hover:bg-opacity-30 transition-all"
                                >
                                  {question}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {/* Typing indicator */}
                    {isAiTyping && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input */}
              <div className="border-t p-4">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendChatMessage(currentMessage);
                  }}
                  className="flex gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder="Ask about vulnerabilities, remediation strategies, or security best practices..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isAiTyping}
                  />
                  <Button 
                    type="submit" 
                    disabled={!currentMessage.trim() || isAiTyping}
                    className="px-4 py-2"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}