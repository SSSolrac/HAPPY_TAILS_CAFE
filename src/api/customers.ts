import { apiClient } from './client';
import { asRecord, unwrapDataArray, unwrapDataObject } from './response';
import type { CustomerProfile } from '@/types/customer';

const mapCustomer = (raw: unknown): CustomerProfile => {
  const row = asRecord(raw) ?? {};
  return {
    id: String(row.id ?? ''),
    fullName: String(row.fullName ?? 'Unknown Customer'),
    email: row.email ? String(row.email) : undefined,
    phone: row.phone ? String(row.phone) : undefined,
    address: row.address ? String(row.address) : undefined,
    city: row.city ? String(row.city) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
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
