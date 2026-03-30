import { menuApi } from '@/api/menu';
import type { DailyMenu } from '@/types/dailyMenu';

export const dailyMenuService = {
  async getCurrentDailyMenu(): Promise<DailyMenu> {
    return menuApi.getDailyMenu();
  },

  async saveDailyMenu(menu: DailyMenu): Promise<DailyMenu> {
    return menuApi.saveDailyMenu(menu);
  },

  async publishDailyMenu(menu: DailyMenu): Promise<DailyMenu> {
    return menuApi.publishDailyMenu(menu);
  },

  async unpublishDailyMenu(): Promise<DailyMenu> {
    return menuApi.unpublishDailyMenu();
  },

  async clearDailyMenu(): Promise<DailyMenu> {
    return menuApi.clearDailyMenu();
  },
};
