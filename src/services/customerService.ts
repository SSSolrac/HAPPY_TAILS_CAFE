import { loyaltyService } from '@/services/loyaltyService';
import type { Customer } from '@/types/customer';
import { getCustomerTier } from '@/utils/tier';

const customersSeed = [
  { id: 'c1', name: 'Avery Johnson', email: 'avery@example.com', points: 1200, initialStamps: 5 },
  { id: 'c2', name: 'Nora Lin', email: 'nora@example.com', points: 760, initialStamps: 6 },
  { id: 'c3', name: 'Leo Adams', email: 'leo@example.com', points: 430, initialStamps: 3 },
  { id: 'c4', name: 'Mia Turner', email: 'mia@example.com', points: 20, initialStamps: 1 },
  { id: 'c5', name: 'Carlos Vega', email: 'carlos@example.com', points: 560, initialStamps: 9 },
  { id: 'c6', name: 'Sam Brooks', email: 'sam@example.com', points: 90, initialStamps: 0 },
];

customersSeed.forEach((customer) => {
  loyaltyService.seedCustomerLoyalty(customer.id, customer.initialStamps);
});

const toCustomer = (customer: (typeof customersSeed)[number]): Customer => ({
  id: customer.id,
  name: customer.name,
  email: customer.email,
  points: customer.points,
  tier: getCustomerTier(customer.points),
  loyalty: loyaltyService.getCustomerLoyalty(customer.id),
});

export const customerService = {
  async getCustomers(): Promise<Customer[]> {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return customersSeed.map(toCustomer);
  },

  async grantManualLoyaltyStamp(customerId: string, reason?: string): Promise<Customer> {
    loyaltyService.grantManualStamp(customerId, reason);
    const customer = customersSeed.find((entry) => entry.id === customerId);
    if (!customer) throw new Error('Customer not found');

    await new Promise((resolve) => setTimeout(resolve, 220));
    return toCustomer(customer);
  },
};
