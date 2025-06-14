// Enhanced API request utility with retry logic and error handling
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export async function apiRequest<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  body?: any,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem('token');
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(endpoint, config);
    
    // Handle network errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error(`API Request failed: ${method} ${endpoint}`, error);
    throw error;
  }
}

// Enhanced version with retry logic and exponential backoff
export async function apiRequestWithRetry<T = any>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  body?: any,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<ApiResponse<T>> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await apiRequest(method, endpoint, body);
      const data = await response.json();
      
      return {
        success: true,
        data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }
  
  return {
    success: false,
    error: lastError!.message,
    timestamp: new Date().toISOString()
  };
}

// Simple request wrapper for backwards compatibility
export async function simpleApiRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  endpoint: string,
  body?: any
): Promise<any> {
  const response = await apiRequest(method, endpoint, body);
  return response.json();
}