
/**
 * Production Validation Utilities
 * Client-side validation and security checks
 */

// Environment validation
export const validateEnvironment = (): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  // Check for required environment variables
  const requiredEnvVars = [
    'VITE_API_URL',
    'VITE_ENCRYPTION_KEY'
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (!import.meta.env[envVar]) {
      issues.push(`Missing environment variable: ${envVar}`);
    }
  });
  
  // Check for development-only configurations in production
  if (import.meta.env.PROD) {
    if (import.meta.env.VITE_DEBUG_MODE === 'true') {
      issues.push('Debug mode should be disabled in production');
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};

// Security validation
export const validateSecurity = (): { isSecure: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  // Check localStorage usage (should not contain sensitive data)
  if (typeof window !== 'undefined') {
    const sensitiveKeys = ['token', 'password', 'secret', 'key'];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        issues.push(`Sensitive data found in localStorage: ${key}`);
      }
    }
  }
  
  // Check for proper HTTPS in production
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      issues.push('Application should use HTTPS in production');
    }
  }
  
  return {
    isSecure: issues.length === 0,
    issues
  };
};

// Performance validation
export const validatePerformance = (): { isOptimal: boolean; metrics: any; issues: string[] } => {
  const issues: string[] = [];
  const metrics: any = {};
  
  if (typeof window !== 'undefined' && 'performance' in window) {
    // Check navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
      
      metrics.loadTime = loadTime;
      metrics.domContentLoaded = domContentLoaded;
      
      if (loadTime > 3000) {
        issues.push(`Page load time too slow: ${loadTime}ms (should be < 3000ms)`);
      }
      
      if (domContentLoaded > 1500) {
        issues.push(`DOM content loaded too slow: ${domContentLoaded}ms (should be < 1500ms)`);
      }
    }
    
    // Check for memory leaks
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metrics.memory = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit
      };
      
      const memoryUsagePercent = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      if (memoryUsagePercent > 80) {
        issues.push(`High memory usage: ${memoryUsagePercent.toFixed(1)}%`);
      }
    }
  }
  
  return {
    isOptimal: issues.length === 0,
    metrics,
    issues
  };
};

// Accessibility validation
export const validateAccessibility = (): { isAccessible: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  if (typeof document !== 'undefined') {
    // Check for missing alt text on images
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        issues.push(`Image ${index + 1} missing alt text`);
      }
    });
    
    // Check for missing form labels
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach((input, index) => {
      const hasLabel = input.getAttribute('aria-label') || 
                      input.getAttribute('aria-labelledby') ||
                      document.querySelector(`label[for="${input.id}"]`);
      
      if (!hasLabel) {
        issues.push(`Form input ${index + 1} missing label`);
      }
    });
    
    // Check for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (index === 0 && level !== 1) {
        issues.push('First heading should be h1');
      }
      
      if (level > previousLevel + 1) {
        issues.push(`Heading level skip detected: h${previousLevel} to h${level}`);
      }
      
      previousLevel = level;
    });
  }
  
  return {
    isAccessible: issues.length === 0,
    issues
  };
};

// Comprehensive production validation
export const runProductionValidation = () => {
  console.log('🔍 Running Production Validation...');
  
  const environmentCheck = validateEnvironment();
  const securityCheck = validateSecurity();
  const performanceCheck = validatePerformance();
  const accessibilityCheck = validateAccessibility();
  
  const allIssues = [
    ...environmentCheck.issues,
    ...securityCheck.issues,
    ...performanceCheck.issues,
    ...accessibilityCheck.issues
  ];
  
  const isProductionReady = 
    environmentCheck.isValid && 
    securityCheck.isSecure && 
    performanceCheck.isOptimal && 
    accessibilityCheck.isAccessible;
  
  const report = {
    timestamp: new Date().toISOString(),
    isProductionReady,
    totalIssues: allIssues.length,
    checks: {
      environment: environmentCheck,
      security: securityCheck,
      performance: performanceCheck,
      accessibility: accessibilityCheck
    },
    metrics: performanceCheck.metrics
  };
  
  if (isProductionReady) {
    console.log('✅ Production validation passed!');
  } else {
    console.warn('⚠️ Production validation found issues:');
    allIssues.forEach(issue => console.warn(`  - ${issue}`));
  }
  
  return report;
};

// Auto-run validation in development
if (import.meta.env.DEV) {
  // Run validation after DOM is loaded
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => runProductionValidation(), 1000);
    });
  }
}
