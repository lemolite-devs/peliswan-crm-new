// ---------------------------------------------------------------------------
// One axios instance for the whole v2 app — talks to the SAME Fastify back-end
// as v1, with the same Bearer token. No back-end changes are needed.
// ---------------------------------------------------------------------------
import axios, { AxiosError } from 'axios';
import { API_BASE_URL, TOKEN_COOKIE } from './config';
import { getCookie } from './storage';

export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = getCookie(TOKEN_COOKIE);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Called when the back-end says the session is no longer valid.
let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void): void {
  onUnauthorized = fn;
}

api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const url = error.config?.url ?? '';
    if (error.response?.status === 401 && !url.includes('/api/login')) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/** Turn any back-end error shape into one readable sentence. */
export function apiErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; error?: string; errors?: string[] }
      | undefined;
    if (data?.errors?.length) return data.errors.join(' ');
    if (data?.message && data.message !== 'Internal Server Error') return data.message;
    if (data?.error) return data.error;
    if (err.response?.status === 403) return 'You do not have permission to do that.';
    if (!err.response) return 'Cannot reach the server. Is the back-end running?';
  }
  return fallback;
}
