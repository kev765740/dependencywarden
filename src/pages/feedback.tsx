import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, Star, Send, CheckCircle, AlertCircle, Lightbulb, Bug } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FeedbackFormData {
  type: string;
  subject: string;
  message: string;
  rating: number;
  email: string;
}

// Helper function to get rating text
const getRatingText = (rating: number): string => {
  switch (rating) {
    case 1: return "Very Poor";
    case 2: return "Poor";
    case 3: return "Average";
    case 4: return "Good";
    case 5: return "Excellent";
    default: return "No rating";
  }
};

export default function FeedbackPage() {
  const auth = useAuth();
  const user = auth ? (auth as any).user : null;
  const isAuthenticated = !!user;
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FeedbackFormData>({
    type: '',
    subject: '',
    message: '',
    rating: 5,
    email: (user as any)?.email || ''
  });

  const [selectedRating, setSelectedRating] = useState(5);

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: FeedbackFormData) => {
      return await apiRequest("POST", "/api/feedback", data);
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! We'll review it and get back to you soon.",
      });
      // Reset form
      setFormData({
        type: '',
        subject: '',
        message: '',
        rating: 5,
        email: (user as any)?.email || ''
      });
      setSelectedRating(5);
    },
    onError: (error: any) => {
      let errorMessage = "Failed to submit feedback. Please try again.";
      
      // Provide more specific error messages
      if (error.message?.includes('network')) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.message?.includes('validation')) {
        errorMessage = "Please check your input and ensure all required fields are filled correctly.";
      } else if (error.status === 429) {
        errorMessage = "Too many requests. Please wait a moment before trying again.";
      } else if (error.status >= 500) {
        errorMessage = "Server error. Our team has been notified. Please try again later.";
      }
      
      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.subject || !formData.message) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    submitFeedbackMutation.mutate({
      ...formData,
      rating: selectedRating
    });
  };

  const feedbackTypes = [
    { value: "feature", label: "Feature Request", icon: Lightbulb, color: "text-blue-600" },
    { value: "bug", label: "Bug Report", icon: Bug, color: "text-red-600" },
    { value: "improvement", label: "Improvement", icon: Star, color: "text-green-600" },
    { value: "general", label: "General Feedback", icon: MessageSquare, color: "text-purple-600" }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Share Your Feedback</h1>
            <p className="text-gray-600 mt-1">Help us improve your security monitoring experience</p>
          </div>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Your Voice Matters
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Make form responsive on mobile */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-blue-600" />
                Submit Feedback
              </CardTitle>
              <CardDescription>
                Share your thoughts, report issues, or suggest improvements to help us build a better platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="type">Feedback Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select feedback type" />
                    </SelectTrigger>
                    <SelectContent>
                      {feedbackTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className={`w-4 h-4 ${type.color}`} />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-4 h-4 rounded-full border border-gray-400 dark:border-gray-500 flex items-center justify-center cursor-help">
                            <span className="text-xs text-gray-600 dark:text-gray-400">?</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Provide a clear, concise summary of your feedback topic</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Input
                    id="subject"
                    placeholder="Brief description of your feedback"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    aria-describedby="subject-help"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="message">Detailed Message *</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="w-4 h-4 rounded-full border border-gray-400 dark:border-gray-500 flex items-center justify-center cursor-help">
                            <span className="text-xs text-gray-600 dark:text-gray-400">?</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Include specific details, steps to reproduce issues, or suggestions for improvement</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Textarea
                    id="message"
                    placeholder="Please provide detailed information about your feedback, including steps to reproduce for bugs or specific use cases for feature requests."
                    value={formData.message}
                    onChange={(e) => {
                      if (e.target.value.length <= 2000) {
                        setFormData({ ...formData, message: e.target.value });
                      }
                    }}
                    className="focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                    aria-describedby="message-help"
                    rows={6}
                    required
                  />
                  <div className={`text-xs text-right ${
                    formData.message.length > 1900 ? 'text-red-500' : 
                    formData.message.length > 1500 ? 'text-yellow-500' : 'text-gray-500'
                  }`}>
                    {formData.message.length}/2000 characters
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Overall Experience Rating</Label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <TooltipProvider key={rating}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              onClick={() => setSelectedRating(rating)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  setSelectedRating(rating);
                                }
                              }}
                              className={`p-1 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                selectedRating >= rating
                                  ? 'text-yellow-500'
                                  : 'text-gray-300 hover:text-yellow-400 dark:text-gray-600 dark:hover:text-yellow-400'
                              }`}
                              aria-label={`Rate ${rating} ${rating === 1 ? 'star' : 'stars'}: ${getRatingText(rating)}`}
                            >
                              <Star className="w-6 h-6 fill-current" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{`${rating} ${rating === 1 ? 'star' : 'stars'}: ${getRatingText(rating)}`}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                      {selectedRating > 0 ? getRatingText(selectedRating) : 'No rating selected'}
                    </span>
                  </div>
                </div>

                {!isAuthenticated && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your-email@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                    <p className="text-sm text-gray-600">
                      Optional: Provide your email if you'd like us to follow up with you
                    </p>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full flex items-center gap-2 hover:shadow-lg transition-all duration-200 active:scale-95"
                  disabled={submitFeedbackMutation.isPending}
                >
                  {submitFeedbackMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Feedback Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Bug className="w-4 h-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Bug Reports</p>
                    <p className="text-xs text-gray-600">Include steps to reproduce, expected vs actual behavior</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Feature Requests</p>
                    <p className="text-xs text-gray-600">Describe the use case and expected functionality</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Star className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Improvements</p>
                    <p className="text-xs text-gray-600">Suggest enhancements to existing features</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Bug Reports</span>
                  <Badge variant="destructive">24-48 hours</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Feature Requests</span>
                  <Badge variant="secondary">3-7 days</Badge>
                </div>
                <div className="flex justify-between">
                  <span>General Feedback</span>
                  <Badge variant="outline">1-3 days</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                For urgent security issues or enterprise support, contact us directly:
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Security Issues:</strong> security@company.com</p>
                <p><strong>Enterprise Support:</strong> enterprise@company.com</p>
                <p><strong>General Inquiries:</strong> support@company.com</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}