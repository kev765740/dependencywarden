import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { initSentry } from "./lib/sentry";
import { ErrorBoundary } from './components/ErrorBoundary';
import { logError } from './lib/errorLogger';

// Initialize Sentry
try {
  initSentry();
} catch (error) {
  logError(error as Error, 'Sentry Initialization');
}

// Ensure the root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  logError(new Error('Failed to find root element'), 'DOM Initialization');
  throw new Error('Failed to find root element');
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Create root with error handling
try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  logError(error as Error, 'React Initialization');
  // Show a user-friendly error message
  document.body.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: system-ui;">
      <div style="text-align: center; padding: 20px;">
        <h1 style="color: #e11d48;">Something went wrong</h1>
        <p>We're having trouble loading the application. Please try refreshing the page.</p>
        ${import.meta.env.DEV ? `<pre style="margin-top: 20px; text-align: left; background: #f3f4f6; padding: 10px; border-radius: 4px;">${(error as Error).message}</pre>` : ''}
      </div>
    </div>
  `;
}