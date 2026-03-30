import { ordersApi } from '@/api/orders';
import { loyaltyService } from '@/services/loyaltyService';
import type { DateRangePreset } from '@/types/dashboard';
import type { Order, OrderFilters, OrderStatus } from '@/types/order';

const rangeToDays: Record<DateRangePreset, number> = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, ALL: 3650 };

const byRange = (rows: Order[], range: DateRangePreset) => {
  if (range === 'ALL') return rows;
  const cutoff = Date.now() - rangeToDays[range] * 24 * 60 * 60 * 1000;
  return rows.filter((row) => new Date(row.createdAt).getTime() >= cutoff);
};

const seedStamped = ordersSeed.find((order) => order.id === 'ORD-2100');
if (seedStamped) {
  const result = loyaltyService.grantStampForConfirmedOrder(seedStamped);
  ordersSeed = ordersSeed.map((order) => (order.id === seedStamped.id
    ? {
      ...order,
      loyaltyStampPreparedAt: result.stampedAt,
      loyaltyStampStatus: result.granted ? 'stamp-awarded' : 'already-stamped',
      loyaltyStampedAt: result.stampedAt,
      loyaltyStampedBy: result.activity?.source,
      loyaltyMessage: result.reason ?? (result.granted ? 'Stamp awarded from confirmed payment.' : 'Loyalty already applied.'),
      loyaltyUnlockedRewards: result.unlockedRewards?.map((reward) => reward.reward) ?? [],
    }
    : order));
}

export const orderService = {
  async getOrders(filters?: OrderFilters): Promise<Order[]> {
    const range = filters?.range ?? '1M';
    let rows = await ordersApi.list(filters);

    rows = byRange(rows, range);

    if (filters?.status && filters.status !== 'all') rows = rows.filter((row) => row.status === filters.status);

    if (filters?.query) {
      const query = filters.query.toLowerCase();
      rows = rows.filter((row) => row.orderNumber.toLowerCase().includes(query) || row.customerName.toLowerCase().includes(query));
    }

    return rows;
  },

  async confirmPayment(orderId: string): Promise<Order> {
    const paidOrder = await ordersApi.confirmPayment(orderId);

    const paidOrder = current.paymentStatus === 'paid' ? current : { ...current, paymentStatus: 'paid' as const };
    const stamp = loyaltyService.grantStampForConfirmedOrder(paidOrder);

    const stamp = await loyaltyService.grantStampForConfirmedOrder(paidOrder);
    return {
      ...paidOrder,
      loyaltyStampPreparedAt: stamp.stampedAt ?? paidOrder.loyaltyStampPreparedAt,
      loyaltyStampStatus: stamp.granted ? 'stamp-awarded' : (stamp.reason === 'Order has already been stamped.' ? 'already-stamped' : 'not-eligible'),
      loyaltyStampedAt: stamp.stampedAt ?? paidOrder.loyaltyStampedAt,
      loyaltyStampedBy: stamp.activity?.source ?? paidOrder.loyaltyStampedBy,
      loyaltyMessage: stamp.reason ?? (stamp.granted ? 'Stamp awarded from confirmed payment.' : paidOrder.loyaltyMessage),
      loyaltyUnlockedRewards: stamp.unlockedRewards?.map((reward) => reward.reward) ?? paidOrder.loyaltyUnlockedRewards,
    };
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    return ordersApi.updateStatus(orderId, status);
  },

  async updateOrderNotes(orderId: string, notes: string): Promise<Order> {
    return ordersApi.updateNotes(orderId, notes);
  },
};
