import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Bug, Lightbulb, Heart, Star, Clock, CheckCircle, XCircle, Edit3, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Feedback } from "@shared/schema";

export default function FeedbackAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);

  const { data: feedbackData = [], isLoading, error } = useQuery({
    queryKey: ['/api/admin/feedback', statusFilter, typeFilter, priorityFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (priorityFilter !== 'all') params.append('priority', priorityFilter);
      return apiRequest('GET', `/api/admin/feedback?${params.toString()}`);
    },
  });

  // Filter feedback based on search term and other filters
  const filteredFeedback = useMemo(() => {
    if (!Array.isArray(feedbackData)) return [];
    
    return feedbackData.filter((item: any) => {
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesType = typeFilter === 'all' || item.type === typeFilter;
      const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;
      const matchesSearch = !searchTerm || [
        item.title,
        item.description,
        item.userEmail,
        item.type
      ].some(field => field?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesStatus && matchesType && matchesPriority && matchesSearch;
    });
  }, [feedbackData, statusFilter, typeFilter, priorityFilter, searchTerm]);

  // Paginated feedback for display
  const paginatedFeedback = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredFeedback.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredFeedback, currentPage, itemsPerPage]);

  // Calculate total pages for pagination
  const totalPages = Math.ceil(filteredFeedback.length / itemsPerPage);

  // Calculate stats
  const feedbackStats = useMemo(() => {
    if (!Array.isArray(filteredFeedback)) return { total: 0, new: 0, inProgress: 0, resolved: 0 };
    
    return {
      total: filteredFeedback.length,
      new: filteredFeedback.filter((item: any) => item.status === 'new').length,
      inProgress: filteredFeedback.filter((item: any) => item.status === 'in_progress').length,
      resolved: filteredFeedback.filter((item: any) => item.status === 'resolved').length,
    };
  }, [filteredFeedback]);

  const updateFeedbackMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      return apiRequest('PATCH', `/api/admin/feedback/${id}`, {
        status,
        adminNotes: notes,
      });
    },
    onSuccess: () => {
      toast({
        title: "Feedback Updated",
        description: "The feedback status has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feedback'] });
      setSelectedFeedback(null);
      setAdminNotes('');
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update feedback.",
        variant: "destructive",
      });
    },
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "feature":
        return <Lightbulb className="w-4 h-4 text-blue-600" aria-label="Feature Request" />;
      case "bug":
        return <Bug className="w-4 h-4 text-red-600" aria-label="Bug Report" />;
      case "improvement":
        return <MessageSquare className="w-4 h-4 text-orange-600" aria-label="Improvement" />;
      case "compliment":
        return <Heart className="w-4 h-4 text-green-600" aria-label="Compliment" />;
      default:
        return <MessageSquare className="w-4 h-4 text-gray-600" aria-label="General Feedback" />;
    }
  };

  const getStatusBadge = (status: string | null) => {
    const statusValue = status || 'new';
    const variants = {
      'new': { variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      'reviewing': { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      'in_progress': { variant: 'secondary' as const, color: 'bg-orange-100 text-orange-800' },
      'resolved': { variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      'closed': { variant: 'outline' as const, color: 'bg-gray-100 text-gray-800' },
    };

    const config = variants[statusValue as keyof typeof variants] || variants.new;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {statusValue.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string | null) => {
    const priorityValue = priority || 'medium';
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-red-100 text-red-800',
      'critical': 'bg-red-200 text-red-900',
    };

    return (
      <Badge variant="outline" className={colors[priorityValue as keyof typeof colors] || colors.medium}>
        {priorityValue.toUpperCase()}
      </Badge>
    );
  };

  const handleStatusUpdate = (feedback: Feedback, newStatus: string) => {
    updateFeedbackMutation.mutate({
      id: feedback.id,
      status: newStatus,
      notes: adminNotes,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Feedback</h3>
            <p className="text-red-600 mb-4">
              Failed to load feedback data. Please try refreshing the page.
            </p>
            <Button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/feedback'] })}
              variant="outline"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Feedback Management</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-wrap">
          <Input
            placeholder="Search feedback..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-64"
          />
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="reviewing">Reviewing</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="feature">Feature Request</SelectItem>
              <SelectItem value="bug">Bug Report</SelectItem>
              <SelectItem value="improvement">Improvement</SelectItem>
              <SelectItem value="compliment">Compliment</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setStatusFilter('all');
              setTypeFilter('all');
              setPriorityFilter('all');
              setSearchTerm('');
              setCurrentPage(1);
            }}
            disabled={statusFilter === 'all' && typeFilter === 'all' && priorityFilter === 'all' && searchTerm === ''}
            className="w-full sm:w-auto whitespace-nowrap"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{feedbackStats.total}</p>
                <p className="text-sm text-gray-600">Total Feedback</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{feedbackStats.new}</p>
                <p className="text-sm text-gray-600">New Items</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Edit3 className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{feedbackStats.inProgress}</p>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{feedbackStats.resolved}</p>
                <p className="text-sm text-gray-600">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Feedback Items ({filteredFeedback.length})
        </h2>
        
        {filteredFeedback.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No feedback items found matching your filters.</p>
            </CardContent>
          </Card>
        ) : (
          paginatedFeedback.map((item: any) => (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getTypeIcon(item.type || 'general')}
                      <h3 className="font-semibold text-lg">{item.title || 'Untitled'}</h3>
                      {getStatusBadge(item.status)}
                      {getPriorityBadge(item.priority)}
                    </div>
                    
                    <p className="text-gray-700 mb-3">{item.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>User: {item.userEmail}</span>
                      <span>Created: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                    
                    {item.adminNotes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-800">Admin Notes:</p>
                        <p className="text-sm text-blue-700">{item.adminNotes}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedFeedback(item);
                            setAdminNotes(item.adminNotes || '');
                          }}
                        >
                          Manage
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle>Manage Feedback</DialogTitle>
                        </DialogHeader>
                        
                        {selectedFeedback && (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Update Status</h4>
                              <div className="flex flex-wrap gap-2">
                                {['new', 'reviewing', 'in_progress', 'resolved', 'closed'].map((status) => (
                                  <Button
                                    key={status}
                                    variant={selectedFeedback.status === status ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleStatusUpdate(selectedFeedback, status)}
                                    disabled={updateFeedbackMutation.isPending}
                                  >
                                    {status.replace('_', ' ').toUpperCase()}
                                  </Button>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Admin Notes</h4>
                              <Textarea
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Add internal notes about this feedback..."
                                className="min-h-[100px]"
                                maxLength={1000}
                              />
                              <div className="text-xs text-muted-foreground text-right mt-1">
                                {adminNotes.length}/1000 characters
                              </div>
                            </div>
                            
                            <Button
                              onClick={() => handleStatusUpdate(selectedFeedback, selectedFeedback.status || 'new')}
                              disabled={updateFeedbackMutation.isPending}
                              className="w-full"
                            >
                              {updateFeedbackMutation.isPending ? "Updating..." : "Update Notes"}
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Pagination */}
        {filteredFeedback.length > itemsPerPage && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredFeedback.length)} of {filteredFeedback.length} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev: number) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 rounded">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev: number) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                aria-label="Next page"
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}