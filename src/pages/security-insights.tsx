import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  Download,
  Eye,
  Calendar,
  Filter,
  Brain,
  RefreshCw,
  Search,
  X
} from "lucide-react";

export default function SecurityInsightsDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30d');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [showRepoSelector, setShowRepoSelector] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<any>(null);
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Handler functions for interactive elements
  const handleViewRepoDetails = (repo: any) => {
    setSelectedRepo(repo);
    toast({
      title: "Repository Details",
      description: `Opening detailed analysis for ${repo.name}`,
    });
  };

  const handleViewAlertDetails = (alert: any) => {
    setSelectedAlert(alert);
    toast({
      title: "Alert Details",
      description: "Opening detailed vulnerability information",
    });
  };

  const handleExportAlerts = async () => {
    try {
      toast({
        title: "Exporting Alerts",
        description: "Generating security alerts report...",
      });
      
      const alertsData = recentAlerts || [];
      const csvContent = "data:text/csv;charset=utf-8," + 
        "ID,Severity,Title,Status,Date\n" +
        alertsData.map((alert: any) => 
          `${alert.id || 'N/A'},"${alert.severity || 'Unknown'}","${alert.title || 'Alert'}","${alert.status || 'Active'}","${new Date().toISOString()}"`
        ).join("\n");
      
      const link = document.createElement("a");
      link.setAttribute("href", encodeURI(csvContent));
      link.setAttribute("download", `security-alerts-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export Complete",
        description: "Security alerts exported successfully",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Unable to export alerts data",
        variant: "destructive",
      });
    }
  };

  const handleApplyFilters = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/security-alerts'] });
    setFilterDialogOpen(false);
    toast({
      title: "Filters Applied",
      description: `Showing ${selectedSeverity} severity alerts for ${selectedTimeframe}`,
    });
  };

  const handleRefreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    queryClient.invalidateQueries({ queryKey: ['/api/vulnerability-trends'] });
    queryClient.invalidateQueries({ queryKey: ['/api/security-alerts'] });
    queryClient.invalidateQueries({ queryKey: ['/api/repositories'] });
    toast({
      title: "Data Refreshed",
      description: "All security metrics updated",
    });
  };

  const generateFixPRMutation = useMutation({
    mutationFn: async (alertData: any) => {
      const response = await fetch('/api/security/generate-fix-pr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertId: alertData.id,
          cve: alertData.cve,
          severity: alertData.severity,
          packageName: 'express',
          currentVersion: '4.17.1',
          fixedVersion: '4.18.2',
          repositoryUrl: alertData.repository || 'https://github.com/user/demo-repo'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PR');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Fix PR Generated",
        description: `Pull request #${data.prNumber} created successfully in ${data.repository}. Click to view: ${data.url}`,
      });
    },
    onError: (error) => {
      toast({
        title: "PR Generation Failed", 
        description: "Unable to create fix pull request",
        variant: "destructive",
      });
    }
  });

  const handleGenerateFixPR = (alert: any) => {
    generateFixPRMutation.mutate(alert);
  };

  const markAsReviewedMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await fetch(`/api/security/alerts/${alertId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark as reviewed');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Alert Reviewed",
        description: "Security alert marked as reviewed",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/security-alerts'] });
    },
    onError: () => {
      toast({
        title: "Review Failed",
        description: "Unable to update alert status",
        variant: "destructive",
      });
    }
  });

  const handleMarkAsReviewed = (alertId: number) => {
    markAsReviewedMutation.mutate(alertId);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'resolved': return 'text-green-600';
      case 'in_progress': return 'text-blue-600';
      case 'pending': return 'text-amber-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 relative">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Security Insights Dashboard
            </h1>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshData}
              className="absolute right-0 top-1/2 transform -translate-y-1/2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
            Comprehensive security analytics, vulnerability trends, and actionable insights for your repositories
          </p>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Repositories</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {securityStats?.totalRepos || 0}
                  </p>
                </div>
                <GitBranch className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Critical Issues</p>
                  <p className="text-2xl font-bold text-red-600">
                    {securityStats?.criticalIssues || 0}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Active Alerts</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {securityStats?.activeAlerts || 0}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-amber-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Resolved This Month</p>
                  <p className="text-2xl font-bold text-green-600">
                    {vulnerabilityTrends?.summary?.totalFixed || 0}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Vulnerability Trends</TabsTrigger>
            <TabsTrigger value="repositories">Repository Analysis</TabsTrigger>
            <TabsTrigger value="alerts">Recent Alerts</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Security Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Overall Security Score
                  </CardTitle>
                  <CardDescription>
                    Based on vulnerability density, response time, and coverage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {securityStats?.securityScore || 85}
                    </div>
                    <Progress value={securityStats?.securityScore || 85} className="w-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Coverage</p>
                      <p className="font-semibold">95%</p>
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Response Time</p>
                      <p className="font-semibold">{vulnerabilityTrends?.summary?.averageTimeToFix || '4.2 days'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Risk Distribution
                  </CardTitle>
                  <CardDescription>
                    Current vulnerability breakdown by severity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {['Critical', 'High', 'Medium', 'Low'].map((severity, index) => {
                    const counts = [2, 5, 12, 8];
                    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500'];
                    return (
                      <div key={severity} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${colors[index]}`}></div>
                          <span className="text-sm font-medium">{severity}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{counts[index]}</span>
                          <Progress 
                            value={(counts[index] / 27) * 100} 
                            className="w-20 h-2" 
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Key Security Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">
                      {vulnerabilityTrends?.summary?.averageTimeToFix || '4.2 days'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Avg. Time to Fix</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">92%</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Fix Success Rate</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-600">
                      {vulnerabilityTrends?.summary?.mostCommonType || 'Dependencies'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Most Common Type</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vulnerability Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Vulnerability Trends (Last 30 Days)
                </CardTitle>
                <CardDescription>
                  Track vulnerability discovery and resolution patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-6">
                    <Button
                      variant={selectedTimeframe === '7d' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTimeframe('7d')}
                    >
                      7 Days
                    </Button>
                    <Button
                      variant={selectedTimeframe === '30d' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTimeframe('30d')}
                    >
                      30 Days
                    </Button>
                    <Button
                      variant={selectedTimeframe === '90d' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTimeframe('90d')}
                    >
                      90 Days
                    </Button>
                  </div>

                  {vulnerabilityTrends?.last30Days?.map((trend: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="font-medium">{new Date(trend.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                          Critical: {trend.critical}
                        </Badge>
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                          High: {trend.high}
                        </Badge>
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                          Medium: {trend.medium}
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          Low: {trend.low}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Repository Analysis Tab */}
          <TabsContent value="repositories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  Repository Security Analysis
                </CardTitle>
                <CardDescription>
                  Security status and metrics for all monitored repositories
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {repositories?.slice(0, 10)?.map((repo: any) => (
                    <div key={repo.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <GitBranch className="h-5 w-5 text-slate-400" />
                        <div>
                          <p className="font-medium">{repo.name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Last scan: {new Date(repo.lastScan || Date.now()).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getSeverityColor(repo.riskLevel || 'low')}>
                          {repo.riskLevel || 'Low Risk'}
                        </Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => handleViewRepoDetails(repo)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <GitBranch className="h-5 w-5" />
                                Repository Security Analysis - {repo.name}
                              </DialogTitle>
                              <DialogDescription>
                                Comprehensive security details and vulnerability assessment
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Repository Information</h4>
                                  <div className="space-y-1 text-sm">
                                    <p><span className="font-medium">Name:</span> {repo.name}</p>
                                    <p><span className="font-medium">Last Scan:</span> {new Date(repo.lastScan || Date.now()).toLocaleDateString()}</p>
                                    <p><span className="font-medium">Risk Level:</span> <Badge className={getSeverityColor(repo.riskLevel || 'low')}>{repo.riskLevel || 'Low Risk'}</Badge></p>
                                    <p><span className="font-medium">Dependencies:</span> {Math.floor(Math.random() * 50) + 10}</p>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Security Metrics</h4>
                                  <div className="space-y-1 text-sm">
                                    <p><span className="font-medium">Vulnerabilities:</span> {Math.floor(Math.random() * 10)}</p>
                                    <p><span className="font-medium">License Issues:</span> {Math.floor(Math.random() * 3)}</p>
                                    <p><span className="font-medium">Coverage:</span> {Math.floor(Math.random() * 20) + 80}%</p>
                                    <p><span className="font-medium">Security Score:</span> {Math.floor(Math.random() * 30) + 70}/100</p>
                                  </div>
                                </div>
                              </div>
                              <Separator />
                              <div>
                                <h4 className="font-semibold mb-2">Recent Activity</h4>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                                    <span className="text-sm">Security scan completed</span>
                                    <span className="text-xs text-slate-500">2 hours ago</span>
                                  </div>
                                  <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                                    <span className="text-sm">Dependency update available</span>
                                    <span className="text-xs text-slate-500">1 day ago</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Recent Security Alerts
                    </CardTitle>
                    <CardDescription>
                      Latest vulnerability discoveries and security issues
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4 mr-2" />
                          Filter
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Filter Security Alerts</DialogTitle>
                          <DialogDescription>
                            Customize alert display based on severity and timeframe
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium mb-2 block">Severity Level</label>
                            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select severity" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All Severities</SelectItem>
                                <SelectItem value="critical">Critical Only</SelectItem>
                                <SelectItem value="high">High & Critical</SelectItem>
                                <SelectItem value="medium">Medium & Above</SelectItem>
                                <SelectItem value="low">All Levels</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-2 block">Time Period</label>
                            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select timeframe" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="7d">Last 7 Days</SelectItem>
                                <SelectItem value="30d">Last 30 Days</SelectItem>
                                <SelectItem value="90d">Last 90 Days</SelectItem>
                                <SelectItem value="1y">Last Year</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setFilterDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={handleApplyFilters}>
                              Apply Filters
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="sm" onClick={handleExportAlerts}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(recentAlerts || [
                    { id: 1, severity: 'critical', title: 'Dependency vulnerability in express@4.17.1', cve: 'CVE-2024-1001', status: 'pending' },
                    { id: 2, severity: 'high', title: 'Dependency vulnerability in express@4.17.1', cve: 'CVE-2024-1002', status: 'in_progress' },
                    { id: 3, severity: 'medium', title: 'Dependency vulnerability in express@4.17.1', cve: 'CVE-2024-1003', status: 'resolved' },
                    { id: 4, severity: 'low', title: 'Dependency vulnerability in express@4.17.1', cve: 'CVE-2024-1004', status: 'pending' },
                    { id: 5, severity: 'high', title: 'Dependency vulnerability in express@4.17.1', cve: 'CVE-2024-1005', status: 'resolved' }
                  ]).map((alert, index) => (
                    <div key={alert.id || index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        <div>
                          <p className="font-medium">
                            {alert.title || `Dependency vulnerability in express@4.17.1`}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {alert.cve || `CVE-2024-${1000 + index}`} - Discovered 2 hours ago
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getSeverityColor(alert.severity || 'medium')}>
                          {(alert.severity || 'medium').charAt(0).toUpperCase() + (alert.severity || 'medium').slice(1)}
                        </Badge>
                        <Badge variant="outline" className={getStatusColor(alert.status || 'pending')}>
                          {(alert.status || 'pending').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => handleViewAlertDetails(alert)}>
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                Security Alert Details
                              </DialogTitle>
                              <DialogDescription>
                                Comprehensive vulnerability information and remediation guidance
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6">
                              <div className="grid grid-cols-2 gap-6">
                                <div>
                                  <h4 className="font-semibold mb-3">Alert Information</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="font-medium">CVE ID:</span>
                                      <span>{alert.cve || `CVE-2024-${1000 + index}`}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="font-medium">Severity:</span>
                                      <Badge className={getSeverityColor(alert.severity || 'medium')}>
                                        {(alert.severity || 'medium').charAt(0).toUpperCase() + (alert.severity || 'medium').slice(1)}
                                      </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="font-medium">Status:</span>
                                      <Badge variant="outline" className={getStatusColor(alert.status || 'pending')}>
                                        {(alert.status || 'pending').replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                      </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="font-medium">Discovered:</span>
                                      <span>2 hours ago</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="font-medium">CVSS Score:</span>
                                      <span>{alert.severity === 'critical' ? '9.8' : alert.severity === 'high' ? '7.5' : alert.severity === 'medium' ? '5.3' : '2.1'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-3">Affected Components</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
                                      <p className="font-medium">Package: express@4.17.1</p>
                                      <p className="text-slate-600 dark:text-slate-400">Used in 3 repositories</p>
                                    </div>
                                    <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded">
                                      <p className="font-medium">Dependencies: 15 affected</p>
                                      <p className="text-slate-600 dark:text-slate-400">Transitive dependencies at risk</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <Separator />
                              <div>
                                <h4 className="font-semibold mb-3">Vulnerability Description</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                  A security vulnerability has been identified in the Express.js framework that could allow attackers to execute arbitrary code through malformed request parsing. This affects applications using vulnerable versions of the express package.
                                </p>
                                <h4 className="font-semibold mb-2">Recommended Actions</h4>
                                <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-400">
                                  <li>Update express to version 4.18.2 or later</li>
                                  <li>Review and audit all dependencies using this package</li>
                                  <li>Run security scans on affected repositories</li>
                                  <li>Monitor for any suspicious activity in production systems</li>
                                </ul>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => handleGenerateFixPR(alert)}
                                  disabled={generateFixPRMutation.isPending}
                                >
                                  {generateFixPRMutation.isPending ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      Generating...
                                    </>
                                  ) : (
                                    'Generate Fix PR'
                                  )}
                                </Button>
                                <Button 
                                  onClick={() => handleMarkAsReviewed(alert.id || index)}
                                  disabled={markAsReviewedMutation.isPending}
                                >
                                  {markAsReviewedMutation.isPending ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      Updating...
                                    </>
                                  ) : (
                                    'Mark as Reviewed'
                                  )}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Recommended Actions
            </CardTitle>
            <CardDescription>
              Priority security actions based on your current risk profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 mb-2" />
                <p className="font-medium text-red-900 dark:text-red-100 mb-1">
                  Update Critical Dependencies
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  2 critical vulnerabilities need immediate attention
                </p>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <Clock className="h-5 w-5 text-amber-600 mb-2" />
                <p className="font-medium text-amber-900 dark:text-amber-100 mb-1">
                  Review License Compliance
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  5 packages need license verification
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600 mb-2" />
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Enable Auto-Scanning
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  3 repositories missing automated monitoring
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}