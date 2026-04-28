/**
 * API Client for Usrah Mobile App
 * Handles all HTTP requests with auth, retry, and error handling
 */
import { API_CONFIG, ENDPOINTS, RequestOptions, ApiError } from './config';
import { tokenStorage } from '../auth/tokenStorage';

// Request state for deduplication
interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

// Cache entry
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

/**
 * API Client Class
 */
class ApiClient {
  private baseUrl: string;
  private pending: Map<string, PendingRequest> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
  }

  /**
   * Generate cache key from request
   */
  private getCacheKey(endpoint: string, options?: RequestOptions): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${endpoint}:${body}`;
  }

  /**
   * Check and return cached response
   */
  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Store response in cache
   */
  private setCache(key: string, data: any, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshToken(): Promise<boolean> {
    // If already refreshing, wait for the existing refresh
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this._doRefreshToken();

    try {
      return await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async _doRefreshToken(): Promise<boolean> {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${this.baseUrl}${ENDPOINTS.auth.refresh}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        // Refresh failed, clear tokens
        await tokenStorage.clearAll();
        return false;
      }

      const data = await response.json();
      await tokenStorage.setTokens(data.access, data.refresh || refreshToken);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      await tokenStorage.clearAll();
      return false;
    }
  }

  /**
   * Sleep helper for retry delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make an API request
   */
  async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = API_CONFIG.timeout,
      retries = API_CONFIG.retries,
      skipAuth = false,
      cache = false,
      dedupe = true,
    } = options;

    const cacheKey = this.getCacheKey(endpoint, options);

    // Check cache for GET requests
    if (cache && method === 'GET') {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }

    // Check for duplicate pending requests
    if (dedupe && method === 'GET') {
      const pendingReq = this.pending.get(cacheKey);
      if (pendingReq && Date.now() - pendingReq.timestamp < 5000) {
        return pendingReq.promise;
      }
    }

    // Build request
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers,
    };

    // Add auth token if not skipping auth
    if (!skipAuth) {
      const accessToken = await tokenStorage.getAccessToken();
      if (accessToken) {
        requestHeaders['Authorization'] = `Bearer ${accessToken}`;
      }
    }

    const url = `${this.baseUrl}${endpoint}`;

    const fetchOptions: globalThis.RequestInit = {
      method,
      headers: requestHeaders,
    };

    if (body && method !== 'GET') {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    fetchOptions.signal = controller.signal;

    // Execute request with retry logic
    const executeRequest = async (attempt: number = 0): Promise<T> => {
      try {
        const response = await fetch(url, fetchOptions);

        // Handle 401 - try to refresh token
        if (response.status === 401 && !skipAuth) {
          const refreshed = await this.refreshToken();
          if (refreshed && attempt < retries) {
            // Retry with new token
            const newToken = await tokenStorage.getAccessToken();
            requestHeaders['Authorization'] = `Bearer ${newToken}`;
            return executeRequest(attempt + 1);
          }
          // Token refresh failed
          throw this.createError(401, 'Session expired. Please login again.');
        }

        // Handle rate limiting
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('Retry-After') || '5');
          if (attempt < retries) {
            await this.sleep(retryAfter * 1000);
            return executeRequest(attempt + 1);
          }
          throw this.createError(429, 'Too many requests. Please try again later.');
        }

        // Handle server errors with retry
        if (response.status >= 500 && attempt < retries) {
          const delay = API_CONFIG.retryDelay * Math.pow(2, attempt);
          await this.sleep(delay);
          return executeRequest(attempt + 1);
        }

        // Parse response
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw this.createError(
            response.status,
            data.detail || data.message || data.error || 'Request failed',
            data
          );
        }

        // Cache successful GET responses
        if (cache && method === 'GET') {
          this.setCache(cacheKey, data);
        }

        return data as T;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw this.createError(0, 'Request timeout');
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
      }
    };

    // Store pending request for deduplication
    const requestPromise = executeRequest();
    if (dedupe && method === 'GET') {
      this.pending.set(cacheKey, {
        promise: requestPromise,
        timestamp: Date.now(),
      });

      requestPromise.finally(() => {
        // Clean up after 5 seconds
        setTimeout(() => this.pending.delete(cacheKey), 5000);
      });
    }

    return requestPromise;
  }

  /**
   * Create standardized error
   */
  private createError(status: number, message: string, details?: any): ApiError {
    const error: ApiError = {
      status,
      message,
    };
    if (details?.code) error.code = details.code;
    if (details?.details) error.details = details.details;
    return error;
  }

  // Convenience methods

  async get<T>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  async put<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body });
  }

  async patch<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Upload file with multipart form data
   */
  async uploadFile<T>(
    endpoint: string,
    formData: FormData,
    options: Omit<RequestOptions, 'body'> = {}
  ): Promise<T> {
    const { skipAuth = false, timeout = 60000 } = options;

    const headers: Record<string, string> = {};

    if (!skipAuth) {
      const accessToken = await tokenStorage.getAccessToken();
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw this.createError(
          response.status,
          data.detail || data.message || 'Upload failed',
          data
        );
      }

      return data as T;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw this.createError(0, 'Upload timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Also export class for testing
export { ApiClient };
