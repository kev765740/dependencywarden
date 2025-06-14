import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AsyncDataState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  isValidating: boolean;
}

interface UseAsyncDataOptions<T> {
  initialData?: T | null;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  retryCount?: number;
  retryDelay?: number;
  shouldRetry?: (error: Error, retryCount: number) => boolean;
  cacheKey?: string;
  cacheTime?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

export function useAsyncData<T>(
  asyncFn: () => Promise<T>,
  deps: any[] = [],
  options: UseAsyncDataOptions<T> = {}
) {
  const {
    initialData = null,
    onSuccess,
    onError,
    retryCount = 3,
    retryDelay = 1000,
    shouldRetry = (error: Error, count: number) => count < retryCount,
    cacheKey,
    cacheTime = 5 * 60 * 1000, // 5 minutes
  } = options;

  const { toast } = useToast();
  const [state, setState] = useState<AsyncDataState<T>>({
    data: initialData,
    isLoading: true,
    error: null,
    isValidating: false,
  });

  const fetchData = useCallback(async (retryAttempt = 0) => {
    // Check cache first
    if (cacheKey) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTime) {
        setState(prev => ({ ...prev, data: cached.data, isLoading: false }));
        return;
      }
    }

    setState(prev => ({ ...prev, isValidating: true }));

    try {
      const result = await asyncFn();
      
      // Update cache
      if (cacheKey) {
        cache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
        });
      }

      setState({
        data: result,
        isLoading: false,
        error: null,
        isValidating: false,
      });

      onSuccess?.(result);
    } catch (error: any) {
      console.error('Error fetching data:', error);

      // Handle retry logic
      if (shouldRetry(error, retryAttempt)) {
        setTimeout(() => {
          fetchData(retryAttempt + 1);
        }, retryDelay * Math.pow(2, retryAttempt)); // Exponential backoff
        return;
      }

      setState({
        data: null,
        isLoading: false,
        error,
        isValidating: false,
      });

      onError?.(error);

      toast({
        title: 'Error',
        description: error.message || 'An error occurred while fetching data',
        variant: 'destructive',
      });
    }
  }, [asyncFn, cacheKey, cacheTime, onSuccess, onError, retryDelay, shouldRetry, toast]);

  useEffect(() => {
    fetchData();
  }, [...deps, fetchData]);

  const refresh = useCallback(() => {
    setState(prev => ({ ...prev, isValidating: true }));
    return fetchData();
  }, [fetchData]);

  const mutate = useCallback((newData: T | ((prev: T | null) => T)) => {
    setState(prev => ({
      ...prev,
      data: typeof newData === 'function' ? (newData as Function)(prev.data) : newData,
    }));

    // Update cache if exists
    if (cacheKey) {
      cache.set(cacheKey, {
        data: typeof newData === 'function' ? (newData as Function)(state.data) : newData,
        timestamp: Date.now(),
      });
    }
  }, [cacheKey, state.data]);

  return {
    ...state,
    refresh,
    mutate,
  };
} 