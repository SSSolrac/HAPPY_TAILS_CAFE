import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useMenuItems } from '@/hooks/useMenuItems';
import type { MenuItem } from '@/types/menuItem';

const defaultDraft: MenuItem = {
  id: '',
  name: '',
  category: 'Pasta',
  price: 0,
  isAvailable: true,
  isFeatured: false,
  imageUrl: '',
};

const categories = ['Pasta', 'Sandwiches', 'Snacks', 'Rice Meals', 'Beverages'];

export const MenuManagementPage = () => {
  const { items, loading, error, saveItem, deleteItem } = useMenuItems();
  const [draft, setDraft] = useState<MenuItem>(defaultDraft);

  const grouped = useMemo(() => {
    return categories.map((category) => ({ category, rows: items.filter((item) => item.category === category) }));
  }, [items]);

  if (loading) return <p>Loading menu...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3">
        <h2 className="text-lg font-semibold">Regular Menu Management</h2>
        <p className="text-sm text-slate-500">Manage permanent menu items, pricing, and availability.</p>

        <div className="grid md:grid-cols-2 gap-3">
          <label className="text-sm">Item Name
            <input className="block border rounded mt-1 px-2 py-1 w-full" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          </label>
          <label className="text-sm">Category
            <select className="block border rounded mt-1 px-2 py-1 w-full" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </label>
          <label className="text-sm">Price
            <input type="number" min={0} step="0.01" className="block border rounded mt-1 px-2 py-1 w-full" value={draft.price} onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })} />
          </label>
          <label className="text-sm">Image URL (placeholder)
            <input className="block border rounded mt-1 px-2 py-1 w-full" value={draft.imageUrl ?? ''} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} />
          </label>
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <label><input type="checkbox" checked={draft.isAvailable} onChange={(e) => setDraft({ ...draft, isAvailable: e.target.checked })} /> Available</label>
          <label><input type="checkbox" checked={draft.isFeatured} onChange={(e) => setDraft({ ...draft, isFeatured: e.target.checked })} /> Featured</label>
        </div>

        <button
          className="border rounded px-3 py-1"
          onClick={async () => {
            if (!draft.name.trim()) {
              toast.error('Item name is required.');
              return;
            }
            if (draft.price <= 0) {
              toast.error('Price must be greater than 0.');
              return;
            }
            const id = draft.id || `m-${Math.random().toString(36).slice(2, 8)}`;
            await saveItem({ ...draft, id });
            setDraft(defaultDraft);
            toast.success('Menu item saved.');
          }}
        >
          {draft.id ? 'Update Item' : 'Add Item'}
        </button>
      </section>

      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-4">
        <h3 className="font-medium">Menu Items</h3>
        {grouped.map((group) => (
          <div key={group.category} className="space-y-2">
            <h4 className="text-sm font-semibold">{group.category}</h4>
            {group.rows.length === 0 ? <p className="text-sm text-slate-500">No items yet.</p> : (
              <div className="space-y-2">
                {group.rows.map((item) => (
                  <div key={item.id} className="border rounded p-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div>
                      <p className="font-medium">{item.name} - ${item.price.toFixed(2)}</p>
                      <p className="text-slate-500">{item.isAvailable ? 'Available' : 'Unavailable'} · {item.isFeatured ? 'Featured' : 'Standard'} · Image: {item.imageUrl ? 'set' : 'none'}</p>
                    </div>
                    <div className="space-x-2">
                      <button className="border rounded px-2 py-1" onClick={() => setDraft(item)}>Edit</button>
                      <button className="border rounded px-2 py-1" onClick={async () => { await deleteItem(item.id); toast.info('Menu item removed.'); }}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
};
