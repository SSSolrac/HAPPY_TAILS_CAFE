import { menuApi } from '@/api/menu';
import type { MenuItem } from '@/types/menuItem';

export const menuService = {
  async getMenuItems(): Promise<MenuItem[]> {
    return menuApi.listMenuItems();
  },

  async saveMenuItem(item: MenuItem): Promise<MenuItem> {
    return menuApi.saveMenuItem(item);
  },

  async deleteMenuItem(itemId: string): Promise<void> {
    await menuApi.deleteMenuItem(itemId);
  },
};
