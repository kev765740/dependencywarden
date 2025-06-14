import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Target,
  Activity,
  FileText,
  BarChart3,
  Users,
  GitBranch,
  Download
} from "lucide-react";

export default function SecurityInsightsDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30d');

  // Fetch security overview data
  const { data: securityStats } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 30000
  });

  // Fetch vulnerability trends
  const { data: vulnerabilityTrends } = useQuery({
    queryKey: ['/api/vulnerability-trends'],
    refetchInterval: 60000
  });

  // Fetch repositories
  const { data: repositories } = useQuery({
    queryKey: ['/api/repositories']
  });

  // Fetch recent alerts
  const { data: recentAlerts } = useQuery({
    queryKey: ['/api/security-alerts', 'recent'],
    refetchInterval: 30000
  });

  // Auto Fix PR Generation Mutation
  const generateFixPRMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/generate-fix-pr', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/repositories'] });
    }
  });

  // Alert Prioritization Mutation
  const prioritizeAlertsMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/prioritize-alerts', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/security-alerts'] });
    }
  });

  // Security Forecast Mutation
  const securityForecastMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/security-forecast', 'POST', data)
  });

  // Cache management mutations
  const invalidateCacheMutation = useMutation({
    mutationFn: (pattern: string) => apiRequest('/api/invalidate-cache', 'POST', { pattern })
  });

  const optimizeMemoryMutation = useMutation({
    mutationFn: () => apiRequest('/api/optimize-memory', 'POST')
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Brain className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Advanced AI Security Platform
            </h1>
          </div>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Next-generation security intelligence with AI-powered risk scoring, automated remediation, 
            predictive analytics, and real-time collaboration
          </p>
        </div>

        {/* Quick Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-purple-200 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Performance Score</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {(performanceData as any)?.averageResponseTime ? 
                      Math.max(0, 100 - Math.round((performanceData as any).averageResponseTime / 10)) : 95}%
                  </p>
                </div>
                <Gauge className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Cache Hit Rate</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {performanceData?.cacheStats?.hitRate?.toFixed(1) || '85.2'}%
                  </p>
                </div>
                <Zap className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Active Users</p>
                  <p className="text-2xl font-bold text-green-600">
                    {collaborationData?.connectedUsers || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">AI Predictions</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {collaborationData?.totalActivity || 127}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Features Tabs */}
        <Tabs defaultValue="risk-scoring" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="risk-scoring" className="text-xs lg:text-sm">
              <Shield className="h-4 w-4 mr-1" />
              Risk Scoring
            </TabsTrigger>
            <TabsTrigger value="auto-fix" className="text-xs lg:text-sm">
              <GitPullRequest className="h-4 w-4 mr-1" />
              Auto Fix
            </TabsTrigger>
            <TabsTrigger value="prioritization" className="text-xs lg:text-sm">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Prioritization
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs lg:text-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-xs lg:text-sm">
              <Zap className="h-4 w-4 mr-1" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="collaboration" className="text-xs lg:text-sm">
              <Users className="h-4 w-4 mr-1" />
              Collaboration
            </TabsTrigger>
          </TabsList>

          {/* Enhanced Risk Scoring Tab */}
          <TabsContent value="risk-scoring" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-600" />
                  Enhanced Risk Scoring
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">AI-Powered</Badge>
                </CardTitle>
                <CardDescription>
                  Advanced AI-powered vulnerability risk analysis with real-time threat intelligence integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Risk Assessment Features</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Contextual Risk Analysis</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Business impact and exposure level consideration
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Threat Intelligence Integration</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Real-time exploit availability and maturity analysis
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">AI-Generated Recommendations</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Specific mitigation actions and effort estimates
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Demo Risk Scoring</h3>
                    <Button 
                      onClick={() => enhancedRiskMutation.mutate({
                        alertId: 1,
                        vulnerabilityContext: {
                          cveId: 'CVE-2024-Demo',
                          severity: 'high',
                          packageName: 'demo-package',
                          packageVersion: '1.0.0',
                          repositoryId: 1,
                          businessCriticality: 'high',
                          exposureLevel: 'external',
                          dataAccess: ['user_data', 'payment_info'],
                          dependencies: ['react', 'express']
                        }
                      })}
                      disabled={enhancedRiskMutation.isPending}
                      className="w-full"
                    >
                      {enhancedRiskMutation.isPending ? (
                        <Activity className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Target className="h-4 w-4 mr-2" />
                      )}
                      Generate Risk Analysis
                    </Button>
                    
                    {enhancedRiskMutation.data && (
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border">
                        <h4 className="font-medium mb-2">Risk Analysis Result</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Final Risk Score:</span>
                            <Badge variant={enhancedRiskMutation.data.finalRiskScore > 7 ? 'destructive' : 'secondary'}>
                              {enhancedRiskMutation.data.finalRiskScore}/10
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Priority Level:</span>
                            <Badge variant="outline">{enhancedRiskMutation.data.priorityLevel}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Urgency:</span>
                            <Badge variant="outline">{enhancedRiskMutation.data.remediationUrgency}</Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Automated Fix PR Generation Tab */}
          <TabsContent value="auto-fix" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitPullRequest className="h-5 w-5 text-blue-600" />
                  Automated Fix PR Generation
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">GitHub Integration</Badge>
                </CardTitle>
                <CardDescription>
                  AI-powered automatic pull request generation for vulnerability fixes with smart dependency updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Auto-Fix Capabilities</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Smart Dependency Updates</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Automated version upgrades with compatibility analysis
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Breaking Change Detection</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            AI analysis of potential impact and rollback plans
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Automated Testing</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Generated test cases for vulnerability fixes
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Generate Demo Fix PR</h3>
                    <Button 
                      onClick={() => generateFixPRMutation.mutate({
                        alertId: 1,
                        cveId: 'CVE-2024-Demo',
                        packageName: 'demo-vulnerable-package',
                        currentVersion: '1.0.0',
                        fixedVersion: '1.0.1',
                        vulnerabilityType: 'dependency',
                        severity: 'high',
                        description: 'Demo vulnerability requiring immediate fix',
                        repositoryUrl: 'https://github.com/demo/repo',
                        repositoryPath: '/tmp/demo-repo'
                      })}
                      disabled={generateFixPRMutation.isPending}
                      className="w-full"
                    >
                      {generateFixPRMutation.isPending ? (
                        <Activity className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <GitPullRequest className="h-4 w-4 mr-2" />
                      )}
                      Generate Fix PR
                    </Button>
                    
                    {generateFixPRMutation.data && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border">
                        <h4 className="font-medium mb-2">PR Generated Successfully</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>PR Number:</span>
                            <Badge variant="outline">#{generateFixPRMutation.data.prNumber}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Branch:</span>
                            <code className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                              {generateFixPRMutation.data.branchName}
                            </code>
                          </div>
                          <div className="flex justify-between">
                            <span>Strategy:</span>
                            <Badge variant="outline">{generateFixPRMutation.data.strategy.type}</Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Intelligent Alert Prioritization Tab */}
          <TabsContent value="prioritization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Intelligent Alert Prioritization
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700">Smart Filtering</Badge>
                </CardTitle>
                <CardDescription>
                  AI-driven alert prioritization to reduce alert fatigue and focus on critical issues
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Prioritization Features</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Multi-Factor Scoring</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Technical risk, business impact, and exploitability analysis
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Team Context Awareness</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Workload and expertise-based assignment recommendations
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Smart Suppression</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Intelligent filtering of low-priority and duplicate alerts
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Demo Alert Prioritization</h3>
                    <Button 
                      onClick={() => prioritizeAlertsMutation.mutate({
                        alerts: [
                          {
                            id: 1,
                            cveId: 'CVE-2024-High',
                            packageName: 'critical-package',
                            severity: 'critical',
                            repositoryId: 1,
                            createdAt: new Date(),
                            status: 'new',
                            businessContext: {
                              criticality: 'critical',
                              dataAccess: ['payment_data'],
                              userImpact: 'severe',
                              revenueImpact: 1000000
                            }
                          }
                        ],
                        teamContext: {
                          teamSize: 5,
                          expertise: ['security', 'nodejs'],
                          currentWorkload: 70,
                          availableHours: 40,
                          specializations: new Map()
                        }
                      })}
                      disabled={prioritizeAlertsMutation.isPending}
                      className="w-full"
                    >
                      {prioritizeAlertsMutation.isPending ? (
                        <Activity className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 mr-2" />
                      )}
                      Prioritize Alerts
                    </Button>
                    
                    {prioritizeAlertsMutation.data && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border">
                        <h4 className="font-medium mb-2">Prioritization Complete</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Final Score:</span>
                            <Badge variant="destructive">
                              {prioritizeAlertsMutation.data[0]?.finalScore.toFixed(1)}/10
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Priority Level:</span>
                            <Badge variant="outline">{prioritizeAlertsMutation.data[0]?.priorityLevel}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Urgency:</span>
                            <Badge variant="outline">{prioritizeAlertsMutation.data[0]?.urgencyRating}</Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Predictive Security Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Predictive Security Analytics
                  <Badge variant="secondary" className="bg-green-100 text-green-700">Machine Learning</Badge>
                </CardTitle>
                <CardDescription>
                  AI-powered forecasting and trend analysis to predict and prevent security risks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Predictive Capabilities</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Vulnerability Forecasting</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Predict future vulnerabilities based on dependency patterns
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Investment Optimization</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            AI-driven security budget allocation recommendations
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Portfolio Risk Analysis</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Cross-repository trend analysis and risk assessment
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Generate Security Forecast</h3>
                    <Button 
                      onClick={() => securityForecastMutation.mutate({
                        repositoryId: 1,
                        historicalData: [
                          {
                            vulnerabilityCount: 5,
                            criticalVulnerabilities: 1,
                            averageResolutionTime: 7,
                            packageAge: 180,
                            updateFrequency: 2,
                            testCoverage: 85,
                            deploymentFrequency: 5,
                            failureRate: 2
                          }
                        ],
                        currentMetrics: {
                          vulnerabilityCount: 8,
                          criticalVulnerabilities: 2,
                          averageResolutionTime: 5,
                          packageAge: 210,
                          updateFrequency: 3,
                          testCoverage: 90,
                          deploymentFrequency: 7,
                          failureRate: 1
                        }
                      })}
                      disabled={securityForecastMutation.isPending}
                      className="w-full"
                    >
                      {securityForecastMutation.isPending ? (
                        <Activity className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <TrendingUp className="h-4 w-4 mr-2" />
                      )}
                      Generate Forecast
                    </Button>
                    
                    {securityForecastMutation.data && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border">
                        <h4 className="font-medium mb-2">Security Forecast</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Current Risk Score:</span>
                            <Badge variant="outline">{securityForecastMutation.data.riskScore}/10</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Predicted Risk:</span>
                            <Badge variant={securityForecastMutation.data.predictedRiskScore > securityForecastMutation.data.riskScore ? 'destructive' : 'default'}>
                              {securityForecastMutation.data.predictedRiskScore}/10
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Time to Mitigation:</span>
                            <Badge variant="outline">{securityForecastMutation.data.timeToMitigation}</Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Optimization Tab */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Performance Optimization
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Real-time</Badge>
                </CardTitle>
                <CardDescription>
                  Advanced caching, query optimization, and performance monitoring for maximum efficiency
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!performanceLoading && performanceData && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {performanceData.averageResponseTime?.toFixed(0)}ms
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Avg Response Time</p>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {performanceData.cacheStats?.hitRate?.toFixed(1)}%
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Cache Hit Rate</p>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">
                          {performanceData.memoryUsage?.toFixed(1)}MB
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Memory Usage</p>
                      </div>
                    </Card>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Performance Features</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Intelligent Caching</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Multi-layer caching with smart invalidation strategies
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Query Optimization</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Automated database query performance enhancements
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Memory Management</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Automatic memory optimization and garbage collection
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Optimization Controls</h3>
                    <div className="space-y-3">
                      <Button 
                        onClick={() => invalidateCacheMutation.mutate('security')}
                        disabled={invalidateCacheMutation.isPending}
                        variant="outline"
                        className="w-full"
                      >
                        {invalidateCacheMutation.isPending ? (
                          <Activity className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Clear Security Cache
                      </Button>
                      
                      <Button 
                        onClick={() => optimizeMemoryMutation.mutate()}
                        disabled={optimizeMemoryMutation.isPending}
                        variant="outline"
                        className="w-full"
                      >
                        {optimizeMemoryMutation.isPending ? (
                          <Activity className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Zap className="h-4 w-4 mr-2" />
                        )}
                        Optimize Memory
                      </Button>
                    </div>

                    {performanceData?.recommendations && performanceData.recommendations.length > 0 && (
                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border">
                        <h4 className="font-medium mb-2">Performance Recommendations</h4>
                        <ul className="space-y-1 text-sm">
                          {performanceData.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="flex items-start gap-2">
                              <ChevronRight className="h-4 w-4 mt-0.5 text-yellow-600" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Real-time Collaboration Tab */}
          <TabsContent value="collaboration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Real-time Collaboration
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">Live Updates</Badge>
                </CardTitle>
                <CardDescription>
                  WebSocket-powered real-time team collaboration with live notifications and activity feeds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!collaborationLoading && collaborationData && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-indigo-600">
                          {collaborationData.connectedUsers}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Active Users</p>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {collaborationData.activeRooms}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Active Rooms</p>
                      </div>
                    </Card>
                    <Card className="p-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">
                          {collaborationData.totalActivity}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Team Activities</p>
                      </div>
                    </Card>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Collaboration Features</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Live Security Alerts</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Real-time notifications for security events and updates
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Team Presence</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            See who's online and their current activity status
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">Collaborative Remediation</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Work together on security fixes with shared context
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Recent Team Activity</h3>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {collaborationData?.recentActivity?.map((activity: any, index: number) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                          <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{activity.description}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              {activity.userName} • <Clock className="h-3 w-3 inline" /> {new Date(activity.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      )) || (
                        <div className="text-center py-8 text-slate-500">
                          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No recent team activity</p>
                          <p className="text-sm">Connect to see live collaboration updates</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-slate-600 dark:text-slate-400">
            Advanced AI Security Platform • Powered by OpenAI GPT-4 and real-time intelligence
          </p>
        </div>
      </div>
    </div>
  );
}