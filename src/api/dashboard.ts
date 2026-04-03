import { apiClient } from './client';
import { asRecord, unwrapDataObject } from './response';
import type { DashboardData, DateRangePreset } from '@/types/dashboard';

const mapTopItem = (raw: unknown): DashboardData['topItems'][number] => {
  const row = asRecord(raw) ?? {};
  return {
    itemName: String(row.itemName ?? ''),
    quantity: Number(row.quantity ?? 0),
    revenue: Number(row.revenue ?? 0),
  };
};

const mapDashboard = (raw: unknown): DashboardData => {
  const row = asRecord(raw) ?? {};
  const sales = asRecord(row.sales) ?? {};
  const orders = asRecord(row.orders) ?? {};

  return {
    sales: {
      today: Number(sales.today ?? 0),
      rangeTotal: Number(sales.rangeTotal ?? 0),
      averageOrderValue: Number(sales.averageOrderValue ?? 0),
    },
    orders: {
      today: Number(orders.today ?? 0),
      rangeTotal: Number(orders.rangeTotal ?? 0),
      pending: Number(orders.pending ?? 0),
      preparing: Number(orders.preparing ?? 0),
      ready: Number(orders.ready ?? 0),
      outForDelivery: Number(orders.outForDelivery ?? 0),
      completed: Number(orders.completed ?? 0),
      cancelled: Number(orders.cancelled ?? 0),
    },
    topItems: Array.isArray(row.topItems) ? row.topItems.map(mapTopItem) : [],
    recentOrders: Array.isArray(row.recentOrders) ? (row.recentOrders as DashboardData['recentOrders']) : [],
    alerts: Array.isArray(row.alerts) ? (row.alerts as DashboardData['alerts']) : [],
  };
};

export const dashboardApi = {
  async getDashboardData(range: DateRangePreset): Promise<DashboardData> {
    const payload = await apiClient.get<unknown>('/api/dashboard', { range });
    return mapDashboard(unwrapDataObject<unknown>(payload));
  },
};
