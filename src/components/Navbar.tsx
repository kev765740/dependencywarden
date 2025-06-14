import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Shield, CreditCard, LogOut, User, Settings, BookOpen, Users, MessageSquare, BarChart3, Scale } from "lucide-react";
import { Link, useLocation } from "wouter";
import { FeedbackModal } from "@/components/FeedbackModal";

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  const getUserInitials = () => {
    if (!user) return "U";
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  const isProUser = user?.subscriptionStatus === 'active';

  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center space-x-4 cursor-pointer">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">DepWatch</h1>
          </div>
        </Link>
        
        <div className="flex items-center space-x-4">
          <Badge 
            variant={isProUser ? "default" : "secondary"}
            className={isProUser ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}
          >
            {isProUser ? 'Pro Plan' : 'Free Plan'}
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImageUrl || undefined} alt="Profile" />
                  <AvatarFallback className="bg-slate-200 text-slate-600">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user?.email || "User"
                    }
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/" className={`flex items-center ${location === '/' ? 'bg-slate-100' : ''}`}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/security" className={`flex items-center ${location === '/security' ? 'bg-slate-100' : ''}`}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Security Dashboard</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/teams" className={`flex items-center ${location === '/teams' ? 'bg-slate-100' : ''}`}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Team Management</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/integrations" className={`flex items-center ${location === '/integrations' ? 'bg-slate-100' : ''}`}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>API Integrations</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/analytics" className={`flex items-center ${location === '/analytics' ? 'bg-slate-100' : ''}`}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  <span>Executive Analytics</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/ai-security" className={`flex items-center ${location === '/ai-security' ? 'bg-slate-100' : ''}`}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>AI Security Intelligence</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/compliance" className={`flex items-center ${location === '/compliance' ? 'bg-slate-100' : ''}`}>
                  <Scale className="mr-2 h-4 w-4" />
                  <span>Compliance & Governance</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/billing" className={`flex items-center ${location === '/billing' ? 'bg-slate-100' : ''}`}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Billing</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/referrals" className={`flex items-center ${location === '/referrals' ? 'bg-slate-100' : ''}`}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>Referrals</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className={`flex items-center ${location === '/settings' ? 'bg-slate-100' : ''}`}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/docs" className={`flex items-center ${location === '/docs' ? 'bg-slate-100' : ''}`}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span>Documentation</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFeedbackModalOpen(true)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Share Feedback</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <FeedbackModal 
        open={feedbackModalOpen} 
        onOpenChange={setFeedbackModalOpen} 
      />
    </nav>
  );
}
