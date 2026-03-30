import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { DateRangeFilter } from '@/components/dashboard';
import { StatusChip } from '@/components/ui';
import { useOrders } from '@/hooks/useOrders';
import { loyaltyService } from '@/services/loyaltyService';
import { formatCurrency } from '@/utils/currency';
import type { LoyaltyStampState, Order, OrderStatus } from '@/types/order';

const statuses: Array<OrderStatus | 'all'> = ['all', 'pending', 'preparing', 'ready', 'completed', 'cancelled', 'refunded', 'out_for_delivery', 'delivered'];

const getLoyaltyState = (order: Order): LoyaltyStampState => {
  if (order.loyaltyStampStatus === 'stamp-awarded') return 'granted';
  if (order.loyaltyStampStatus === 'already-stamped' || loyaltyService.hasOrderAlreadyBeenStamped(order.id)) return 'already-stamped';
  if (loyaltyService.canGrantStamp(order)) return 'eligible';
  return 'not-eligible';
};

const loyaltyLabel: Record<LoyaltyStampState, string> = {
  'not-eligible': 'Not eligible',
  eligible: 'Loyalty eligible',
  granted: 'Stamp awarded',
  'already-stamped': 'Already stamped',
};

const statusTone = (status: OrderStatus) => {
  if (status === 'completed' || status === 'delivered') return 'success';
  if (status === 'cancelled' || status === 'refunded') return 'danger';
  if (status === 'pending') return 'warning';
  return 'neutral';
};

