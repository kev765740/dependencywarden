import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  GitBranch, 
  Activity, 
  Users, 
  Calendar,
  GitCommit,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Zap
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { data: dashboardStats } = useQuery({
    queryKey: ['/api/dashboard/overview'],
    refetchInterval: 30000
  });

  // Mock data for demonstration
  const mockData = {
    totalProjects: 12,
    activeProjects: 8,
    totalCommits: 247,
    weeklyCommits: 23,
    teamMembers: 6,
    dependencies: 189,
    buildsThisWeek: 45,
    buildSuccessRate: 94,
    recentActivity: [
      { id: 1, action: 'Deployed', project: 'Frontend App', time: '2 hours ago', status: 'success' },
      { id: 2, action: 'Merged PR', project: 'API Service', time: '4 hours ago', status: 'success' },
      { id: 3, action: 'Build Failed', project: 'Mobile App', time: '6 hours ago', status: 'error' },
      { id: 4, action: 'New Release', project: 'Core Library', time: '1 day ago', status: 'success' },
      { id: 5, action: 'Dependency Updated', project: 'Auth Service', time: '1 day ago', status: 'info' }
    ],
    projectHealth: [
      { name: 'Frontend App', health: 95, status: 'Excellent', commits: 42 },
      { name: 'API Service', health: 88, status: 'Good', commits: 28 },
      { name: 'Mobile App', health: 73, status: 'Needs Attention', commits: 15 },
      { name: 'Core Library', health: 91, status: 'Good', commits: 35 }
    ],
    upcomingTasks: [
      { id: 1, title: 'Q4 Performance Review', due: '2 days', priority: 'high' },
      { id: 2, title: 'Database Migration', due: '1 week', priority: 'medium' },
      { id: 3, title: 'Security Audit', due: '2 weeks', priority: 'high' },
      { id: 4, title: 'UI Redesign Phase 1', due: '3 weeks', priority: 'low' }
    ]
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'info': return <FileText className="h-4 w-4 text-blue-500" />;
      default: return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getHealthColor = (health: number) => {
    if (health >= 90) return 'text-green-600';
    if (health >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">DependencyWarden</h1>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/security"
              className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-medium">Security Dashboard</h3>
              <p className="mt-2 text-gray-600">Monitor vulnerabilities across all dependencies</p>
            </Link>

            <Link
              to="/threats"
              className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-medium">Threat Hunting</h3>
              <p className="mt-2 text-gray-600">Proactively identify potential security risks</p>
            </Link>

            <Link
              to="/auto-fix"
              className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h3 className="text-lg font-medium">Auto-Fix PRs</h3>
              <p className="mt-2 text-gray-600">Automatically generate fix pull requests</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;