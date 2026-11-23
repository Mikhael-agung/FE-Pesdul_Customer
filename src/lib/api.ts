import axios from 'axios';

export const TOKEN_KEY = 'pesduls_token';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((c) => {
  const t = localStorage.getItem(TOKEN_KEY);
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});

api.interceptors.response.use(
  (r) => r,
  (e) => {
    const isAuthCall = String(e.config?.url ?? '').startsWith('/auth/');
    if (e.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(e);
  },
);

export type ApiError = {
  message: string;
  code?: string;
  errors?: Record<string, string[]>;
};

export function parseError(e: unknown): ApiError {
  if (axios.isAxiosError(e) && e.response?.data?.message) {
    return e.response.data as ApiError;
  }
  return { message: 'Tidak bisa terhubung ke server.' };
}
