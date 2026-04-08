import { AppError, normalizeError } from '@/lib/errors';
import { mapCustomerProfileRow, mapOrderItemRow, mapOrderRow, mapOrderStatusHistoryRow } from '@/lib/mappers';
import { requireSupabaseClient } from '@/lib/supabase';
import type { DateRangePreset } from '@/types/dashboard';
import type { Order, OrderFilters, OrderStatus } from '@/types/order';

const asDbError = (error: unknown, fallback = 'Database request failed.') => {
  const normalized = normalizeError(error, { fallbackMessage: fallback });
  if (normalized.code === '54001' || /stack depth limit exceeded/i.test(normalized.message)) {
    return new AppError({
      category: 'backend',
      code: normalized.code,
      status: normalized.status,
      details: normalized.details,
      hint: normalized.hint,
      cause: error,
      message:
        "Supabase failed to load order data (Postgres error 54001: stack depth limit exceeded). This is usually caused by a recursive Row Level Security (RLS) policy on the 'orders'/'order_items' tables. Fix the RLS policies in Supabase.",
    });
  }

  return normalized;
};

const rangeToDays: Record<Exclude<DateRangePreset, 'all'>, number> = {
  today: 0,
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '3m': 90,
  '6m': 180,
  '1y': 365,
};

const startOfToday = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const rangeStartIso = (range: DateRangePreset): string | null => {
  if (range === 'all') return null;
  if (range === 'today') return startOfToday().toISOString();
  const days = rangeToDays[range];
  const start = new Date();
  start.setDate(start.getDate() - days);
  return start.toISOString();
};

const requireUserId = async () => {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw asDbError(error, 'Unable to load session.');
  if (!data.user) throw new AppError({ category: 'auth', message: 'You must be signed in.' });
  return data.user.id;
};

const attachOrderRelations = async (orders: Array<ReturnType<typeof mapOrderRow>>): Promise<Order[]> => {
  const supabase = requireSupabaseClient();
  const orderIds = orders.map((o) => o.id).filter(Boolean);
  const customerIds = orders.map((o) => o.customerId).filter((id): id is string => Boolean(id));

  const [itemsResult, customersResult] = await Promise.all([
    orderIds.length ? supabase.from('order_items').select('*').in('order_id', orderIds) : Promise.resolve({ data: [], error: null }),
    customerIds.length ? supabase.from('profiles').select('*').in('id', customerIds) : Promise.resolve({ data: [], error: null }),
  ]);

  if (itemsResult.error) throw asDbError(itemsResult.error, 'Unable to load order items.');
  if (customersResult.error) throw asDbError(customersResult.error, 'Unable to load customer profiles.');

  const itemsByOrderId = (Array.isArray(itemsResult.data) ? itemsResult.data : []).reduce<Record<string, Order['items']>>((acc, row) => {
    const item = mapOrderItemRow(row);
    if (!acc[item.orderId]) acc[item.orderId] = [];
    acc[item.orderId]!.push(item);
    return acc;
  }, {});

  const customerById = new Map(
    (Array.isArray(customersResult.data) ? customersResult.data : []).map((row) => {
      const customer = mapCustomerProfileRow(row);
      return [customer.id, customer] as const;
    }),
  );

  return orders.map((order) => ({
    ...order,
    items: itemsByOrderId[order.id] ?? [],
    customer: order.customerId ? customerById.get(order.customerId) ?? null : null,
  }));
};

const fetchOrderById = async (orderId: string): Promise<Order> => {
  const supabase = requireSupabaseClient();
  const { data: orderRow, error: orderError } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
  if (orderError) throw asDbError(orderError, 'Unable to load order.');
  if (!orderRow) throw new Error('Order not found.');

  const base = mapOrderRow(orderRow);

  const [itemsResult, historyResult, customerResult] = await Promise.all([
    supabase.from('order_items').select('*').eq('order_id', orderId),
    supabase.from('order_status_history').select('*').eq('order_id', orderId).order('changed_at', { ascending: true }),
    base.customerId ? supabase.from('profiles').select('*').eq('id', base.customerId).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);

  if (itemsResult.error) throw asDbError(itemsResult.error, 'Unable to load order items.');
  if (historyResult.error) throw asDbError(historyResult.error, 'Unable to load status history.');
  if (customerResult.error) throw asDbError(customerResult.error, 'Unable to load customer profile.');

  return {
    ...base,
    items: (Array.isArray(itemsResult.data) ? itemsResult.data : []).map(mapOrderItemRow),
    statusTimeline: (Array.isArray(historyResult.data) ? historyResult.data : []).map(mapOrderStatusHistoryRow),
    customer: customerResult.data ? mapCustomerProfileRow(customerResult.data) : null,
  };
};

export const orderService = {
  async getOrders(filters?: OrderFilters): Promise<Order[]> {
    const supabase = requireSupabaseClient();
    const range = filters?.range ?? '30d';
    const status = filters?.status ?? 'all';
    const queryText = filters?.query?.trim() ?? '';

    let query = supabase.from('orders').select('*').order('placed_at', { ascending: false });

    const startIso = rangeStartIso(range);
    if (startIso) query = query.gte('placed_at', startIso);
    if (status !== 'all') query = query.eq('status', status);
    if (queryText) query = query.ilike('code', `%${queryText}%`);

    const { data, error } = await query;
    if (error) throw asDbError(error, 'Unable to load orders.');

    const mapped = (Array.isArray(data) ? data : []).map(mapOrderRow);
    return attachOrderRelations(mapped);
  },

  async getOrderById(orderId: string): Promise<Order> {
    return fetchOrderById(orderId);
  },

  async confirmPayment(orderId: string): Promise<Order> {
    const supabase = requireSupabaseClient();
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: 'paid', updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) throw asDbError(error, 'Unable to confirm payment.');
    return fetchOrderById(orderId);
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const supabase = requireSupabaseClient();
    const userId = await requireUserId();
    const changedAt = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status, updated_at: changedAt })
      .eq('id', orderId);

    if (updateError) throw asDbError(updateError, 'Unable to update order status.');

    const { error: historyError } = await supabase.from('order_status_history').insert({
      order_id: orderId,
      status,
      changed_by: userId,
      note: null,
      changed_at: changedAt,
    });

    if (historyError) throw asDbError(historyError, 'Unable to write status history.');

    return fetchOrderById(orderId);
  },
};
