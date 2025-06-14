import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Navbar } from "@/components/Navbar";
import { AddRepositoryModal } from "@/components/AddRepositoryModal";
import { ScanJobMonitor } from "@/components/ScanJobMonitor";
import { FeedbackWidget } from "@/components/FeedbackWidget";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, GitBranch, AlertTriangle, Shield, Clock, Github, Eye, RefreshCw, Search, Filter, Settings } from "lucide-react";
import { Link } from "wouter";
import type { Repository } from "@shared/schema";

export default function Repositories() {
  const { toast } = useToast();
  const auth = useAuth();
  const isAuthenticated = auth?.isAuthenticated || false;
  const isLoading = auth?.isLoading || false;
  const queryClient = useQueryClient();
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");

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

  const { data: repositories = [], isLoading: isLoadingRepos } = useQuery<Repository[]>({
    queryKey: ["/api/repositories"],
    enabled: isAuthenticated,
    retry: false,
  });

  const scanMutation = useMutation({
    mutationFn: async (repoId: number) => {
      await apiRequest("POST", `/api/repositories/${repoId}/scan`);
    },
    onSuccess: () => {
      toast({
        title: "Scan Started",
        description: "Repository scan initiated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
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
        description: "Failed to start repository scan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (repoId: number) => {
      await apiRequest("DELETE", `/api/repositories/${repoId}`);
    },
    onSuccess: () => {
      toast({
        title: "Repository Deleted",
        description: "Repository removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete repository. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleScanNow = (repoId: number) => {
    scanMutation.mutate(repoId);
  };

  const handleDeleteRepo = (repoId: number) => {
    if (confirm("Are you sure you want to delete this repository? This action cannot be undone.")) {
      deleteMutation.mutate(repoId);
    }
  };

  const formatTimeAgo = (dateString: string | Date | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "< 1 hour ago";
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  // Filter and sort repositories
  const repositoriesArray = Array.isArray(repositories) ? repositories : [];
  const filteredRepositories = repositoriesArray
    .filter((repo: Repository) => {
      const matchesSearch = repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          repo.gitUrl.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || repo.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a: Repository, b: Repository) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "lastScan":
          return new Date(b.lastScannedAt || 0).getTime() - new Date(a.lastScannedAt || 0).getTime();
        case "status":
          return (a.status || "").localeCompare(b.status || "");
        default:
          return 0;
      }
    });

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Repository Management</h2>
            <p className="text-slate-600">Manage and monitor all your repositories in one place</p>
          </div>
          <Button 
            onClick={() => setShowAddRepo(true)}
            className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus size={16} />
            <span>Add Repository</span>
          </Button>
        </div>

        {/* Repository Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Total Repositories</p>
                  <p className="text-2xl font-bold text-slate-900">{repositories.length}</p>
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
                  <p className="text-slate-600 text-sm font-medium">Active Monitoring</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {repositoriesArray.filter((r: Repository) => r.autoScanEnabled).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield className="text-green-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Recently Scanned</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {repositoriesArray.filter((r: Repository) => {
                      if (!r.lastScannedAt) return false;
                      const hoursSince = (Date.now() - new Date(r.lastScannedAt).getTime()) / (1000 * 60 * 60);
                      return hoursSince < 24;
                    }).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-purple-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Needs Attention</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {repositoriesArray.filter((r: Repository) => !r.lastScannedAt).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-amber-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    placeholder="Search repositories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter size={16} className="mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="lastScan">Last Scan</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Repositories List */}
        <Card>
          <CardContent className="p-0">
            {isLoadingRepos ? (
              <div className="p-6 text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                <p className="text-gray-600 mt-2">Loading repositories...</p>
              </div>
            ) : filteredRepositories.length === 0 ? (
              <div className="p-6 text-center">
                <Github className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {repositories.length === 0 ? "No repositories yet" : "No repositories match your search"}
                </h3>
                <p className="text-gray-600 mb-4">
                  {repositories.length === 0 
                    ? "Get started by adding your first repository to monitor for security vulnerabilities and license changes."
                    : "Try adjusting your search or filter criteria."
                  }
                </p>
                {repositories.length === 0 && (
                  <Button onClick={() => setShowAddRepo(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Repository
                  </Button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredRepositories.map((repo: Repository) => (
                  <div key={repo.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <Github className="h-5 w-5 text-gray-400" />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-medium text-gray-900">
                              {repo.name}
                            </h3>
                            <Badge 
                              variant="outline" 
                              className={repo.status === 'active' ? "text-green-600 border-green-300" : "text-gray-600 border-gray-300"}
                            >
                              {repo.status || 'Active'}
                            </Badge>
                            {repo.autoScanEnabled && (
                              <Badge variant="secondary">Auto-scan</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{repo.gitUrl}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>Last scan: {formatTimeAgo(repo.lastScannedAt)}</span>
                            <span>•</span>
                            <span>Frequency: {repo.scanFrequency || 'daily'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleScanNow(repo.id)}
                          disabled={scanMutation.isPending}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${scanMutation.isPending ? 'animate-spin' : ''}`} />
                          Scan Now
                        </Button>
                        <Link href={`/repositories/${repo.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRepo(repo.id)}
                          disabled={deleteMutation.isPending}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Queue Status */}
        <div className="mt-8">
          <ScanJobMonitor />
        </div>
      </div>

      <AddRepositoryModal 
        open={showAddRepo} 
        onOpenChange={setShowAddRepo}
      />

      <FeedbackWidget />
    </div>
  );
}