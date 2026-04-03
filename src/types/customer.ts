import type { LoyaltyAccount } from './loyalty';

export interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  addresses: string[];
  preferences: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerWithLoyalty extends CustomerProfile {
  loyalty: LoyaltyAccount;
}

export type Customer = CustomerWithLoyalty;
