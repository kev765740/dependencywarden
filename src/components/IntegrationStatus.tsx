import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle, 
  AlertTriangle, 
  Settings, 
  Github, 
  Mail, 
  MessageSquare,
  Key,
  ExternalLink,
  Copy,
  Eye,
  EyeOff
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface IntegrationConfig {
  name: string;
  status: 'connected' | 'missing' | 'error';
  description: string;
  icon: any;
  envVars: string[];
  setupInstructions: string;
  testEndpoint?: string;
}

export function IntegrationStatus() {
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [setupDialog, setSetupDialog] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: integrations, isLoading } = useQuery<IntegrationConfig[]>({
    queryKey: ['/api/integrations/status'],
    queryFn: async () => {
      const response = await fetch('/api/integrations/status', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch integration status');
      return response.json();
    }
  });

  const integrationConfigs: IntegrationConfig[] = [
    {
      name: 'GitHub Integration',
      status: 'missing',
      description: 'Access private repositories and create real pull requests',
      icon: Github,
      envVars: ['GITHUB_TOKEN'],
      setupInstructions: `1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Click "Generate new token (classic)"
3. Select scopes: repo, pull_request, contents
4. Copy the token and paste it below
5. For organizations, ensure token has proper permissions`,
      testEndpoint: '/api/test-github'
    },
    {
      name: 'Email Notifications',
      status: 'missing', 
      description: 'Send security alerts and reports via email',
      icon: Mail,
      envVars: ['SENDGRID_API_KEY'],
      setupInstructions: `Option 1 - SendGrid (Recommended):
1. Create account at sendgrid.com
2. Go to Settings > API Keys
3. Create new API key with Mail Send permissions
4. Copy key and paste below

Option 2 - Custom SMTP:
Configure SMTP_HOST, SMTP_USER, SMTP_PASS instead`,
      testEndpoint: '/api/test-email'
    },
    {
      name: 'Slack Integration',
      status: 'missing',
      description: 'Send alerts and reports to Slack channels',
      icon: MessageSquare,
      envVars: ['SLACK_WEBHOOK_URL'],
      setupInstructions: `1. Go to your Slack workspace
2. Apps > Incoming Webhooks > Add to Slack
3. Choose channel for notifications
4. Copy Webhook URL and paste below
5. Test the integration`,
      testEndpoint: '/api/test-slack'
    }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Environment variable copied successfully"
    });
  };

  const testIntegration = async (integration: IntegrationConfig) => {
    if (!integration.testEndpoint) return;
    
    try {
      const response = await fetch(integration.testEndpoint, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast({
          title: "Integration Test Successful",
          description: `${integration.name} is working correctly`
        });
      } else {
        toast({
          title: "Integration Test Failed",
          description: `Please check your ${integration.name} configuration`
        });
      }
    } catch (error) {
      toast({
        title: "Test Error",
        description: `Failed to test ${integration.name} integration`
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Settings className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Setup Required</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const connectedCount = integrationConfigs.filter(i => i.status === 'connected').length;
  const totalCount = integrationConfigs.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Integration Status</span>
            </CardTitle>
            <CardDescription>
              Configure external integrations for full platform functionality
            </CardDescription>
          </div>
          <Badge variant={connectedCount === totalCount ? "default" : "secondary"}>
            {connectedCount}/{totalCount} Configured
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {connectedCount < totalCount && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Some integrations need configuration. The platform works without them, but you'll miss key features like private repo scanning and notifications.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {integrationConfigs.map((integration) => (
            <div key={integration.name} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(integration.status)}
                <integration.icon className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{integration.name}</span>
                    {getStatusBadge(integration.status)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {integration.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {integration.status === 'connected' && integration.testEndpoint && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testIntegration(integration)}
                  >
                    Test
                  </Button>
                )}
                
                <Dialog open={setupDialog === integration.name} onOpenChange={(open) => {
                  if (!open) setSetupDialog(null);
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      variant={integration.status === 'connected' ? "outline" : "default"} 
                      size="sm"
                      onClick={() => setSetupDialog(integration.name)}
                    >
                      {integration.status === 'connected' ? 'Reconfigure' : 'Setup'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center space-x-2">
                        <integration.icon className="h-5 w-5" />
                        <span>Setup {integration.name}</span>
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Setup Instructions</h4>
                        <div className="text-sm text-blue-800 dark:text-blue-200 whitespace-pre-line">
                          {integration.setupInstructions}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-medium">Environment Variables</h4>
                        {integration.envVars.map((envVar) => (
                          <div key={envVar} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor={envVar}>{envVar}</Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(envVar)}
                                className="h-6 px-2"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="relative">
                              <Input
                                id={envVar}
                                type={showSecrets[envVar] ? "text" : "password"}
                                placeholder={`Enter your ${envVar}...`}
                                className="pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3"
                                onClick={() => setShowSecrets(prev => ({
                                  ...prev,
                                  [envVar]: !prev[envVar]
                                }))}
                              >
                                {showSecrets[envVar] ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Add these environment variables to your deployment configuration. 
                          The platform will automatically detect and use them once configured.
                        </AlertDescription>
                      </Alert>

                      <div className="flex justify-end space-x-3">
                        <Button variant="outline" onClick={() => setSetupDialog(null)}>
                          Close
                        </Button>
                        {integration.testEndpoint && (
                          <Button onClick={() => testIntegration(integration)}>
                            Test Integration
                          </Button>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>

        {connectedCount === totalCount && (
          <div className="text-center py-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-green-900 dark:text-green-100 mb-2">
              All Integrations Configured
            </h3>
            <p className="text-green-700 dark:text-green-300">
              Your platform is fully configured with all external services
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}