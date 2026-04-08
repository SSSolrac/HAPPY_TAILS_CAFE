import { normalizeError } from '@/lib/errors';
import { asRecord, mapOrderRow } from '@/lib/mappers';
import { requireSupabaseClient } from '@/lib/supabase';
import type { DashboardData, DateRangePreset } from '@/types/dashboard';

const mapDashboardSummary = (payload: unknown): DashboardData => {
  const base = (Array.isArray(payload) ? payload[0] : payload) as unknown;
  const row = asRecord(base) ?? {};

  // Preferred: RPC already returns the canonical DashboardData shape (camelCase).
  const salesNested = asRecord(row.sales);
  const ordersNested = asRecord(row.orders);
  if (salesNested && ordersNested) {
    return {
      sales: {
        today: Number(salesNested.today ?? 0),
        rangeTotal: Number(salesNested.rangeTotal ?? 0),
        averageOrderValue: Number(salesNested.averageOrderValue ?? 0),
      },
      orders: {
        today: Number(ordersNested.today ?? 0),
        rangeTotal: Number(ordersNested.rangeTotal ?? 0),
        pending: Number(ordersNested.pending ?? 0),
        preparing: Number(ordersNested.preparing ?? 0),
        ready: Number(ordersNested.ready ?? 0),
        outForDelivery: Number(ordersNested.outForDelivery ?? 0),
        completed: Number(ordersNested.completed ?? 0),
        cancelled: Number(ordersNested.cancelled ?? 0),
      },
      topItems: Array.isArray(row.topItems)
        ? (row.topItems as unknown[]).map((item) => {
            const r = asRecord(item) ?? {};
            return { itemName: String(r.itemName ?? ''), quantity: Number(r.quantity ?? 0), revenue: Number(r.revenue ?? 0) };
          })
        : [],
      recentOrders: Array.isArray(row.recentOrders) ? (row.recentOrders as unknown[]).map(mapOrderRow) : [],
      alerts: Array.isArray(row.alerts)
        ? (row.alerts as unknown[]).map((item) => {
            const r = asRecord(item) ?? {};
            return { id: String(r.id ?? ''), message: String(r.message ?? ''), type: (r.type as DashboardData['alerts'][number]['type']) ?? 'info' };
          })
        : [],
    };
  }

  // Fallback: RPC returns a flat, snake_case row.
  const topItemsRaw = (row.top_items ?? row.topItems) as unknown;
  const recentOrdersRaw = (row.recent_orders ?? row.recentOrders) as unknown;
  const alertsRaw = (row.alerts ?? row.alerts) as unknown;

  return {
    sales: {
      today: Number(row.sales_today ?? row.today_sales ?? 0),
      rangeTotal: Number(row.sales_range_total ?? row.range_sales ?? 0),
      averageOrderValue: Number(row.average_order_value ?? row.avg_order_value ?? 0),
    },
    orders: {
      today: Number(row.orders_today ?? 0),
      rangeTotal: Number(row.orders_range_total ?? row.orders_total ?? 0),
      pending: Number(row.orders_pending ?? 0),
      preparing: Number(row.orders_preparing ?? 0),
      ready: Number(row.orders_ready ?? 0),
      outForDelivery: Number(row.orders_out_for_delivery ?? row.orders_outForDelivery ?? 0),
      completed: Number(row.orders_completed ?? 0),
      cancelled: Number(row.orders_cancelled ?? 0),
    },
    topItems: Array.isArray(topItemsRaw)
      ? (topItemsRaw as unknown[]).map((item) => {
          const r = asRecord(item) ?? {};
          return {
            itemName: String(r.item_name ?? r.itemName ?? ''),
            quantity: Number(r.quantity ?? 0),
            revenue: Number(r.revenue ?? 0),
          };
        })
      : [],
    recentOrders: Array.isArray(recentOrdersRaw) ? (recentOrdersRaw as unknown[]).map(mapOrderRow) : [],
    alerts: Array.isArray(alertsRaw)
      ? (alertsRaw as unknown[]).map((item) => {
          const r = asRecord(item) ?? {};
          return { id: String(r.id ?? ''), message: String(r.message ?? ''), type: (r.type as DashboardData['alerts'][number]['type']) ?? 'info' };
        })
      : [],
  };
};

export const dashboardService = {
  async getDashboardData(range: DateRangePreset): Promise<DashboardData> {
    const supabase = requireSupabaseClient();
    const { data, error } = await supabase.rpc('dashboard_summary', { range_key: range });
    if (error) throw normalizeError(error, { fallbackMessage: 'Unable to load dashboard summary.' });
    return mapDashboardSummary(data);
  },
};
