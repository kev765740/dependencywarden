import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Bug, Lightbulb, MessageCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

const feedbackSchema = z.object({
  type: z.enum(["bug", "feature", "general"]),
  title: z.string().min(1, "Title is required").max(255, "Title must be 255 characters or less"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description must be 2000 characters or less"),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

interface FeedbackWidgetProps {
  repositoryId?: number;
  repositoryName?: string;
  className?: string;
}

export function FeedbackWidget({ repositoryId, repositoryName, className }: FeedbackWidgetProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open]);

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      type: "general",
      title: "",
      description: "",
    },
  });

  // Capture browser and context information
  const getBrowserInfo = () => {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };
  };

  const getRepositoryContext = () => {
    if (!repositoryId) return null;
    
    return {
      repositoryId,
      repositoryName: repositoryName || 'Unknown',
      currentPage: location,
      timestamp: new Date().toISOString(),
    };
  };

  const submitFeedback = useMutation({
    mutationFn: async (data: FeedbackFormData) => {
      const payload = {
        ...data,
        repositoryContext: getRepositoryContext(),
        browserInfo: getBrowserInfo(),
      };

      return await apiRequest("POST", "/api/feedback", payload);
    },
    onSuccess: () => {
      toast({
        title: "✓ Feedback submitted successfully!",
        description: "Thank you for helping us improve. We'll review your feedback shortly.",
        duration: 5000,
      });
      form.reset();
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
    },
    onError: (error: any) => {
      let errorMessage = "Failed to submit feedback. Please try again.";
      
      // Enhanced error handling with specific messages
      if (error.message?.includes('network')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message?.includes('validation')) {
        errorMessage = "Please check your input and ensure all required fields are filled correctly.";
      } else if (error.status === 429) {
        errorMessage = "Too many requests. Please wait a moment before trying again.";
      } else if (error.status >= 500) {
        errorMessage = "Server error. Our team has been notified. Please try again later.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: FeedbackFormData) => {
    submitFeedback.mutate(data);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug":
        return <Bug className="w-4 h-4" />;
      case "feature":
        return <Lightbulb className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "bug":
        return "text-red-600 dark:text-red-400";
      case "feature":
        return "text-blue-600 dark:text-blue-400";
      default:
        return "text-green-600 dark:text-green-400";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`fixed bottom-4 right-4 z-50 shadow-lg hover:shadow-xl transition-shadow ${className}`}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Feedback
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve by reporting bugs or suggesting new features.
            {repositoryName && (
              <span className="block mt-1 text-sm font-medium text-muted-foreground">
                Context: {repositoryName}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select feedback type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="bug">
                        <div className="flex items-center gap-2">
                          <Bug className="w-4 h-4 text-red-600" aria-label="Bug Report" />
                          Bug Report
                        </div>
                      </SelectItem>
                      <SelectItem value="feature">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-blue-600" aria-label="Feature Request" />
                          Feature Request
                        </div>
                      </SelectItem>
                      <SelectItem value="general">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-green-600" aria-label="General Feedback" />
                          General Feedback
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Brief summary of your feedback" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Provide detailed information about your feedback..."
                      className="min-h-[100px]"
                      maxLength={2000}
                      {...field} 
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground text-right">
                    {field.value?.length || 0}/2000 characters
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={submitFeedback.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitFeedback.isPending}
              >
                {submitFeedback.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </div>
                ) : (
                  "Submit Feedback"
                )}
              </Button>
            </div>
          </form>
        </Form>

        {/* Context Information Preview */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-xs text-muted-foreground mb-2">
            Automatically captured context:
          </p>
          <div className="space-y-1 text-xs">
            <div>• Current page: {location}</div>
            {repositoryName && <div>• Repository: {repositoryName}</div>}
            <div>• Browser: {navigator.userAgent.split(' ')[0]}</div>
            <div>• Timestamp: {new Date().toLocaleString()}</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}