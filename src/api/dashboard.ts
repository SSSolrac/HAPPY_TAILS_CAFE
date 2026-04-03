import { apiClient } from './client';
import { asRecord, unwrapDataObject } from './response';
import type { DashboardSummary, DateRangePreset } from '@/types/dashboard';

const mapDashboard = (raw: unknown): DashboardSummary => {
  const row = asRecord(raw) ?? {};
  const sales = asRecord(row.sales) ?? {};
  const orders = asRecord(row.orders) ?? {};
  const byStatus = asRecord(orders.byStatus) ?? {};

  return {
    sales: {
      today: Number(sales.today ?? 0),
      rangeTotal: Number(sales.rangeTotal ?? 0),
      averageOrderValue: Number(sales.averageOrderValue ?? 0),
    },
    orders: {
      total: Number(orders.total ?? 0),
      byStatus: {
        pending: Number(byStatus.pending ?? 0),
        preparing: Number(byStatus.preparing ?? 0),
        ready: Number(byStatus.ready ?? 0),
        out_for_delivery: Number(byStatus.out_for_delivery ?? 0),
        completed: Number(byStatus.completed ?? 0),
        delivered: Number(byStatus.delivered ?? 0),
        cancelled: Number(byStatus.cancelled ?? 0),
        refunded: Number(byStatus.refunded ?? 0),
      },
    },
    topItems: Array.isArray(row.topItems) ? (row.topItems as DashboardSummary['topItems']) : [],
    recentOrders: Array.isArray(row.recentOrders) ? (row.recentOrders as DashboardSummary['recentOrders']) : [],
    alerts: Array.isArray(row.alerts) ? (row.alerts as DashboardSummary['alerts']) : [],
    salesSummary: {
      todaySales: Number(sales.today ?? 0),
      weeklySales: Number(sales.rangeTotal ?? 0),
      monthlySales: Number(sales.rangeTotal ?? 0),
      averageOrderValue: Number(sales.averageOrderValue ?? 0),
    },
    orderStatusSummary: {
      pending: Number(byStatus.pending ?? 0),
      preparing: Number(byStatus.preparing ?? 0),
      ready: Number(byStatus.ready ?? 0),
      out_for_delivery: Number(byStatus.out_for_delivery ?? 0),
      completed: Number(byStatus.completed ?? 0),
      delivered: Number(byStatus.delivered ?? 0),
      cancelled: Number(byStatus.cancelled ?? 0),
      refunded: Number(byStatus.refunded ?? 0),
    },
    topSellingItems: Array.isArray(row.topItems) ? (row.topItems as DashboardSummary['topItems']) : [],
    customerSummary: { totalCustomers: 0, activeLoyaltyCustomers: 0 },
  };
};

export const dashboardApi = {
  async getDashboardData(range: DateRangePreset): Promise<DashboardSummary> {
    const payload = await apiClient.get<unknown>('/api/dashboard', { range });
    return mapDashboard(unwrapDataObject<unknown>(payload));
  },
};
