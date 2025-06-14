import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Navbar } from "@/components/Navbar";
import { AlertDetailModal } from "@/components/AlertDetailModal";
import { ScanJobMonitor } from "@/components/ScanJobMonitor";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Github, RefreshCw, Settings, Box, Gavel, Shield } from "lucide-react";
import type { Repository, Alert } from "@shared/schema";

export default function RepositoryDetail() {
  const params = useParams();
  const repoId = parseInt(params.id || "0");
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [alertTypeFilter, setAlertTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: repository, isLoading: isLoadingRepo } = useQuery<Repository>({
    queryKey: ["/api/repositories", repoId],
    enabled: isAuthenticated && !!repoId,
    retry: false,
  });

  const { data: alerts = [], isLoading: isLoadingAlerts } = useQuery<Alert[]>({
    queryKey: ["/api/repositories", repoId, "alerts"],
    enabled: isAuthenticated && !!repoId,
    retry: false,
  });

  const scanMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/repositories/${repoId}/scan`);
    },
    onSuccess: () => {
      toast({
        title: "Scan Complete",
        description: "Repository scan completed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repositories", repoId, "alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/repositories", repoId] });
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
        description: "Failed to scan repository. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleScanNow = () => {
    scanMutation.mutate();
  };

  const formatTimeAgo = (dateString: string | Date | null) => {
    if (!dateString) return "Never";
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "< 1h";
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  const getSeverityColor = (severity: string | null) => {
    if (!severity) return 'bg-slate-100 text-slate-800';
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-amber-100 text-amber-800';
      case 'low': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getAlertTypeIcon = (alertType: string) => {
    if (alertType === 'license') {
      return <Gavel size={16} className="mr-1" />;
    }
    return <Shield size={16} className="mr-1" />;
  };

  const filteredAlerts = alerts.filter(alert => {
    if (alertTypeFilter !== "all" && alert.alertType !== alertTypeFilter) return false;
    if (severityFilter !== "all" && alert.severity !== severityFilter) return false;
    return true;
  });

  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical').length;
  const mediumAlerts = alerts.filter(alert => alert.severity === 'medium').length;

  if (!isAuthenticated) {
    return null;
  }

  if (isLoadingRepo) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">Loading repository...</div>
        </div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">Repository not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Repository Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mr-4">
                  <Github className="text-slate-600" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{repository.name}</h2>
                  <p className="text-slate-600">{repository.gitUrl}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button 
                  onClick={handleScanNow}
                  disabled={scanMutation.isPending}
                  className="bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw size={16} className={`mr-2 ${scanMutation.isPending ? 'animate-spin' : ''}`} />
                  Scan Now
                </Button>
                <Button variant="outline" className="border-slate-200 text-slate-600 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition-colors">
                  <Settings size={16} className="mr-2" />
                  Settings
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">-</div>
                <div className="text-sm text-slate-600">Dependencies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-danger">{criticalAlerts}</div>
                <div className="text-sm text-slate-600">Critical Alerts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-warning">{mediumAlerts}</div>
                <div className="text-sm text-slate-600">Medium Alerts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{formatTimeAgo(repository.lastScannedAt)}</div>
                <div className="text-sm text-slate-600">Last Scan</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alerts Table */}
        <Card>
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Security & License Alerts</h3>
            <div className="flex items-center space-x-3">
              <Select value={alertTypeFilter} onValueChange={setAlertTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="license">License Changes</SelectItem>
                  <SelectItem value="vuln">Security Vulnerabilities</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            {isLoadingAlerts ? (
              <div className="p-8 text-center text-slate-500">Loading alerts...</div>
            ) : filteredAlerts.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="text-emerald-600" size={32} />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No alerts found</h3>
                <p className="text-slate-600 mb-4">
                  {alerts.length === 0 
                    ? "Your repository has no security or license alerts" 
                    : "No alerts match your current filters"}
                </p>
                {alerts.length === 0 && (
                  <Button onClick={handleScanNow} disabled={scanMutation.isPending}>
                    <RefreshCw size={16} className={`mr-2 ${scanMutation.isPending ? 'animate-spin' : ''}`} />
                    Run Initial Scan
                  </Button>
                )}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dependency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Alert Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Change</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Severity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Detected</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {filteredAlerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                            alert.severity === 'critical' ? 'bg-red-100' : 'bg-amber-100'
                          }`}>
                            <Box className={`text-sm ${
                              alert.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                            }`} size={16} />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">{alert.dependencyName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant="secondary" 
                          className={alert.alertType === 'license' ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'}
                        >
                          {getAlertTypeIcon(alert.alertType)}
                          {alert.alertType === 'license' ? 'License Change' : 'Vulnerability'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {alert.alertType === 'license' ? (
                            <>
                              <span className="text-slate-500">{alert.oldValue}</span>
                              <span className="mx-2 text-slate-400">→</span>
                              <span className={`font-medium ${
                                alert.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                              }`}>
                                {alert.newValue}
                              </span>
                            </>
                          ) : (
                            <div>
                              <span className={`font-medium ${
                                alert.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                              }`}>
                                {alert.newValue}
                              </span>
                              {alert.description && (
                                <div className="text-xs text-slate-500">{alert.description}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">
                          {formatTimeAgo(alert.createdAt)} ago
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button 
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedAlert(alert)}
                          className="text-primary hover:text-blue-700"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      </div>

      {/* Repository-specific scan job monitoring */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <ScanJobMonitor repositoryId={repoId} />
      </div>

      <AlertDetailModal 
        alert={selectedAlert} 
        open={!!selectedAlert} 
        onOpenChange={(open) => !open && setSelectedAlert(null)}
        repositoryId={repoId}
      />

      <FeedbackWidget 
        repositoryId={repoId}
        repositoryName={repository?.name}
      />
    </div>
  );
}
