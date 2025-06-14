import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Bell, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  GitBranch,
  Package,
  Users,
  Settings,
  Search,
  Filter,
  MarkAsUnread,
  Trash2,
  Clock,
  Star
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Notification {
  id: number;
  type: 'security' | 'update' | 'build' | 'team' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  source?: string;
}

const NotificationsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');

  const mockNotifications: Notification[] = [
    {
      id: 1,
      type: 'security',
      title: 'Critical Security Alert',
      message: 'High severity vulnerability detected in express@4.17.1. Immediate action required.',
      timestamp: '2 minutes ago',
      read: false,
      priority: 'critical',
      source: 'Frontend App'
    },
    {
      id: 2,
      type: 'build',
      title: 'Build Completed Successfully',
      message: 'Deployment pipeline for API Service completed with all tests passing.',
      timestamp: '1 hour ago',
      read: false,
      priority: 'low',
      source: 'API Service'
    },
    {
      id: 3,
      type: 'update',
      title: 'Dependency Update Available',
      message: 'React v18.2.0 update available. Includes security patches and performance improvements.',
      timestamp: '3 hours ago',
      read: true,
      priority: 'medium',
      source: 'Mobile App'
    },
    {
      id: 4,
      type: 'team',
      title: 'New Team Member Added',
      message: 'John Doe has been added to the development team with contributor access.',
      timestamp: '6 hours ago',
      read: true,
      priority: 'low',
      source: 'Team Management'
    },
    {
      id: 5,
      type: 'security',
      title: 'Security Scan Completed',
      message: 'Weekly security scan completed. 2 medium priority issues found.',
      timestamp: '12 hours ago',
      read: false,
      priority: 'medium',
      source: 'Core Library'
    },
    {
      id: 6,
      type: 'system',
      title: 'System Maintenance Scheduled',
      message: 'Scheduled maintenance window: Sunday 2:00 AM - 4:00 AM UTC.',
      timestamp: '1 day ago',
      read: true,
      priority: 'medium',
      source: 'System'
    },
    {
      id: 7,
      type: 'security',
      title: 'License Compliance Issue',
      message: 'GPL-3.0 license detected in commercial project. Review required.',
      timestamp: '1 day ago',
      read: false,
      priority: 'high',
      source: 'Auth Service'
    },
    {
      id: 8,
      type: 'build',
      title: 'Build Failed',
      message: 'Unit tests failed in mobile-app branch. 3 test cases failing.',
      timestamp: '2 days ago',
      read: true,
      priority: 'high',
      source: 'Mobile App'
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'security': return <Shield className="h-4 w-4" />;
      case 'update': return <Package className="h-4 w-4" />;
      case 'build': return <GitBranch className="h-4 w-4" />;
      case 'team': return <Users className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'security': return 'text-red-500';
      case 'update': return 'text-blue-500';
      case 'build': return 'text-green-500';
      case 'team': return 'text-purple-500';
      case 'system': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFilteredNotifications = () => {
    let filtered = mockNotifications;

    // Filter by tab
    if (selectedTab !== 'all') {
      if (selectedTab === 'unread') {
        filtered = filtered.filter(n => !n.read);
      } else {
        filtered = filtered.filter(n => n.type === selectedTab);
      }
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.source?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const unreadCount = mockNotifications.filter(n => !n.read).length;
  const priorityCount = {
    critical: mockNotifications.filter(n => n.priority === 'critical').length,
    high: mockNotifications.filter(n => n.priority === 'high').length,
    medium: mockNotifications.filter(n => n.priority === 'medium').length,
    low: mockNotifications.filter(n => n.priority === 'low').length
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your projects and security alerts</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {unreadCount} unread
          </Badge>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{mockNotifications.length}</p>
              </div>
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
              </div>
              <MarkAsUnread className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-600">{priorityCount.critical}</p>
              </div>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold text-orange-600">{priorityCount.high}</p>
              </div>
              <Star className="h-5 w-5 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Notifications List */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="build">Builds</TabsTrigger>
          <TabsTrigger value="update">Updates</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4 mt-6">
          {getFilteredNotifications().length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No notifications found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? 'Try adjusting your search terms.' : 'You\'re all caught up!'}
                </p>
              </CardContent>
            </Card>
          ) : (
            getFilteredNotifications().map((notification) => (
              <Card key={notification.id} className={`${!notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`${getTypeColor(notification.type)} mt-1`}>
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-sm">{notification.title}</h3>
                          {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{notification.timestamp}</span>
                          </div>
                          {notification.source && (
                            <span>from {notification.source}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Badge className={getPriorityColor(notification.priority)}>
                        {notification.priority}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationsPage; 