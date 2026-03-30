const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

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
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = (payload && typeof payload === 'object' && 'message' in payload ? String(payload.message) : response.statusText) || 'Request failed';
    throw new ApiError(message, response.status);
  }

  return payload as T;
};

export const apiClient = {
  async get<T>(path: string, query?: Record<string, string | number | undefined>, init?: RequestInit): Promise<T> {
    const response = await fetch(buildUrl(path, query), {
      method: 'GET',
      headers: { Accept: 'application/json', ...(init?.headers ?? {}) },
      ...init,
    });
    return parseResponse<T>(response);
  },

  async post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    const response = await fetch(buildUrl(path), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(init?.headers ?? {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
      ...init,
    });
    return parseResponse<T>(response);
  },

  async put<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    const response = await fetch(buildUrl(path), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(init?.headers ?? {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
      ...init,
    });
    return parseResponse<T>(response);
  },

  async patch<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    const response = await fetch(buildUrl(path), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(init?.headers ?? {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
      ...init,
    });
    return parseResponse<T>(response);
  },

  async delete(path: string, init?: RequestInit): Promise<void> {
    const response = await fetch(buildUrl(path), {
      method: 'DELETE',
      headers: { Accept: 'application/json', ...(init?.headers ?? {}) },
      ...init,
    });

    if (!response.ok) {
      throw new ApiError(response.statusText || 'Request failed', response.status);
    }
  },
};
