// Development error logger to catch initialization issues
let errorCount = 0;

export function logError(error: Error, context?: string) {
  errorCount++;
  
  console.group(`🚨 Error #${errorCount}${context ? ` in ${context}` : ''}`);
  console.error(error);
  console.log('Stack:', error.stack);
  if (context) {
    console.log('Context:', context);
  }
  console.log('Environment:', import.meta.env.MODE);
  console.log('User Agent:', navigator.userAgent);
  console.groupEnd();

  // In development, show errors in the UI
  if (import.meta.env.DEV) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      background: #fee2e2;
      color: #991b1b;
      padding: 1rem;
      border-radius: 0.5rem;
      font-family: monospace;
      font-size: 0.875rem;
      max-width: 400px;
      z-index: 9999;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    `;
    errorDiv.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 0.5rem;">Error #${errorCount}${context ? ` in ${context}` : ''}</div>
      <div style="word-break: break-word;">${error.message}</div>
    `;
    document.body.appendChild(errorDiv);
    
    // Remove after 10 seconds
    setTimeout(() => errorDiv.remove(), 10000);
  }
} 