import React, { Suspense } from "react";
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/Layout";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy load all pages
const LoginPage = React.lazy(() => import("./pages/LoginPage"));
const TestPage = React.lazy(() => import("./pages/TestPage"));
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
const BillingPage = React.lazy(() => import("./pages/BillingPage"));

// Component wrapper for lazy-loaded routes with error boundary
const LazyPageWrapper = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>
    <Suspense fallback={<LoadingSpinner />}>
      {children}
    </Suspense>
  </ErrorBoundary>
);

// Protected route component
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

export const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();

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
      
      {/* Default routes */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}; 