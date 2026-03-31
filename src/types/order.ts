import type { DateRangePreset } from './dashboard';
import type { LoyaltyRewardName } from './loyalty';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'qrph' | 'gcash' | 'maribank' | 'bdo';

export type OrderType = 'dine_in' | 'pickup' | 'takeout' | 'delivery';

export type OrderStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'completed'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type OrderItem = {
  id: string;
  orderId: string;
  menuItemId?: string;
  itemName: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
};

export type OrderStatusHistoryItem = {
  id: string;
  orderId: string;
  status: OrderStatus;
  note?: string;
  changedByUserId?: string;
  changedAt: string;
};

export type OrderLoyaltyStatus = 'not-eligible' | 'eligible' | 'stamp-awarded' | 'already-stamped';

export type Order = {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  orderType: OrderType;
  items: OrderItem[];
  subtotal: number;
  serviceFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  statusTimeline?: OrderStatusHistoryItem[];
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  receiptImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  loyaltyStampPreparedAt?: string;
  loyaltyStampStatus?: OrderLoyaltyStatus;
  loyaltyStampedAt?: string;
  loyaltyStampedBy?: 'automatic-order-confirmation' | 'manual-staff-adjustment';
  loyaltyMessage?: string;
  loyaltyUnlockedRewards?: LoyaltyRewardName[];
};

export type OrderFilters = {
  query?: string;
  status?: OrderStatus | 'all';
  range?: DateRangePreset;
};

export type LoyaltyStampState = 'not-eligible' | 'eligible' | 'granted' | 'already-stamped';
