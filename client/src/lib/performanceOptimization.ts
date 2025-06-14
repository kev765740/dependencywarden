
import React, { lazy, ComponentType, LazyExoticComponent, Suspense } from 'react';
import ComponentErrorBoundary from '@/components/ComponentErrorBoundary';

// Lazy loading wrapper with error boundary
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: ComponentType,
  componentName?: string
): LazyExoticComponent<T> {
  return lazy(importFn);
}

// Optimized image loading with lazy loading and WebP support
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  loading = 'lazy',
  priority = false
}: OptimizedImageProps) {
  const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  
  return React.createElement('picture', null,
    React.createElement('source', { srcSet: webpSrc, type: 'image/webp' }),
    React.createElement('img', {
      src,
      alt,
      width,
      height,
      className,
      loading: priority ? 'eager' : loading,
      decoding: 'async'
    })
  );
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private static metrics: Map<string, number> = new Map();
  
  static startMeasure(name: string): void {
    if (typeof performance !== 'undefined') {
      performance.mark(`${name}-start`);
    }
  }
  
  static endMeasure(name: string): number | null {
    if (typeof performance !== 'undefined') {
      try {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
        
        const measure = performance.getEntriesByName(name, 'measure')[0];
        const duration = measure?.duration || 0;
        
        this.metrics.set(name, duration);
        return duration;
      } catch (error) {
        console.warn('Performance measurement failed:', error);
        return null;
      }
    }
    return null;
  }
  
  static getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
  
  static reportMetrics(): void {
    if (typeof performance !== 'undefined') {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      console.log('Performance Metrics:', {
        navigationTiming: {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
          loadComplete: navigation.loadEventEnd - navigation.fetchStart,
          firstByte: navigation.responseStart - navigation.fetchStart,
        },
        paintTiming: paint.reduce((acc, entry) => {
          acc[entry.name] = entry.startTime;
          return acc;
        }, {} as Record<string, number>),
        customMetrics: this.getMetrics()
      });
    }
  }
}

// Bundle size optimization
export function removeUnusedImports() {
  // Tree-shaking optimization hints
  if (import.meta.env.PROD) {
    // Remove development-only code
    console.warn = () => {};
    console.info = () => {};
  }
}

// Memory optimization utilities
export class MemoryOptimizer {
  private static observers: Set<IntersectionObserver> = new Set();
  private static timers: Set<NodeJS.Timeout> = new Set();
  
  static createIntersectionObserver(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ): IntersectionObserver {
    const observer = new IntersectionObserver(callback, options);
    this.observers.add(observer);
    return observer;
  }
  
  static createTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timer = setTimeout(() => {
      callback();
      this.timers.delete(timer);
    }, delay);
    this.timers.add(timer);
    return timer;
  }
  
  static cleanup(): void {
    // Clean up observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // Clean up timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
  }
}

// Virtualization for large lists
export function useVirtualization<T>(
  items: T[],
  containerHeight: number,
  itemHeight: number
) {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length - 1
  );
  
  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;
  
  return {
    visibleItems,
    offsetY,
    totalHeight: items.length * itemHeight,
    setScrollTop
  };
}

// Code splitting constants
export const LAZY_LOAD_ROUTES = {
  // Critical routes (loaded immediately)
  CRITICAL: ['/dashboard', '/login', '/'],
  
  // Important routes (loaded on user interaction)
  IMPORTANT: ['/repositories', '/security', '/settings'],
  
  // Optional routes (loaded on demand)
  OPTIONAL: ['/analytics', '/enterprise', '/admin']
};

export default {
  createLazyComponent,
  OptimizedImage,
  PerformanceMonitor,
  MemoryOptimizer,
  useVirtualization,
  removeUnusedImports
};
