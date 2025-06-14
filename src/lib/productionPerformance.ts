/**
 * Production Performance Optimization
 * Comprehensive performance utilities for production deployment
 */

import React, { lazy, Suspense, LazyExoticComponent } from 'react';

// Simple lazy loading without complex error boundaries
export function createProductionLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  loadingComponent?: React.ComponentType
): LazyExoticComponent<T> {
  const LazyComponent = lazy(importFn);
  
  const WrappedComponent = (props: React.ComponentProps<T>) => 
    React.createElement(
      Suspense,
      { 
        fallback: loadingComponent ? 
          React.createElement(loadingComponent) : 
          React.createElement('div', { className: 'p-4 text-center' }, 'Loading...')
      },
      React.createElement(LazyComponent, props)
    );
  
  return WrappedComponent as LazyExoticComponent<T>;
}

// Performance monitoring utilities
export class PerformanceTracker {
  private static measurements = new Map<string, number>();

  static startMeasurement(name: string): void {
    this.measurements.set(name, performance.now());
  }

  static endMeasurement(name: string): number | null {
    const start = this.measurements.get(name);
    if (!start) return null;
    
    const duration = performance.now() - start;
    this.measurements.delete(name);
    return duration;
  }

  static getMetrics(): Record<string, number> {
    const metrics: Record<string, number> = {};
    this.measurements.forEach((value, key) => {
      metrics[key] = performance.now() - value;
    });
    return metrics;
  }

  static clearMetrics(): void {
    this.measurements.clear();
  }
}

// Image optimization for production
export interface OptimizedImageProps {
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
  className = '',
  loading = 'lazy',
  priority = false
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = React.useState(src);
  const [isLoaded, setIsLoaded] = React.useState(false);

  React.useEffect(() => {
    // Detect WebP support
    const checkWebPSupport = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    };

    if (checkWebPSupport() && src.includes('.jpg') || src.includes('.png')) {
      const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      setImageSrc(webpSrc);
    }
  }, [src]);

  return React.createElement('img', {
    src: imageSrc,
    alt,
    width,
    height,
    className: `${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`,
    loading: priority ? 'eager' : loading,
    onLoad: () => setIsLoaded(true),
    onError: () => setImageSrc(src) // Fallback to original format
  });
}

// Memory optimization utilities
export class MemoryOptimizer {
  private static observers = new Set<IntersectionObserver>();
  private static timeouts = new Set<NodeJS.Timeout>();

  static createIntersectionObserver(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ): IntersectionObserver {
    const observer = new IntersectionObserver(callback, options);
    this.observers.add(observer);
    return observer;
  }

  static createTimeout(callback: () => void, delay: number): NodeJS.Timeout {
    const timeout = setTimeout(callback, delay);
    this.timeouts.add(timeout);
    return timeout;
  }

  static cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.observers.clear();
    this.timeouts.clear();
  }
}

// Bundle optimization utilities
export function preloadRoute(routePath: string): void {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = routePath;
  document.head.appendChild(link);
}

export function preloadCriticalAssets(assets: string[]): void {
  assets.forEach(asset => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = asset;
    
    if (asset.endsWith('.css')) {
      link.as = 'style';
    } else if (asset.endsWith('.js')) {
      link.as = 'script';
    } else if (asset.match(/\.(jpg|jpeg|png|webp|svg)$/)) {
      link.as = 'image';
    }
    
    document.head.appendChild(link);
  });
}

// Production analytics
export class ProductionAnalytics {
  private static events: Array<{ name: string; timestamp: number; data?: any }> = [];

  static trackEvent(name: string, data?: any): void {
    this.events.push({
      name,
      timestamp: Date.now(),
      data
    });

    // Keep only last 100 events to prevent memory leaks
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
  }

  static getEvents(): Array<{ name: string; timestamp: number; data?: any }> {
    return [...this.events];
  }

  static clearEvents(): void {
    this.events = [];
  }
}