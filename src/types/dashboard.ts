import type { Order } from './order';

export type DateRangePreset = 'today' | '7d' | '30d' | '90d';

export type DashboardSummary = {
  sales: {
    today: number;
    rangeTotal: number;
    averageOrderValue: number;
  };
  orders: {
    total: number;
    byStatus: {
      pending: number;
      preparing: number;
      ready: number;
      out_for_delivery: number;
      completed: number;
      delivered: number;
      cancelled: number;
      refunded: number;
    };
  };
  topItems: Array<{
    itemName: string;
    qtySold: number;
    revenue: number;
  }>;
  recentOrders: Order[];
  alerts: Array<{ id: string; message: string; type: 'info' | 'warning' | 'error' }>;

  salesSummary?: {
    todaySales: number;
    weeklySales: number;
    monthlySales: number;
    averageOrderValue: number;
  };
  orderStatusSummary?: {
    pending: number;
    preparing: number;
    ready: number;
    out_for_delivery: number;
    completed: number;
    delivered: number;
    cancelled: number;
    refunded: number;
  };
  topSellingItems?: Array<{
    itemName: string;
    qtySold: number;
    revenue: number;
  }>;
  customerSummary?: {
    totalCustomers: number;
    activeLoyaltyCustomers: number;
  };
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
