export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export type DiscountType = 'percentage';

export type MenuItemDiscount = {
  type: DiscountType;
  value: number;
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
};

export type MenuItem = {
  id: string;
  categoryId?: string | null;
  name: string;
  description?: string | null;
  price: number;
  isAvailable: boolean;
  imageUrl?: string | null;
  stock: number;
  lowStockThreshold: number;
  inventoryStatus: InventoryStatus;
  discount?: MenuItemDiscount | null;
  createdAt: string;
  updatedAt: string;
};

export type MenuCategory = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
