export const LOYALTY_TOTAL_STAMPS = 10;

export type LoyaltyActivitySource = 'automatic-order-confirmation' | 'manual-staff-adjustment';

export interface LoyaltyActivityEntry {
  id: string;
  customerId: string;
  source: LoyaltyActivitySource;
  stampDelta: 1;
  at: string;
  orderId?: string;
  reason?: string;
}
