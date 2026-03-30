import { apiClient } from './client';
import { asRecord, unwrapObject } from './response';
import type { LoyaltyAccount } from '@/types/customer';

const mapLoyalty = (raw: unknown): LoyaltyAccount => {
  const row = asRecord(raw) ?? {};

  return {
    customerId: String(row.customerId ?? row.customer_id ?? ''),
    currentStampCount: Number(row.currentStampCount ?? row.current_stamp_count ?? 0),
    totalStampsEarned: Number(row.totalStampsEarned ?? row.total_stamps_earned ?? 0),
    rewardsUnlocked: Array.isArray(row.rewardsUnlocked)
      ? row.rewardsUnlocked.map((reward) => String(reward))
      : Array.isArray(row.rewards_unlocked)
        ? row.rewards_unlocked.map((reward) => String(reward))
        : [],
    lastStampedOrderId: row.lastStampedOrderId ? String(row.lastStampedOrderId) : row.last_stamped_order_id ? String(row.last_stamped_order_id) : undefined,
    updatedAt: String(row.updatedAt ?? row.updated_at ?? new Date().toISOString()),
  };
};

export const loyaltyApi = {
  async getCustomerLoyalty(customerId: string): Promise<LoyaltyAccount> {
    const payload = await apiClient.get<unknown>(`/api/loyalty/${customerId}`);
    const row = unwrapObject<unknown>(payload);
    return mapLoyalty(row ?? payload);
  },
};
