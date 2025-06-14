import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { 
  Activity, 
  Server, 
  Database, 
  Globe, 
  MemoryStick, 
  HardDrive, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Zap
} from "lucide-react";

interface HealthCheckData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime: number;
      error?: string;
    };
    memory: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      usage: number;
      limit: number;
      percentage: number;
    };
    disk: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      usage?: number;
      available?: number;
      percentage?: number;
    };
    external_services: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      services: {
        npm_registry: boolean;
        osv_api: boolean;
      };
    };
  };
}

export default function Monitoring() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: healthData, isLoading, error, refetch } = useQuery({
    queryKey: ['/health'],
    refetchInterval: autoRefresh ? 30000 : false, // Refresh every 30 seconds
    retry: 3,
    staleTime: 0,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800';
      case 'unhealthy':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatBytes = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let unitIndex = 0;
    let size = bytes;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-6 h-6" />
          <h1 className="text-2xl font-bold">System Monitoring</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !healthData) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-6 h-6" />
          <h1 className="text-2xl font-bold">System Monitoring</h1>
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unable to Load Health Data</h3>
            <p className="text-gray-600 mb-4">
              Failed to retrieve system health information. This could indicate a system issue.
            </p>
            <Button onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const health = healthData as HealthCheckData;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-6 h-6" />
          <h1 className="text-2xl font-bold">System Monitoring</h1>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(health.status)}
            System Status
            <Badge className={getStatusColor(health.status)}>
              {health.status.toUpperCase()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Environment</p>
              <p className="font-semibold capitalize">{health.environment}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Version</p>
              <p className="font-semibold">{health.version}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Uptime</p>
              <p className="font-semibold">{formatUptime(health.uptime)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Check</p>
              <p className="font-semibold">
                {new Date(health.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Database */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="w-5 h-5" />
              Database
              {getStatusIcon(health.checks.database.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Response Time</span>
                <span className="font-mono">{health.checks.database.responseTime}ms</span>
              </div>
              <Badge className={getStatusColor(health.checks.database.status)}>
                {health.checks.database.status}
              </Badge>
              {health.checks.database.error && (
                <p className="text-xs text-red-600 mt-2">
                  {health.checks.database.error}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Memory */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MemoryStick className="w-5 h-5" />
              Memory
              {getStatusIcon(health.checks.memory.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Usage</span>
                <span className="font-mono">
                  {formatBytes(health.checks.memory.usage)} / {formatBytes(health.checks.memory.limit)}
                </span>
              </div>
              <Progress value={health.checks.memory.percentage} className="h-2" />
              <div className="flex justify-between text-xs text-gray-600">
                <span>{health.checks.memory.percentage.toFixed(1)}% used</span>
                <Badge className={getStatusColor(health.checks.memory.status)}>
                  {health.checks.memory.status}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Disk */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <HardDrive className="w-5 h-5" />
              Storage
              {getStatusIcon(health.checks.disk.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Status</span>
                <Badge className={getStatusColor(health.checks.disk.status)}>
                  {health.checks.disk.status}
                </Badge>
              </div>
              {health.checks.disk.percentage !== undefined && (
                <>
                  <Progress value={health.checks.disk.percentage} className="h-2" />
                  <div className="text-xs text-gray-600">
                    {health.checks.disk.percentage}% used
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* External Services */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="w-5 h-5" />
              External APIs
              {getStatusIcon(health.checks.external_services.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">NPM Registry</span>
                {health.checks.external_services.services.npm_registry ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">OSV API</span>
                {health.checks.external_services.services.osv_api ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
              </div>
              <Badge className={getStatusColor(health.checks.external_services.status)}>
                {health.checks.external_services.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {health.checks.database.responseTime}ms
              </div>
              <p className="text-sm text-gray-600">Database Response</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {health.checks.memory.percentage.toFixed(1)}%
              </div>
              <p className="text-sm text-gray-600">Memory Usage</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatUptime(health.uptime)}
              </div>
              <p className="text-sm text-gray-600">System Uptime</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Platform</p>
              <p className="font-mono">Node.js</p>
            </div>
            <div>
              <p className="text-gray-600">Environment</p>
              <p className="font-mono capitalize">{health.environment}</p>
            </div>
            <div>
              <p className="text-gray-600">Version</p>
              <p className="font-mono">{health.version}</p>
            </div>
            <div>
              <p className="text-gray-600">Last Updated</p>
              <p className="font-mono">
                {new Date(health.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}