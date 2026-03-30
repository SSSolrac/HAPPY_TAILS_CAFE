export const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

export const unwrapArray = <T>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];

  const obj = asRecord(payload);
  if (!obj) return [];

  const candidates = [obj.data, obj.rows, obj.items, obj.results];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as T[];
  }

  return [];
};

export const unwrapObject = <T>(payload: unknown): T | null => {
  const obj = asRecord(payload);
  if (!obj) return null;

  const candidates = [obj.data, obj.item, obj.row, obj.result, obj.dailyMenu, obj.daily_menu];
  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) return candidate as T;
  }

  return obj as T;
};
