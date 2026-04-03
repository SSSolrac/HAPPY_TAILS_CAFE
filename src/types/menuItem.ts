export type InventoryStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export type MenuItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  isAvailable: boolean;
  imageUrl: string | null;
  stock: number;
  lowStockThreshold: number;
  inventoryStatus: InventoryStatus;
  discount: number;
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
