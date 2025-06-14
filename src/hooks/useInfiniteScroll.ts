import { useEffect, useRef, useState, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
  onLoadMore: () => Promise<void>;
}

export function useInfiniteScroll({
  threshold = 0.5,
  rootMargin = '100px',
  enabled = true,
  onLoadMore,
}: UseInfiniteScrollOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  const { ref, inView } = useInView({
    threshold,
    rootMargin,
  });

  const handleLoadMore = useCallback(async () => {
    if (!enabled || loadingRef.current) return;

    try {
      setLoading(true);
      setError(null);
      await onLoadMore();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more items'));
    } finally {
      setLoading(false);
    }
  }, [enabled, onLoadMore]);

  useEffect(() => {
    if (inView) {
      handleLoadMore();
    }
  }, [inView, handleLoadMore]);

  const retry = useCallback(() => {
    setError(null);
    handleLoadMore();
  }, [handleLoadMore]);

  return {
    ref,
    loading,
    error,
    retry,
  };
}

// Example usage:
// function ItemList() {
//   const [items, setItems] = useState<Item[]>([]);
//   const [hasMore, setHasMore] = useState(true);
//   const page = useRef(1);
//
//   const loadMore = async () => {
//     const newItems = await fetchItems(page.current);
//     setItems(prev => [...prev, ...newItems]);
//     setHasMore(newItems.length > 0);
//     page.current += 1;
//   };
//
//   const { ref, loading, error, retry } = useInfiniteScroll({
//     enabled: hasMore,
//     onLoadMore: loadMore,
//   });
//
//   return (
//     <div>
//       {items.map(item => (
//         <ItemComponent key={item.id} item={item} />
//       ))}
//       {loading && <Spinner />}
//       {error && (
//         <div>
//           Error: {error.message}
//           <button onClick={retry}>Retry</button>
//         </div>
//       )}
//       <div ref={ref} />
//     </div>
//   );
// } 