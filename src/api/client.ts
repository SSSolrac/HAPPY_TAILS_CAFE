import { mockApi } from './mockApi';

const resolveApiBaseUrl = () => {
  const env = import.meta.env as Record<string, string | undefined>;
  const configured = env.VITE_API_BASE_URL ?? env.VITE_BACKEND_URL ?? env.VITE_API_URL;
  return configured?.replace(/\/$/, '') ?? '';
};

const API_BASE_URL = resolveApiBaseUrl();
const USE_MOCK_API = (() => {
  const env = import.meta.env as Record<string, string | boolean | undefined>;
  const explicit = env.VITE_USE_MOCK_API;
  if (explicit === true || explicit === 'true') return true;
  if (explicit === false || explicit === 'false') return false;
  return import.meta.env.DEV && !API_BASE_URL;
})();

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const buildUrl = (path: string, query?: Record<string, string | number | undefined>) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`, window.location.origin);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === '') return;
      url.searchParams.set(key, String(value));
    });
  }

  return API_BASE_URL ? url.toString() : `${url.pathname}${url.search}`;
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const payloadMessage = payload && typeof payload === 'object' && 'message' in payload
      ? String((payload as { message: unknown }).message)
      : typeof payload === 'string'
        ? payload
        : response.statusText;

    throw new ApiError(payloadMessage || 'Request failed', response.status);
  }

  return payload as T;
};

const SESSION_KEY = 'staffowner_session';

const getSessionToken = () => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return '';
    const session = JSON.parse(raw) as { token?: unknown };
    return typeof session.token === 'string' ? session.token : '';
  } catch {
    return '';
  }
};

const makeHeaders = (initHeaders: HeadersInit | undefined, extra: Record<string, string>) => {
  const headers = new Headers(initHeaders);
  Object.entries(extra).forEach(([key, value]) => headers.set(key, value));
  const token = getSessionToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return headers;
};

export const apiClient = {
  async get<T>(path: string, query?: Record<string, string | number | undefined>, init?: RequestInit): Promise<T> {
    if (USE_MOCK_API) return mockApi.request<T>('GET', path, query);
    const response = await fetch(buildUrl(path, query), {
      ...init,
      method: 'GET',
      headers: makeHeaders(init?.headers, { Accept: 'application/json' }),
    });
    return parseResponse<T>(response);
  },

  async post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    if (USE_MOCK_API) return mockApi.request<T>('POST', path, undefined, body);
    const response = await fetch(buildUrl(path), {
      body: body === undefined ? undefined : JSON.stringify(body),
      ...init,
      method: 'POST',
      headers: makeHeaders(init?.headers, { 'Content-Type': 'application/json', Accept: 'application/json' }),
    });
    return parseResponse<T>(response);
  },

  async put<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    if (USE_MOCK_API) return mockApi.request<T>('PUT', path, undefined, body);
    const response = await fetch(buildUrl(path), {
      body: body === undefined ? undefined : JSON.stringify(body),
      ...init,
      method: 'PUT',
      headers: makeHeaders(init?.headers, { 'Content-Type': 'application/json', Accept: 'application/json' }),
    });
    return parseResponse<T>(response);
  },

  async patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    if (USE_MOCK_API) return mockApi.request<T>('PATCH', path, undefined, body);
    const response = await fetch(buildUrl(path), {
      body: body === undefined ? undefined : JSON.stringify(body),
      ...init,
      method: 'PATCH',
      headers: makeHeaders(init?.headers, { 'Content-Type': 'application/json', Accept: 'application/json' }),
    });
    return parseResponse<T>(response);
  },

  async delete(path: string, init?: RequestInit): Promise<void> {
    if (USE_MOCK_API) {
      await mockApi.request<void>('DELETE', path);
      return;
    }
    const response = await fetch(buildUrl(path), {
      ...init,
      method: 'DELETE',
      headers: makeHeaders(init?.headers, { Accept: 'application/json' }),
    });

    if (!response.ok) {
      throw new ApiError(response.statusText || 'Request failed', response.status);
    }
  },
};
