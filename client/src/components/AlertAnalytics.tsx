import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Shield, AlertTriangle, Eye, EyeOff, Filter, BarChart3 } from "lucide-react";
import { useState } from "react";
import { Alert } from "@shared/schema";

interface AlertAnalyticsProps {
  alerts: (Alert & {
    isUsedInCode?: boolean;
    usageCount?: number;
    riskScore?: number;
  })[];
  onFilterChange?: (filter: string) => void;
}

export function AlertAnalytics({ alerts, onFilterChange }: AlertAnalyticsProps) {
  const [filter, setFilter] = useState<string>('all');

  // Calculate analytics
  const totalAlerts = alerts.length;
  const usedInCodeAlerts = alerts.filter(a => a.isUsedInCode).length;
  const unusedAlerts = totalAlerts - usedInCodeAlerts;
  const highRiskAlerts = alerts.filter(a => (a.riskScore || 0) >= 70).length;
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;

  // Severity distribution
  const severityData = [
    { name: 'Critical', value: alerts.filter(a => a.severity === 'critical').length, color: '#ef4444' },
    { name: 'High', value: alerts.filter(a => a.severity === 'high').length, color: '#f97316' },
    { name: 'Medium', value: alerts.filter(a => a.severity === 'medium').length, color: '#eab308' },
    { name: 'Low', value: alerts.filter(a => a.severity === 'low').length, color: '#3b82f6' },
  ].filter(item => item.value > 0);

  // Usage analysis
  const usageData = [
    { name: 'Used in Code', value: usedInCodeAlerts, color: '#ef4444' },
    { name: 'Not Used', value: unusedAlerts, color: '#22c55e' },
  ].filter(item => item.value > 0);

  // Risk score distribution
  const riskData = [
    { name: 'Very High (80-100)', value: alerts.filter(a => (a.riskScore || 0) >= 80).length },
    { name: 'High (60-79)', value: alerts.filter(a => (a.riskScore || 0) >= 60 && (a.riskScore || 0) < 80).length },
    { name: 'Medium (40-59)', value: alerts.filter(a => (a.riskScore || 0) >= 40 && (a.riskScore || 0) < 60).length },
    { name: 'Low (20-39)', value: alerts.filter(a => (a.riskScore || 0) >= 20 && (a.riskScore || 0) < 40).length },
    { name: 'Very Low (0-19)', value: alerts.filter(a => (a.riskScore || 0) < 20).length },
  ].filter(item => item.value > 0);

  const handleFilterChange = (value: string) => {
    setFilter(value);
    onFilterChange?.(value);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{totalAlerts}</p>
                <p className="text-sm text-gray-600">Total Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{usedInCodeAlerts}</p>
                <p className="text-sm text-gray-600">Used in Code</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{highRiskAlerts}</p>
                <p className="text-sm text-gray-600">High Risk (AI)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{unusedAlerts}</p>
                <p className="text-sm text-gray-600">Low Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Smart Filtering
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter alerts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Alerts</SelectItem>
                  <SelectItem value="used">Used in Code Only</SelectItem>
                  <SelectItem value="unused">Unused Dependencies</SelectItem>
                  <SelectItem value="high-risk">High Risk (AI Score ≥70)</SelectItem>
                  <SelectItem value="critical">Critical Severity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant={filter === 'all' ? 'default' : 'secondary'} 
                   className="cursor-pointer" 
                   onClick={() => handleFilterChange('all')}>
              All ({totalAlerts})
            </Badge>
            <Badge variant={filter === 'used' ? 'default' : 'secondary'} 
                   className="cursor-pointer" 
                   onClick={() => handleFilterChange('used')}>
              <Eye className="w-3 h-3 mr-1" />
              Used ({usedInCodeAlerts})
            </Badge>
            <Badge variant={filter === 'unused' ? 'default' : 'secondary'} 
                   className="cursor-pointer" 
                   onClick={() => handleFilterChange('unused')}>
              <EyeOff className="w-3 h-3 mr-1" />
              Unused ({unusedAlerts})
            </Badge>
            <Badge variant={filter === 'high-risk' ? 'default' : 'secondary'} 
                   className="cursor-pointer" 
                   onClick={() => handleFilterChange('high-risk')}>
              <TrendingUp className="w-3 h-3 mr-1" />
              High Risk ({highRiskAlerts})
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Charts */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage Analysis</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Severity Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={severityData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {severityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Code Usage Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={usageData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {usageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dependency Usage Analysis</CardTitle>
              <p className="text-sm text-gray-600">
                Our AI analyzes your codebase to identify which dependencies are actually used, 
                helping you prioritize security fixes that matter.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">Smart Prioritization Benefits</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Focus on vulnerabilities in dependencies you actually use</li>
                    <li>• Reduce alert fatigue from unused packages</li>
                    <li>• Save development time with intelligent filtering</li>
                    <li>• Improve security ROI by prioritizing real risks</li>
                  </ul>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-3xl font-bold text-red-600">{usedInCodeAlerts}</div>
                    <div className="text-sm text-red-800">Require Immediate Attention</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{unusedAlerts}</div>
                    <div className="text-sm text-green-800">Lower Priority (Unused)</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Risk Assessment</CardTitle>
              <p className="text-sm text-gray-600">
                Advanced risk scoring considers severity, code usage, and dependency criticality 
                to provide contextual security insights.
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={riskData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
              
              <div className="mt-4 bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-800 mb-2">AI Risk Scoring Factors</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Base vulnerability severity (CVSS)</li>
                  <li>• Actual code usage patterns</li>
                  <li>• Frequency of dependency usage</li>
                  <li>• Dependency criticality to your application</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}