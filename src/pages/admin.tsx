import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings, 
  Users, 
  Activity, 
  Shield, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";

interface SystemStats {
  totalUsers: number;
  totalRepositories: number;
  totalAlerts: number;
  activeScans: number;
  lastScanTime: string;
}

interface SchedulerStatus {
  dailyScan: boolean;
  hourlyScan: boolean;
}

export default function Admin() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const [scanInProgress, setScanInProgress] = useState(false);

  const { data: systemStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: isAuthenticated,
  });

  const { data: schedulerStatus, isLoading: schedulerLoading } = useQuery({
    queryKey: ["/api/admin/scheduler-status"],
    enabled: isAuthenticated,
  });

  const triggerDailyScanMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/trigger-daily-scan");
    },
    onSuccess: () => {
      toast({
        title: "Daily Scan Triggered",
        description: "Daily vulnerability scan has been started for all repositories.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Scan Failed",
        description: "Failed to trigger daily scan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const triggerHourlyScanMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/admin/trigger-hourly-scan");
    },
    onSuccess: () => {
      toast({
        title: "Hourly Scan Triggered",
        description: "Hourly vulnerability scan has been started for Pro repositories.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Scan Failed",
        description: "Failed to trigger hourly scan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleSchedulerMutation = useMutation({
    mutationFn: async ({ task, enabled }: { task: string; enabled: boolean }) => {
      return await apiRequest("POST", "/api/admin/toggle-scheduler", { task, enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scheduler-status"] });
      toast({
        title: "Scheduler Updated",
        description: "Scheduler settings have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update scheduler settings.",
        variant: "destructive",
      });
    },
  });

  const handleTriggerDailyScan = () => {
    setScanInProgress(true);
    triggerDailyScanMutation.mutate();
    setTimeout(() => setScanInProgress(false), 5000);
  };

  const handleTriggerHourlyScan = () => {
    setScanInProgress(true);
    triggerHourlyScanMutation.mutate();
    setTimeout(() => setScanInProgress(false), 3000);
  };

  const handleToggleScheduler = (task: string, enabled: boolean) => {
    toggleSchedulerMutation.mutate({ task, enabled });
  };

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p>Please log in to access admin controls.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || statsLoading || schedulerLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-48 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      {/* System Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats?.totalUsers || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Repositories</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats?.totalRepositories || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats?.totalAlerts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Scans</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats?.activeScans || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Scan Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Manual Scan Controls
          </CardTitle>
          <CardDescription>
            Trigger vulnerability scans manually for testing and immediate updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleTriggerDailyScan}
              disabled={triggerDailyScanMutation.isPending || scanInProgress}
              className="flex items-center gap-2"
            >
              {triggerDailyScanMutation.isPending || scanInProgress ? (
                <RotateCcw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              Trigger Daily Scan
            </Button>

            <Button
              onClick={handleTriggerHourlyScan}
              disabled={triggerHourlyScanMutation.isPending || scanInProgress}
              variant="outline"
              className="flex items-center gap-2"
            >
              {triggerHourlyScanMutation.isPending || scanInProgress ? (
                <RotateCcw className="w-4 h-4 animate-spin" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
              Trigger Hourly Scan
            </Button>
          </div>

          {systemStats?.lastScanTime && (
            <p className="text-sm text-muted-foreground">
              Last scan completed: {new Date(systemStats.lastScanTime).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Scheduler Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Automated Scheduler
          </CardTitle>
          <CardDescription>
            Configure automated vulnerability scanning schedules
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Daily Scan</Label>
              <p className="text-sm text-muted-foreground">
                Scans all repositories once per day for vulnerabilities and license changes
              </p>
            </div>
            <div className="flex items-center gap-2">
              {schedulerStatus?.dailyScan ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <Switch
                checked={schedulerStatus?.dailyScan || false}
                onCheckedChange={(enabled) => handleToggleScheduler('dailyScan', enabled)}
                disabled={toggleSchedulerMutation.isPending}
              />
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Hourly Scan (Pro)</Label>
              <p className="text-sm text-muted-foreground">
                Scans Pro repositories every hour for rapid vulnerability detection
              </p>
            </div>
            <div className="flex items-center gap-2">
              {schedulerStatus?.hourlyScan ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <Switch
                checked={schedulerStatus?.hourlyScan || false}
                onCheckedChange={(enabled) => handleToggleScheduler('hourlyScan', enabled)}
                disabled={toggleSchedulerMutation.isPending}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            System Health
          </CardTitle>
          <CardDescription>
            Monitor system status and external service connectivity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">OSV Database</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">NPM Registry</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">Email Service</span>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Configured
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}