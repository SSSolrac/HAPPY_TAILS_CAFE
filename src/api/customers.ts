import { apiClient } from './client';
import { asRecord, unwrapArray, unwrapObject } from './response';
import type { CustomerProfile } from '@/types/customer';

const mapCustomer = (raw: unknown): CustomerProfile => {
  const row = asRecord(raw) ?? {};
  return {
    id: String(row.id ?? ''),
    fullName: String(row.fullName ?? row.full_name ?? 'Unknown Customer'),
    email: row.email ? String(row.email) : undefined,
    phone: row.phone ? String(row.phone) : row.phone_number ? String(row.phone_number) : undefined,
    address: row.address ? String(row.address) : undefined,
    city: row.city ? String(row.city) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    createdAt: String(row.createdAt ?? row.created_at ?? new Date().toISOString()),
    updatedAt: String(row.updatedAt ?? row.updated_at ?? row.createdAt ?? row.created_at ?? new Date().toISOString()),
  };
};

export const customersApi = {
  async list(): Promise<CustomerProfile[]> {
    const payload = await apiClient.get<unknown>('/api/customers');
    return unwrapArray<unknown>(payload).map(mapCustomer);
  },

  async getById(customerId: string): Promise<CustomerProfile> {
    const payload = await apiClient.get<unknown>(`/api/customers/${customerId}`);
    const row = unwrapObject<unknown>(payload);
    return mapCustomer(row ?? payload);
  },
};
