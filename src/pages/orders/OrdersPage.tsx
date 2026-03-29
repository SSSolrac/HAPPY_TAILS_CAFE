import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DateRangeFilter } from '@/components/dashboard';
import { useOrders } from '@/hooks/useOrders';
import { loyaltyService } from '@/services/loyaltyService';
import type { LoyaltyStampState, Order, OrderStatus } from '@/types/order';

const statuses: Array<OrderStatus | 'all'> = ['all', 'pending', 'preparing', 'ready', 'completed', 'cancelled', 'refunded', 'out-for-delivery', 'delivered'];

const getLoyaltyState = (order: Order): LoyaltyStampState => {
  if (loyaltyService.hasAlreadyBeenStamped(order)) return 'already-stamped';
  if (order.loyaltyStampPreparedAt) return 'granted';
  if (loyaltyService.canGrantLoyaltyStamp(order)) return 'eligible';
  return 'not-eligible';
};

const loyaltyLabel: Record<LoyaltyStampState, string> = {
  'not-eligible': 'Not eligible',
  eligible: 'Eligible after payment',
  granted: 'Stamp prepared',
  'already-stamped': 'Already stamped',
};

export const OrdersPage = () => {
  const {
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
  } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const statusSummary = useMemo(() => {
    return statuses
      .filter((item): item is OrderStatus => item !== 'all')
      .map((item) => ({ status: item, total: orders.filter((order) => order.status === item).length }));
  }, [orders]);

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3 justify-between">
          <div>
            <h2 className="text-lg font-semibold">Orders Operations</h2>
            <p className="text-sm text-slate-500">Track order progress, confirm payments, and handle notes.</p>
          </div>
          <DateRangeFilter value={range} onChange={setRange} />
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <label className="text-sm">
            Search
            <input className="block border rounded mt-1 px-2 py-1 w-full" placeholder="Order ID or customer" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <label className="text-sm">
            Status
            <select className="block border rounded mt-1 px-2 py-1 w-full" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | 'all')}>
              {statuses.map((value) => <option key={value} value={value}>{value === 'all' ? 'All statuses' : value}</option>)}
            </select>
          </label>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
          {statusSummary.map((item) => (
            <div key={item.status} className="border rounded p-2 capitalize">{item.status}: <strong>{item.total}</strong></div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 overflow-auto">
        <table className="w-full text-sm min-w-[980px]">
          <thead>
            <tr className="text-left">
              <th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Payment</th><th>Loyalty</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr className="border-t" key={order.id}>
                <td>{order.id}</td>
                <td>{order.customerName}</td>
                <td>{order.items.reduce((sum, item) => sum + item.qty, 0)} items</td>
                <td>${order.total.toFixed(2)}</td>
                <td>
                  <select
                    className="border rounded px-2 py-1"
                    value={order.status}
                    onChange={async (e) => {
                      await updateStatus(order.id, e.target.value as OrderStatus);
                      toast.success('Order status updated.');
                    }}
                  >
                    {statuses.filter((value) => value !== 'all').map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </td>
                <td className="capitalize">{order.paymentStatus} / {order.paymentMethod}</td>
                <td>{loyaltyLabel[getLoyaltyState(order)]}</td>
                <td className="space-x-2">
                  <button className="border rounded px-2 py-1" onClick={() => { setSelectedOrder(order); setNoteDraft(order.notes ?? ''); }}>Details</button>
                  <button
                    className="border rounded px-2 py-1"
                    onClick={async () => {
                      const updated = await confirmPayment(order.id);
                      toast.success(updated.loyaltyStampPreparedAt ? 'Payment confirmed and loyalty prepared.' : 'Payment confirmed.');
                    }}
                  >
                    Confirm Payment
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-20">
          <div className="w-full max-w-2xl rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Order details: {selectedOrder.id}</h3>
              <button className="border rounded px-2 py-1" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
            <p className="text-sm">Customer: {selectedOrder.customerName}</p>
            <p className="text-sm">Created: {new Date(selectedOrder.createdAt).toLocaleString()}</p>
            <p className="text-sm capitalize">Payment: {selectedOrder.paymentStatus} via {selectedOrder.paymentMethod}</p>
            <p className="text-sm">Loyalty: {loyaltyLabel[getLoyaltyState(selectedOrder)]}</p>
            <div className="border rounded p-3">
              <p className="font-medium text-sm mb-2">Items</p>
              <ul className="text-sm list-disc pl-5">
                {selectedOrder.items.map((item) => <li key={item.name}>{item.qty} x {item.name}</li>)}
              </ul>
            </div>

            <div>
              <p className="font-medium text-sm mb-1">Order notes (placeholder)</p>
              <textarea className="border rounded w-full px-2 py-1 text-sm" rows={4} value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} />
              <p className="text-xs text-slate-500 mt-1">TODO: sync to backend timeline and staff audit trail.</p>
            </div>

            <div className="flex gap-2">
              <button
                className="border rounded px-3 py-1"
                onClick={async () => {
                  const updated = await updateNotes(selectedOrder.id, noteDraft);
                  setSelectedOrder(updated);
                  toast.success('Order notes updated.');
                }}
              >
                Save Notes
              </button>
              <button
                className="border rounded px-3 py-1"
                onClick={async () => {
                  const updated = await confirmPayment(selectedOrder.id);
                  setSelectedOrder(updated);
                  toast.success('Payment confirmed.');
                }}
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
