import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Image, StatusChip } from '@/components/ui';
import { useMenuItems } from '@/hooks/useMenuItems';
import { notificationService } from '@/services/notificationService';
import type { MenuItem } from '@/types/menuItem';
import { formatCurrency } from '@/utils/currency';
import { clampStockValue, clampThresholdValue, computeInventoryStatus, getInventoryStatusLabel } from '@/utils/inventory';

const defaultDraft: MenuItem = {
  id: '',
  name: '',
  categoryId: '',
  description: '',
  price: 0,
  isAvailable: true,
  imageUrl: '',
  stock: 0,
  lowStockThreshold: 5,
  inventoryStatus: 'out_of_stock',
  discount: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const MenuManagementPage = () => {
  const { items, loading, error, saveItem, deleteItem } = useMenuItems();
  const [draft, setDraft] = useState<MenuItem>(defaultDraft);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [inventoryStatus, setInventoryStatus] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [discountValue, setDiscountValue] = useState(10);

  const categories = useMemo(() => ['All', ...Array.from(new Set(items.map((item) => item.categoryId || 'uncategorized')))], [items]);

  const filtered = useMemo(() => items.filter((item) => {
    const byQuery = item.name.toLowerCase().includes(query.toLowerCase());
    const byCategory = categoryFilter === 'All' || (item.categoryId || 'uncategorized') === categoryFilter;
    const byStatus = inventoryStatus === 'all' || item.inventoryStatus === inventoryStatus;
    return byQuery && byCategory && byStatus;
  }), [items, query, categoryFilter, inventoryStatus]);

  const selectedSet = useMemo(() => new Set(selectedItemIds), [selectedItemIds]);

  const handleSaveInventory = async (item: MenuItem, stock: number, lowStockThreshold: number) => {
    const next: MenuItem = {
      ...item,
      stock: clampStockValue(stock),
      lowStockThreshold: clampThresholdValue(lowStockThreshold),
      inventoryStatus: computeInventoryStatus(clampStockValue(stock), clampThresholdValue(lowStockThreshold)),
      updatedAt: new Date().toISOString(),
    };
    await saveItem(next);

    if (next.inventoryStatus === 'out_of_stock') {
      notificationService.create({
        type: 'out_of_stock',
        title: 'Inventory out of stock',
        message: `${next.name} is out of stock.`,
        relatedInventoryItemId: next.id,
      });
    } else if (next.inventoryStatus === 'low_stock') {
      notificationService.create({
        type: 'low_stock',
        title: 'Low stock warning',
        message: `${next.name} stock is low (${next.stock} left).`,
        relatedInventoryItemId: next.id,
      });
    }
  };

  if (loading) return <p>Loading menu...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3">
        <h2 className="text-lg font-semibold">Menu + Inventory + Discounts</h2>
        <p className="text-sm text-[#6B7280]">Manage menu records and operational stock, including low-stock thresholds and discount bulk actions.</p>

        <div className="grid md:grid-cols-2 gap-3">
          <label className="text-sm">Item Name<input className="block border rounded mt-1 px-2 py-1 w-full" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></label>
          <label className="text-sm">Category ID<input className="block border rounded mt-1 px-2 py-1 w-full" value={draft.categoryId ?? ''} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })} /></label>
          <label className="text-sm">Price<input type="number" min={0} step="0.01" className="block border rounded mt-1 px-2 py-1 w-full" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} /></label>
          <label className="text-sm">Image URL<input className="block border rounded mt-1 px-2 py-1 w-full" value={draft.imageUrl ?? ''} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} /></label>
          <label className="text-sm">Stock<input type="number" min={0} className="block border rounded mt-1 px-2 py-1 w-full" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: clampStockValue(Number(e.target.value)) })} /></label>
          <label className="text-sm">Low-stock threshold<input type="number" min={0} className="block border rounded mt-1 px-2 py-1 w-full" value={draft.lowStockThreshold} onChange={(e) => setDraft({ ...draft, lowStockThreshold: clampThresholdValue(Number(e.target.value)) })} /></label>
          <label className="text-sm md:col-span-2">Description<input className="block border rounded mt-1 px-2 py-1 w-full" value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
        </div>

        <div className="flex flex-wrap gap-3 text-sm"><label><input type="checkbox" checked={draft.isAvailable} onChange={(e) => setDraft({ ...draft, isAvailable: e.target.checked })} /> Available</label></div>

        <div className="flex gap-2">
          <button className="border rounded px-3 py-1" onClick={async () => {
            if (!draft.name.trim()) return toast.error('Item name is required.');
            if (draft.price <= 0) return toast.error('Price must be greater than 0.');
            const stock = clampStockValue(draft.stock);
            const threshold = clampThresholdValue(draft.lowStockThreshold);
            await saveItem({ ...draft, stock, lowStockThreshold: threshold, inventoryStatus: computeInventoryStatus(stock, threshold), updatedAt: new Date().toISOString(), createdAt: draft.createdAt || new Date().toISOString() });
            setDraft(defaultDraft);
            toast.success('Menu item saved.');
          }}>{draft.id ? 'Update Item' : 'Add Item'}</button>
          {draft.id && <button className="border rounded px-3 py-1" onClick={() => setDraft(defaultDraft)}>Cancel edit</button>}
        </div>
      </section>

      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-4">
        <div className="flex flex-wrap gap-3 items-end justify-between">
          <h3 className="font-medium">Inventory Tracker</h3>
          <div className="flex flex-wrap gap-2">
            <input className="border rounded px-2 py-1 text-sm" placeholder="Search item" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select className="border rounded px-2 py-1 text-sm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select>
            <select className="border rounded px-2 py-1 text-sm" value={inventoryStatus} onChange={(e) => setInventoryStatus(e.target.value as typeof inventoryStatus)}>
              <option value="all">All stock</option><option value="in_stock">In stock</option><option value="low_stock">Low stock</option><option value="out_of_stock">Out of stock</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <button className="border rounded px-2 py-1" onClick={() => setSelectedItemIds(filtered.map((item) => item.id))}>Select all visible</button>
          <button className="border rounded px-2 py-1" onClick={() => setSelectedItemIds([])}>Clear selections</button>
          <input className="border rounded px-2 py-1 w-24" type="number" min={1} max={100} value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} />
          <button className="border rounded px-2 py-1" onClick={async () => {
            if (discountValue <= 0 || discountValue > 100) return toast.error('Discount must be between 1 and 100%.');
            if (selectedItemIds.length === 0) return toast.error('Select at least one item.');
            await Promise.all(items.filter((item) => selectedSet.has(item.id)).map((item) => saveItem({ ...item, discount: { type: 'percentage', value: discountValue, isActive: true }, updatedAt: new Date().toISOString() })));
            notificationService.create({ type: 'promo_updated', title: 'Discount updated', message: `Discount ${discountValue}% applied to ${selectedItemIds.length} item(s).` });
            toast.success('Discount applied to selected items.');
          }}>Bulk apply discount</button>
          <button className="border rounded px-2 py-1" onClick={async () => {
            if (selectedItemIds.length === 0) return toast.error('Select at least one item.');
            await Promise.all(items.filter((item) => selectedSet.has(item.id)).map((item) => saveItem({ ...item, discount: null, updatedAt: new Date().toISOString() })));
            toast.success('Discount removed from selected items.');
          }}>Bulk remove discount</button>
        </div>

        {filtered.length === 0 ? <div className="border rounded p-4 text-sm text-[#6B7280]">No menu items match the current filters.</div> : (
          <div className="space-y-2">
            {filtered.map((item) => (
              <div key={item.id} className="border rounded p-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-3 min-w-[260px]">
                  <input type="checkbox" checked={selectedSet.has(item.id)} onChange={(e) => setSelectedItemIds((rows) => e.target.checked ? [...rows, item.id] : rows.filter((id) => id !== item.id))} />
                  <Image src={item.imageUrl ?? undefined} alt={item.name} className="h-14 w-14 rounded object-cover" />
                  <div>
                    <p className="font-medium">{item.name} · {formatCurrency(item.price)}</p>
                    <p className="text-[#6B7280]">Category: {item.categoryId || 'uncategorized'} · Updated: {new Date(item.updatedAt).toLocaleString()}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <StatusChip label={item.isAvailable ? 'Available' : 'Unavailable'} tone={item.isAvailable ? 'success' : 'warning'} />
                      <StatusChip label={getInventoryStatusLabel(item.inventoryStatus)} tone={item.inventoryStatus === 'in_stock' ? 'success' : item.inventoryStatus === 'low_stock' ? 'warning' : 'danger'} />
                      <StatusChip label={item.discount?.isActive ? `${item.discount.value}% OFF` : 'No discount'} tone={item.discount?.isActive ? 'warning' : 'neutral'} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <label className="text-xs">Stock
                    <input className="border rounded px-2 py-1 w-20 ml-1" type="number" min={0} value={item.stock} onChange={async (e) => { await handleSaveInventory(item, Number(e.target.value), item.lowStockThreshold); }} />
                  </label>
                  <label className="text-xs">Threshold
                    <input className="border rounded px-2 py-1 w-20 ml-1" type="number" min={0} value={item.lowStockThreshold} onChange={async (e) => { await handleSaveInventory(item, item.stock, Number(e.target.value)); }} />
                  </label>
                  <button className="border rounded px-2 py-1" onClick={async () => { await handleSaveInventory(item, item.stock + 1, item.lowStockThreshold); }}>+1</button>
                  <button className="border rounded px-2 py-1" onClick={async () => { await handleSaveInventory(item, Math.max(0, item.stock - 1), item.lowStockThreshold); }}>-1</button>
                  <button className="border rounded px-2 py-1" onClick={() => setDraft(item)}>Edit</button>
                  <button className="border rounded px-2 py-1" onClick={async () => { await deleteItem(item.id); toast.info('Menu item removed.'); }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
