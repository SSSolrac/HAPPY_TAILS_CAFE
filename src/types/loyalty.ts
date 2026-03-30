export const LOYALTY_TOTAL_STAMPS = 10;

export const LOYALTY_MILESTONES = [
  { stampCount: 6, reward: 'Free Latte' },
  { stampCount: 10, reward: 'Free Groom' },
] as const;

export type LoyaltyRewardName = (typeof LOYALTY_MILESTONES)[number]['reward'];

export type LoyaltyActivitySource = 'automatic-order-confirmation' | 'manual-staff-adjustment';

export interface LoyaltyUnlockedReward {
  reward: LoyaltyRewardName;
  unlockedAt: string;
  stampCount: number;
}

export interface LoyaltyActivityEntry {
  id: string;
  customerId: string;
  source: LoyaltyActivitySource;
  stampDelta: 1;
  at: string;
  orderId?: string;
  reason?: string;
}

export interface CustomerLoyalty {
  customerId: string;
  currentStampCount: number;
  totalStamps: number;
  milestones: Array<{ stampCount: number; reward: LoyaltyRewardName }>;
  unlockedRewards: LoyaltyUnlockedReward[];
  activity: LoyaltyActivityEntry[];
  lastStampedOrderId?: string;
}

export interface LoyaltyStampResult {
  granted: boolean;
  stampedAt?: string;
  activity?: LoyaltyActivityEntry;
  loyalty?: CustomerLoyalty;
  unlockedRewards?: LoyaltyUnlockedReward[];
  reason?: string;
}
