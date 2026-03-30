import { apiClient } from './client';
import type { Order, OrderFilters, OrderItem, OrderStatus, OrderStatusHistoryItem, PaymentMethod, PaymentStatus } from '@/types/order';

type CanonicalOrderResponse = Partial<Order> & {
  id: string;
  orderNumber?: string;
  status?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  items?: Array<Partial<OrderItem>>;
  statusHistory?: Array<Partial<OrderStatusHistoryItem>>;
};

const allowedStatuses: OrderStatus[] = ['pending', 'preparing', 'ready', 'out_for_delivery', 'completed', 'delivered', 'cancelled', 'refunded'];
const allowedPaymentMethods: PaymentMethod[] = ['cash', 'card', 'e_wallet'];
const allowedPaymentStatuses: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded'];

const normalizeStatus = (status: string | undefined): OrderStatus => {
  const normalized = (status ?? 'pending').replaceAll('-', '_') as OrderStatus;
  return allowedStatuses.includes(normalized) ? normalized : 'pending';
};

const normalizePaymentMethod = (method: string | undefined): PaymentMethod => {
  const normalized = (method ?? 'cash').replaceAll('-', '_') as PaymentMethod;
  return allowedPaymentMethods.includes(normalized) ? normalized : 'cash';
};

const normalizePaymentStatus = (status: string | undefined): PaymentStatus => {
  const normalized = (status ?? 'pending') as PaymentStatus;
  return allowedPaymentStatuses.includes(normalized) ? normalized : 'pending';
};

const mapOrderItem = (orderId: string, index: number, item: Partial<OrderItem>): OrderItem => {
  const qty = Number(item.qty ?? 0);
  const unitPrice = Number(item.unitPrice ?? 0);
  const lineTotal = Number(item.lineTotal ?? qty * unitPrice);

  return {
    id: item.id ?? `${orderId}-item-${index + 1}`,
    orderId,
    menuItemId: item.menuItemId,
    itemName: item.itemName ?? '',
    qty,
    unitPrice,
    lineTotal,
  };
};

const mapStatusHistory = (orderId: string, index: number, event: Partial<OrderStatusHistoryItem>): OrderStatusHistoryItem => ({
  id: event.id ?? `${orderId}-status-${index + 1}`,
  orderId,
  status: normalizeStatus(event.status),
  note: event.note,
  changedByUserId: event.changedByUserId,
  changedAt: event.changedAt ?? new Date().toISOString(),
});

const mapOrder = (raw: CanonicalOrderResponse): Order => {
  const subtotal = Number(raw.subtotal ?? 0);
  const serviceFee = Number(raw.serviceFee ?? 0);
  const discount = Number(raw.discount ?? 0);
  const total = Number(raw.total ?? subtotal + serviceFee - discount);

  return {
    id: raw.id,
    orderNumber: raw.orderNumber ?? raw.id,
    customerId: raw.customerId,
    customerName: raw.customerName ?? 'Unknown',
    customerEmail: raw.customerEmail,
    customerPhone: raw.customerPhone,
    customerAddress: raw.customerAddress,
    orderType: raw.orderType ?? 'pickup',
    items: (raw.items ?? []).map((item, index) => mapOrderItem(raw.id, index, item)),
    subtotal,
    serviceFee,
    discount,
    total,
    status: normalizeStatus(raw.status),
    statusHistory: (raw.statusHistory ?? []).map((event, index) => mapStatusHistory(raw.id, index, event)),
    paymentStatus: normalizePaymentStatus(raw.paymentStatus),
    paymentMethod: normalizePaymentMethod(raw.paymentMethod),
    receiptImageUrl: raw.receiptImageUrl,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? raw.createdAt ?? new Date().toISOString(),
    notes: raw.notes,
    loyaltyStampStatus: raw.loyaltyStampStatus,
    loyaltyStampedAt: raw.loyaltyStampedAt,
    loyaltyStampedBy: raw.loyaltyStampedBy,
    loyaltyMessage: raw.loyaltyMessage,
    loyaltyUnlockedRewards: raw.loyaltyUnlockedRewards,
  };
};

export const ordersApi = {
  async list(filters?: OrderFilters): Promise<Order[]> {
    const rows = await apiClient.get<CanonicalOrderResponse[]>('/api/orders', {
      query: filters?.query,
      status: filters?.status && filters.status !== 'all' ? filters.status : undefined,
      range: filters?.range,
    });
    return rows.map(mapOrder);
  },

  async confirmPayment(orderId: string): Promise<Order> {
    const row = await apiClient.post<CanonicalOrderResponse>(`/api/orders/${orderId}/confirm-payment`);
    return mapOrder(row);
  },

  async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const row = await apiClient.patch<CanonicalOrderResponse>(`/api/orders/${orderId}/status`, { status });
    return mapOrder(row);
  },

  async updateNotes(orderId: string, notes: string): Promise<Order> {
    const row = await apiClient.patch<CanonicalOrderResponse>(`/api/orders/${orderId}/notes`, { notes });
    return mapOrder(row);
  },
};
