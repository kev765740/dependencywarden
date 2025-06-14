import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { 
  Shield, 
  Home,
  Brain,
  CheckCircle,
  Zap,
  AlertTriangle,
  BarChart3,
  Lock,
  Search,
  Users,
  Settings,
  UserCog,
  FileText,
  Gift,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
  GitPullRequest,
  GitBranch,
  MessageSquare,
  TrendingUp,
  Scale,
  Activity,
  FileCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (!user) return null;

  const navigationSections = [
    {
      title: "Core Platform",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: Home,
          description: "Overview & Analytics"
        },
        {
          title: "Security Dashboard",
          href: "/security-dashboard",
          icon: Shield,
          description: "Security Overview"
        },
        {
          title: "Repositories",
          href: "/repositories",
          icon: GitBranch,
          description: "Repository Management"
        },
        {
          title: "Security Alerts",
          href: "/alerts",
          icon: AlertTriangle,
          description: "Vulnerability Alerts"
        }
      ]
    },
    {
      title: "Enterprise Security",
      items: [
        {
          title: "Enterprise Security",
          href: "/enterprise-security",
          icon: Lock,
          description: "Threat Intelligence, Policies & SSO",
          badge: "ENTERPRISE"
        },
        {
          title: "AI Security Intelligence",
          href: "/ai-security",
          icon: Brain,
          description: "AI-Powered Threat Detection",
          badge: "AI"
        },
        {
          title: "Compliance & Governance", 
          href: "/compliance",
          icon: FileCheck,
          description: "SOC 2, ISO 27001 & GDPR"
        }
      ]
    },
    {
      title: "AI & Automation",
      items: [
        {
          title: "Security Insights",
          href: "/advanced-ai",
          icon: BarChart3,
          description: "Vulnerability Trends & Analytics",
          badge: "IMPROVED"
        },
        {
          title: "Security Copilot",
          href: "/security-copilot",
          icon: Brain,
          description: "AI Assistant with Slash Commands",
          badge: "AI"
        },
        {
          title: "AI-Generated SBOM",
          href: "/sbom",
          icon: FileText,
          description: "Plain-Language SBOM Analysis"
        },
        {
          title: "License Policy Management",
          href: "/license-policy",
          icon: Scale,
          description: "Block GPL/AGPL Dependencies"
        },
        {
          title: "Auto-Fix PRs",
          href: "/auto-fix-prs",
          icon: GitPullRequest,
          description: "Automated GitHub Patches",
          badge: "PRIORITY"
        }
      ]
    },
    {
      title: "Management",
      items: [
        {
          title: "Team Management",
          href: "/team",
          icon: Users,
          description: "Users & Permissions"
        },
        {
          title: "API Integrations",
          href: "/integrations",
          icon: Zap,
          description: "SIEM, DevOps & Identity"
        },
        {
          title: "Executive Analytics",
          href: "/analytics",
          icon: BarChart3,
          description: "Platform Analytics"
        },
        {
          title: "Billing",
          href: "/pricing",
          icon: Gift,
          description: "Plans & Billing"
        }
      ]
    },
    {
      title: "Support",
      items: [
        {
          title: "Referrals",
          href: "/referrals",
          icon: Gift,
          description: "Invite & Earn"
        },
        {
          title: "Settings",
          href: "/settings",
          icon: Settings,
          description: "Account & Preferences"
        },
        {
          title: "Documentation",
          href: "/docs",
          icon: FileText,
          description: "API & Guides"
        },
        {
          title: "Share Feedback",
          href: "/feedback",
          icon: MessageSquare,
          description: "Report Issues & Suggestions"
        }
      ]
    }
  ];



  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  // Filter sections based on search query
  const filteredSections = navigationSections.map(section => ({
    ...section,
    items: section.items.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.badge && item.badge.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(section => section.items.length > 0);

  return (
    <div className={cn(
      "flex flex-col border-r bg-white dark:bg-gray-950 transition-all duration-300",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              DepWatch
            </span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 p-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* User Info */}
      {!collapsed && user && (
        <div className="p-4 border-b bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      {!collapsed && (
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-2 space-y-4">
          {filteredSections.length > 0 ? (
            filteredSections.map((section, sectionIndex) => (
              <div key={section.title} className="space-y-1">
                {/* Section Header */}
                {!collapsed && (
                  <div className="px-2 py-1">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {section.title}
                    </h3>
                  </div>
                )}

                {/* Section Items */}
                {section.items.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive(item.href) ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-10 transition-all duration-200",
                        collapsed ? "px-2" : "px-3",
                        isActive(item.href) && "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500",
                        !isActive(item.href) && "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      )}
                    >
                      <item.icon className={cn("h-4 w-4 flex-shrink-0", collapsed ? "" : "mr-3")} />
                      {!collapsed && (
                        <>
                          <span className="flex-1 text-left text-sm font-medium">{item.title}</span>
                          {item.badge && (
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "text-xs ml-2 px-1.5 py-0.5 font-medium",
                                item.badge === "AI" && "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
                                item.badge === "ENTERPRISE" && "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
                                item.badge === "NEW" && "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                              )}
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Button>
                  </Link>
                ))}

                {/* Section Separator */}
                {sectionIndex < filteredSections.length - 1 && !collapsed && (
                  <div className="pt-2">
                    <Separator className="opacity-30" />
                  </div>
                )}
              </div>
            ))
          ) : (
            /* No Results Message */
            !collapsed && searchQuery && (
              <div className="px-4 py-8 text-center">
                <Search className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No features found for "{searchQuery}"
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Try searching for "AI", "Security", or "Dashboard"
                </p>
              </div>
            )
          )}
        </nav>
      </div>

      {/* Footer Actions */}
      <div className="border-t p-2 space-y-1">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-10",
            collapsed ? "px-2" : "px-3"
          )}
        >
          <Bell className={cn("h-4 w-4", collapsed ? "" : "mr-3")} />
          {!collapsed && <span className="flex-1 text-left">Notifications</span>}
        </Button>

        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start h-10 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50",
            collapsed ? "px-2" : "px-3"
          )}
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className={cn("h-4 w-4", collapsed ? "" : "mr-3")} />
          {!collapsed && <span className="flex-1 text-left">Sign Out</span>}
        </Button>
      </div>
    </div>
  );
}