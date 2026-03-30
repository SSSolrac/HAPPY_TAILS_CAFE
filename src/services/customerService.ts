import { customersApi } from '@/api/customers';
import { loyaltyService } from '@/services/loyaltyService';
import type { Customer } from '@/types/customer';
import { getCustomerTier } from '@/utils/tier';

const normalizeCustomer = (customer: Partial<Customer>): Customer => ({
  id: customer.id ?? '',
  name: customer.name ?? 'Unknown Customer',
  email: customer.email ?? '',
  points: Number(customer.points ?? 0),
  tier: customer.tier ?? getCustomerTier(Number(customer.points ?? 0)),
  loyalty: customer.loyalty as Customer['loyalty'],
});

export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    const customers = await customersApi.list();
    const enriched = await Promise.all(customers.map(async (customer) => {
      const loyalty = await loyaltyService.getCustomerLoyalty(customer.id);
      return normalizeCustomer({ ...customer, loyalty, tier: getCustomerTier(Number(customer.points ?? 0)) });
    }));

    return enriched;
  },

  async grantManualLoyaltyStamp(customerId: string, reason?: string): Promise<Customer> {
    await loyaltyService.grantManualStamp(customerId, reason);
    const customers = await this.getCustomers();
    const customer = customers.find((entry) => entry.id === customerId);
    if (!customer) throw new Error('Customer not found');
    return customer;
  },
};
