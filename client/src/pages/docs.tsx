import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Shield, 
  Bell, 
  HelpCircle, 
  Play, 
  Github,
  Mail,
  Slack,
  AlertTriangle,
  CheckCircle,
  Info,
  Settings,
  Zap,
  Clock
} from "lucide-react";

export default function Documentation() {
  const [activeSection, setActiveSection] = useState("getting-started");

  const sections = [
    { id: "getting-started", label: "Getting Started", icon: Play },
    { id: "repositories", label: "Adding Repositories", icon: Github },
    { id: "scanning", label: "Scanning Configuration", icon: Settings },
    { id: "alerts", label: "Understanding Alerts", icon: Shield },
    { id: "notifications", label: "Notifications Setup", icon: Bell },
    { id: "faq", label: "FAQ & Troubleshooting", icon: HelpCircle }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-left">
              <h1 className="text-4xl font-bold">Documentation Hub</h1>
              <p className="text-gray-600 mt-1">Complete guide to enterprise security monitoring</p>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 max-w-4xl mx-auto">
            <p className="text-lg text-gray-700 mb-4">
              Master dependency security monitoring with AI-powered vulnerability detection, 
              automated remediation, and enterprise-grade compliance reporting.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">Real-time Scanning</Badge>
              <Badge className="bg-purple-100 text-purple-800">AI Security Copilot</Badge>
              <Badge className="bg-green-100 text-green-800">Auto-Fix PRs</Badge>
              <Badge className="bg-orange-100 text-orange-800">Compliance Reports</Badge>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Quick Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <Button
                      key={section.id}
                      variant={activeSection === section.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setActiveSection(section.id)}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {section.label}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeSection === "getting-started" && <GettingStarted />}
            {activeSection === "repositories" && <RepositoriesGuide />}
            {activeSection === "scanning" && <ScanningConfigurationGuide />}
            {activeSection === "alerts" && <AlertsGuide />}
            {activeSection === "notifications" && <NotificationsGuide />}
            {activeSection === "faq" && <FAQSection />}
          </div>
        </div>
      </div>
    </div>
  );
}

