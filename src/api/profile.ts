import { apiClient } from './client';
import { unwrapDataObject } from './response';
import type { CustomerProfile } from '@/types/customer';

export const profileApi = {
  async getMe(): Promise<CustomerProfile> {
    const payload = await apiClient.get<unknown>('/api/profile/me');
    return unwrapDataObject<CustomerProfile>(payload);
  },
  async updateMe(payload: Partial<CustomerProfile>): Promise<CustomerProfile> {
    const result = await apiClient.put<unknown>('/api/profile/me', payload);
    return unwrapDataObject<CustomerProfile>(result);
  },
};
