import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, Star, Lightbulb, Bug, Heart } from "lucide-react";

const feedbackSchema = z.object({
  type: z.enum(["feature", "bug", "improvement", "compliment", "other"]),
  title: z.string().min(5, "Title must be at least 5 characters").max(255, "Title must be 255 characters or less"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description must be 2000 characters or less"),
  priority: z.enum(["low", "medium", "high"]),
  rating: z.number().min(1).max(5).optional(),
  email: z.string().email().optional().or(z.literal("")),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open, onOpenChange]);

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      type: "improvement",
      priority: "medium",
      title: "",
      description: "",
      email: "",
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: async (data: FeedbackFormData) => {
      const response = await apiRequest("POST", "/api/feedback", {
        ...data,
        rating: rating > 0 ? rating : undefined,
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! We'll review it carefully.",
      });
      form.reset();
      setRating(0);
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FeedbackFormData) => {
    feedbackMutation.mutate(data);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "feature":
        return <Lightbulb className="w-4 h-4" />;
      case "bug":
        return <Bug className="w-4 h-4" />;
      case "improvement":
        return <MessageSquare className="w-4 h-4" />;
      case "compliment":
        return <Heart className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "feature":
        return "text-blue-600";
      case "bug":
        return "text-red-600";
      case "improvement":
        return "text-orange-600";
      case "compliment":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Share Your Feedback
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Overall Rating */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Overall Experience</Label>
              <TooltipProvider>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const tooltipText = star === 5 ? "Excellent - Exceeds expectations" : 
                                       star === 4 ? "Good - Meets expectations well" : 
                                       star === 3 ? "Okay - Meets basic expectations" : 
                                       star === 2 ? "Poor - Below expectations" : 
                                       "Very Poor - Significantly below expectations";
                    
                    return (
                      <Tooltip key={star}>
                        <TooltipTrigger asChild>
                          <Star
                            className={`w-6 h-6 cursor-pointer transition-colors ${
                              star <= rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300 hover:text-yellow-300"
                            }`}
                            onClick={() => setRating(star)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setRating(star);
                              }
                            }}
                            tabIndex={0}
                            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                            role="button"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{tooltipText}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                  {rating > 0 && (
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                      {rating === 5 ? "Excellent!" : rating === 4 ? "Good" : rating === 3 ? "Okay" : rating === 2 ? "Poor" : "Very Poor"}
                    </span>
                  )}
                </div>
              </TooltipProvider>
            </div>

            {/* Feedback Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>What type of feedback is this?</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid grid-cols-2 gap-4"
                    >
                      {[
                        { value: "feature", label: "Feature Request", desc: "Suggest a new feature" },
                        { value: "bug", label: "Bug Report", desc: "Report an issue" },
                        { value: "improvement", label: "Improvement", desc: "Suggest an enhancement" },
                        { value: "compliment", label: "Compliment", desc: "Share positive feedback" },
                      ].map((option) => (
                        <div key={option.value} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 dark:border-gray-700">
                          <RadioGroupItem value={option.value} id={option.value} />
                          <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                            <div className={`flex items-center gap-2 ${getTypeColor(option.value)}`}>
                              {getTypeIcon(option.value)}
                              <span className="font-medium dark:text-gray-200">{option.label}</span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{option.desc}</p>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Brief summary of your feedback"
                      maxLength={255}
                      {...field}
                    />
                  </FormControl>
                  <div className="text-xs text-muted-foreground text-right">
                    {field.value?.length || 0}/255 characters
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide detailed feedback, steps to reproduce (for bugs), or specific suggestions..."
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

            {/* Priority */}
            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low - Nice to have</SelectItem>
                      <SelectItem value="medium">Medium - Would be helpful</SelectItem>
                      <SelectItem value="high">High - Important for workflow</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Optional Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="email"
                      placeholder="your@email.com - for follow-up questions"
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-gray-500">
                    We'll only use this to ask clarifying questions about your feedback
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={feedbackMutation.isPending}
              >
                {feedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}