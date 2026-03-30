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
    } catch (loadError) {
      console.error('Failed to load orders', loadError);
      setError('Unable to load orders.');
    } finally {
      setLoading(false);
    }
  }, [query, status, range]);

  const getOrderById = useCallback(async (orderId: string) => {
    const updated = await orderService.getOrderById(orderId);
    setOrders((rows) => rows.map((order) => (order.id === orderId ? updated : order)));
    return updated;
  }, []);

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
    getOrderById,
    confirmPayment,
    updateStatus,
    refresh: loadOrders,
  };
};
