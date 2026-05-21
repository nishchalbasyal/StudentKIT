import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { API_BASE_URL, REQUEST_TIMEOUT_MS } from "../constants/config";
import { useAuthStore } from "../store/authStore";
import type { AuthResponse } from "../types/auth.types";

type ApiEnvelope<T> = {
  data: T;
};

type ApiErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json"
  }
});

let refreshSessionPromise: Promise<AuthResponse> | null = null;

async function refreshSession(refreshToken: string) {
  refreshSessionPromise ??= axios
    .post<ApiEnvelope<AuthResponse>>(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      {
        headers: { "Content-Type": "application/json" },
        timeout: REQUEST_TIMEOUT_MS
      }
    )
    .then((response) => response.data.data)
    .finally(() => {
      refreshSessionPromise = null;
    });

  return refreshSessionPromise;
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorEnvelope>) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const requestUrl = originalRequest?.url ?? "";
    const canRefresh =
      !requestUrl.includes("/auth/login") &&
      !requestUrl.includes("/auth/register") &&
      !requestUrl.includes("/auth/refresh");

    if (error.response?.status === 401 && originalRequest?._retry) {
      await useAuthStore.getState().logout();
    }

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && canRefresh) {
      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        originalRequest._retry = true;

        try {
          const session = await refreshSession(refreshToken);
          await useAuthStore.getState().login(session);
          originalRequest.headers.Authorization = `Bearer ${session.tokens.accessToken}`;

          return apiClient(originalRequest);
        } catch {
          await useAuthStore.getState().logout();
        }
      } else {
        await useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);

export function unwrap<T>(response: { data: ApiEnvelope<T> }) {
  return response.data.data;
}

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError<ApiErrorEnvelope>(error)) {
    if (!error.response) {
      return `Cannot reach the API at ${API_BASE_URL}. Make sure the server is running and your device can access that address.`;
    }

    return (
      error.response?.data.error?.message ??
      error.message ??
      "Server unavailable. Check your internet connection."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}
