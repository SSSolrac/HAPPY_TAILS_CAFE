import { apiClient } from './client';
import { asRecord, unwrapDataArray, unwrapDataObject } from './response';
import type { CustomerProfile } from '@/types/customer';

const mapCustomer = (raw: unknown): CustomerProfile => {
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

export const customersApi = {
  async list(): Promise<CustomerProfile[]> {
    const payload = await apiClient.get<unknown>('/api/customers');
    return unwrapDataArray<unknown>(payload).map(mapCustomer);
  },

  async getById(customerId: string): Promise<CustomerProfile> {
    const payload = await apiClient.get<unknown>(`/api/customers/${customerId}`);
    return mapCustomer(unwrapDataObject<unknown>(payload));
  },
};
