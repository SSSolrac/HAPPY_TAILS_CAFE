import { customersApi } from '@/api/customers';
import { loyaltyService } from '@/services/loyaltyService';
import type { CustomerWithLoyalty } from '@/types/customer';

const combineCustomer = async (customerId: string): Promise<CustomerWithLoyalty> => {
  const [customer, loyalty] = await Promise.all([
    customersApi.getById(customerId),
    loyaltyService.getCustomerLoyalty(customerId),
  ]);

  return {
    ...customer,
    loyalty,
  };
};

export const customerService = {
  async getCustomers(): Promise<CustomerWithLoyalty[]> {
    const customers = await customersApi.list();

    return Promise.all(customers.map(async (customer) => {
      const loyalty = await loyaltyService.getCustomerLoyalty(customer.id);

      return {
        ...customer,
        loyalty,
      };
    }));
  },

  async getCustomerById(customerId: string): Promise<CustomerWithLoyalty> {
    return combineCustomer(customerId);
  },
};
