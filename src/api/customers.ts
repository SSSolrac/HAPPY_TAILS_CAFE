import { apiClient } from './client';
import type { Customer } from '@/types/customer';

export const customersApi = {
  async list(): Promise<Customer[]> {
    return apiClient.get<Customer[]>('/api/customers');
  },
};
