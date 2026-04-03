import { apiClient } from './client';
import { asRecord, unwrapDataObject } from './response';
import type { LoyaltyAccount, Reward } from '@/types/loyalty';

const mapReward = (raw: unknown): Reward => {
  const row = asRecord(raw) ?? {};
  return {
    id: String(row.id ?? ''),
    label: String(row.label ?? ''),
    requiredStamps: Number(row.requiredStamps ?? 0),
  };
};

const mapLoyalty = (raw: unknown): LoyaltyAccount => {
  const row = asRecord(raw) ?? {};
  return {
    customerId: String(row.customerId ?? ''),
    stampCount: Number(row.stampCount ?? 0),
    availableRewards: Array.isArray(row.availableRewards) ? row.availableRewards.map(mapReward) : [],
    redeemedRewards: Array.isArray(row.redeemedRewards) ? row.redeemedRewards.map(mapReward) : [],
    updatedAt: String(row.updatedAt ?? new Date().toISOString()),
  };
};

export const loyaltyApi = {
  async getCustomerLoyalty(customerId: string): Promise<LoyaltyAccount> {
    const payload = await apiClient.get<unknown>(`/api/loyalty/${customerId}`);
    return mapLoyalty(unwrapDataObject<unknown>(payload));
  },
};
