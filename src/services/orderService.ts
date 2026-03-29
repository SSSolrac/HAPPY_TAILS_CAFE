import { loyaltyService } from '@/services/loyaltyService';
import type { DateRangePreset } from '@/types/dashboard';
import type { Order, OrderFilters, OrderStatus } from '@/types/order';

let ordersSeed: Order[] = [
  {
    id: 'ORD-2101',
    customerId: 'c1',
    customerName: 'Avery Johnson',
    items: [{ name: 'Chicken Alfredo', qty: 1 }, { name: 'Iced Latte', qty: 1 }],
    total: 21.5,
    status: 'pending',
    paymentStatus: 'pending',
    paymentMethod: 'card',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 'ORD-2100',
    customerId: 'c2',
    customerName: 'Nora Lin',
    items: [{ name: 'Beef Rice Bowl', qty: 1 }],
    total: 12.75,
    status: 'preparing',
    paymentStatus: 'paid',
    paymentMethod: 'e-wallet',
    createdAt: new Date(Date.now() - 1000 * 60 * 70).toISOString(),
  },
  {
    id: 'ORD-2099',
    customerName: 'Walk-in Guest',
    items: [{ name: 'Truffle Fries', qty: 1 }, { name: 'Soda', qty: 1 }],
    total: 9.5,
    status: 'ready',
    paymentStatus: 'pending',
    paymentMethod: 'cash',
    createdAt: new Date(Date.now() - 1000 * 60 * 115).toISOString(),
  },
  {
    id: 'ORD-2098',
    customerId: 'c4',
    customerName: 'Mia Turner',
    items: [{ name: 'Cafe Club Sandwich', qty: 1 }],
    total: 10.25,
    status: 'completed',
    paymentStatus: 'paid',
    paymentMethod: 'card',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
  {
    id: 'ORD-2097',
    customerId: 'c5',
    customerName: 'Carlos Vega',
    items: [{ name: 'Pesto Penne', qty: 1 }],
    total: 11.5,
    status: 'cancelled',
    paymentStatus: 'pending',
    paymentMethod: 'cash',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
    notes: 'Customer cancelled before preparation.',
  },
];

const latency = async <T>(value: T): Promise<T> => {
  await new Promise((resolve) => setTimeout(resolve, 220));
  return value;
};

const rangeToDays: Record<DateRangePreset, number> = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, ALL: 3650 };

const byRange = (rows: Order[], range: DateRangePreset) => {
  if (range === 'ALL') return rows;
  const cutoff = Date.now() - rangeToDays[range] * 24 * 60 * 60 * 1000;
  return rows.filter((row) => new Date(row.createdAt).getTime() >= cutoff);
};

const seedStamped = ordersSeed.find((order) => order.id === 'ORD-2100');
if (seedStamped) {
  const result = loyaltyService.grantLoyaltyStamp(seedStamped);
  if (result.granted && result.stampedAt) {
    ordersSeed = ordersSeed.map((order) => (order.id === seedStamped.id ? { ...order, loyaltyStampPreparedAt: result.stampedAt } : order));
  }
}

export const orderService = {
  async getOrders(filters?: OrderFilters): Promise<Order[]> {
    const range = filters?.range ?? '1M';
    let rows = byRange(ordersSeed, range);

    if (filters?.status && filters.status !== 'all') {
      rows = rows.filter((row) => row.status === filters.status);
    }

    if (filters?.query) {
      const query = filters.query.toLowerCase();
      rows = rows.filter((row) => row.id.toLowerCase().includes(query) || row.customerName.toLowerCase().includes(query));
    }

    return latency(rows.map((row) => ({ ...row, items: [...row.items] })));
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    const row = ordersSeed.find((order) => order.id === orderId);
    return latency(row ? { ...row, items: [...row.items] } : null);
  },

  async confirmPayment(orderId: string): Promise<Order> {
    const current = ordersSeed.find((order) => order.id === orderId);
    if (!current) throw new Error('Order not found');

    const paidOrder = current.paymentStatus === 'paid' ? current : { ...current, paymentStatus: 'paid' as const };
    const stamp = loyaltyService.grantLoyaltyStamp(paidOrder);

    const updated: Order = {
      ...paidOrder,
      loyaltyStampPreparedAt: stamp.stampedAt ?? paidOrder.loyaltyStampPreparedAt,
    };

    ordersSeed = ordersSeed.map((order) => (order.id === orderId ? updated : order));

    // TODO(order-api): call payment confirmation endpoint + loyalty side effect atomically.
    return latency({ ...updated, items: [...updated.items] });
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const current = ordersSeed.find((order) => order.id === orderId);
    if (!current) throw new Error('Order not found');

    const updated = { ...current, status };
    ordersSeed = ordersSeed.map((order) => (order.id === orderId ? updated : order));

    // TODO(order-api): replace with PATCH /api/orders/:id/status.
    return latency({ ...updated, items: [...updated.items] });
  },

  async updateOrderNotes(orderId: string, notes: string): Promise<Order> {
    const current = ordersSeed.find((order) => order.id === orderId);
    if (!current) throw new Error('Order not found');

    const updated = { ...current, notes };
    ordersSeed = ordersSeed.map((order) => (order.id === orderId ? updated : order));

    // TODO(order-api): replace with PATCH /api/orders/:id notes field.
    return latency({ ...updated, items: [...updated.items] });
  },
};
