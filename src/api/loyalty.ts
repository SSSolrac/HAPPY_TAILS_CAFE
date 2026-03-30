import { apiClient } from './client';
import type { CustomerLoyalty, LoyaltyStampResult } from '@/types/loyalty';

export const loyaltyApi = {
  async getCustomerLoyalty(customerId: string): Promise<CustomerLoyalty> {
    return apiClient.get<CustomerLoyalty>(`/api/loyalty/${customerId}`);
  },

  async grantManualStamp(customerId: string, reason?: string): Promise<LoyaltyStampResult> {
    return apiClient.post<LoyaltyStampResult>(`/api/loyalty/${customerId}/manual-stamp`, { reason });
  },

  async grantOrderStamp(orderId: string): Promise<LoyaltyStampResult> {
    return apiClient.post<LoyaltyStampResult>(`/api/loyalty/orders/${orderId}/confirm`);
  },

  async hasOrderAlreadyBeenStamped(orderId: string): Promise<boolean> {
    const response = await apiClient.get<{ stamped: boolean }>(`/api/loyalty/orders/${orderId}/stamped`);
    return Boolean(response.stamped);
  },
};
