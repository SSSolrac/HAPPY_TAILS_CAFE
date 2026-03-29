import { useCallback, useEffect, useState } from 'react';
import { orderService } from '@/services/orderService';
import type { DateRangePreset } from '@/types/dashboard';
import type { Order, OrderStatus } from '@/types/order';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<OrderStatus | 'all'>('all');
  const [range, setRange] = useState<DateRangePreset>('1M');

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setOrders(await orderService.getOrders({ query, status, range }));
    } catch {
      setError('Unable to load orders.');
    } finally {
      setLoading(false);
    }
  }, [query, status, range]);

  const confirmPayment = useCallback(async (orderId: string) => {
    const updated = await orderService.confirmPayment(orderId);
    setOrders((rows) => rows.map((order) => (order.id === orderId ? updated : order)));
    return updated;
  }, []);

  const updateStatus = useCallback(async (orderId: string, nextStatus: OrderStatus) => {
    const updated = await orderService.updateOrderStatus(orderId, nextStatus);
    setOrders((rows) => rows.map((order) => (order.id === orderId ? updated : order)));
    return updated;
  }, []);

  const updateNotes = useCallback(async (orderId: string, notes: string) => {
    const updated = await orderService.updateOrderNotes(orderId, notes);
    setOrders((rows) => rows.map((order) => (order.id === orderId ? updated : order)));
    return updated;
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return {
    orders,
    loading,
    error,
    query,
    status,
    range,
    setQuery,
    setStatus,
    setRange,
    confirmPayment,
    updateStatus,
    updateNotes,
    refresh: loadOrders,
  };
};
