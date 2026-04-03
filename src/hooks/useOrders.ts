import { useCallback, useEffect, useState } from 'react';
import { orderService } from '@/services/orderService';
import { notificationService } from '@/services/notificationService';
import type { DateRangePreset } from '@/types/dashboard';
import type { Order, OrderStatus } from '@/types/order';

export const useOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<OrderStatus | 'all'>('all');
  const [range, setRange] = useState<DateRangePreset>('1M');
  const [knownOrderState, setKnownOrderState] = useState<Record<string, OrderStatus>>({});

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const rows = await orderService.getOrders({ query, status, range });
      setOrders(rows);
      setKnownOrderState((known) => {
        const next = { ...known };
        rows.forEach((order) => {
          if (!next[order.id]) {
            if (Date.now() - new Date(order.createdAt).getTime() <= 5 * 60 * 1000) {
              notificationService.create({
                type: 'new_order',
                title: 'New order received',
                message: `${order.orderNumber} placed by ${order.customerName}.`,
                relatedOrderId: order.id,
              });
            }
          } else if (next[order.id] !== 'cancelled' && order.status === 'cancelled') {
            notificationService.create({
              type: 'order_cancelled',
              title: 'Order cancelled',
              message: `${order.orderNumber} was cancelled.`,
              relatedOrderId: order.id,
            });
          }
          next[order.id] = order.status;
        });
        return next;
      });
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
    if (nextStatus === 'cancelled') {
      notificationService.create({
        type: 'order_cancelled',
        title: 'Order cancelled',
        message: `${updated.orderNumber} was cancelled.`,
        relatedOrderId: updated.id,
      });
    }
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
