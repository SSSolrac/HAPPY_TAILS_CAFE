import { apiClient } from './client';
import { asRecord, unwrapArray, unwrapObject } from './response';
import type { DailyMenu, DailyMenuItem } from '@/types/dailyMenu';
import type { MenuItem } from '@/types/menuItem';

const mapMenuItem = (raw: unknown): MenuItem => {
  const row = asRecord(raw) ?? {};

  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? row.item_name ?? ''),
    categoryId: String(row.categoryId ?? row.category_id ?? ''),
    description: row.description ? String(row.description) : '',
    price: Number(row.price ?? 0),
    isAvailable: Boolean(row.isAvailable ?? row.is_available ?? true),
    imageUrl: row.imageUrl ? String(row.imageUrl) : row.image_url ? String(row.image_url) : '',
    createdAt: String(row.createdAt ?? row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updatedAt ?? row.updated_at ?? row.createdAt ?? row.created_at ?? new Date().toISOString()),
  };
};

const mapDailyMenuItem = (raw: unknown, index: number, dailyMenuId: string): DailyMenuItem => {
  const row = asRecord(raw) ?? {};
  return {
    id: String(row.id ?? `${dailyMenuId}-item-${index + 1}`),
    dailyMenuId: String(row.dailyMenuId ?? row.daily_menu_id ?? dailyMenuId),
    menuItemId: String(row.menuItemId ?? row.menu_item_id ?? ''),
    isAvailable: Boolean(row.isAvailable ?? row.is_available ?? true),
    sortOrder: Number(row.sortOrder ?? row.sort_order ?? index + 1),
  };
};

const mapDailyMenu = (raw: unknown): DailyMenu => {
  const row = asRecord(raw) ?? {};
  const id = String(row.id ?? '');
  const rawItems = row.items ?? row.dailyMenuItems ?? row.daily_menu_items;

  return {
    id,
    menuDate: String(row.menuDate ?? row.menu_date ?? new Date().toISOString().slice(0, 10)),
    isPublished: Boolean(row.isPublished ?? row.is_published ?? false),
    createdAt: String(row.createdAt ?? row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updatedAt ?? row.updated_at ?? row.createdAt ?? row.created_at ?? new Date().toISOString()),
    items: Array.isArray(rawItems) ? rawItems.map((item, index) => mapDailyMenuItem(item, index, id)) : [],
  };
};

const toDailyMenu = (payload: unknown): DailyMenu => {
  const single = unwrapObject<unknown>(payload);
  if (single) return mapDailyMenu(single);

  const list = unwrapArray<unknown>(payload);
  if (list.length > 0) return mapDailyMenu(list[0]);

  return {
    id: '',
    menuDate: new Date().toISOString().slice(0, 10),
    isPublished: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    items: [],
  };
};

export const menuApi = {
  async listMenuItems(): Promise<MenuItem[]> {
    const payload = await apiClient.get<unknown>('/api/menu');
    return unwrapArray<unknown>(payload).map(mapMenuItem);
  },

  async saveMenuItem(item: MenuItem): Promise<MenuItem> {
    const payload = item.id
      ? await apiClient.put<unknown>(`/api/menu/${item.id}`, item)
      : await apiClient.post<unknown>('/api/menu', item);

    const row = unwrapObject<unknown>(payload);
    return mapMenuItem(row ?? payload);
  },

  async deleteMenuItem(itemId: string): Promise<void> {
    return apiClient.delete(`/api/menu/${itemId}`);
  },

  async getDailyMenu(): Promise<DailyMenu> {
    const payload = await apiClient.get<unknown>('/api/menu/daily');
    return toDailyMenu(payload);
  },

  async saveDailyMenu(menu: DailyMenu): Promise<DailyMenu> {
    const payload = await apiClient.put<unknown>('/api/menu/daily', menu);
    return toDailyMenu(payload);
  },

  async publishDailyMenu(menu: DailyMenu): Promise<DailyMenu> {
    const payload = await apiClient.post<unknown>('/api/menu/daily/publish', menu);
    return toDailyMenu(payload);
  },

  async unpublishDailyMenu(): Promise<DailyMenu> {
    const payload = await apiClient.post<unknown>('/api/menu/daily/unpublish');
    return toDailyMenu(payload);
  },

  async clearDailyMenu(): Promise<DailyMenu> {
    const payload = await apiClient.post<unknown>('/api/menu/daily/clear');
    return toDailyMenu(payload);
  },
};
