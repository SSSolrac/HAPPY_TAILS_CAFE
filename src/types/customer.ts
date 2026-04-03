export interface CustomerProfile {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyAccount {
  customerId: string;
  stampCount: number;
  availableRewards: string[];
  redeemedRewards: string[];
  updatedAt: string;
}

export interface CustomerWithLoyalty extends CustomerProfile {
  loyalty: LoyaltyAccount;
}

export type Customer = CustomerWithLoyalty;
