import type { DailyMenu } from '@/types/dailyMenu';

const withLatency = async <T>(value: T): Promise<T> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return value;
};

let dailyMenuStore: DailyMenu = {
  id: 'menu-today-001',
  title: 'Menu of the Day',
  subtitle: 'Freshly prepared specials for today',
  mode: 'manual',
  isActive: false,
  categories: [
    { id: 'cat-pasta', name: 'Pasta', items: [{ id: 'item-carbonara', name: 'Creamy Carbonara' }] },
    { id: 'cat-sandwich', name: 'Sandwiches', items: [{ id: 'item-club', name: 'Cafe Club Sandwich' }] },
  ],
  updatedAt: new Date().toISOString(),
};

export const dailyMenuService = {
  async getCurrentDailyMenu(): Promise<DailyMenu> {
    // TODO(daily-menu-api): replace with GET /api/daily-menu/current when shared backend is available.
    return withLatency(structuredClone(dailyMenuStore));
  },

  async saveDailyMenu(menu: DailyMenu): Promise<DailyMenu> {
    const next = { ...menu, isActive: false, updatedAt: new Date().toISOString() };
    dailyMenuStore = structuredClone(next);

    // TODO(daily-menu-api): replace with POST /api/daily-menu or PUT /api/daily-menu/:id.
    return withLatency(structuredClone(dailyMenuStore));
  },

  async publishDailyMenu(menu: DailyMenu): Promise<DailyMenu> {
    const next = { ...menu, isActive: true, updatedAt: new Date().toISOString() };
    dailyMenuStore = structuredClone(next);

    // TODO(daily-menu-api): replace with endpoint that atomically saves and publishes menu.
    return withLatency(structuredClone(dailyMenuStore));
  },

  async unpublishDailyMenu(): Promise<DailyMenu> {
    dailyMenuStore = { ...dailyMenuStore, isActive: false, updatedAt: new Date().toISOString() };

    // TODO(daily-menu-api): replace with endpoint for unpublishing current daily menu.
    return withLatency(structuredClone(dailyMenuStore));
  },

  async clearDailyMenu(): Promise<DailyMenu> {
    dailyMenuStore = {
      ...dailyMenuStore,
      isActive: false,
      categories: [],
      updatedAt: new Date().toISOString(),
    };

    // TODO(daily-menu-api): replace with endpoint for clearing draft/current menu.
    return withLatency(structuredClone(dailyMenuStore));
  },
};
