import type { MenuItem } from '@/types/menuItem';

let menuItemsSeed: MenuItem[] = [
  { id: 'm1', name: 'Chicken Alfredo', category: 'Pasta', price: 13.5, isAvailable: true, isFeatured: true },
  { id: 'm2', name: 'Cafe Club Sandwich', category: 'Sandwiches', price: 9.75, isAvailable: true, isFeatured: false },
  { id: 'm3', name: 'Truffle Fries', category: 'Snacks', price: 6.25, isAvailable: false, isFeatured: true },
  { id: 'm4', name: 'Beef Rice Bowl', category: 'Rice Meals', price: 11.25, isAvailable: true, isFeatured: true },
];

const latency = async <T>(value: T): Promise<T> => {
  await new Promise((resolve) => setTimeout(resolve, 200));
  return value;
};

export const menuService = {
  async getMenuItems(): Promise<MenuItem[]> {
    return latency(menuItemsSeed.map((item) => ({ ...item })));
  },

  async saveMenuItem(item: MenuItem): Promise<MenuItem> {
    const exists = menuItemsSeed.some((row) => row.id === item.id);
    menuItemsSeed = exists ? menuItemsSeed.map((row) => (row.id === item.id ? item : row)) : [{ ...item }, ...menuItemsSeed];

    // TODO(menu-api): replace with POST/PUT menu item endpoints.
    return latency({ ...item });
  },

  async deleteMenuItem(itemId: string): Promise<void> {
    menuItemsSeed = menuItemsSeed.filter((item) => item.id !== itemId);

    // TODO(menu-api): replace with DELETE /api/menu-items/:id.
    await latency(undefined);
  },
};
