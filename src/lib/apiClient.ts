import { QueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

interface RequestConfig extends RequestInit {
  retries?: number;
  retryDelay?: number;
}

interface ApiError extends Error {
  status?: number;
  data?: any;
}

class ApiClient {
  private baseUrl: string;
  private defaultConfig: RequestConfig;
  private queryClient: QueryClient;
  private offlineQueue: Array<{ request: Request; resolve: Function; reject: Function }> = [];

  constructor(baseUrl: string = '/api', queryClient: QueryClient) {
    this.baseUrl = baseUrl;
    this.queryClient = queryClient;
    this.defaultConfig = {
      retries: 3,
      retryDelay: 1000,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.processOfflineQueue.bind(this));
      window.addEventListener('offline', () => {
        toast({
          title: 'You are offline',
          description: 'Some features may be limited until connection is restored.',
          variant: 'destructive',
        });
      });
    }
  }

  private async processOfflineQueue() {
    toast({
      title: 'Back online',
      description: 'Processing pending requests...',
    });

    while (this.offlineQueue.length > 0) {
      const { request, resolve, reject } = this.offlineQueue.shift()!;
      try {
        const response = await fetch(request);
        resolve(response);
      } catch (error) {
        reject(error);
      }
    }
  }

  private async handleResponse(response: Response) {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const error: ApiError = new Error(data.message || 'An error occurred');
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  }

  private async retryRequest(
    url: string,
    config: RequestConfig,
    attempt: number = 1
  ): Promise<any> {
    try {
      const response = await fetch(url, config);
      return await this.handleResponse(response);
    } catch (error: any) {
      const maxRetries = config.retries || this.defaultConfig.retries;
      const delay = config.retryDelay || this.defaultConfig.retryDelay;

      if (
        attempt < maxRetries! && 
        (error.status === 429 || error.status === 503 || error.status === 408)
      ) {
        await new Promise(resolve => setTimeout(resolve, delay! * attempt));
        return this.retryRequest(url, config, attempt + 1);
      }

      // If offline, queue the request
      if (!navigator.onLine) {
        return new Promise((resolve, reject) => {
          this.offlineQueue.push({
            request: new Request(url, config),
            resolve,
            reject,
          });
        });
      }

      throw error;
    }
  }

  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const finalConfig = {
      ...this.defaultConfig,
      ...config,
      headers: {
        ...this.defaultConfig.headers,
        ...config.headers,
        // Add auth token if available
        ...(localStorage.getItem('authToken') && {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        }),
      },
    };

    try {
      return await this.retryRequest(url, finalConfig);
    } catch (error: any) {
      // Handle specific error types
      if (error.status === 401) {
        // Clear invalid auth token
        localStorage.removeItem('authToken');
        // Invalidate all queries
        this.queryClient.invalidateQueries();
      }

      // Show user-friendly error message
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });

      throw error;
    }
  }

  // Convenience methods
  async get<T>(endpoint: string, config: RequestConfig = {}) {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T>(endpoint: string, data: any, config: RequestConfig = {}) {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any, config: RequestConfig = {}) {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, config: RequestConfig = {}) {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  async patch<T>(endpoint: string, data: any, config: RequestConfig = {}) {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export default ApiClient; 