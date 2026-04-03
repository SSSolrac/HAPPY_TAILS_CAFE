import { apiClient } from './client';
import { asRecord, unwrapDataObject } from './response';
import type { CustomerProfile } from '@/types/customer';

const mapProfile = (raw: unknown): CustomerProfile => {
  const row = asRecord(raw) ?? {};
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    addresses: Array.isArray(row.addresses) ? row.addresses.map(String) : [],
    preferences: (asRecord(row.preferences) ?? {}) as Record<string, unknown>,
    createdAt: String(row.createdAt ?? new Date().toISOString()),
    updatedAt: String(row.updatedAt ?? row.createdAt ?? new Date().toISOString()),
  };
};

export const profileApi = {
  async getMe(): Promise<CustomerProfile> {
    const payload = await apiClient.get<unknown>('/api/profile/me');
    return mapProfile(unwrapDataObject<unknown>(payload));
  },

  async updateMe(payload: Partial<CustomerProfile>): Promise<CustomerProfile> {
    const result = await apiClient.put<unknown>('/api/profile/me', payload);
    return mapProfile(unwrapDataObject<unknown>(result));
  },
};
