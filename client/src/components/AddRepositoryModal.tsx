import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertRepositorySchema } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { z } from "zod";

const formSchema = insertRepositorySchema.omit({ userId: true });

interface AddRepositoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddRepositoryModal({ open, onOpenChange }: AddRepositoryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      gitUrl: "",
      defaultBranch: "main",
      authToken: "",
      ownerEmail: "",
      slackWebhookUrl: "",
      status: "active",
    },
  });

  const createRepositoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      console.log('Submitting repository data:', data);
      const response = await apiRequest("POST", "/api/repositories", data);
      const result = await response.json();
      console.log('Repository creation response:', result);
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Repository Added",
        description: "Repository has been added successfully and will be scanned shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/repositories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Repository creation error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      if (isUnauthorizedError(error) || error.message.includes("Invalid or expired token")) {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        // Clear the invalid token and redirect to login
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        return;
      }

      // Check for repository limit errors
      if (error.message.includes("Repository limit exceeded") || error.message.includes("403:")) {
        try {
          // Try to parse the error message for repository limit details
          const errorMatch = error.message.match(/403: (.+)/);
          if (errorMatch) {
            const errorData = JSON.parse(errorMatch[1]);
            if (errorData.error === "Repository limit exceeded") {
              toast({
                title: "Repository Limit Reached",
                description: `You've reached your ${errorData.subscriptionTier} plan limit of ${errorData.maxAllowed} repositories. Upgrade to Pro for unlimited repositories.`,
                variant: "destructive",
              });
              return;
            }
          }
        } catch (parseError) {
          // If parsing fails, show generic limit message
          toast({
            title: "Repository Limit Reached",
            description: "You've reached your plan's repository limit. Upgrade to Pro for unlimited repositories.",
            variant: "destructive",
          });
          return;
        }
      }

      // Check for subscription limit error
      if (error.message.includes("Free tier limited")) {
        toast({
          title: "Subscription Limit Reached",
          description: "Free tier is limited to 5 repositories. Please upgrade to Pro to add more repositories.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Error",
        description: `Failed to add repository: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const validateForm = (): string | null => {
    const formData = form.getValues();
    if (!formData.name.trim()) {
      return 'Repository name is required';
    }

    if (!formData.gitUrl.trim() && !formData.repoUrl.trim()) {
      return 'Either Git URL or Repository URL is required';
    }

    // Validate Git URL format
    const gitUrlPattern = /^https:\/\/github\.com\/[\w\-\.]+\/[\w\-\.]+(?:\.git)?$/;
    if (formData.gitUrl && !gitUrlPattern.test(formData.gitUrl)) {
      return 'Please enter a valid GitHub repository URL (e.g., https://github.com/user/repo)';
    }

    // Validate email format if provided
    if (formData.ownerEmail) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(formData.ownerEmail)) {
        return 'Please enter a valid email address';
      }
    }

    // Validate Slack webhook URL if provided
    if (formData.slackWebhookUrl) {
      const slackPattern = /^https:\/\/hooks\.slack\.com\/services\/.+/;
      if (!slackPattern.test(formData.slackWebhookUrl)) {
        return 'Please enter a valid Slack webhook URL';
      }
    }

    return null;
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }
    createRepositoryMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Repository</DialogTitle>
          <DialogDescription>
            Add a new repository to monitor for security vulnerabilities and license compliance.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repository Name</FormLabel>
                    <FormControl>
                      <Input placeholder="my-awesome-app" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="defaultBranch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Branch</FormLabel>
                    <FormControl>
                      <Input placeholder="main" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="gitUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Git URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://github.com/username/repository.git" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="authToken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GitHub Personal Access Token</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" {...field} />
                  </FormControl>
                  <FormDescription>
                    Required for private repositories. Needs repo access.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Owner Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="owner@company.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Email address for alert notifications.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slackWebhookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slack Webhook URL (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="url" 
                      placeholder="https://hooks.slack.com/services/..." 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional: Receive alerts in Slack.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createRepositoryMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createRepositoryMutation.isPending}
                className="bg-primary text-white hover:bg-blue-700"
              >
                {createRepositoryMutation.isPending ? "Adding..." : "Add Repository"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}