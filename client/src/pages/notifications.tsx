import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Bell, 
  AlertCircle, 
  CheckCircle, 
  Mail, 
  Slack, 
  Filter,
  Search,
  Clock,
  Shield,
  GitBranch,
  Zap,
  ExternalLink
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: 'vulnerability' | 'license' | 'scan' | 'system';
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  repository?: string;
  createdAt: string;
  isRead: boolean;
  actionUrl?: string;
  metadata?: {
    cve?: string;
    package?: string;
    version?: string;
    cvssScore?: number;
  };
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  // Mock notification data - replace with actual API call
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated,
    // Providing mock data for demonstration
    initialData: [
      {
        id: "1",
        type: "vulnerability",
        title: "Critical Vulnerability Detected",
        message: "CVE-2024-1001 found in express package affecting Frontend Application",
        severity: "critical",
        repository: "frontend-app",
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        isRead: false,
        actionUrl: "/vulnerabilities?id=vuln-1",
        metadata: {
          cve: "CVE-2024-1001",
          package: "express",
          version: "4.17.1",
          cvssScore: 9.8
        }
      },
      {
        id: "2",
        type: "license",
        title: "License Change Alert",
        message: "lodash package changed from MIT to GPL-3.0 license",
        severity: "high",
        repository: "backend-api",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        isRead: false,
        actionUrl: "/repositories/2",
        metadata: {
          package: "lodash",
          version: "4.17.21"
        }
      },
      {
        id: "3",
        type: "scan",
        title: "Scan Completed Successfully",
        message: "Weekly security scan completed for all repositories",
        severity: "info",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        isRead: true,
        metadata: {}
      },
      {
        id: "4",
        type: "vulnerability",
        title: "Medium Severity Vulnerability",
        message: "CVE-2024-1002 found in winston logging package",
        severity: "medium",
        repository: "backend-api",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        isRead: true,
        actionUrl: "/vulnerabilities?id=vuln-2",
        metadata: {
          cve: "CVE-2024-1002",
          package: "winston",
          version: "3.8.0",
          cvssScore: 5.5
        }
      }
    ]
  });

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || notification.type === typeFilter;
    const matchesSeverity = severityFilter === "all" || notification.severity === severityFilter;
    
    return matchesSearch && matchesType && matchesSeverity;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'info': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'vulnerability': return <Shield className="w-4 h-4" />;
      case 'license': return <ExternalLink className="w-4 h-4" />;
      case 'scan': return <Zap className="w-4 h-4" />;
      case 'system': return <Bell className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p>Please log in to view your notifications.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
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
          <Bell className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-gray-600 mt-1">Stay informed about security alerts and system updates</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={unreadCount > 0 ? "destructive" : "outline"}>
            {unreadCount} Unread
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {notifications.length} Total
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="vulnerability">Vulnerabilities</SelectItem>
                <SelectItem value="license">License Changes</SelectItem>
                <SelectItem value="scan">Scan Results</SelectItem>
                <SelectItem value="system">System Updates</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No Notifications Found</h3>
              <p className="text-gray-600">
                {searchQuery || typeFilter !== "all" || severityFilter !== "all"
                  ? "Try adjusting your filters to see more notifications."
                  : "You're all caught up! No new notifications at this time."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`cursor-pointer transition-colors hover:bg-gray-50 ${
                !notification.isRead ? 'border-l-4 border-l-blue-500' : ''
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getSeverityColor(notification.severity)}`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className={`font-semibold ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h3>
                        <p className="text-gray-600 mt-1">{notification.message}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={notification.severity === 'critical' ? 'destructive' : 'outline'}
                          className="capitalize"
                        >
                          {notification.severity}
                        </Badge>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {notification.repository && (
                          <span className="flex items-center gap-1">
                            <GitBranch className="w-3 h-3" />
                            {notification.repository}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                        {notification.metadata?.cve && (
                          <Badge variant="outline" className="text-xs">
                            {notification.metadata.cve}
                          </Badge>
                        )}
                        {notification.metadata?.cvssScore && (
                          <Badge variant="outline" className="text-xs">
                            CVSS {notification.metadata.cvssScore}
                          </Badge>
                        )}
                      </div>
                      
                      {notification.actionUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={notification.actionUrl}>
                            View Details
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}