function GettingStarted() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Play className="w-6 h-6 text-green-600" />
            <CardTitle>Getting Started</CardTitle>
          </div>
          <CardDescription>
            Start monitoring your dependencies in just a few simple steps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto">
                1
              </div>
              <h3 className="font-semibold">Sign In</h3>
              <p className="text-sm text-gray-600">
                Authenticate securely with your account
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto">
                2
              </div>
              <h3 className="font-semibold">Add Repositories</h3>
              <p className="text-sm text-gray-600">
                Connect your GitHub repositories for monitoring
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto">
                3
              </div>
              <h3 className="font-semibold">Monitor & Alert</h3>
              <p className="text-sm text-gray-600">
                Receive real-time security and license alerts
              </p>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              Quick Start Tips
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Start with your most critical repositories first</li>
              <li>• Configure notifications early to stay informed</li>
              <li>• Review vulnerability details to understand impact</li>
              <li>• Set up Slack integration for team notifications</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What We Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                <h4 className="font-semibold">Security Vulnerabilities</h4>
              </div>
              <p className="text-sm text-gray-600">
                Real-time scanning using the OSV database to detect CVEs and security issues
                in your npm dependencies with detailed CVSS scoring.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <h4 className="font-semibold">License Changes</h4>
              </div>
              <p className="text-sm text-gray-600">
                Track license modifications in your dependencies to ensure compliance
                with your organization's legal requirements.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RepositoriesGuide() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Github className="w-6 h-6" />
            <CardTitle>Adding Repositories</CardTitle>
          </div>
          <CardDescription>
            Connect your GitHub repositories to start monitoring dependencies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Step 1: Navigate to Home</h4>
              <p className="text-sm text-gray-600 mb-2">
                From your dashboard, click the "Add Repository" button to open the repository form.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Step 2: Repository Information</h4>
              <div className="bg-gray-50 p-3 rounded text-sm space-y-2">
                <p><strong>Repository Name:</strong> A descriptive name for identification</p>
                <p><strong>Git URL:</strong> The HTTPS clone URL (e.g., https://github.com/user/repo.git)</p>
                <p><strong>Default Branch:</strong> Usually 'main' or 'master'</p>
                <p><strong>Auth Token:</strong> GitHub personal access token (optional but recommended)</p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Step 3: First Scan</h4>
              <p className="text-sm text-gray-600">
                After adding your repository, trigger an initial scan to detect existing vulnerabilities
                and establish a baseline for monitoring.
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-yellow-600" />
              Repository Requirements
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Repository must contain a package.json file</li>
              <li>• Dependencies section should be populated</li>
              <li>• Public repositories work without authentication</li>
              <li>• Private repositories require a valid access token</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Setting Up Access Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              For private repositories or to avoid rate limits, set up a GitHub Personal Access Token:
            </p>
            <ol className="space-y-2 text-sm">
              <li>1. Go to GitHub Settings → Developer settings → Personal access tokens</li>
              <li>2. Generate a new token with 'repo' scope for private repos</li>
              <li>3. Copy the token and paste it in the Auth Token field</li>
              <li>4. Keep your token secure and never share it publicly</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AlertsGuide() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-red-600" />
            <CardTitle>Understanding Alerts</CardTitle>
          </div>
          <CardDescription>
            Learn about vulnerability severity levels and license change notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-3">Vulnerability Severity Levels</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded">
                <Badge variant="destructive">Critical</Badge>
                <div>
                  <p className="font-medium text-red-900">Critical (CVSS 9.0-10.0)</p>
                  <p className="text-sm text-red-700">Immediate action required. High risk of exploitation.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded">
                <Badge className="bg-orange-600">High</Badge>
                <div>
                  <p className="font-medium text-orange-900">High (CVSS 7.0-8.9)</p>
                  <p className="text-sm text-orange-700">Significant risk. Update as soon as possible.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded">
                <Badge className="bg-yellow-600">Medium</Badge>
                <div>
                  <p className="font-medium text-yellow-900">Medium (CVSS 4.0-6.9)</p>
                  <p className="text-sm text-yellow-700">Moderate risk. Plan update in next release cycle.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded">
                <Badge variant="outline" className="border-blue-600 text-blue-600">Low</Badge>
                <div>
                  <p className="font-medium text-blue-900">Low (CVSS 0.1-3.9)</p>
                  <p className="text-sm text-blue-700">Minor risk. Update when convenient.</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">License Change Types</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-red-50 rounded">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Restrictive License Change</p>
                  <p className="text-sm text-red-700">License became more restrictive (e.g., MIT → GPL)</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Permissive License Change</p>
                  <p className="text-sm text-green-700">License became more permissive (e.g., GPL → MIT)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Alert Details</h4>
            <p className="text-sm text-gray-700 mb-2">
              Each alert provides comprehensive information:
            </p>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• CVE identifiers and detailed descriptions</li>
              <li>• CVSS scores and severity ratings</li>
              <li>• Affected version ranges</li>
              <li>• Recommended remediation steps</li>
              <li>• File usage information when available</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationsGuide() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" />
            <CardTitle>Notification Setup</CardTitle>
          </div>
          <CardDescription>
            Configure email and Slack notifications to stay informed about security alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="email">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Setup
              </TabsTrigger>
              <TabsTrigger value="slack" className="flex items-center gap-2">
                <Slack className="w-4 h-4" />
                Slack Setup
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="email" className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Email Notifications</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Email alerts are sent automatically to your registered email address when vulnerabilities are detected.
                </p>
                
                <div className="bg-gray-50 p-3 rounded text-sm space-y-2">
                  <p><strong>Notification Types:</strong></p>
                  <ul className="space-y-1 ml-4">
                    <li>• New vulnerability alerts</li>
                    <li>• License change notifications</li>
                    <li>• Weekly scan summaries</li>
                    <li>• System maintenance updates</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Email Configuration</h4>
                <p className="text-sm text-gray-700">
                  Email notifications are automatically enabled for all users. 
                  You can manage your email preferences in the Settings page.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="slack" className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Slack Integration</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Get real-time alerts delivered directly to your Slack channels with rich formatting.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <h5 className="font-medium mb-1">Step 1: Create Slack Webhook</h5>
                    <ol className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>1. Go to your Slack workspace settings</li>
                      <li>2. Navigate to Apps → Incoming Webhooks</li>
                      <li>3. Create a new webhook for your desired channel</li>
                      <li>4. Copy the webhook URL</li>
                    </ol>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-1">Step 2: Configure in Settings</h5>
                    <ol className="text-sm text-gray-600 space-y-1 ml-4">
                      <li>1. Go to Settings page</li>
                      <li>2. Find your repository in the list</li>
                      <li>3. Click Edit and paste the webhook URL</li>
                      <li>4. Save changes</li>
                    </ol>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Slack Message Features</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Color-coded severity indicators</li>
                  <li>• Detailed vulnerability information</li>
                  <li>• Direct links to remediation resources</li>
                  <li>• Batch notifications for multiple alerts</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function ScanningConfigurationGuide() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-green-600" />
            <CardTitle>Scanning Configuration</CardTitle>
          </div>
          <CardDescription>
            Configure automated scanning schedules and monitoring preferences for your repositories
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-semibold mb-3">Scan Frequency Options</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded">
                <Clock className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Hourly Scans</p>
                  <p className="text-sm text-green-700">Maximum protection with scans every hour (Pro plan only)</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">Daily Scans</p>
                  <p className="text-sm text-blue-700">Standard protection with daily vulnerability checks</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded">
                <Clock className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-900">Weekly Scans</p>
                  <p className="text-sm text-orange-700">Basic protection with weekly security reviews</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                <Settings className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">Manual Only</p>
                  <p className="text-sm text-gray-700">Scans triggered only when manually requested</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Advanced Scanning Features</h4>
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 rounded">
                <h5 className="font-medium text-purple-900 mb-1">Auto-Scan Toggle</h5>
                <p className="text-sm text-purple-700 mb-2">Enable or disable automatic scanning for each repository independently.</p>
                <ul className="text-xs text-purple-600 space-y-1">
                  <li>• Useful for pausing monitoring during development</li>
                  <li>• Helps manage scan quotas for large repository collections</li>
                  <li>• Manual scans still available when auto-scan is disabled</li>
                </ul>
              </div>
              
              <div className="p-3 bg-yellow-50 rounded">
                <h5 className="font-medium text-yellow-900 mb-1">Priority Scanning</h5>
                <p className="text-sm text-yellow-700 mb-2">Mark critical repositories for faster processing and immediate alerts.</p>
                <ul className="text-xs text-yellow-600 space-y-1">
                  <li>• Priority repositories are scanned first in the queue</li>
                  <li>• Immediate notifications for critical vulnerabilities</li>
                  <li>• Available for Pro subscribers</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-3">Configuring Repository Settings</h4>
            <div className="space-y-3">
              <div>
                <h5 className="font-medium mb-1">Step 1: Access Settings</h5>
                <p className="text-sm text-gray-600 mb-2">Navigate to the Settings page from the main navigation menu.</p>
              </div>
              
              <div>
                <h5 className="font-medium mb-1">Step 2: Find Your Repository</h5>
                <p className="text-sm text-gray-600 mb-2">Locate your repository in the list and click the "Edit" button.</p>
              </div>
              
              <div>
                <h5 className="font-medium mb-1">Step 3: Configure Scanning</h5>
                <div className="bg-gray-50 p-3 rounded text-sm space-y-2">
                  <p><strong>Scan Frequency:</strong> Choose from hourly, daily, weekly, or manual</p>
                  <p><strong>Auto-Scan:</strong> Toggle automatic scanning on/off</p>
                  <p><strong>Priority Scanning:</strong> Enable for critical repositories (Pro only)</p>
                  <p><strong>Slack Webhook:</strong> Configure team notifications</p>
                </div>
              </div>
              
              <div>
                <h5 className="font-medium mb-1">Step 4: Save Changes</h5>
                <p className="text-sm text-gray-600">Click "Save Changes" to apply your new scanning configuration.</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              Best Practices
            </h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>• Use hourly scans for production repositories</li>
              <li>• Enable priority scanning for mission-critical projects</li>
              <li>• Configure Slack notifications for team awareness</li>
              <li>• Set weekly scans for experimental or archived projects</li>
              <li>• Use manual scanning during active development to reduce noise</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FAQSection() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-purple-600" />
            <CardTitle>Frequently Asked Questions</CardTitle>
          </div>
          <CardDescription>
            Common questions about privacy, subscriptions, and troubleshooting
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">🔒 Privacy & Security</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Q: How is my repository data handled?</p>
                  <p className="text-gray-600">A: We only clone your repositories temporarily for scanning. No source code is stored permanently. Only dependency information and vulnerability data are retained.</p>
                </div>
                <div>
                  <p className="font-medium">Q: Are my access tokens secure?</p>
                  <p className="text-gray-600">A: Yes, all access tokens are encrypted in our database and only used for repository access during scans.</p>
                </div>
                <div>
                  <p className="font-medium">Q: What data do you collect?</p>
                  <p className="text-gray-600">A: We collect dependency lists, vulnerability information, and basic repository metadata. We never store your actual source code.</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">💳 Subscription & Billing</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Q: What's included in the free plan?</p>
                  <p className="text-gray-600">A: Free plan includes monitoring for up to 3 repositories with basic vulnerability detection and email notifications.</p>
                </div>
                <div>
                  <p className="font-medium">Q: What are Pro plan benefits?</p>
                  <p className="text-gray-600">A: Pro plan offers unlimited repositories, priority scanning, Slack integration, advanced analytics, and premium support.</p>
                </div>
                <div>
                  <p className="font-medium">Q: Can I cancel anytime?</p>
                  <p className="text-gray-600">A: Yes, you can cancel your subscription at any time. You'll retain Pro features until the end of your billing period.</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">🔧 Troubleshooting</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Q: Why is my repository scan failing?</p>
                  <p className="text-gray-600">A: Common causes: missing package.json, no dependencies listed, incorrect Git URL, or authentication issues for private repos.</p>
                </div>
                <div>
                  <p className="font-medium">Q: How often are repositories scanned?</p>
                  <p className="text-gray-600">A: Free plans: daily scans. Pro plans: hourly scans. You can also trigger manual scans anytime.</p>
                </div>
                <div>
                  <p className="font-medium">Q: Why am I not receiving notifications?</p>
                  <p className="text-gray-600">A: Check your email settings, verify Slack webhook URLs, and ensure your email isn't marking our messages as spam.</p>
                </div>
                <div>
                  <p className="font-medium">Q: How do I update my notification preferences?</p>
                  <p className="text-gray-600">A: Go to Settings page to configure email preferences and Slack webhooks for each repository.</p>
                </div>
                <div>
                  <p className="font-medium">Q: My scan is stuck in "running" status. What should I do?</p>
                  <p className="text-gray-600">A: Scans typically complete within 2-5 minutes. If stuck longer, try triggering a new manual scan or contact support.</p>
                </div>
                <div>
                  <p className="font-medium">Q: Can I scan private repositories?</p>
                  <p className="text-gray-600">A: Yes, provide a GitHub personal access token with appropriate permissions when adding the repository.</p>
                </div>
                <div>
                  <p className="font-medium">Q: How do I delete a repository from monitoring?</p>
                  <p className="text-gray-600">A: Go to Settings, find your repository, and click the "Delete" button. This removes all associated data permanently.</p>
                </div>
                <div>
                  <p className="font-medium">Q: Why don't I see vulnerabilities for some dependencies?</p>
                  <p className="text-gray-600">A: Some packages may not have known vulnerabilities, or they might not be in the OSV database yet. This indicates good security hygiene.</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">⚙️ Technical Details</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Q: Which package managers are supported?</p>
                  <p className="text-gray-600">A: Currently we support npm (package.json). Support for pip (requirements.txt) and other package managers is coming soon.</p>
                </div>
                <div>
                  <p className="font-medium">Q: How accurate is vulnerability detection?</p>
                  <p className="text-gray-600">A: We use the OSV (Open Source Vulnerabilities) database, which is the same source used by GitHub Security Advisories.</p>
                </div>
                <div>
                  <p className="font-medium">Q: Can I integrate with CI/CD pipelines?</p>
                  <p className="text-gray-600">A: API integration for CI/CD is available for Pro subscribers. Contact support for webhook endpoints and documentation.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              Need More Help?
            </h4>
            <p className="text-sm text-gray-700">
              Can't find what you're looking for? Our support team is here to help. 
              Contact us through the settings page or email support for personalized assistance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}