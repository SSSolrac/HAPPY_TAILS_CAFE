export type DailyMenuItem = {
  id: string;
  name: string;
  description?: string;
};

export type DailyMenuCategory = {
  id: string;
  name: string;
  items: DailyMenuItem[];
};

export type DailyMenuMode = 'manual' | 'date-based';

export type DailyMenu = {
  id: string;
  title: string;
  subtitle: string;
  date?: string;
  isActive: boolean;
  mode: DailyMenuMode;
  categories: DailyMenuCategory[];
  updatedAt: string;
};
