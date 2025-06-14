import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, GitBranch, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

const DashboardPage = () => {
  const { data: dashboardStats } = useQuery({
    queryKey: ['/api/stats'],
    refetchInterval: 30000
  });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Security Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Repositories</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalRepos || 5}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.activeAlerts || 3}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.criticalIssues || 1}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.securityScore || '85%'}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Repositories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(dashboardStats?.recentRepos || [
                { id: 1, name: 'Repository 1', lastScan: '2h ago' },
                { id: 2, name: 'Repository 2', lastScan: '4h ago' },
                { id: 3, name: 'Repository 3', lastScan: '1d ago' }
              ]).map((repo) => (
                <div key={repo.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <GitBranch className="h-4 w-4" />
                    <span>{repo.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{repo.lastScan}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vulnerability Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-red-500">Critical</span>
                <span>{dashboardStats?.vulnerabilities?.critical || 1}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-amber-500">High</span>
                <span>{dashboardStats?.vulnerabilities?.high || 2}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-yellow-500">Medium</span>
                <span>{dashboardStats?.vulnerabilities?.medium || 5}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-blue-500">Low</span>
                <span>{dashboardStats?.vulnerabilities?.low || 3}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage; 