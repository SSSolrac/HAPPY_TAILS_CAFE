import { apiClient } from './client';
import type { DailyMenu } from '@/types/dailyMenu';
import type { MenuItem } from '@/types/menuItem';

export const menuApi = {
  async listMenuItems(): Promise<MenuItem[]> {
    return apiClient.get<MenuItem[]>('/api/menu');
  },

  async saveMenuItem(item: MenuItem): Promise<MenuItem> {
    if (item.id) return apiClient.put<MenuItem>(`/api/menu/${item.id}`, item);
    return apiClient.post<MenuItem>('/api/menu', item);
  },

  async deleteMenuItem(itemId: string): Promise<void> {
    return apiClient.delete(`/api/menu/${itemId}`);
  },

  async getDailyMenu(): Promise<DailyMenu> {
    return apiClient.get<DailyMenu>('/api/menu/daily');
  },

  async saveDailyMenu(menu: DailyMenu): Promise<DailyMenu> {
    return apiClient.put<DailyMenu>('/api/menu/daily', menu);
  },

  async publishDailyMenu(menu: DailyMenu): Promise<DailyMenu> {
    return apiClient.post<DailyMenu>('/api/menu/daily/publish', menu);
  },

  async unpublishDailyMenu(): Promise<DailyMenu> {
    return apiClient.post<DailyMenu>('/api/menu/daily/unpublish');
  },

  async clearDailyMenu(): Promise<DailyMenu> {
    return apiClient.post<DailyMenu>('/api/menu/daily/clear');
  },
};
