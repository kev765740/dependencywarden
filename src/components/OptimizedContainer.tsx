import React, { Suspense, lazy, useRef, useEffect, useState, ReactNode } from 'react';
import { useInView } from 'react-intersection-observer';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface OptimizedContainerProps {
  children: ReactNode;
  height?: string | number;
  threshold?: number;
  placeholder?: ReactNode;
  onVisibilityChange?: (visible: boolean) => void;
  lazyLoad?: boolean;
  virtualizeItems?: boolean;
  itemHeight?: number;
  items?: any[];
  renderItem?: (item: any, index: number) => ReactNode;
}

export function OptimizedContainer({
  children,
  height = 'auto',
  threshold = 0.1,
  placeholder = <LoadingSpinner />,
  onVisibilityChange,
  lazyLoad = false,
  virtualizeItems = false,
  itemHeight = 50,
  items = [],
  renderItem
}: OptimizedContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: false,
  });

  useEffect(() => {
    onVisibilityChange?.(inView);
  }, [inView, onVisibilityChange]);

  useEffect(() => {
    if (!virtualizeItems || !containerRef.current) return;

    const updateVisibleItems = () => {
      const container = containerRef.current;
      if (!container) return;

      const scrollTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      
      // Add buffer for smooth scrolling
      const buffer = Math.floor(containerHeight / itemHeight);
      const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
      const endIndex = Math.min(
        items.length,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
      );

      setVisibleItems(Array.from(
        { length: endIndex - startIndex },
        (_, i) => startIndex + i
      ));
    };

    const container = containerRef.current;
    container.addEventListener('scroll', updateVisibleItems);
    window.addEventListener('resize', updateVisibleItems);
    updateVisibleItems();

    return () => {
      container.removeEventListener('scroll', updateVisibleItems);
      window.removeEventListener('resize', updateVisibleItems);
    };
  }, [virtualizeItems, items.length, itemHeight]);

  // Lazy loading wrapper
  const LazyComponent = lazy(() => 
    new Promise<{ default: React.ComponentType }>((resolve) => {
      if (inView) {
        resolve({ default: () => <>{children}</> });
      }
    })
  );

  if (virtualizeItems && renderItem) {
    return (
      <div
        ref={containerRef}
        style={{
          height,
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <div style={{ height: `${items.length * itemHeight}px` }}>
          {visibleItems.map(index => (
            <div
              key={index}
              style={{
                position: 'absolute',
                top: `${index * itemHeight}px`,
                left: 0,
                right: 0,
                height: `${itemHeight}px`,
              }}
            >
              {renderItem(items[index], index)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      style={{
        height,
        overflowY: virtualizeItems ? 'auto' : 'visible',
      }}
    >
      {lazyLoad ? (
        <Suspense fallback={placeholder}>
          {inView ? <LazyComponent /> : null}
        </Suspense>
      ) : (
        children
      )}
    </div>
  );
} 