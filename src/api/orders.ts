import { apiClient } from './client';
import { asRecord, unwrapArray, unwrapObject } from './response';
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
  orderNumber?: string;
  order_number?: string;
  status?: string;
  orderType?: string;
  order_type?: string;
  paymentMethod?: string;
  payment_method?: string;
  paymentStatus?: string;
  payment_status?: string;
  items?: Array<Partial<OrderItem> & { name?: string }>;
  order_items?: Array<Partial<OrderItem> & { name?: string }>;
  statusTimeline?: Array<Partial<OrderStatusHistoryItem>>;
  statusHistory?: Array<Partial<OrderStatusHistoryItem>>;
  status_history?: Array<Partial<OrderStatusHistoryItem>>;
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
  const unitPrice = Number(item.unitPrice ?? (asRecord(item)?.unit_price ?? 0));
  const lineTotal = Number(item.lineTotal ?? (asRecord(item)?.line_total ?? qty * unitPrice));

  return {
    id: item.id ?? `${orderId}-item-${index + 1}`,
    orderId,
    menuItemId: item.menuItemId ?? String(asRecord(item)?.menu_item_id ?? ''),
    itemName: item.itemName ?? item.name ?? String(asRecord(item)?.item_name ?? ''),
    qty,
    unitPrice,
    lineTotal,
  };
};

const mapStatusTimeline = (orderId: string, index: number, event: Partial<OrderStatusHistoryItem>): OrderStatusHistoryItem => {
  const row = asRecord(event) ?? {};
  return {
    id: event.id ?? `${orderId}-status-${index + 1}`,
    orderId,
    status: normalizeStatus(event.status ?? String(row.status ?? 'pending')),
    note: event.note ?? (row.note ? String(row.note) : undefined),
    changedByUserId: event.changedByUserId ?? (row.changed_by_user_id ? String(row.changed_by_user_id) : undefined),
    changedAt: event.changedAt ?? (row.changed_at ? String(row.changed_at) : new Date().toISOString()),
  };
};

export const mapOrder = (raw: CanonicalOrderResponse): Order => {
  const row = asRecord(raw) ?? {};
  const subtotal = Number(raw.subtotal ?? row.subtotal ?? 0);
  const serviceFee = Number(raw.serviceFee ?? row.service_fee ?? 0);
  const discount = Number(raw.discount ?? row.discount ?? 0);
  const total = Number(raw.total ?? row.total ?? subtotal + serviceFee - discount);

  const rawItems = raw.items ?? raw.order_items ?? [];
  const rawTimeline = raw.statusTimeline ?? raw.statusHistory ?? raw.status_history ?? [];

  return {
    id: raw.id,
    orderNumber: raw.orderNumber ?? raw.order_number ?? raw.id,
    customerId: raw.customerId ?? (row.customer_id ? String(row.customer_id) : undefined),
    customerName: raw.customerName ?? (row.customer_name ? String(row.customer_name) : 'Unknown'),
    customerEmail: raw.customerEmail ?? (row.customer_email ? String(row.customer_email) : undefined),
    customerPhone: raw.customerPhone ?? (row.customer_phone ? String(row.customer_phone) : undefined),
    customerAddress: raw.customerAddress ?? (row.customer_address ? String(row.customer_address) : undefined),
    orderType: normalizeOrderType(raw.orderType ?? raw.order_type),
    items: rawItems.map((item, index) => mapOrderItem(raw.id, index, item)),
    subtotal,
    serviceFee,
    discount,
    total,
    status: normalizeStatus(raw.status),
    statusTimeline: rawTimeline.map((event, index) => mapStatusTimeline(raw.id, index, event)),
    paymentStatus: normalizePaymentStatus(raw.paymentStatus ?? raw.payment_status),
    paymentMethod: normalizeOrderPaymentMethod(raw.paymentMethod ?? raw.payment_method),
    receiptImageUrl: raw.receiptImageUrl ?? (row.receipt_image_url ? String(row.receipt_image_url) : undefined),
    createdAt: raw.createdAt ?? (row.created_at ? String(row.created_at) : new Date().toISOString()),
    updatedAt: raw.updatedAt ?? (row.updated_at ? String(row.updated_at) : raw.createdAt ?? new Date().toISOString()),
    notes: raw.notes,
    loyaltyStampStatus: raw.loyaltyStampStatus ?? (row.loyalty_stamp_status ? String(row.loyalty_stamp_status) as Order['loyaltyStampStatus'] : undefined),
    loyaltyStampedAt: raw.loyaltyStampedAt ?? (row.loyalty_stamped_at ? String(row.loyalty_stamped_at) : undefined),
    loyaltyStampedBy: raw.loyaltyStampedBy ?? (row.loyalty_stamped_by ? String(row.loyalty_stamped_by) as Order['loyaltyStampedBy'] : undefined),
    loyaltyMessage: raw.loyaltyMessage ?? (row.loyalty_message ? String(row.loyalty_message) : undefined),
    loyaltyUnlockedRewards: raw.loyaltyUnlockedRewards,
  };
};

const requireOrder = (payload: unknown): CanonicalOrderResponse => {
  const row = unwrapObject<CanonicalOrderResponse>(payload);
  if (!row || !row.id) throw new Error('Order response did not include an id.');
  return row;
};

export const ordersApi = {
  async list(filters?: OrderFilters): Promise<Order[]> {
    const payload = await apiClient.get<unknown>('/api/orders', {
      query: filters?.query,
      status: filters?.status && filters.status !== 'all' ? filters.status : undefined,
      range: filters?.range,
    });

    return unwrapArray<CanonicalOrderResponse>(payload)
      .filter((row): row is CanonicalOrderResponse => Boolean(row?.id))
      .map(mapOrder);
  },

  async getById(orderId: string): Promise<Order> {
    const payload = await apiClient.get<unknown>(`/api/orders/${orderId}`);
    return mapOrder(requireOrder(payload));
  },

  async getStatusTimeline(orderId: string): Promise<OrderStatusHistoryItem[]> {
    const payload = await apiClient.get<unknown>(`/api/orders/${orderId}/history`);
    return unwrapArray<Partial<OrderStatusHistoryItem>>(payload).map((event, index) => mapStatusTimeline(orderId, index, event));
  },

  async updatePayment(orderId: string, paymentStatus: PaymentStatus): Promise<Order> {
    const payload = await apiClient.patch<unknown>(`/api/orders/${orderId}/payment`, { paymentStatus });
    return mapOrder(requireOrder(payload));
  },

  async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const payload = await apiClient.patch<unknown>(`/api/orders/${orderId}/status`, { status });
    return mapOrder(requireOrder(payload));
  },
};
