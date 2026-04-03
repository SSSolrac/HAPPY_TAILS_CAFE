import { apiClient } from './client';
import { asRecord, unwrapDataObject } from './response';
import type { LoyaltyAccount } from '@/types/customer';

const mapLoyalty = (raw: unknown): LoyaltyAccount => {
  const row = asRecord(raw) ?? {};
  return {
    customerId: String(row.customerId ?? ''),
    stampCount: Number(row.stampCount ?? 0),
    availableRewards: Array.isArray(row.availableRewards) ? row.availableRewards.map((reward) => String(reward)) : [],
    redeemedRewards: Array.isArray(row.redeemedRewards) ? row.redeemedRewards.map((reward) => String(reward)) : [],
    updatedAt: String(row.updatedAt ?? new Date().toISOString()),
  };
};

export const loyaltyApi = {
  async getCustomerLoyalty(customerId: string): Promise<LoyaltyAccount> {
    const payload = await apiClient.get<unknown>(`/api/loyalty/${customerId}`);
    return mapLoyalty(unwrapDataObject<unknown>(payload));
  },
};
