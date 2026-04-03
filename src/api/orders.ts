import { apiClient } from './client';
import { asRecord, unwrapDataArray, unwrapDataObject } from './response';
import type {
  Order,
  OrderFilters,
  OrderItem,
  OrderStatus,
  OrderStatusHistoryItem,
  OrderType,
  PaymentMethod,
  PaymentStatus,
} from '@/types/order';
import { normalizePaymentMethod } from '@/utils/payment';

type CanonicalOrderResponse = Partial<Order> & {
  id: string;
  items?: Array<Partial<OrderItem> & { name?: string }>;
  statusTimeline?: Array<Partial<OrderStatusHistoryItem>>;
};

const allowedStatuses: OrderStatus[] = ['pending', 'preparing', 'ready', 'out_for_delivery', 'completed', 'delivered', 'cancelled', 'refunded'];
const allowedOrderTypes: OrderType[] = ['dine_in', 'pickup', 'takeout', 'delivery'];
const allowedPaymentMethods: PaymentMethod[] = ['qrph', 'gcash', 'maribank', 'bdo'];
const allowedPaymentStatuses: PaymentStatus[] = ['pending', 'paid', 'failed', 'refunded'];

const normalizeStatus = (status: string | undefined): OrderStatus => {
  const normalized = (status ?? 'pending').replaceAll('-', '_') as OrderStatus;
  return allowedStatuses.includes(normalized) ? normalized : 'pending';
};
const normalizeOrderType = (orderType: string | undefined): OrderType => {
  const normalized = (orderType ?? 'pickup').replaceAll('-', '_') as OrderType;
  return allowedOrderTypes.includes(normalized) ? normalized : 'pickup';
};
const normalizeOrderPaymentMethod = (method: string | undefined): PaymentMethod => {
  const normalized = normalizePaymentMethod(method);
  return allowedPaymentMethods.includes(normalized) ? normalized : 'qrph';
};
const normalizePaymentStatus = (status: string | undefined): PaymentStatus => {
  const normalized = (status ?? 'pending') as PaymentStatus;
  return allowedPaymentStatuses.includes(normalized) ? normalized : 'pending';
};

const mapOrderItem = (orderId: string, index: number, item: Partial<OrderItem> & { name?: string }): OrderItem => {
  const qty = Number(item.qty ?? 0);
  const unitPrice = Number(item.unitPrice ?? 0);
  return {
    id: item.id ?? `${orderId}-item-${index + 1}`,
    orderId,
    menuItemId: item.menuItemId ?? '',
    itemName: item.itemName ?? item.name ?? '',
    qty,
    unitPrice,
    lineTotal: Number(item.lineTotal ?? qty * unitPrice),
  };
};

const mapStatusTimeline = (orderId: string, index: number, event: Partial<OrderStatusHistoryItem>): OrderStatusHistoryItem => ({
  id: event.id ?? `${orderId}-status-${index + 1}`,
  orderId,
  status: normalizeStatus(event.status),
  note: event.note,
  changedByUserId: event.changedByUserId,
  changedAt: event.changedAt ?? new Date().toISOString(),
});

export const mapOrder = (raw: CanonicalOrderResponse): Order => {
  const row = asRecord(raw) ?? {};
  const subtotal = Number(raw.subtotal ?? row.subtotal ?? 0);
  const serviceFee = Number(raw.serviceFee ?? row.serviceFee ?? 0);
  const discount = Number(raw.discount ?? row.discount ?? 0);
  const total = Number(raw.total ?? row.total ?? subtotal + serviceFee - discount);

  return {
    id: raw.id,
    orderNumber: raw.orderNumber ?? raw.id,
    customerId: raw.customerId,
    customerName: raw.customerName ?? 'Unknown',
    customerEmail: raw.customerEmail,
    customerPhone: raw.customerPhone,
    customerAddress: raw.customerAddress,
    orderType: normalizeOrderType(raw.orderType),
    items: (raw.items ?? []).map((item, index) => mapOrderItem(raw.id, index, item)),
    subtotal,
    serviceFee,
    discount,
    total,
    status: normalizeStatus(raw.status),
    statusTimeline: (raw.statusTimeline ?? []).map((event, index) => mapStatusTimeline(raw.id, index, event)),
    paymentStatus: normalizePaymentStatus(raw.paymentStatus),
    paymentMethod: normalizeOrderPaymentMethod(raw.paymentMethod),
    receiptImageUrl: raw.receiptImageUrl,
    createdAt: raw.createdAt ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? raw.createdAt ?? new Date().toISOString(),
    notes: raw.notes,
  };
};

export const ordersApi = {
  async list(filters?: OrderFilters): Promise<Order[]> {
    const payload = await apiClient.get<unknown>('/api/orders', {
      query: filters?.query,
      status: filters?.status && filters.status !== 'all' ? filters.status : undefined,
      range: filters?.range,
    });

    return unwrapDataArray<CanonicalOrderResponse>(payload)
      .filter((row): row is CanonicalOrderResponse => Boolean(row?.id))
      .map(mapOrder);
  },

  async getById(orderId: string): Promise<Order> {
    const payload = await apiClient.get<unknown>(`/api/orders/${orderId}`);
    return mapOrder(unwrapDataObject<CanonicalOrderResponse>(payload));
  },

  async getStatusTimeline(orderId: string): Promise<OrderStatusHistoryItem[]> {
    const payload = await apiClient.get<unknown>(`/api/orders/${orderId}/history`);
    return unwrapDataArray<Partial<OrderStatusHistoryItem>>(payload).map((event, index) => mapStatusTimeline(orderId, index, event));
  },

  async updatePayment(orderId: string, paymentStatus: PaymentStatus): Promise<Order> {
    const payload = await apiClient.patch<unknown>(`/api/orders/${orderId}/payment`, { paymentStatus });
    return mapOrder(unwrapDataObject<CanonicalOrderResponse>(payload));
  },

  async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const payload = await apiClient.patch<unknown>(`/api/orders/${orderId}/status`, { status });
    return mapOrder(unwrapDataObject<CanonicalOrderResponse>(payload));
  },
};
