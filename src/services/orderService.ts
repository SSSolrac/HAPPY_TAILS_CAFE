import { ordersApi } from '@/api/orders';
import type { DateRangePreset } from '@/types/dashboard';
import type { Order, OrderFilters, OrderStatus } from '@/types/order';

const rangeToDays: Record<DateRangePreset, number> = { today: 1, '7d': 7, '30d': 30, '90d': 90 };

const byRange = (rows: Order[], range: DateRangePreset) => {
  const cutoff = Date.now() - rangeToDays[range] * 24 * 60 * 60 * 1000;
  return rows.filter((row) => new Date(row.createdAt).getTime() >= cutoff);
};

export const orderService = {
  async getOrders(filters?: OrderFilters): Promise<Order[]> {
    const range = filters?.range ?? '30d';
    let rows = await ordersApi.list(filters);

    rows = byRange(rows, range);

    if (filters?.status && filters.status !== 'all') rows = rows.filter((row) => row.status === filters.status);

    if (filters?.query) {
      const query = filters.query.toLowerCase();
      rows = rows.filter((row) => row.orderNumber.toLowerCase().includes(query) || row.customerName.toLowerCase().includes(query));
    }

    return rows;
  },

  async getOrderById(orderId: string): Promise<Order> {
    const order = await ordersApi.getById(orderId);
    const statusTimeline = await ordersApi.getStatusTimeline(orderId);
    return { ...order, statusTimeline };
  },

  async confirmPayment(orderId: string): Promise<Order> {
    const order = await ordersApi.updatePayment(orderId, 'paid');
    const statusTimeline = await ordersApi.getStatusTimeline(orderId);
    return { ...order, statusTimeline };
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const order = await ordersApi.updateStatus(orderId, status);
    const statusTimeline = await ordersApi.getStatusTimeline(orderId);
    return { ...order, statusTimeline };
  },
};
