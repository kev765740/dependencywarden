import React, { Suspense, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { SecurityCopilotProvider } from "@/contexts/SecurityCopilotContext";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { lazy } from 'react';

// Lazy-loaded components
const LoginPage = lazy(() => import('./pages/LoginPage'));
const TestPage = lazy(() => import("./pages/TestPage"));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SecurityDashboard = lazy(() => import('./pages/security-dashboard'));
const RepositoriesPage = lazy(() => import("./pages/RepositoriesPage"));
const AlertsPage = lazy(() => import("./pages/AlertsPage"));
const EnterpriseSecurityPage = lazy(() => import("./pages/enterprise-security"));
const AISecurityIntelligence = lazy(() => import("./pages/ai-security"));
const AdvancedCompliance = lazy(() => import("./pages/compliance"));
const SecurityInsightsDashboard = lazy(() => import("./pages/security-insights"));
const SecurityCopilot = lazy(() => import("./pages/security-copilot"));
const AIGeneratedSBOM = lazy(() => import("./pages/ai-generated-sbom"));
const LicensePolicy = lazy(() => import("./pages/LicensePolicy"));
const AutoFixPRs = lazy(() => import('./pages/auto-fix-prs'));
const TeamManagement = lazy(() => import("./pages/team-management"));
const Integrations = lazy(() => import("./pages/integrations"));
const Analytics = lazy(() => import("./pages/analytics"));
const Settings = lazy(() => import("./pages/settings"));
const Documentation = lazy(() => import("./pages/docs"));
const FeedbackPage = lazy(() => import("./pages/feedback"));
const BillingPage = lazy(() => import("./pages/BillingPage"));
const ThreatHunting = lazy(() => import('./pages/threat-hunting'));

// Component wrapper for lazy-loaded routes with error boundary
const LazyPageWrapper = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

// Protected route component that uses useAuth
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Main routes component
const AppContent = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // Global error handler
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/test" element={
        <LazyPageWrapper>
          <TestPage />
        </LazyPageWrapper>
      } />
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : (
          <LazyPageWrapper>
            <LoginPage />
          </LazyPageWrapper>
        )} 
      />
      
      {/* Protected routes with layout */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <LazyPageWrapper>
              <DashboardPage />
            </LazyPageWrapper>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/security-dashboard" element={
        <ProtectedRoute>
          <Layout>
            <LazyPageWrapper>
              <SecurityDashboard />
            </LazyPageWrapper>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/repositories" element={
        <ProtectedRoute>
          <Layout>
            <LazyPageWrapper>
              <RepositoriesPage />
            </LazyPageWrapper>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/alerts" element={
        <ProtectedRoute>
          <Layout>
            <LazyPageWrapper>
              <AlertsPage />
            </LazyPageWrapper>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/enterprise-security" element={
        <ProtectedRoute>
          <Layout>
            <LazyPageWrapper>
              <EnterpriseSecurityPage />
            </LazyPageWrapper>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/ai-security" element={
        <ProtectedRoute>
          <Layout>
            <LazyPageWrapper>
              <AISecurityIntelligence />
            </LazyPageWrapper>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/compliance" element={
        <ProtectedRoute>
          <Layout>
            <LazyPageWrapper>
              <AdvancedCompliance />
            </LazyPageWrapper>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/advanced-ai" element={
        <ProtectedRoute>
          <Layout>
            <LazyPageWrapper>
              <SecurityInsightsDashboard />
            </LazyPageWrapper>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/security-copilot" element={
        <ProtectedRoute>
          <Layout>
            <LazyPageWrapper>
              <SecurityCopilot />
            </LazyPageWrapper>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/sbom" element={
        <ProtectedRoute>
          <Layout>
            <LazyPageWrapper>
              <AIGeneratedSBOM />
            </LazyPageWrapper>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/license-policy" element={
        <ProtectedRoute>
          <Layout>
            <LazyPageWrapper>
              <LicensePolicy />
            </LazyPageWrapper>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/auto-fix-prs" element={
        <ProtectedRoute>
          <Layout>
            <LazyPageWrapper>
              <AutoFixPRs />
            </LazyPageWrapper>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/team" element={
        <ProtectedRoute>
          <Layout>
            <LazyPageWrapper>
              <TeamManagement />
            </LazyPageWrapper>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/integrations" element={
        <ProtectedRoute>
          <Layout>
            <LazyPageWrapper>
              <Integrations />
            </LazyPageWrapper>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/analytics" element={
        <ProtectedRoute>
          <Layout>
            <LazyPageWrapper>
              <Analytics />
            </LazyPageWrapper>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/settings" element={
        <ProtectedRoute>
          <Layout>
            <LazyPageWrapper>
              <Settings />
            </LazyPageWrapper>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/docs" element={
        <ProtectedRoute>
          <Layout>
            <LazyPageWrapper>
              <Documentation />
            </LazyPageWrapper>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/feedback" element={
        <ProtectedRoute>
          <Layout>
            <LazyPageWrapper>
              <FeedbackPage />
            </LazyPageWrapper>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/billing" element={
        <ProtectedRoute>
          <Layout>
            <LazyPageWrapper>
              <BillingPage />
            </LazyPageWrapper>
          </Layout>
        </ProtectedRoute>
      } />
      
      <Route path="/threats" element={
        <ProtectedRoute>
          <Layout>
            <LazyPageWrapper>
              <ThreatHunting />
            </LazyPageWrapper>
          </Layout>
        </ProtectedRoute>
      } />
      
      {/* Default routes */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

// Main App component with providers in the correct order
export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <TooltipProvider>
          <SecurityCopilotProvider>
            <Router>
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </Router>
          </SecurityCopilotProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}