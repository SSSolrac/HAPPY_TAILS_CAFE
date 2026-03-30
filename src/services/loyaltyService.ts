import { loyaltyApi } from '@/api/loyalty';
import type { Order } from '@/types/order';
import type { CustomerLoyalty, LoyaltyStampResult, LoyaltyUnlockedReward } from '@/types/loyalty';

export const loyaltyService = {
  canGrantStamp(order: Order): boolean {
    return order.paymentStatus === 'paid' && Boolean(order.customerId);
  },

  hasOrderAlreadyBeenStamped(orderOrId: Order | string): boolean {
    if (typeof orderOrId === 'string') return false;
    return orderOrId.loyaltyStampStatus === 'already-stamped';
  },

  evaluateRewardMilestones(customerLoyalty: CustomerLoyalty): LoyaltyUnlockedReward[] {
    return customerLoyalty.unlockedRewards;
  },

  async hasOrderAlreadyBeenStampedById(orderId: string): Promise<boolean> {
    return loyaltyApi.hasOrderAlreadyBeenStamped(orderId);
  },

  async grantStampForConfirmedOrder(order: Order): Promise<LoyaltyStampResult> {
    return loyaltyApi.grantOrderStamp(order.id);
  },

  async grantManualStamp(customerId: string, reason?: string): Promise<LoyaltyStampResult> {
    return loyaltyApi.grantManualStamp(customerId, reason);
  },

  async getCustomerLoyalty(customerId: string): Promise<CustomerLoyalty> {
    return loyaltyApi.getCustomerLoyalty(customerId);
  },
};
