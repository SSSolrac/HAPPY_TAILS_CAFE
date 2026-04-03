import { apiClient } from './client';
import { asRecord, unwrapDataArray, unwrapDataObject } from './response';
import type { DailyMenu, DailyMenuItem } from '@/types/dailyMenu';
import type { MenuItem } from '@/types/menuItem';
import { clampStockValue, clampThresholdValue, computeInventoryStatus } from '@/utils/inventory';

const mapMenuItem = (raw: unknown): MenuItem => {
  const row = asRecord(raw) ?? {};
  const stock = clampStockValue(Number(row.stock ?? 0));
  const lowStockThreshold = clampThresholdValue(Number(row.lowStockThreshold ?? 5));
  const discount = Number(row.discount ?? 0);

  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    categoryId: String(row.categoryId ?? ''),
    description: row.description ? String(row.description) : '',
    price: Number(row.price ?? 0),
    isAvailable: Boolean(row.isAvailable ?? true),
    imageUrl: row.imageUrl ? String(row.imageUrl) : null,
    stock,
    lowStockThreshold,
    inventoryStatus: computeInventoryStatus(stock, lowStockThreshold),
    discount,
    createdAt: String(row.createdAt ?? new Date().toISOString()),
    updatedAt: String(row.updatedAt ?? row.createdAt ?? new Date().toISOString()),
  };
};

const mapDailyMenuItem = (raw: unknown, index: number): DailyMenuItem => {
  const row = asRecord(raw) ?? {};
  return {
    id: String(row.id ?? `dmi-${index + 1}`),
    menuItemId: String(row.menuItemId ?? ''),
    name: String(row.name ?? ''),
    price: Number(row.price ?? 0),
    categoryId: String(row.categoryId ?? ''),
    isAvailable: Boolean(row.isAvailable ?? true),
  };
};

const mapDailyMenu = (raw: unknown): DailyMenu => {
  const row = asRecord(raw) ?? {};
  const items = Array.isArray(row.items) ? row.items.map(mapDailyMenuItem) : [];
  return {
    id: String(row.id ?? ''),
    menuDate: String(row.menuDate ?? new Date().toISOString().slice(0, 10)),
    isPublished: Boolean(row.isPublished ?? false),
    createdAt: String(row.createdAt ?? new Date().toISOString()),
    updatedAt: String(row.updatedAt ?? row.createdAt ?? new Date().toISOString()),
    items,
  };
};

export const menuApi = {
  async listMenuItems(): Promise<MenuItem[]> {
    const payload = await apiClient.get<unknown>('/api/menu');
    return unwrapDataArray<unknown>(payload).map(mapMenuItem);
  },

  async saveMenuItem(item: MenuItem): Promise<MenuItem> {
    const payload = item.id
      ? await apiClient.put<unknown>(`/api/menu/${item.id}`, item)
      : await apiClient.post<unknown>('/api/menu', item);
    return mapMenuItem(unwrapDataObject<unknown>(payload));
  },

  async deleteMenuItem(itemId: string): Promise<void> {
    return apiClient.delete(`/api/menu/${itemId}`);
  },

  async getDailyMenu(): Promise<DailyMenu> {
    const payload = await apiClient.get<unknown>('/api/menu/daily');
    return mapDailyMenu(unwrapDataObject<unknown>(payload));
  },

  async saveDailyMenu(menu: DailyMenu): Promise<DailyMenu> {
    const payload = await apiClient.put<unknown>('/api/menu/daily', menu);
    return mapDailyMenu(unwrapDataObject<unknown>(payload));
  },

  async publishDailyMenu(): Promise<DailyMenu> {
    const payload = await apiClient.post<unknown>('/api/menu/daily/publish');
    return mapDailyMenu(unwrapDataObject<unknown>(payload));
  },

  async unpublishDailyMenu(): Promise<DailyMenu> {
    const payload = await apiClient.post<unknown>('/api/menu/daily/unpublish');
    return mapDailyMenu(unwrapDataObject<unknown>(payload));
  },

  async clearDailyMenu(): Promise<DailyMenu> {
    const payload = await apiClient.post<unknown>('/api/menu/daily/clear');
    return mapDailyMenu(unwrapDataObject<unknown>(payload));
  },
};
