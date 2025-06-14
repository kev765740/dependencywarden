import { useState, useCallback } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  retryCount?: number;
  retryDelay?: number;
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: UseApiOptions = {}
) {
  const {
    onSuccess,
    onError,
    retryCount = 3,
    retryDelay = 1000,
  } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      let attempts = 0;
      let lastError: Error | null = null;

      while (attempts < retryCount) {
        try {
          const data = await apiFunction(...args);
          setState({ data, loading: false, error: null });
          onSuccess?.(data);
          return data;
        } catch (error) {
          lastError = error as Error;
          attempts++;

          if (attempts === retryCount) {
            setState({ data: null, loading: false, error: lastError });
            onError?.(lastError);
            throw lastError;
          }

          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }
    },
    [apiFunction, onSuccess, onError, retryCount, retryDelay]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Example usage:
// const api = useApi(fetchData, {
//   onSuccess: (data) => console.log('Success:', data),
//   onError: (error) => console.error('Error:', error),
//   retryCount: 3,
//   retryDelay: 1000,
// });
//
// try {
//   await api.execute(params);
// } catch (error) {
//   // Handle error
// } 