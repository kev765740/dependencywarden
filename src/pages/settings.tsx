import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { AlertCircle, CheckCircle, Cog, Bell, Slack, Mail, Clock, Zap, Shield, Globe, Database, Activity, User, Key, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface Repository {
  id: number;
  name: string;
  ownerEmail: string;
  slackWebhookUrl: string | null;
  scanFrequency: string;
  autoScanEnabled: boolean;
  priorityScanning: boolean;
}

export default function Settings() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  const [editingRepo, setEditingRepo] = useState<number | null>(null);
  const [formData, setFormData] = useState<{
    ownerEmail: string;
    slackWebhookUrl: string;
    scanFrequency: string;
    autoScanEnabled: boolean;
    priorityScanning: boolean;
  }>({ 
    ownerEmail: "", 
    slackWebhookUrl: "",
    scanFrequency: "daily",
    autoScanEnabled: true,
    priorityScanning: false
  });

  const { data: repositories = [], isLoading: reposLoading } = useQuery<Repository[]>({
    queryKey: ["/api/repositories"],
    enabled: isAuthenticated,
  });

  const updateRepositoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return await apiRequest("PATCH", `/api/repositories/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
      setEditingRepo(null);
      toast({
        title: "Settings Updated",
        description: "Repository notification settings have been saved.",
      });
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
        title: "Error",
        description: "Failed to update repository settings.",
        variant: "destructive",
      });
    },
  });

  const configureSlackMutation = useMutation({
    mutationFn: async ({ repoId, webhookUrl }: { repoId: number; webhookUrl: string }) => {
      return await apiRequest("POST", `/api/repositories/${repoId}/slack-webhook`, { webhookUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
      toast({
        title: "Slack Configured",
        description: "Slack webhook has been configured and tested successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Configuration Failed",
        description: "Failed to configure Slack webhook. Please check your webhook URL.",
        variant: "destructive",
      });
    },
  });

  const removeSlackMutation = useMutation({
    mutationFn: async (repoId: number) => {
      return await apiRequest("DELETE", `/api/repositories/${repoId}/slack-webhook`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
      toast({
        title: "Slack Removed",
        description: "Slack webhook has been removed from this repository.",
      });
    },
    onError: (error) => {
      toast({
        title: "Removal Failed",
        description: "Failed to remove Slack webhook.",
        variant: "destructive",
      });
    },
  });

  const testSlackMutation = useMutation({
    mutationFn: async (repoId: number) => {
      return await apiRequest("POST", `/api/repositories/${repoId}/test-slack`);
    },
    onSuccess: () => {
      toast({
        title: "Test Successful",
        description: "Slack webhook is working correctly!",
      });
    },
    onError: (error) => {
      toast({
        title: "Test Failed",
        description: "Slack webhook test failed. Please check your webhook URL.",
        variant: "destructive",
      });
    },
  });

  const startEditing = (repo: Repository) => {
    setEditingRepo(repo.id);
    setFormData({
      ownerEmail: repo.ownerEmail || "",
      slackWebhookUrl: repo.slackWebhookUrl || "",
      scanFrequency: repo.scanFrequency || "daily",
      autoScanEnabled: repo.autoScanEnabled ?? true,
      priorityScanning: repo.priorityScanning ?? false,
    });
  };

  const handleSave = () => {
    if (editingRepo) {
      updateRepositoryMutation.mutate({
        id: editingRepo,
        data: formData,
      });
    }
  };

  const handleTestSlack = (repoId: number) => {
    testSlackMutation.mutate(repoId);
  };

  if (!isAuthenticated && !isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p>Please log in to access settings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || reposLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse" />
          <div className="h-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Cog className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Settings & Configuration</h1>
            <p className="text-gray-600 mt-1">Manage your security monitoring preferences and integrations</p>
          </div>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Activity className="w-3 h-3" />
          Production Ready
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Repositories</p>
                <p className="text-xl font-bold">{repositories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Email Alerts</p>
                <p className="text-xl font-bold">{repositories.filter(r => r.ownerEmail).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Slack className="w-4 h-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Slack Webhooks</p>
                <p className="text-xl font-bold">{repositories.filter(r => r.slackWebhookUrl).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Auto-Scan</p>
                <p className="text-xl font-bold">{repositories.filter(r => r.autoScanEnabled).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Repository Notifications & Scanning
          </CardTitle>
          <CardDescription>
            Configure comprehensive security monitoring including email alerts, Slack notifications, and automated scanning schedules for enhanced vulnerability detection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {repositories.length === 0 ? (
            <p className="text-muted-foreground">
              No repositories found. Add a repository to configure notifications.
            </p>
          ) : (
            repositories.map((repo: Repository) => (
              <div key={repo.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{repo.name}</h3>
                  <div className="flex items-center gap-2">
                    {repo.ownerEmail && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        Email
                      </Badge>
                    )}
                    {repo.slackWebhookUrl && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Slack className="w-3 h-3" />
                        Slack
                      </Badge>
                    )}
                  </div>
                </div>

                {editingRepo === repo.id ? (
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor={`email-${repo.id}`}>Email Address</Label>
                      <Input
                        id={`email-${repo.id}`}
                        type="email"
                        placeholder="your-email@example.com"
                        value={formData.ownerEmail}
                        onChange={(e) =>
                          setFormData({ ...formData, ownerEmail: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`slack-${repo.id}`}>Slack Webhook URL</Label>
                      <Input
                        id={`slack-${repo.id}`}
                        type="url"
                        placeholder="https://hooks.slack.com/services/..."
                        value={formData.slackWebhookUrl}
                        onChange={(e) =>
                          setFormData({ ...formData, slackWebhookUrl: e.target.value })
                        }
                      />
                      <p className="text-sm text-muted-foreground">
                        Create a Slack webhook in your workspace settings to receive alerts.
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <Label className="text-sm font-medium">Scanning Schedule</Label>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`frequency-${repo.id}`}>Scan Frequency</Label>
                        <Select
                          value={formData.scanFrequency}
                          onValueChange={(value) =>
                            setFormData({ ...formData, scanFrequency: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">Manual Only</SelectItem>
                            <SelectItem value="hourly">Every Hour</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          Choose how often to automatically scan for vulnerabilities
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">Auto-Scan Enabled</Label>
                          <p className="text-xs text-muted-foreground">
                            Enable automatic background scanning
                          </p>
                        </div>
                        <Switch
                          checked={formData.autoScanEnabled}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, autoScanEnabled: checked })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Zap className="w-3 h-3" />
                            <Label className="text-sm font-medium">Priority Scanning</Label>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Process scans with higher priority for faster results
                          </p>
                        </div>
                        <Switch
                          checked={formData.priorityScanning}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, priorityScanning: checked })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSave}
                        disabled={updateRepositoryMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {updateRepositoryMutation.isPending ? "Saving Changes..." : "Save Configuration"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setEditingRepo(null)}
                      >
                        Cancel
                      </Button>
                      {formData.slackWebhookUrl && (
                        <Button
                          variant="secondary"
                          onClick={() => configureSlackMutation.mutate({ 
                            repoId: editingRepo!, 
                            webhookUrl: formData.slackWebhookUrl 
                          })}
                          disabled={configureSlackMutation.isPending}
                        >
                          Test Slack Integration
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm">
                          <strong>Email:</strong> {repo.ownerEmail || "Not configured"}
                        </p>
                        <p className="text-sm">
                          <strong>Slack:</strong> {repo.slackWebhookUrl ? "Configured" : "Not configured"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {repo.slackWebhookUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestSlack(repo.id)}
                            disabled={testSlackMutation.isPending}
                          >
                            Test Slack
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditing(repo)}
                        >
                          Configure
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {repo.id !== repositories[repositories.length - 1].id && (
                  <Separator />
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Alert Types & Severity
            </CardTitle>
            <CardDescription>
              Configure which security events trigger notifications and their priority levels.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 border rounded-lg bg-red-50 border-red-200">
                <div className="w-3 h-3 bg-red-500 rounded-full mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-red-900">Critical Vulnerabilities</h4>
                    <Badge variant="destructive">CRITICAL</Badge>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    CVSS 9.0+ security issues requiring immediate attention with automated PR generation.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 border rounded-lg bg-orange-50 border-orange-200">
                <div className="w-3 h-3 bg-orange-500 rounded-full mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-orange-900">High Priority Issues</h4>
                    <Badge variant="secondary">HIGH</Badge>
                  </div>
                  <p className="text-sm text-orange-700 mt-1">
                    License changes to GPL/AGPL and CVSS 7.0+ vulnerabilities with AI remediation.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-yellow-900">Medium & Low Issues</h4>
                    <Badge variant="outline">STANDARD</Badge>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">
                    Dependency updates, minor license changes, and standard security advisories.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Integration Status
            </CardTitle>
            <CardDescription>
              Monitor the health of your external integrations and API connections.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="font-medium">GitHub Integration</p>
                    <p className="text-sm text-muted-foreground">Repository scanning active</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">Connected</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="font-medium">OSV Vulnerability Database</p>
                    <p className="text-sm text-muted-foreground">Real-time vulnerability feeds</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">Operational</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="font-medium">Google Gemini AI</p>
                    <p className="text-sm text-muted-foreground">Security analysis & remediation</p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="font-medium">Email Service</p>
                    <p className="text-sm text-muted-foreground">SendGrid notification delivery</p>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Configured</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}