export type ApiDataResponse<T> = { data: T };

export const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

export const unwrapData = <T>(payload: unknown): T => {
  const obj = asRecord(payload);
  if (!obj || !('data' in obj)) throw new Error('Expected API response shape { data: ... }.');
  return obj.data as T;
};

export const unwrapDataArray = <T>(payload: unknown): T[] => {
  const data = unwrapData<unknown>(payload);
  if (!Array.isArray(data)) throw new Error('Expected API response shape { data: [...] }.');
  return data as T[];
};

export const unwrapDataObject = <T>(payload: unknown): T => {
  const data = unwrapData<unknown>(payload);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Expected API response shape { data: {...} }.');
  return data as T;
};
