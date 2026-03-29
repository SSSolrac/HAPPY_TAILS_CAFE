import type { DateRangePreset } from './dashboard';

export type PaymentStatus = 'pending' | 'paid';
export type PaymentMethod = 'cash' | 'card' | 'e-wallet';

export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'
  | 'refunded'
  | 'out-for-delivery'
  | 'delivered';

export type OrderItem = {
  name: string;
  qty: number;
};

export type Order = {
  id: string;
  customerId?: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
  notes?: string;
  loyaltyStampPreparedAt?: string;
};

export type OrderFilters = {
  query?: string;
  status?: OrderStatus | 'all';
  range?: DateRangePreset;
};

export type LoyaltyStampState = 'not-eligible' | 'eligible' | 'granted' | 'already-stamped';
