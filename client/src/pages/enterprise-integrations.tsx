import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Shield, Server, Users, GitBranch, Database, Cloud, Activity, Check, X, Plus, Settings, TestTube } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Integration {
  id: number;
  type: string;
  provider: string;
  config: any;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EnterpriseIntegrations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("siem");

  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ["/api/integrations"],
  });

  const testIntegrationMutation = useMutation({
    mutationFn: async (integrationId: number) => {
      return await apiRequest("POST", `/api/integrations/${integrationId}/test`);
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Integration Test Passed" : "Integration Test Failed",
        description: data.success ? "Connection established successfully" : "Failed to establish connection",
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: () => {
      toast({
        title: "Test Failed",
        description: "Unable to test integration",
        variant: "destructive",
      });
    },
  });

  const siemIntegrations = integrations.filter((i: Integration) => i.type === 'siem');
  const devopsIntegrations = integrations.filter((i: Integration) => i.type === 'devops');
  const identityIntegrations = integrations.filter((i: Integration) => i.type === 'identity_provider');

  const SIEMIntegrations = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">SIEM Integrations</h3>
          <p className="text-muted-foreground">Connect with Security Information and Event Management systems</p>
        </div>
        <SIEMSetupDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SIEMProviderCard 
          provider="splunk"
          title="Splunk"
          description="Enterprise security analytics platform"
          icon={<Database className="h-8 w-8" />}
          features={["HEC Integration", "Real-time Events", "Custom Dashboards"]}
          isConfigured={siemIntegrations.some((i: Integration) => i.provider === 'splunk')}
        />
        
        <SIEMProviderCard 
          provider="qradar"
          title="IBM QRadar"
          description="Intelligent security analytics"
          icon={<Shield className="h-8 w-8" />}
          features={["Event Correlation", "Threat Intelligence", "Compliance Reporting"]}
          isConfigured={siemIntegrations.some((i: Integration) => i.provider === 'qradar')}
        />
        
        <SIEMProviderCard 
          provider="sentinel"
          title="Azure Sentinel"
          description="Cloud-native SIEM solution"
          icon={<Cloud className="h-8 w-8" />}
          features={["AI-Powered Detection", "Cloud Integration", "Automated Response"]}
          isConfigured={siemIntegrations.some((i: Integration) => i.provider === 'sentinel')}
        />
        
        <SIEMProviderCard 
          provider="elastic"
          title="Elastic Security"
          description="Open source security analytics"
          icon={<Activity className="h-8 w-8" />}
          features={["Full-text Search", "Machine Learning", "Threat Hunting"]}
          isConfigured={siemIntegrations.some((i: Integration) => i.provider === 'elastic')}
        />
      </div>

      {siemIntegrations.length > 0 && (
        <ConfiguredIntegrations 
          integrations={siemIntegrations}
          onTest={(id) => testIntegrationMutation.mutate(id)}
          isTesting={testIntegrationMutation.isPending}
        />
      )}
    </div>
  );

  const DevOpsIntegrations = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">DevOps Tool Chain</h3>
          <p className="text-muted-foreground">Integrate with development and deployment pipelines</p>
        </div>
        <DevOpsSetupDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <DevOpsProviderCard 
          provider="terraform"
          title="Terraform"
          description="Infrastructure as Code"
          icon={<Server className="h-8 w-8" />}
          features={["State Monitoring", "Security Policies", "Automated Scans"]}
          isConfigured={devopsIntegrations.some((i: Integration) => i.provider === 'terraform')}
        />
        
        <DevOpsProviderCard 
          provider="kubernetes"
          title="Kubernetes"
          description="Container orchestration"
          icon={<GitBranch className="h-8 w-8" />}
          features={["Pod Security", "Network Policies", "Admission Controllers"]}
          isConfigured={devopsIntegrations.some((i: Integration) => i.provider === 'kubernetes')}
        />
        
        <DevOpsProviderCard 
          provider="docker"
          title="Docker"
          description="Containerization platform"
          icon={<Database className="h-8 w-8" />}
          features={["Image Scanning", "Registry Integration", "Security Policies"]}
          isConfigured={devopsIntegrations.some((i: Integration) => i.provider === 'docker')}
        />
        
        <DevOpsProviderCard 
          provider="github_actions"
          title="GitHub Actions"
          description="CI/CD workflows"
          icon={<GitBranch className="h-8 w-8" />}
          features={["Workflow Integration", "Security Checks", "Automated Scanning"]}
          isConfigured={devopsIntegrations.some((i: Integration) => i.provider === 'github_actions')}
        />
        
        <DevOpsProviderCard 
          provider="jenkins"
          title="Jenkins"
          description="Automation server"
          icon={<Settings className="h-8 w-8" />}
          features={["Pipeline Integration", "Build Security", "Artifact Scanning"]}
          isConfigured={devopsIntegrations.some((i: Integration) => i.provider === 'jenkins')}
        />
      </div>

      {devopsIntegrations.length > 0 && (
        <ConfiguredIntegrations 
          integrations={devopsIntegrations}
          onTest={(id) => testIntegrationMutation.mutate(id)}
          isTesting={testIntegrationMutation.isPending}
        />
      )}
    </div>
  );

  const IdentityIntegrations = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Identity Provider SSO</h3>
          <p className="text-muted-foreground">Connect with enterprise identity providers for single sign-on</p>
        </div>
        <IdentitySetupDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <IdentityProviderCard 
          provider="okta"
          title="Okta"
          description="Enterprise identity platform"
          icon={<Users className="h-8 w-8" />}
          features={["SAML/OIDC", "MFA", "User Provisioning"]}
          isConfigured={identityIntegrations.some((i: Integration) => i.provider === 'okta')}
        />
        
        <IdentityProviderCard 
          provider="azure_ad"
          title="Azure AD"
          description="Microsoft identity platform"
          icon={<Cloud className="h-8 w-8" />}
          features={["Office 365 Integration", "Conditional Access", "B2B/B2C"]}
          isConfigured={identityIntegrations.some((i: Integration) => i.provider === 'azure_ad')}
        />
        
        <IdentityProviderCard 
          provider="google_workspace"
          title="Google Workspace"
          description="Google identity services"
          icon={<Users className="h-8 w-8" />}
          features={["G Suite Integration", "Admin Console", "Security Center"]}
          isConfigured={identityIntegrations.some((i: Integration) => i.provider === 'google_workspace')}
        />
        
        <IdentityProviderCard 
          provider="ping_identity"
          title="Ping Identity"
          description="Enterprise identity solutions"
          icon={<Shield className="h-8 w-8" />}
          features={["PingFederate", "PingOne", "API Security"]}
          isConfigured={identityIntegrations.some((i: Integration) => i.provider === 'ping_identity')}
        />
      </div>

      {identityIntegrations.length > 0 && (
        <ConfiguredIntegrations 
          integrations={identityIntegrations}
          onTest={(id) => testIntegrationMutation.mutate(id)}
          isTesting={testIntegrationMutation.isPending}
        />
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Enterprise Integration Ecosystem</h1>
        <p className="text-muted-foreground">
          Connect your dependency monitoring platform with enterprise security, DevOps, and identity management systems
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              SIEM Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Real-time security event forwarding to enterprise SIEM platforms
            </p>
            <Badge variant="outline">{siemIntegrations.length} Configured</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-green-600" />
              DevOps Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Automated security checks in CI/CD pipelines and infrastructure
            </p>
            <Badge variant="outline">{devopsIntegrations.length} Configured</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Identity Providers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Enterprise SSO and identity management integration
            </p>
            <Badge variant="outline">{identityIntegrations.length} Configured</Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="siem">SIEM Integration</TabsTrigger>
          <TabsTrigger value="devops">DevOps Tools</TabsTrigger>
          <TabsTrigger value="identity">Identity Providers</TabsTrigger>
        </TabsList>

        <TabsContent value="siem">
          <SIEMIntegrations />
        </TabsContent>

        <TabsContent value="devops">
          <DevOpsIntegrations />
        </TabsContent>

        <TabsContent value="identity">
          <IdentityIntegrations />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SIEMProviderCard({ provider, title, description, icon, features, isConfigured }: {
  provider: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  isConfigured: boolean;
}) {
  return (
    <Card className={`relative ${isConfigured ? 'ring-2 ring-green-500' : ''}`}>
      {isConfigured && (
        <div className="absolute -top-2 -right-2">
          <Badge className="bg-green-500 text-white">
            <Check className="h-3 w-3 mr-1" />
            Configured
          </Badge>
        </div>
      )}
      <CardHeader>
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {features.map((feature, index) => (
            <li key={index} className="text-sm flex items-center gap-2">
              <Check className="h-3 w-3 text-green-500" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function DevOpsProviderCard({ provider, title, description, icon, features, isConfigured }: {
  provider: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  isConfigured: boolean;
}) {
  return (
    <Card className={`relative ${isConfigured ? 'ring-2 ring-green-500' : ''}`}>
      {isConfigured && (
        <div className="absolute -top-2 -right-2">
          <Badge className="bg-green-500 text-white">
            <Check className="h-3 w-3 mr-1" />
            Configured
          </Badge>
        </div>
      )}
      <CardHeader>
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {features.map((feature, index) => (
            <li key={index} className="text-sm flex items-center gap-2">
              <Check className="h-3 w-3 text-green-500" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function IdentityProviderCard({ provider, title, description, icon, features, isConfigured }: {
  provider: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  isConfigured: boolean;
}) {
  return (
    <Card className={`relative ${isConfigured ? 'ring-2 ring-green-500' : ''}`}>
      {isConfigured && (
        <div className="absolute -top-2 -right-2">
          <Badge className="bg-green-500 text-white">
            <Check className="h-3 w-3 mr-1" />
            Configured
          </Badge>
        </div>
      )}
      <CardHeader>
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1">
          {features.map((feature, index) => (
            <li key={index} className="text-sm flex items-center gap-2">
              <Check className="h-3 w-3 text-green-500" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function ConfiguredIntegrations({ integrations, onTest, isTesting }: {
  integrations: Integration[];
  onTest: (id: number) => void;
  isTesting: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configured Integrations</CardTitle>
        <CardDescription>Manage your active integrations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {integrations.map((integration) => (
            <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant={integration.isEnabled ? "default" : "secondary"}>
                  {integration.provider}
                </Badge>
                <div>
                  <p className="font-medium">{integration.provider} Integration</p>
                  <p className="text-sm text-muted-foreground">
                    {integration.isEnabled ? 'Active' : 'Disabled'} • {integration.type}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onTest(integration.id)}
                  disabled={isTesting}
                >
                  <TestTube className="h-4 w-4 mr-1" />
                  Test
                </Button>
                <Switch checked={integration.isEnabled} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SIEMSetupDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add SIEM Integration
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure SIEM Integration</DialogTitle>
          <DialogDescription>
            Connect your SIEM platform to receive real-time security events
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            To set up SIEM integration, you'll need to provide your SIEM platform credentials and endpoint configuration. 
            Please contact your security team for the required API keys and connection details.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DevOpsSetupDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add DevOps Integration
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure DevOps Integration</DialogTitle>
          <DialogDescription>
            Integrate with your CI/CD pipeline and infrastructure tools
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            DevOps integrations enable automated security scanning in your deployment pipelines. 
            You'll need webhook URLs and API tokens from your DevOps platform.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function IdentitySetupDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Identity Provider
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configure Identity Provider</DialogTitle>
          <DialogDescription>
            Set up enterprise SSO with your identity management system
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Identity provider integration enables enterprise single sign-on. 
            You'll need client credentials and tenant configuration from your identity provider.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}