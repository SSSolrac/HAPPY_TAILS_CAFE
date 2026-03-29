import type { Order } from '@/types/order';

const stampedOrders = new Map<string, string>();

export const loyaltyService = {
  canGrantLoyaltyStamp(order: Order): boolean {
    return order.paymentStatus === 'paid' && Boolean(order.customerId);
  },

  hasAlreadyBeenStamped(order: Order): boolean {
    return stampedOrders.has(order.id);
  },

  grantLoyaltyStamp(order: Order): { granted: boolean; stampedAt?: string; reason?: string } {
    if (!this.canGrantLoyaltyStamp(order)) {
      return { granted: false, reason: 'Order is not eligible for loyalty stamping.' };
    }

    if (this.hasAlreadyBeenStamped(order)) {
      return {
        granted: false,
        stampedAt: stampedOrders.get(order.id),
        reason: 'Order has already been stamped.',
      };
    }

    const stampedAt = new Date().toISOString();
    stampedOrders.set(order.id, stampedAt);

    // TODO(loyalty-integration): Replace this in-memory store with shared persistence/API.
    // TODO(loyalty-integration): Connect stamped order to real customer loyalty card in customer system.
    return { granted: true, stampedAt };
  },
};
