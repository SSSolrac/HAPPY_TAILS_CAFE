import type { Order } from './order';

export type DateRangePreset = 'today' | '7d' | '30d' | '90d';

export type Alert = {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error';
};

export type DashboardData = {
  sales: {
    today: number;
    rangeTotal: number;
    averageOrderValue: number;
  };
  orders: {
    today: number;
    rangeTotal: number;
    pending: number;
    preparing: number;
    ready: number;
    outForDelivery: number;
    completed: number;
    cancelled: number;
  };
  topItems: Array<{
    itemName: string;
    quantity: number;
    revenue: number;
  }>;
  recentOrders: Order[];
  alerts: Alert[];
};

export type TrendPoint = {
  label: string;
  sales: number;
};

export type SalesImportMergeResult = {
  added: number;
  updated: number;
  skipped: number;
  affectedDateRange?: {
    start: string;
    end: string;
  };
};

export type CsvImportType = 'orders' | 'customers' | 'menu-items' | 'sales';

export type CsvValidationResult = {
  validRows: Record<string, string>[];
  invalidRows: Array<{ rowNumber: number; reason: string; row: Record<string, string> }>;
};
