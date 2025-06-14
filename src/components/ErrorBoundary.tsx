import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ReloadIcon } from '@radix-ui/react-icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, retryCount: 0 };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Here we could send to error reporting service
    // reportError(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isNetworkError = this.state.error?.message.toLowerCase().includes('network') 
        || this.state.error?.message.toLowerCase().includes('fetch');

      const shouldShowRetry = this.state.retryCount < 3 && isNetworkError;

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive" className="border-red-500">
              <AlertTitle className="text-lg font-semibold">
                {isNetworkError ? 'Connection Error' : 'Something went wrong'}
              </AlertTitle>
              <AlertDescription className="mt-2 text-sm">
                {isNetworkError 
                  ? 'There was a problem connecting to the server. Please check your internet connection and try again.'
                  : 'An unexpected error occurred. Our team has been notified and is working on it.'}
                
                {this.state.error && (
                  <div className="mt-2 text-xs opacity-75">
                    Error: {this.state.error.message}
                  </div>
                )}
              </AlertDescription>
              
              <div className="mt-4 flex gap-2">
                {shouldShowRetry && (
                  <Button 
                    variant="outline"
                    onClick={this.handleRetry}
                    className="flex items-center gap-2"
                  >
                    <ReloadIcon className="h-4 w-4" />
                    Retry
                  </Button>
                )}
                <Button 
                  variant="default"
                  onClick={this.handleReload}
                >
                  Reload Page
                </Button>
              </div>
            </Alert>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
