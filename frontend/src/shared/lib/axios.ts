import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, AuthData } from '@/shared/types/api.types';
import {
  isAccessTokenExpiringSoon,
  notifySessionExpired,
} from '@/shared/lib/auth-session';

const API_URL = import.meta.env.VITE_API_URL ?? '/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const refreshClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
}

export function clearAuth() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  notifySessionExpired();
}

function persistAuth(authData: AuthData) {
  localStorage.setItem('accessToken', authData.accessToken);
  localStorage.setItem('refreshToken', authData.refreshToken);
  localStorage.setItem('user', JSON.stringify(authData.user));
}

async function refreshAccessToken(): Promise<string> {
  const storedRefreshToken = localStorage.getItem('refreshToken');
  if (!storedRefreshToken) {
    throw new Error('Sin refresh token');
  }

  const { data } = await refreshClient.post<ApiResponse<AuthData>>('/auth/refresh', {
    refreshToken: storedRefreshToken,
  });

  persistAuth(data.data);
  return data.data.accessToken;
}

async function ensureFreshAccessToken(): Promise<string | null> {
  const currentToken = localStorage.getItem('accessToken');
  if (!currentToken) {
    return null;
  }

  if (!isAccessTokenExpiringSoon(currentToken)) {
    return currentToken;
  }

  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = refreshAccessToken()
    .catch((error) => {
      clearAuth();
      throw error;
    })
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });

  return refreshPromise;
}

apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await ensureFreshAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // La respuesta 401 del endpoint manejará el cierre de sesión.
  }

  if (config.data instanceof FormData) {
    if (typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
    } else {
      delete config.headers['Content-Type'];
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    if (!originalRequest || (status !== 401 && status !== 403) || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/auth/refresh')) {
      clearAuth();
      return Promise.reject(error);
    }

    const storedRefreshToken = localStorage.getItem('refreshToken');
    if (!storedRefreshToken) {
      clearAuth();
      return Promise.reject(error);
    }

    if (isRefreshing && refreshPromise) {
      return refreshPromise
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        })
        .catch((refreshError) => Promise.reject(refreshError));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      refreshPromise = refreshAccessToken();
      const newToken = await refreshPromise;
      processQueue(null, newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuth();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  },
);