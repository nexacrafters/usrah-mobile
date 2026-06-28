/**
 * API Client
 * Axios instance with interceptors for authentication + token refresh.
 */

import axios, {AxiosError, AxiosInstance, AxiosRequestConfig} from 'axios';
import {Platform} from 'react-native';
import {useAuthStore} from '../../store/authStore';

/**
 * Resolve the API base URL.
 * - Android emulator reaches the host machine via 10.0.2.2 (not localhost).
 * - iOS simulator can use localhost.
 * - Production points at the deployed API.
 *
 * Override at runtime by setting EXPO_PUBLIC_API_URL / a build-time constant
 * if you run the API on a different host (e.g. a physical device on LAN).
 */
// Use localhost on both platforms and rely on `adb reverse tcp:8000 tcp:<port>`
// to route the device's localhost:8000 to the host API. This avoids depending
// on 10.0.2.2 (the host loopback) when other services occupy host port 8000.
const DEV_HOST = 'localhost';

export const API_BASE_URL = __DEV__
  ? `http://${DEV_HOST}:8000/api`
  : 'https://usrah-api.nexacrafters.com/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor - attach access token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// --- Token refresh handling -------------------------------------------------
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

const flushQueue = (token: string | null) => {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & {_retry?: boolean}) | undefined;
    const status = error.response?.status;

    // Attempt one transparent refresh on 401
    if (status === 401 && original && !original._retry) {
      const {refreshToken, setToken, logout} = useAuthStore.getState();

      if (!refreshToken) {
        logout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue until the in-flight refresh resolves
        return new Promise((resolve, reject) => {
          pendingQueue.push((token) => {
            if (!token) {
              reject(error);
              return;
            }
            original._retry = true;
            original.headers = {...original.headers, Authorization: `Bearer ${token}`};
            resolve(apiClient(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;
      try {
        const resp = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
          refresh: refreshToken,
        });
        const newAccess: string = resp.data.access;
        setToken(newAccess);
        flushQueue(newAccess);
        original.headers = {...original.headers, Authorization: `Bearer ${newAccess}`};
        return apiClient(original);
      } catch (refreshErr) {
        flushQueue(null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status,
        data: error.response?.data,
      });
    }

    return Promise.reject(error);
  },
);

export default apiClient;

/**
 * Unwrap a DRF list response, which may be paginated ({count, results}) or a
 * bare array depending on the endpoint. Always returns an array.
 */
export function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && Array.isArray((data as {results?: unknown}).results)) {
    return (data as {results: T[]}).results;
  }
  return [];
}

/**
 * Normalize a DRF error payload into a human-readable string.
 * DRF returns either {detail: "..."}, {field: ["msg"]}, or {error: "..."}.
 */
export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Record<string, unknown> | undefined;
    if (data) {
      if (typeof data.detail === 'string') return data.detail;
      if (typeof data.error === 'string') return data.error;
      if (typeof data.message === 'string') return data.message;
      // First field error
      const firstKey = Object.keys(data)[0];
      if (firstKey) {
        const val = data[firstKey];
        if (Array.isArray(val) && val.length) return `${firstKey}: ${val[0]}`;
        if (typeof val === 'string') return val;
      }
    }
    return error.message;
  }
  return 'An unexpected error occurred';
};
