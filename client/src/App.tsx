import React, { Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/Sidebar";
import { SecurityCopilotProvider } from "@/contexts/SecurityCopilotContext";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ThemeProvider } from './context/ThemeContext';

// Lazy load pages
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const DashboardPage = React.lazy(() => import("./pages/DashboardPage"));
const SecurityDashboard = React.lazy(() => import("./pages/security-dashboard"));
const RepositoriesPage = React.lazy(() => import("./pages/RepositoriesPage"));
const AlertsPage = React.lazy(() => import("./pages/AlertsPage"));
const EnterpriseSecurityPage = React.lazy(() => import("./pages/enterprise-security"));
const AISecurityIntelligence = React.lazy(() => import("./pages/ai-security"));
const AdvancedCompliance = React.lazy(() => import("./pages/compliance"));
const SecurityInsightsDashboard = React.lazy(() => import("./pages/security-insights"));
const SecurityCopilot = React.lazy(() => import("./pages/security-copilot"));
const AIGeneratedSBOM = React.lazy(() => import("./pages/ai-generated-sbom"));
const LicensePolicy = React.lazy(() => import("./pages/LicensePolicy"));
const AutoFixPRs = React.lazy(() => import("./pages/auto-fix-prs"));
const TeamManagement = React.lazy(() => import("./pages/team-management"));
const Integrations = React.lazy(() => import("./pages/integrations"));
const Analytics = React.lazy(() => import("./pages/analytics"));
const Settings = React.lazy(() => import("./pages/settings"));
const Documentation = React.lazy(() => import("./pages/docs"));
const FeedbackPage = React.lazy(() => import("./pages/feedback"));

const AppContent = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/security-dashboard" element={<SecurityDashboard />} />
            <Route path="/repositories" element={<RepositoriesPage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/enterprise-security" element={<EnterpriseSecurityPage />} />
            <Route path="/ai-security" element={<AISecurityIntelligence />} />
            <Route path="/compliance" element={<AdvancedCompliance />} />
            <Route path="/advanced-ai" element={<SecurityInsightsDashboard />} />
            <Route path="/security-copilot" element={<SecurityCopilot />} />
            <Route path="/sbom" element={<AIGeneratedSBOM />} />
            <Route path="/license-policy" element={<LicensePolicy />} />
            <Route path="/auto-fix-prs" element={<AutoFixPRs />} />
            <Route path="/team" element={<TeamManagement />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="/feedback" element={<FeedbackPage />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <SecurityCopilotProvider>
              <TooltipProvider>
                <AppContent />
                <Toaster />
              </TooltipProvider>
            </SecurityCopilotProvider>
          </QueryClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}