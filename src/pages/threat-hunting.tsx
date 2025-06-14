import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Target, 
  GitBranch, 
  AlertTriangle, 
  Shield,
  Eye,
  Clock,
  Download,
  Filter,
  TrendingUp,
  ArrowRight,
  FileText,
  Database,
  Network,
  Bug,
  Skull,
  Zap,
  Activity,
  Users,
  Globe
} from "lucide-react";

export default function ThreatHunting() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("timeline");
  const [selectedRepository, setSelectedRepository] = useState("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState("7d");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: threatTimeline, isLoading: timelineLoading } = useQuery({
    queryKey: ["/api/threat-hunting/timeline", selectedRepository, selectedTimeframe],
  });

  const { data: attackPaths, isLoading: pathsLoading } = useQuery({
    queryKey: ["/api/threat-hunting/attack-paths", selectedRepository],
  });

  const { data: behavioralAnomalies, isLoading: anomaliesLoading } = useQuery({
    queryKey: ["/api/threat-hunting/behavioral-anomalies", selectedTimeframe],
  });

  const { data: supplyChainThreats, isLoading: supplyChainLoading } = useQuery({
    queryKey: ["/api/threat-hunting/supply-chain-threats", selectedRepository],
  });

  const { data: forensicEvidence, isLoading: evidenceLoading } = useQuery({
    queryKey: ["/api/threat-hunting/forensic-evidence", "global"],
  });

  const ThreatTimelineTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Digital Forensics Timeline</h3>
          <p className="text-muted-foreground">Reconstruct attack sequences and trace threat actor activities</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedRepository} onValueChange={setSelectedRepository}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Repositories</SelectItem>
              <SelectItem value="frontend">Frontend App</SelectItem>
              <SelectItem value="backend">Backend API</SelectItem>
              <SelectItem value="mobile">Mobile App</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <div className="text-sm text-muted-foreground">Security events tracked</div>
            <div className="text-xs text-green-600 mt-1">
              +423 in last 24h
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Critical Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">47</div>
            <div className="text-sm text-muted-foreground">High severity incidents</div>
            <div className="text-xs text-red-600 mt-1">
              +8 new alerts
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-purple-600" />
              Attack Chains
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <div className="text-sm text-muted-foreground">Correlated sequences</div>
            <div className="text-xs text-orange-600 mt-1">
              3 active investigations
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-red-600" />
              IOCs Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">89</div>
            <div className="text-sm text-muted-foreground">Indicators of compromise</div>
            <div className="text-xs text-red-600 mt-1">
              15 confirmed threats
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Threat Event Timeline</CardTitle>
          <CardDescription>Chronological view of security events and potential attack sequences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">14:23:45</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Skull className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-sm">Malicious Package Detection</span>
                  <Badge variant="destructive" className="text-xs">Critical</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Suspicious package "evil-dependency@1.0.0" detected in repository frontend-app
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Repository: frontend-app</span>
                  <span>IOC: SHA256:4a7b8c9d...</span>
                  <span>Technique: T1195.002</span>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">14:18:12</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Network className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-sm">Suspicious Network Connection</span>
                  <Badge variant="secondary" className="text-xs">High</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Outbound connection to known malicious domain detected from build process
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Destination: malicious-c2.example.com</span>
                  <span>Port: 8080</span>
                  <span>Protocol: HTTPS</span>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">14:15:33</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Bug className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">Vulnerability Detected</span>
                  <Badge variant="outline" className="text-xs">Medium</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  CVE-2024-1234 identified in dependency lodash@4.17.20
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>CVSS: 7.5</span>
                  <span>Category: Prototype Pollution</span>
                  <span>Affected: 3 repositories</span>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-xs text-muted-foreground">14:12:07</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium text-sm">Behavioral Anomaly</span>
                  <Badge variant="secondary" className="text-xs">Medium</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  User accessed repository from unusual location (Moscow, RU)
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>User: admin@company.com</span>
                  <span>Device: Unknown</span>
                  <span>Risk Score: 75</span>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const AttackPathsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Attack Path Analysis</h3>
          <p className="text-muted-foreground">Visualize and analyze potential attack vectors and progression paths</p>
        </div>
        <Button>
          <Target className="h-4 w-4 mr-2" />
          Generate Attack Graph
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-red-600" />
              Active Paths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">8</div>
            <div className="text-sm text-muted-foreground">Under investigation</div>
            <div className="text-xs text-red-600 mt-1">
              2 critical severity
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Mitigated Paths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">23</div>
            <div className="text-sm text-muted-foreground">Successfully blocked</div>
            <div className="text-xs text-green-600 mt-1">
              95.8% success rate
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Risk Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">73</div>
            <div className="text-sm text-muted-foreground">Average path risk</div>
            <div className="text-xs text-orange-600 mt-1">
              +12% from last week
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Critical Attack Paths</CardTitle>
          <CardDescription>High-risk attack sequences requiring immediate attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">Critical</Badge>
                  <span className="font-medium">Supply Chain → Privilege Escalation → Data Exfiltration</span>
                </div>
                <span className="text-sm text-muted-foreground">Risk Score: 92</span>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-red-600">1</span>
                  </div>
                  <span className="text-xs">Malicious Package Injection</span>
                </div>
                <ArrowRight className="h-3 w-3 text-gray-400" />
                <div className="flex items-center gap-1">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-orange-600">2</span>
                  </div>
                  <span className="text-xs">Build Process Compromise</span>
                </div>
                <ArrowRight className="h-3 w-3 text-gray-400" />
                <div className="flex items-center gap-1">
                  <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-red-600">3</span>
                  </div>
                  <span className="text-xs">Data Access</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Affected Repositories: 3</span>
                <span>MITRE Techniques: T1195.002, T1548, T1041</span>
                <span>Duration: 6 hours</span>
              </div>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">High</Badge>
                  <span className="font-medium">Credential Harvesting → Lateral Movement</span>
                </div>
                <span className="text-sm text-muted-foreground">Risk Score: 78</span>
              </div>
              
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-yellow-600">1</span>
                  </div>
                  <span className="text-xs">Phishing Attack</span>
                </div>
                <ArrowRight className="h-3 w-3 text-gray-400" />
                <div className="flex items-center gap-1">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-orange-600">2</span>
                  </div>
                  <span className="text-xs">Credential Theft</span>
                </div>
                <ArrowRight className="h-3 w-3 text-gray-400" />
                <div className="flex items-center gap-1">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-orange-600">3</span>
                  </div>
                  <span className="text-xs">Repository Access</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Affected Users: 2</span>
                <span>MITRE Techniques: T1566, T1078, T1021</span>
                <span>Duration: 2 hours</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attack Path Visualization</CardTitle>
          <CardDescription>Interactive graph showing attack progression and relationships</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
            <div className="text-center">
              <GitBranch className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Attack path visualization would be displayed here</p>
              <p className="text-xs text-gray-400">Interactive graph with nodes and connections</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const BehavioralAnomaliesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Behavioral Anomaly Detection</h3>
          <p className="text-muted-foreground">Identify unusual user behaviors and potential insider threats</p>
        </div>
        <div className="flex gap-2">
          <Input 
            placeholder="Search users..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Users Monitored
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <div className="text-sm text-muted-foreground">Active behavioral profiles</div>
            <div className="text-xs text-green-600 mt-1">
              100% coverage
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Anomalies Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">18</div>
            <div className="text-sm text-muted-foreground">This week</div>
            <div className="text-xs text-red-600 mt-1">
              +25% from last week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              Avg Detection Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2m</div>
            <div className="text-sm text-muted-foreground">Real-time analysis</div>
            <div className="text-xs text-green-600 mt-1">
              -30% from baseline
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              Auto Responses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <div className="text-sm text-muted-foreground">Automated actions</div>
            <div className="text-xs text-green-600 mt-1">
              92% accuracy
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Anomaly Types</CardTitle>
            <CardDescription>Distribution of behavioral anomalies by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Time-based Anomalies</span>
                </div>
                <span className="text-sm font-medium">8 incidents</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Location Anomalies</span>
                </div>
                <span className="text-sm font-medium">5 incidents</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Download className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Download Behavior</span>
                </div>
                <span className="text-sm font-medium">3 incidents</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-600" />
                  <span className="text-sm">Access Pattern Changes</span>
                </div>
                <span className="text-sm font-medium">2 incidents</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>High-Risk Users</CardTitle>
            <CardDescription>Users with recent anomalous behavior requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">sarah.admin@company.com</div>
                    <div className="text-xs text-muted-foreground">Off-hours access, unusual location</div>
                  </div>
                </div>
                <Badge variant="destructive" className="text-xs">High Risk</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">mike.dev@company.com</div>
                    <div className="text-xs text-muted-foreground">Excessive download activity</div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">Medium Risk</Badge>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">john.contractor@external.com</div>
                    <div className="text-xs text-muted-foreground">New device access pattern</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">Low Risk</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const ForensicEvidenceTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Digital Forensic Evidence</h3>
          <p className="text-muted-foreground">Collect and analyze forensic artifacts for incident investigation</p>
        </div>
        <Button>
          <Database className="h-4 w-4 mr-2" />
          Create Evidence Package
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Evidence Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <div className="text-sm text-muted-foreground">Collected artifacts</div>
            <div className="text-xs text-green-600 mt-1">
              +89 today
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              IOCs Correlated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">156</div>
            <div className="text-sm text-muted-foreground">Threat intelligence matches</div>
            <div className="text-xs text-orange-600 mt-1">
              23 high confidence
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-purple-600" />
              Active Hunts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <div className="text-sm text-muted-foreground">Ongoing investigations</div>
            <div className="text-xs text-purple-600 mt-1">
              3 critical priority
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Chain of Custody
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">100%</div>
            <div className="text-sm text-muted-foreground">Evidence integrity</div>
            <div className="text-xs text-green-600 mt-1">
              Cryptographically verified
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evidence Collection Summary</CardTitle>
          <CardDescription>Recent forensic artifacts and their analysis status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-sm">File Hashes</span>
                </div>
                <div className="text-2xl font-bold mb-1">347</div>
                <div className="text-xs text-muted-foreground">SHA256 checksums verified</div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Network className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-sm">Network Artifacts</span>
                </div>
                <div className="text-2xl font-bold mb-1">89</div>
                <div className="text-xs text-muted-foreground">Connection logs analyzed</div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-purple-600" />
                  <span className="font-medium text-sm">Process Execution</span>
                </div>
                <div className="text-2xl font-bold mb-1">156</div>
                <div className="text-xs text-muted-foreground">Process traces collected</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Threat Intelligence Correlation</CardTitle>
          <CardDescription>Evidence matched against known threat intelligence sources</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Target className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Malware Hash Match</div>
                  <div className="text-xs text-muted-foreground">SHA256: 4a7b8c9d... matched in VirusTotal</div>
                </div>
              </div>
              <Badge variant="destructive" className="text-xs">High Confidence</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Globe className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">C2 Domain Identified</div>
                  <div className="text-xs text-muted-foreground">malicious-c2.example.com in threat feed</div>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">Medium Confidence</Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Known Threat Actor TTPs</div>
                  <div className="text-xs text-muted-foreground">Techniques match APT28 campaign patterns</div>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">Low Confidence</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (timelineLoading || pathsLoading || anomaliesLoading || supplyChainLoading || evidenceLoading) {
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
        <h1 className="text-3xl font-bold">Advanced Threat Hunting & Forensics</h1>
        <p className="text-muted-foreground">
          Comprehensive threat detection, attack path analysis, and digital forensics capabilities
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-600" />
              Threat Hunting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Proactive threat detection using advanced analytics and machine learning
            </p>
            <Badge variant="outline">24/7 Monitoring</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-purple-600" />
              Attack Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Reconstruct attack timelines and identify attack progression paths
            </p>
            <Badge variant="outline">Real-time Analysis</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-600" />
              Behavioral Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Detect insider threats and anomalous user behavior patterns
            </p>
            <Badge variant="outline">ML-Powered</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5 text-orange-600" />
              Digital Forensics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              Comprehensive evidence collection and forensic analysis capabilities
            </p>
            <Badge variant="outline">Chain of Custody</Badge>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="timeline">Threat Timeline</TabsTrigger>
          <TabsTrigger value="attack-paths">Attack Paths</TabsTrigger>
          <TabsTrigger value="behavioral">Behavioral Anomalies</TabsTrigger>
          <TabsTrigger value="forensics">Forensic Evidence</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <ThreatTimelineTab />
        </TabsContent>

        <TabsContent value="attack-paths">
          <AttackPathsTab />
        </TabsContent>

        <TabsContent value="behavioral">
          <BehavioralAnomaliesTab />
        </TabsContent>

        <TabsContent value="forensics">
          <ForensicEvidenceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}