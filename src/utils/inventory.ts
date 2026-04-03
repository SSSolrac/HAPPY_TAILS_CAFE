import type { InventoryStatus } from '@/types/menuItem';

export const computeInventoryStatus = (stock: number, lowStockThreshold: number): InventoryStatus => {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= lowStockThreshold) return 'low_stock';
  return 'in_stock';
};

export const getInventoryStatusLabel = (status: InventoryStatus) => {
  if (status === 'out_of_stock') return 'Out of Stock';
  if (status === 'low_stock') return 'Low Stock';
  return 'In Stock';
};

export const clampStockValue = (value: number) => Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
export const clampThresholdValue = (value: number) => Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
