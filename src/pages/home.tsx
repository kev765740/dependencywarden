import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Sidebar } from "@/components/Sidebar";
import { AddRepositoryModal } from "@/components/AddRepositoryModal";
import { ScanJobMonitor } from "@/components/ScanJobMonitor";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { UsageTracker } from "@/components/UsageTracker";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, GitBranch, AlertTriangle, Shield, Clock, Github, Eye, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import type { Repository } from "@shared/schema";
import { Progress } from "@/components/ui/progress"
import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface Stats {
  totalRepos: number;
  activeAlerts: number;
  criticalIssues: number;
  lastScan: string;
  usage: {
    totalRepos: number;
    freeLimit: number;
    usagePercentage: number;
    hasExceededLimit: boolean;
  }
}

export default function HomePage() {
  const { toast } = useToast();
  const auth = useAuth();
  const { isAuthenticated, isLoading } = auth || { isAuthenticated: false, isLoading: true };
  const queryClient = useQueryClient();
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const { data: repositories = [], isLoading: isLoadingRepos } = useQuery({
    queryKey: ["/api/repositories"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Check if user should see onboarding (first-time users with no repos)
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding && isAuthenticated && !isLoadingRepos) {
      // Small delay to ensure smooth UX
      const timer = setTimeout(() => {
        setShowOnboarding(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoadingRepos]);

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

  const { data: stats } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    enabled: isAuthenticated,
    retry: false,
  });

  const scanMutation = useMutation({
    mutationFn: async (repoId: number) => {
      await apiRequest("POST", `/api/repositories/${repoId}/scan`);
    },
    onSuccess: () => {
      toast({
        title: "Scan Complete",
        description: "Repository scan completed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
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

  const handleScanNow = (repoId: number) => {
    scanMutation.mutate(repoId);
  };

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "< 1 hour ago";
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="w-full">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h2>
            <p className="text-slate-600">Monitor your repositories for license and security changes</p>
          </div>
          <Button 
            onClick={() => setShowAddRepo(true)}
            className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Add Repository</span>
          </Button>
        </div>

        {/* Usage Tracker */}
        <div className="mb-8">
          <UsageTracker 
            currentRepos={Array.isArray(repositories) ? repositories.length : 0}
            maxRepos={5}
            subscriptionStatus="free"
            onUpgrade={() => {
              window.location.href = "/billing";
            }}
          />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total Repositories</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.totalRepos || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <GitBranch className="text-primary" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Active Alerts</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.activeAlerts || 0}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-warning" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${(stats?.criticalIssues || 0) > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(stats?.criticalIssues || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {stats?.criticalIssues || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {(stats?.criticalIssues || 0) > 0 ? 'Requires immediate attention' : 'No critical issues'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Last Scan</p>
                  <p className="text-2xl font-bold text-slate-900">{stats?.lastScan ? formatTimeAgo(stats.lastScan) : "Never"}</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-success" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Repositories Table */}
        <Card>
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Repositories</h3>
          </div>

          <div className="overflow-x-auto">
            {isLoadingRepos ? (
              <div className="p-8 text-center text-slate-500">Loading repositories...</div>
            ) : !Array.isArray(repositories) || repositories.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <GitBranch className="text-slate-400" size={32} />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No repositories yet</h3>
                <p className="text-slate-600 mb-4">Add your first repository to start monitoring dependencies</p>
                <Button onClick={() => setShowAddRepo(true)}>
                  <Plus size={16} className="mr-2" />
                  Add Repository
                </Button>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Repository</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Scan</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {Array.isArray(repositories) && repositories.map((repo: any) => (
                    <tr key={repo.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mr-3">
                            <Github className="text-slate-600" size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium text-slate-900">{repo.name}</div>
                              {repo.isDemo && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Demo
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-slate-500">{repo.gitUrl}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={repo.status === 'active' ? 'default' : 'secondary'}
                          className={repo.status === 'active' ? 'bg-emerald-100 text-emerald-800' : ''}
                        >
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></div>
                          {repo.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{formatTimeAgo(repo.lastScannedAt ? new Date(repo.lastScannedAt).toISOString() : null)}</div>
                        <div className="text-sm text-slate-500">Auto-scan enabled</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-3">
                          <Link href={`/repositories/${repo.id}`}>
                            <Button variant="ghost" size="sm" className="text-primary hover:text-blue-700">
                              <Eye size={16} className="mr-1" />
                              View Alerts
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleScanNow(repo.id)}
                            disabled={scanMutation.isPending}
                            className="text-secondary hover:text-slate-700"
                          >
                            <RefreshCw size={16} className={`mr-1 ${scanMutation.isPending ? 'animate-spin' : ''}`} />
                            Scan Now
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>

        {/* Real-time scan job monitoring */}
        <div className="mb-8">
          <ScanJobMonitor showGlobalJobs={true} />
        </div>

        <AddRepositoryModal 
          open={showAddRepo} 
          onOpenChange={setShowAddRepo}
        />

        {showOnboarding && (
          <OnboardingWizard 
            onComplete={() => {
              setShowOnboarding(false);
              localStorage.setItem('hasSeenOnboarding', 'true');
            }}
            onSkip={() => {
              setShowOnboarding(false);
              localStorage.setItem('hasSeenOnboarding', 'true');
            }}
          />
        )}

        <FeedbackWidget />
      </div>
  );
}