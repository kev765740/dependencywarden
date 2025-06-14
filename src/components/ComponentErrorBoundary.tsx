import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, RefreshCw, Bug, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  showDetails: boolean;
  retryCount: number;
}

class ComponentErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false, 
      showDetails: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      showDetails: false,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Component Error in ${this.props.componentName || 'Unknown Component'}:`, error, errorInfo);

    this.setState({
      errorInfo
    });

    // Send error to monitoring service
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        },
        tags: {
          component: this.props.componentName || 'unknown'
        }
      });
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < 3) {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: this.state.retryCount + 1
      });
    } else {
      window.location.reload();
    }
  };

  toggleDetails = () => {
    this.setState(prev => ({
      showDetails: !prev.showDetails
    }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < 3;

      return (
        <Card className="w-full max-w-2xl mx-auto mt-8 border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle className="text-destructive">Component Error</CardTitle>
            </div>
            <CardDescription>
              {this.props.componentName && (
                <span className="font-medium">{this.props.componentName}: </span>
              )}
              {canRetry 
                ? "A temporary error occurred. You can try again or refresh the page."
                : "Multiple errors detected. Please refresh the page to continue."
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {canRetry ? (
                <Button 
                  onClick={this.handleRetry}
                  variant="default"
                  size="sm"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again ({3 - this.state.retryCount} attempts left)
                </Button>
              ) : (
                <Button 
                  onClick={() => window.location.reload()}
                  variant="destructive"
                  size="sm"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Page
                </Button>
              )}

              <Button 
                onClick={this.toggleDetails}
                variant="outline"
                size="sm"
              >
                <Bug className="mr-2 h-4 w-4" />
                {this.state.showDetails ? (
                  <>Hide Details <ChevronUp className="ml-1 h-3 w-3" /></>
                ) : (
                  <>Show Details <ChevronDown className="ml-1 h-3 w-3" /></>
                )}
              </Button>
            </div>

            {this.state.showDetails && (
              <div className="bg-muted p-4 rounded-md">
                <h4 className="font-medium mb-2">Error Details:</h4>
                <div className="text-sm font-mono bg-background p-2 rounded border overflow-auto max-h-40">
                  <div className="text-destructive mb-2">
                    {this.state.error?.name}: {this.state.error?.message}
                  </div>
                  {this.state.error?.stack && (
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
                {this.state.errorInfo?.componentStack && (
                  <div className="mt-2">
                    <div className="text-sm font-medium mb-1">Component Stack:</div>
                    <pre className="text-xs bg-background p-2 rounded border overflow-auto max-h-32 text-muted-foreground whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              If this error persists, please contact support with the error details above.
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ComponentErrorBoundary;