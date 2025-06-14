import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Play, 
  Loader2,
  Shield,
  AlertTriangle,
  FileText
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ScanJob {
  id: string;
  repositoryId: number;
  type: 'manual' | 'scheduled' | 'webhook';
  priority: 'low' | 'normal' | 'high';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  result?: {
    licenseChanges: number;
    vulnerabilities: number;
    filesScanned: number;
  };
}

interface ScanJobMonitorProps {
  repositoryId?: number;
  showGlobalJobs?: boolean;
}

export function ScanJobMonitor({ repositoryId, showGlobalJobs = false }: ScanJobMonitorProps) {
  const [pollingEnabled, setPollingEnabled] = useState(true);

  // Query for repository-specific jobs or global job stats
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: repositoryId ? [`/api/repositories/${repositoryId}/jobs`] : ['/api/jobs/recent'],
    refetchInterval: pollingEnabled ? 2000 : false, // Poll every 2 seconds when enabled
    refetchIntervalInBackground: true,
  });

  const { data: jobStats } = useQuery({
    queryKey: ['/api/jobs/stats'],
    refetchInterval: pollingEnabled ? 3000 : false,
    enabled: showGlobalJobs,
  });

  // Stop polling after 30 seconds of no activity
  useEffect(() => {
    const timer = setTimeout(() => {
      setPollingEnabled(false);
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      running: 'default',
      completed: 'default',
      failed: 'destructive'
    };
    
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      running: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      normal: 'bg-blue-100 text-blue-800',
      low: 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge variant="outline" className={colors[priority as keyof typeof colors]}>
        {priority}
      </Badge>
    );
  };

  const formatDuration = (startTime?: string, endTime?: string) => {
    if (!startTime) return null;
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const duration = Math.round((end.getTime() - start.getTime()) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.round(duration / 60)}m`;
    return `${Math.round(duration / 3600)}h`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading scan jobs...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {showGlobalJobs && jobStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5" />
              Job Queue Status
            </CardTitle>
            <CardDescription>
              Real-time background scanning system performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{jobStats.running}</div>
                <div className="text-sm text-gray-600">Running</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{jobStats.pending}</div>
                <div className="text-sm text-gray-600">Queued</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{jobStats.completed}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{jobStats.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Processing Capacity</span>
                <span>{jobStats.currentConcurrent} / {jobStats.maxConcurrent}</span>
              </div>
              <Progress 
                value={(jobStats.currentConcurrent / jobStats.maxConcurrent) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5" />
              {repositoryId ? 'Repository Scan Jobs' : 'Recent Scan Jobs'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPollingEnabled(!pollingEnabled)}
            >
              {pollingEnabled ? 'Stop' : 'Start'} Live Updates
            </Button>
          </CardTitle>
          <CardDescription>
            Background scanning job status and progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No scan jobs found
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 10).map((job: ScanJob) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Scan Job</span>
                        {getStatusBadge(job.status)}
                        {getPriorityBadge(job.priority)}
                        <Badge variant="outline" className="text-xs">
                          {job.type}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Started {new Date(job.createdAt).toLocaleTimeString()}
                        {job.startedAt && job.status === 'running' && (
                          <span> • Running for {formatDuration(job.startedAt)}</span>
                        )}
                        {job.completedAt && (
                          <span> • Completed in {formatDuration(job.startedAt, job.completedAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {job.result && job.status === 'completed' && (
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Shield className="w-4 h-4 text-red-600" />
                          <span>{job.result.vulnerabilities}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="w-4 h-4 text-orange-600" />
                          <span>{job.result.licenseChanges}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4 text-blue-600" />
                          <span>{job.result.filesScanned}</span>
                        </div>
                      </div>
                    )}
                    {job.error && job.status === 'failed' && (
                      <div className="text-sm text-red-600 max-w-xs truncate">
                        {job.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}