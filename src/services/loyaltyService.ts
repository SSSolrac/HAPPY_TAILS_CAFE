import { loyaltyApi } from '@/api/loyalty';
import type { Order } from '@/types/order';
import {
  LOYALTY_MILESTONES,
  LOYALTY_TOTAL_STAMPS,
  type CustomerLoyalty,
  type LoyaltyActivityEntry,
  type LoyaltyRewardName,
  type LoyaltyStampResult,
  type LoyaltyUnlockedReward,
} from '@/types/loyalty';

const stampedOrders = new Map<string, string>();
const customerLoyaltyCards = new Map<string, CustomerLoyalty>();

const makeActivityId = () => `LOY-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

const defaultCard = (customerId: string): CustomerLoyalty => ({
  customerId,
  currentStampCount: 0,
  totalStamps: LOYALTY_TOTAL_STAMPS,
  milestones: LOYALTY_MILESTONES.map((milestone) => ({ ...milestone })),
  unlockedRewards: [],
  activity: [],
});

const cloneCard = (card: CustomerLoyalty): CustomerLoyalty => ({
  ...card,
  milestones: card.milestones.map((item) => ({ ...item })),
  unlockedRewards: card.unlockedRewards.map((item) => ({ ...item })),
  activity: card.activity.map((item) => ({ ...item })),
});

const upsertCard = (customerId: string): CustomerLoyalty => {
  const current = customerLoyaltyCards.get(customerId);
  if (current) return current;
  const created = defaultCard(customerId);
  customerLoyaltyCards.set(customerId, created);
  return created;
};

const applyStamp = (card: CustomerLoyalty, activity: LoyaltyActivityEntry): LoyaltyStampResult => {
  card.currentStampCount = Math.min(card.totalStamps, card.currentStampCount + 1);
  card.activity = [activity, ...card.activity].slice(0, 20);
  if (activity.orderId) card.lastStampedOrderId = activity.orderId;

  const unlockedRewards = loyaltyService.evaluateRewardMilestones(card);
  return {
    granted: true,
    stampedAt: activity.at,
    activity: { ...activity },
    loyalty: cloneCard(card),
    unlockedRewards,
  };
};

export const loyaltyService = {
  canGrantStamp(order: Order): boolean {
    return order.paymentStatus === 'paid' && Boolean(order.customerId);
  },

  hasOrderAlreadyBeenStamped(orderId: string): boolean {
    return stampedOrders.has(orderId);
  },

  evaluateRewardMilestones(customerLoyalty: CustomerLoyalty): LoyaltyUnlockedReward[] {
    const existingRewards = new Set(customerLoyalty.unlockedRewards.map((entry) => entry.reward));
    const now = new Date().toISOString();

    LOYALTY_MILESTONES.forEach((milestone) => {
      if (customerLoyalty.currentStampCount >= milestone.stampCount && !existingRewards.has(milestone.reward)) {
        customerLoyalty.unlockedRewards.push({
          reward: milestone.reward,
          unlockedAt: now,
          stampCount: milestone.stampCount,
        });
      }
    });

    return customerLoyalty.unlockedRewards.map((entry) => ({ ...entry }));
  },

  grantStampForConfirmedOrder(order: Order): LoyaltyStampResult {
    if (!order.customerId || !this.canGrantStamp(order)) {
      return { granted: false, reason: 'Order is not eligible for loyalty stamping.' };
    }

    if (this.hasOrderAlreadyBeenStamped(order.id)) {
      return {
        granted: false,
        stampedAt: stampedOrders.get(order.id),
        loyalty: cloneCard(upsertCard(order.customerId)),
        reason: 'Order has already been stamped.',
      };
    }

  async grantManualStamp(customerId: string, reason?: string): Promise<LoyaltyStampResult> {
    return loyaltyApi.grantManualStamp(customerId, reason);
  },

    const card = upsertCard(order.customerId);
    const activity: LoyaltyActivityEntry = {
      id: makeActivityId(),
      customerId: order.customerId,
      source: 'automatic-order-confirmation',
      stampDelta: 1,
      at: stampedAt,
      orderId: order.id,
      reason: `Auto-awarded from confirmed order ${order.id}`,
    };

    return applyStamp(card, activity);
  },

  grantManualStamp(customerId: string, reason?: string): LoyaltyStampResult {
    const trimmedReason = reason?.trim();
    const stampedAt = new Date().toISOString();
    const card = upsertCard(customerId);

    const activity: LoyaltyActivityEntry = {
      id: makeActivityId(),
      customerId,
      source: 'manual-staff-adjustment',
      stampDelta: 1,
      at: stampedAt,
      reason: trimmedReason || 'Manual stamp granted by staff/owner.',
    };

    return applyStamp(card, activity);
  },

  getCustomerLoyalty(customerId: string): CustomerLoyalty {
    return cloneCard(upsertCard(customerId));
  },

  seedCustomerLoyalty(customerId: string, currentStampCount: number, unlockedRewards: LoyaltyRewardName[] = []): CustomerLoyalty {
    const card = upsertCard(customerId);
    card.currentStampCount = Math.max(0, Math.min(LOYALTY_TOTAL_STAMPS, currentStampCount));
    card.unlockedRewards = unlockedRewards.map((reward) => {
      const milestone = LOYALTY_MILESTONES.find((item) => item.reward === reward);
      return {
        reward,
        stampCount: milestone?.stampCount ?? LOYALTY_TOTAL_STAMPS,
        unlockedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
      };
    });

    return cloneCard(card);
  },
};
