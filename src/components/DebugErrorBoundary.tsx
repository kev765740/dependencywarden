import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class DebugErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 ERROR CAUGHT:', error);
    console.error('🚨 ERROR INFO:', errorInfo);
    console.error('🚨 COMPONENT STACK:', errorInfo.componentStack);
    
    this.setState({
      error,
      errorInfo
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#fff', color: '#000', fontFamily: 'monospace' }}>
          <h1 style={{ color: 'red' }}>🚨 DEBUG ERROR BOUNDARY</h1>
          <h2>Error:</h2>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
            {this.state.error?.toString()}
          </pre>
          <h2>Stack:</h2>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto', fontSize: '12px' }}>
            {this.state.error?.stack}
          </pre>
          <h2>Component Stack:</h2>
          <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', overflow: 'auto', fontSize: '12px' }}>
            {this.state.errorInfo?.componentStack}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '20px', padding: '10px', backgroundColor: '#007bff', color: 'white' }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
} 