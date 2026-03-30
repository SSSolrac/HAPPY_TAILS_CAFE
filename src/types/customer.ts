import type { CustomerLoyalty } from './loyalty';

export type CustomerTier = 'Gold' | 'Silver' | 'Bronze' | 'Unranked';

export interface Customer {
  id: string;
  name: string;
  email: string;
  points: number;
  tier: CustomerTier;
  loyalty: CustomerLoyalty;
}
