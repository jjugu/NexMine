import axios from 'axios';
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/authStore';

export const axiosInstance = axios.create({
  baseURL: '/api',
});

// Request interceptor: attach JWT token
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Refresh token state
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

// Response interceptor: handle 401 with token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post('/api/Auth/refresh', {}, { withCredentials: true });
        const { accessToken, user } = response.data;

        if (accessToken && user) {
          useAuthStore.getState().setAuth(user, accessToken);
          processQueue(null, accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return axiosInstance(originalRequest);
        }

        throw new Error('Refresh failed');
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// orval custom instance (kept for generated code compatibility)
export function customInstance<T>(url: string, config?: RequestInit): Promise<T> {
  const axiosConfig: AxiosRequestConfig = {
    url,
    method: (config?.method as AxiosRequestConfig['method']) ?? 'GET',
    headers: config?.headers as Record<string, string>,
    data: config?.body,
    signal: config?.signal as AbortSignal,
  };
  return axiosInstance(axiosConfig).then(({ data }) => data);
}

export default axiosInstance;