export const OrdersPage = () => {
  const { orders, loading, error, query, status, range, setQuery, setStatus, setRange, confirmPayment, updateStatus } = useOrders();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const statusSummary = useMemo(() => statuses.filter((item): item is OrderStatus => item !== 'all').map((item) => ({ status: item, total: orders.filter((order) => order.status === item).length })), [orders]);

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3 justify-between">
          <div>
            <h2 className="text-lg font-semibold">Orders Operations</h2>
            <p className="text-sm text-[#6B7280]">Track order progress, confirm payments, and auto-award loyalty stamps (10-stamp card: Free Latte at 6, Free Groom at 10).</p>
          </div>
          <DateRangeFilter value={range} onChange={setRange} />
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <label className="text-sm">Search
            <input className="block border rounded mt-1 px-2 py-1 w-full" placeholder="Order ID or customer" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          <label className="text-sm">Status
            <select className="block border rounded mt-1 px-2 py-1 w-full" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | 'all')}>
              {statuses.map((value) => <option key={value} value={value}>{value === 'all' ? 'All statuses' : value}</option>)}
            </select>
          </label>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
          {statusSummary.map((item) => <div key={item.status} className="border rounded p-2 capitalize">{item.status}: <strong>{item.total}</strong></div>)}
        </div>
      </section>

      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 overflow-auto">
        <table className="w-full text-sm min-w-[1080px]">
          <thead><tr className="text-left"><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Payment</th><th>Loyalty</th><th>Actions</th></tr></thead>
          <tbody>
            {orders.map((order) => {
              const paid = order.paymentStatus === 'paid';
              const loyaltyState = getLoyaltyState(order);
              return (
                <tr className="border-t" key={order.orderNumber}>
                  <td className="font-medium">{order.orderNumber}</td>
                  <td>{order.customerName}</td>
                  <td>{order.items.reduce((sum, item) => sum + item.qty, 0)} items</td>
                  <td>{formatCurrency(order.total)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <StatusChip label={order.status.replaceAll('_', ' ')} tone={statusTone(order.status)} />
                      <select className="border rounded px-2 py-1" value={order.status} onChange={async (e) => { await updateStatus(order.id, e.target.value as OrderStatus); toast.success('Order status updated.'); }}>
                        {statuses.filter((value) => value !== 'all').map((value) => <option key={value} value={value}>{value}</option>)}
                      </select>
                    </div>
                  </td>
                  <td><StatusChip label={`${order.paymentStatus} · ${order.paymentMethod}`} tone={paid ? 'success' : 'warning'} /></td>
                  <td>
                    <div>
                      <p>{loyaltyLabel[loyaltyState]}</p>
                      {order.loyaltyUnlockedRewards?.length ? <p className="text-xs text-emerald-700">Reward unlocked: {order.loyaltyUnlockedRewards.join(', ')}</p> : null}
                    </div>
                  </td>
                  <td className="space-x-2">
                    <button className="border rounded px-2 py-1" onClick={() => { setSelectedOrder(order); setNoteDraft(order.notes ?? ''); }}>Details</button>
                    <button
                      className="border rounded px-2 py-1 disabled:opacity-50"
                      disabled={paid && loyaltyState === 'already-stamped'}
                      onClick={async () => {
                        const updated = await confirmPayment(order.id);
                        if (updated.loyaltyStampStatus === 'stamp-awarded') toast.success('Payment confirmed. 1 stamp auto-awarded.');
                        else if (updated.loyaltyStampStatus === 'already-stamped') toast.info('Payment confirmed. Loyalty was already applied for this order.');
                        else toast.success('Payment confirmed.');
                      }}
                    >
                      {paid ? 'Recheck Payment' : 'Confirm Payment'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-20">
          <div className="w-full max-w-4xl rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Order details: {selectedOrder.id}</h3>
              <button className="border rounded px-2 py-1" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="border rounded p-3 space-y-1">
                <p><strong>Customer:</strong> {selectedOrder.customerName}</p>
                <p><strong>Email:</strong> {selectedOrder.customerEmail ?? 'Not provided'}</p>
                <p><strong>Phone:</strong> {selectedOrder.customerPhone ?? 'Not provided'}</p>
                <p><strong>Created:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
                <p className="capitalize"><strong>Payment:</strong> {selectedOrder.paymentStatus} via {selectedOrder.paymentMethod.replace('_', '-')}</p>
                <p><strong>Loyalty:</strong> {loyaltyLabel[getLoyaltyState(selectedOrder)]}</p>
                <p><strong>Loyalty Source:</strong> {selectedOrder.loyaltyStampedBy === 'automatic-order-confirmation' ? 'Automatic from order confirmation' : 'Not yet stamped'}</p>
                <p><strong>Loyalty Note:</strong> {selectedOrder.loyaltyMessage ?? 'No loyalty activity yet.'}</p>
                {selectedOrder.loyaltyUnlockedRewards?.length ? <p><strong>Reward unlocked:</strong> {selectedOrder.loyaltyUnlockedRewards.join(', ')}</p> : null}
              </div>

              <div className="border rounded p-3 space-y-2 text-sm">
                <p className="font-medium">Amount Breakdown</p>
                {selectedOrder.items.map((item) => <p key={item.itemName}>{item.qty} × {item.itemName} · {formatCurrency(item.qty * item.unitPrice)}</p>)}
                <p>Service fee: {formatCurrency(selectedOrder.serviceFee ?? 0)}</p>
                <p>Discount: -{formatCurrency(selectedOrder.discount ?? 0)}</p>
                <p className="font-semibold">Grand total: {formatCurrency(selectedOrder.total)}</p>
              </div>
            </div>

            {selectedOrder.paymentMethod === 'e_wallet' && (
              <div className="border rounded p-3">
                <p className="font-medium text-sm mb-2">Payment proof preview</p>
                {selectedOrder.receiptImageUrl ? <img src={selectedOrder.receiptImageUrl} alt="Payment proof" className="h-36 rounded border object-cover" /> : <p className="text-sm text-[#6B7280]">No proof attached yet.</p>}
              </div>
            )}

            <div className="border rounded p-3">
              <p className="font-medium text-sm mb-2">Status timeline</p>
              <div className="space-y-2 text-sm">
                {selectedOrder.statusHistory.map((event, index) => (
                  <div key={`${event.changedAt}-${event.status}-${index}`} className="border-l-2 pl-3">
                    <p className="capitalize font-medium">{event.status.replaceAll('_', ' ')}</p>
                    <p className="text-[#6B7280]">{new Date(event.changedAt).toLocaleString()}</p>
                    {event.note && <p className="text-[#6B7280]">{event.note}</p>}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="font-medium text-sm mb-1">Internal order notes</p>
              <textarea className="border rounded w-full px-2 py-1 text-sm" rows={4} value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} />
              <p className="text-xs text-[#6B7280] mt-1">Notes are shown from order data. Editing requires a dedicated backend endpoint.</p>
            </div>

            <div className="flex gap-2">
              <button className="border rounded px-3 py-1" onClick={async () => { const updated = await updateNotes(selectedOrder.id, noteDraft); setSelectedOrder(updated); toast.success('Order notes updated.'); }}>Save Notes</button>
              <button
                className="border rounded px-3 py-1 disabled:opacity-50"
                disabled={selectedOrder.paymentStatus === 'paid' && getLoyaltyState(selectedOrder) === 'already-stamped'}
                onClick={async () => {
                  const updated = await confirmPayment(selectedOrder.id);
                  setSelectedOrder(updated);
                  if (updated.loyaltyStampStatus === 'stamp-awarded') toast.success('Payment confirmed. Stamp auto-awarded.');
                  else if (updated.loyaltyStampStatus === 'already-stamped') toast.info('Payment already confirmed and stamp already applied.');
                  else toast.success('Payment confirmed.');
                }}
              >
                {selectedOrder.paymentStatus === 'paid' ? 'Recheck Payment' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
