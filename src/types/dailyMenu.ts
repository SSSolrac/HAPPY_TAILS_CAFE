export type DailyMenuItem = {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  categoryId: string;
  isAvailable: boolean;
};

export type DailyMenu = {
  id: string;
  menuDate: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  items: DailyMenuItem[];
};
