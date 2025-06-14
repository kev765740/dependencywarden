import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { secureStorage } from "./secureStorage";
import { csrfProtection } from "./inputSanitization";
import { apiCircuitBreaker } from "./retryLogic";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  return apiCircuitBreaker.execute(async () => {
    const token = secureStorage.getAuthToken();
    const headers: Record<string, string> = {
      ...(data ? { "Content-Type": "application/json" } : {}),
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    };

    // Add CSRF protection for state-changing operations
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
      try {
        const csrfToken = await csrfProtection.getToken();
        headers['X-CSRF-Token'] = csrfToken;
      } catch (error) {
        console.warn('CSRF token not available:', error);
      }
    }

    // Ensure API calls go to the correct base URL
    const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const fullUrl = url.startsWith('/api/') ? `${baseUrl}${url}` : url;

    const res = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  });
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    return apiCircuitBreaker.execute(async () => {
      const token = secureStorage.getAuthToken();
      const headers: Record<string, string> = {
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      };

      // Ensure API calls go to the correct base URL
      const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
      const url = queryKey[0] as string;
      const fullUrl = url.startsWith('/api/') ? `${baseUrl}${url}` : url;

      const res = await fetch(fullUrl, {
        credentials: "include",
        headers,
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        // Clear invalid credentials
        secureStorage.clear();
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    });
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && error.message.includes('4')) {
          return false;
        }
        // Retry up to 3 times for network/server errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations on client errors
        if (error instanceof Error && error.message.includes('4')) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: 1000,
    },
  },
});
