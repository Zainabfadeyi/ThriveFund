import type { ApiErrorResponse, ApiResponse, AuthTokens, PaginationMeta } from './types';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const ACCESS_KEY = 'thrivefund_access_token';
const REFRESH_KEY = 'thrivefund_refresh_token';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(tokens: AuthTokens) {
  localStorage.setItem(ACCESS_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://api.thrivefund.live/api/v1';

export const WS_BASE =
  process.env.NEXT_PUBLIC_WS_BASE_URL ??
  API_BASE.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:').replace(/\/api\/v1$/, '/ws');

type RequestOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
};

const REQUEST_TIMEOUT_MS = 10_000;

function buildUrl(path: string, params?: RequestOptions['params']) {
  const base = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  if (!params) return base;
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') qs.set(k, String(v));
  });
  const q = qs.toString();
  return q ? `${base}?${q}` : base;
}

export async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as ApiResponse<{ access_token: string; expires_in: number }>;
    localStorage.setItem(ACCESS_KEY, json.data.access_token);
    return json.data.access_token;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; meta?: PaginationMeta }> {
  const { params, skipAuth, headers: customHeaders, ...init } = options;
  const url = buildUrl(path, params);
  const signal = init.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS);

  const headers: Record<string, string> = {
    ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    ...(customHeaders as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res = await fetch(url, { ...init, headers, credentials: 'include', signal });

  if (res.status === 401 && !skipAuth) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers.Authorization = `Bearer ${newToken}`;
      res = await fetch(url, { ...init, headers, credentials: 'include', signal });
    }
  }

  if (res.status === 204) {
    return { data: undefined as T };
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('text/csv')) {
    const text = await res.text();
    return { data: text as T };
  }
  if (contentType.includes('application/pdf')) {
    const blob = await res.blob();
    return { data: blob as T };
  }

  const json = await res.json();

  if (!res.ok) {
    const err = json as ApiErrorResponse;
    throw new ApiError(
      res.status,
      err.error?.code ?? 'UNKNOWN',
      err.error?.message ?? 'Request failed',
      err.error?.details,
    );
  }

  const ok = json as ApiResponse<T>;
  return { data: ok.data, meta: ok.meta };
}
