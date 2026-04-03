import { loyaltyApi } from '@/api/loyalty';
import type { LoyaltyAccount } from '@/types/loyalty';
import type { Order } from '@/types/order';

export const loyaltyService = {
  canGrantStamp(order: Order): boolean {
    return order.paymentStatus === 'paid' && Boolean(order.customerId);
  },

  hasOrderAlreadyBeenStamped(order: Order): boolean {
    return order.loyaltyStampStatus === 'already-stamped';
  },

  async getCustomerLoyalty(customerId: string): Promise<LoyaltyAccount> {
    return loyaltyApi.getCustomerLoyalty(customerId);
  },
};
