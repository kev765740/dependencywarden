import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, GitBranch, Webhook, Bug, ExternalLink, Settings, Play, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Integration {
  id: number;
  platform: string;
  is_active: boolean;
  created_at: string;
  ticket_count?: number;
}

interface Repository {
  id: number;
  repositoryName: string;
  gitUrl: string;
}

export default function Integrations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRepo, setSelectedRepo] = useState<string>("");
  const [activeTab, setActiveTab] = useState("overview");

  // Get repositories
  const { data: repositories } = useQuery({
    queryKey: ["/api/repositories"],
  });

  // Get integrations for selected repository
  const { data: cicdIntegrations } = useQuery({
    queryKey: ["/api/cicd/integrations", selectedRepo],
    enabled: !!selectedRepo,
  });

  const { data: issueIntegrations } = useQuery({
    queryKey: ["/api/issue-tracking/integrations", selectedRepo],
    enabled: !!selectedRepo,
  });

  // CI/CD Configuration
  const [cicdConfig, setCicdConfig] = useState({
    platform: "",
    blockOnCritical: true,
    blockOnHigh: false,
    maxCritical: 0,
    maxHigh: 5,
    blockOnLicenseViolations: true
  });

  // Issue Tracking Configuration
  const [issueConfig, setIssueConfig] = useState({
    platform: "",
    config: {}
  });

  // Jira Configuration
  const [jiraConfig, setJiraConfig] = useState({
    baseUrl: "",
    email: "",
    apiToken: "",
    projectKey: "",
    issueType: "Bug"
  });

  // Linear Configuration
  const [linearConfig, setLinearConfig] = useState({
    apiKey: "",
    teamId: "",
    labelIds: []
  });

  // GitHub Issues Configuration
  const [githubConfig, setGithubConfig] = useState({
    token: "",
    owner: "",
    repo: ""
  });

  // Configure CI/CD Integration
  const cicdMutation = useMutation({
    mutationFn: async (config: any) => {
      return await apiRequest("POST", `/api/cicd/integrations/${selectedRepo}`, config);
    },
    onSuccess: () => {
      toast({
        title: "CI/CD Integration Configured",
        description: "Security gate is now active for this repository.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cicd/integrations", selectedRepo] });
    },
    onError: (error) => {
      toast({
        title: "Configuration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Configure Issue Tracking Integration
  const issueMutation = useMutation({
    mutationFn: async (config: any) => {
      return await apiRequest("POST", `/api/issue-tracking/integrations/${selectedRepo}`, config);
    },
    onSuccess: () => {
      toast({
        title: "Issue Tracking Configured",
        description: "Automatic ticket creation is now enabled.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/issue-tracking/integrations", selectedRepo] });
    },
    onError: (error) => {
      toast({
        title: "Configuration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Test Integration
  const testMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/issue-tracking/test/${selectedRepo}`);
    },
    onSuccess: (data) => {
      toast({
        title: "Test Successful",
        description: `Test ticket created: ${data.ticket_id}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCicdSubmit = () => {
    cicdMutation.mutate({
      platform: cicdConfig.platform,
      settings: {
        blockOnCritical: cicdConfig.blockOnCritical,
        blockOnHigh: cicdConfig.blockOnHigh,
        maxCritical: cicdConfig.maxCritical,
        maxHigh: cicdConfig.maxHigh,
        blockOnLicenseViolations: cicdConfig.blockOnLicenseViolations
      }
    });
  };

  const handleIssueSubmit = () => {
    let config = {};
    
    switch (issueConfig.platform) {
      case 'jira':
        config = jiraConfig;
        break;
      case 'linear':
        config = linearConfig;
        break;
      case 'github_issues':
        config = githubConfig;
        break;
    }

    issueMutation.mutate({
      platform: issueConfig.platform,
      config
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Integrations</h1>
          <p className="text-muted-foreground">
            Automate your security workflow with CI/CD and issue tracking integrations
          </p>
        </div>
      </div>

      {/* Repository Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Repository Selection
          </CardTitle>
          <CardDescription>
            Choose a repository to configure integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="repository">Repository</Label>
              <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a repository" />
                </SelectTrigger>
                <SelectContent>
                  {repositories?.map((repo: Repository) => (
                    <SelectItem key={repo.id} value={repo.id.toString()}>
                      {repo.repositoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedRepo && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cicd">CI/CD Security Gates</TabsTrigger>
            <TabsTrigger value="issue-tracking">Issue Tracking</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* CI/CD Integration Status */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">CI/CD Security Gate</CardTitle>
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    {cicdIntegrations?.is_active ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Active</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">Not Configured</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {cicdIntegrations?.platform || "No platform configured"}
                  </p>
                </CardContent>
              </Card>

              {/* Issue Tracking Status */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Issue Tracking</CardTitle>
                  <Bug className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    {issueIntegrations?.integrations?.length > 0 ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Active</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">Not Configured</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {issueIntegrations?.integrations?.[0]?.platform || "No platform configured"}
                  </p>
                </CardContent>
              </Card>

              {/* Webhook Status */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
                  <Webhook className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Available</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    GitHub, GitLab, Generic
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Integration Benefits */}
            <Card>
              <CardHeader>
                <CardTitle>Integration Benefits</CardTitle>
                <CardDescription>
                  Key features enabled by API integrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">CI/CD Security Gates</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Block deployments on critical vulnerabilities</li>
                      <li>• Automated dependency scanning</li>
                      <li>• License compliance enforcement</li>
                      <li>• Security policy validation</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Issue Tracking Automation</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Automatic ticket creation for vulnerabilities</li>
                      <li>• Remediation tracking and updates</li>
                      <li>• Team assignment and notifications</li>
                      <li>• Progress monitoring and reporting</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CI/CD Tab */}
          <TabsContent value="cicd" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  CI/CD Security Gate Configuration
                </CardTitle>
                <CardDescription>
                  Configure security gates to block deployments when vulnerabilities are detected
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="cicd-platform">CI/CD Platform</Label>
                    <Select 
                      value={cicdConfig.platform} 
                      onValueChange={(value) => setCicdConfig(prev => ({ ...prev, platform: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="github_actions">GitHub Actions</SelectItem>
                        <SelectItem value="gitlab_ci">GitLab CI</SelectItem>
                        <SelectItem value="jenkins">Jenkins</SelectItem>
                        <SelectItem value="azure_devops">Azure DevOps</SelectItem>
                        <SelectItem value="circleci">CircleCI</SelectItem>
                        <SelectItem value="travis_ci">Travis CI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="block-critical">Block on Critical Vulnerabilities</Label>
                      <Switch
                        id="block-critical"
                        checked={cicdConfig.blockOnCritical}
                        onCheckedChange={(checked) => setCicdConfig(prev => ({ ...prev, blockOnCritical: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="block-high">Block on High Vulnerabilities</Label>
                      <Switch
                        id="block-high"
                        checked={cicdConfig.blockOnHigh}
                        onCheckedChange={(checked) => setCicdConfig(prev => ({ ...prev, blockOnHigh: checked }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="max-critical">Max Critical Vulnerabilities</Label>
                      <Input
                        id="max-critical"
                        type="number"
                        value={cicdConfig.maxCritical}
                        onChange={(e) => setCicdConfig(prev => ({ ...prev, maxCritical: parseInt(e.target.value) }))}
                      />
                    </div>

                    <div>
                      <Label htmlFor="max-high">Max High Vulnerabilities</Label>
                      <Input
                        id="max-high"
                        type="number"
                        value={cicdConfig.maxHigh}
                        onChange={(e) => setCicdConfig(prev => ({ ...prev, maxHigh: parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="block-license">Block on License Violations</Label>
                    <Switch
                      id="block-license"
                      checked={cicdConfig.blockOnLicenseViolations}
                      onCheckedChange={(checked) => setCicdConfig(prev => ({ ...prev, blockOnLicenseViolations: checked }))}
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleCicdSubmit} 
                  disabled={!cicdConfig.platform || cicdMutation.isPending}
                  className="w-full"
                >
                  {cicdMutation.isPending ? "Configuring..." : "Configure CI/CD Integration"}
                </Button>

                {cicdIntegrations && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Integration Endpoint</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Add this endpoint to your CI/CD pipeline:
                    </p>
                    <code className="text-sm bg-background px-2 py-1 rounded border">
                      POST {window.location.origin}/api/cicd/security-gate
                    </code>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Issue Tracking Tab */}
          <TabsContent value="issue-tracking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bug className="h-5 w-5" />
                  Issue Tracking Integration
                </CardTitle>
                <CardDescription>
                  Automatically create tickets when security vulnerabilities are detected
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="issue-platform">Platform</Label>
                  <Select 
                    value={issueConfig.platform} 
                    onValueChange={(value) => setIssueConfig(prev => ({ ...prev, platform: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jira">Jira</SelectItem>
                      <SelectItem value="linear">Linear</SelectItem>
                      <SelectItem value="github_issues">GitHub Issues</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Jira Configuration */}
                {issueConfig.platform === 'jira' && (
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="jira-url">Jira Base URL</Label>
                      <Input
                        id="jira-url"
                        placeholder="https://your-domain.atlassian.net"
                        value={jiraConfig.baseUrl}
                        onChange={(e) => setJiraConfig(prev => ({ ...prev, baseUrl: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="jira-email">Email</Label>
                        <Input
                          id="jira-email"
                          type="email"
                          value={jiraConfig.email}
                          onChange={(e) => setJiraConfig(prev => ({ ...prev, email: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="jira-token">API Token</Label>
                        <Input
                          id="jira-token"
                          type="password"
                          value={jiraConfig.apiToken}
                          onChange={(e) => setJiraConfig(prev => ({ ...prev, apiToken: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="jira-project">Project Key</Label>
                        <Input
                          id="jira-project"
                          placeholder="PROJ"
                          value={jiraConfig.projectKey}
                          onChange={(e) => setJiraConfig(prev => ({ ...prev, projectKey: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="jira-issue-type">Issue Type</Label>
                        <Input
                          id="jira-issue-type"
                          placeholder="Bug"
                          value={jiraConfig.issueType}
                          onChange={(e) => setJiraConfig(prev => ({ ...prev, issueType: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Linear Configuration */}
                {issueConfig.platform === 'linear' && (
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="linear-token">API Key</Label>
                      <Input
                        id="linear-token"
                        type="password"
                        value={linearConfig.apiKey}
                        onChange={(e) => setLinearConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="linear-team">Team ID</Label>
                      <Input
                        id="linear-team"
                        value={linearConfig.teamId}
                        onChange={(e) => setLinearConfig(prev => ({ ...prev, teamId: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {/* GitHub Issues Configuration */}
                {issueConfig.platform === 'github_issues' && (
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="github-token">GitHub Token</Label>
                      <Input
                        id="github-token"
                        type="password"
                        value={githubConfig.token}
                        onChange={(e) => setGithubConfig(prev => ({ ...prev, token: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="github-owner">Owner</Label>
                        <Input
                          id="github-owner"
                          value={githubConfig.owner}
                          onChange={(e) => setGithubConfig(prev => ({ ...prev, owner: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="github-repo">Repository</Label>
                        <Input
                          id="github-repo"
                          value={githubConfig.repo}
                          onChange={(e) => setGithubConfig(prev => ({ ...prev, repo: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={handleIssueSubmit} 
                    disabled={!issueConfig.platform || issueMutation.isPending}
                    className="flex-1"
                  >
                    {issueMutation.isPending ? "Configuring..." : "Configure Integration"}
                  </Button>
                  
                  {issueIntegrations?.integrations?.length > 0 && (
                    <Button 
                      variant="outline"
                      onClick={() => testMutation.mutate()}
                      disabled={testMutation.isPending}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      {testMutation.isPending ? "Testing..." : "Test"}
                    </Button>
                  )}
                </div>

                {issueIntegrations?.statistics && (
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{issueIntegrations.statistics.total_tickets}</div>
                      <div className="text-sm text-muted-foreground">Total Tickets</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{issueIntegrations.statistics.open_tickets}</div>
                      <div className="text-sm text-muted-foreground">Open</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{issueIntegrations.statistics.in_progress_tickets}</div>
                      <div className="text-sm text-muted-foreground">In Progress</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{issueIntegrations.statistics.closed_tickets}</div>
                      <div className="text-sm text-muted-foreground">Closed</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Webhooks Tab */}
          <TabsContent value="webhooks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Webhook Endpoints
                </CardTitle>
                <CardDescription>
                  Configure webhooks for automatic repository discovery and dependency scanning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  
                  {/* GitHub Webhook */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary">GitHub</Badge>
                      <span className="font-medium">Repository Events</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Automatically discover repositories and trigger scans on push events
                    </p>
                    <div className="space-y-2">
                      <Label>Webhook URL</Label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm bg-muted px-3 py-2 rounded border">
                          {window.location.origin}/webhooks/github
                        </code>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Configure in GitHub: Settings → Webhooks → Add webhook
                      </p>
                    </div>
                  </div>

                  {/* GitLab Webhook */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary">GitLab</Badge>
                      <span className="font-medium">Project Events</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Automatically discover projects and trigger scans on push events
                    </p>
                    <div className="space-y-2">
                      <Label>Webhook URL</Label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm bg-muted px-3 py-2 rounded border">
                          {window.location.origin}/webhooks/gitlab
                        </code>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Configure in GitLab: Settings → Webhooks → Add webhook
                      </p>
                    </div>
                  </div>

                  {/* Generic Webhook */}
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary">Generic</Badge>
                      <span className="font-medium">Custom Integrations</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Custom webhook endpoint for third-party integrations
                    </p>
                    <div className="space-y-2">
                      <Label>Webhook URL</Label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-sm bg-muted px-3 py-2 rounded border">
                          {window.location.origin}/webhooks/generic
                        </code>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Send POST requests with custom payload structure
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100">Webhook Benefits</h4>
                      <ul className="text-sm text-blue-700 dark:text-blue-200 mt-1 space-y-1">
                        <li>• Automatic repository discovery</li>
                        <li>• Real-time dependency scanning on code changes</li>
                        <li>• Immediate security alerts for new vulnerabilities</li>
                        <li>• Seamless integration with existing development workflows</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}