import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useDailyMenu } from '@/hooks/useDailyMenu';
import type { DailyMenu } from '@/types/dailyMenu';

const makeId = () => Math.random().toString(36).slice(2, 9);
const emptyMenu = (): DailyMenu => ({ id: '', menuDate: new Date().toISOString().slice(0, 10), isPublished: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), items: [] });

export const DailyMenuPage = () => {
  const { menu, loading, error, saving, saveDraft, publish, unpublish, clearMenu } = useDailyMenu();
  const [draft, setDraft] = useState<DailyMenu>(emptyMenu());

  useEffect(() => {
    if (menu) setDraft(menu);
  }, [menu]);

  if (loading) return <p>Loading daily menu...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Daily Menu Management</h2>
            <p className="text-sm text-[#6B7280] dark:text-slate-300">Manage canonical daily menu records from backend API.</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded ${draft.isPublished ? 'bg-green-100 text-green-700' : 'bg-[#FFE4E8] text-slate-700'}`}>{draft.isPublished ? 'Published' : 'Draft'}</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm">Menu Date<input type="date" className="block border rounded mt-1 px-2 py-1 w-full" value={draft.menuDate} onChange={(e) => setDraft({ ...draft, menuDate: e.target.value })} /></label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Daily Menu Items</h3>
            <button className="border rounded px-2 py-1" onClick={() => setDraft({ ...draft, items: [...draft.items, { id: `dmi-${makeId()}`, menuItemId: '', name: '', price: 0, categoryId: '', isAvailable: true }] })}>Add item</button>
          </div>
          {draft.items.map((item, index) => (
            <div key={item.id} className="border rounded p-3 space-y-2">
              <label className="text-sm">Menu Item ID
                <input className="block border rounded mt-1 px-2 py-1 w-full" value={item.menuItemId} onChange={(e) => setDraft({ ...draft, items: draft.items.map((x) => (x.id === item.id ? { ...x, menuItemId: e.target.value } : x)) })} />
              </label>
              <label className="text-sm">Name
                <input className="block border rounded mt-1 px-2 py-1 w-full" value={item.name} onChange={(e) => setDraft({ ...draft, items: draft.items.map((x) => (x.id === item.id ? { ...x, name: e.target.value } : x)) })} />
              </label>
              <div className="flex items-center gap-3 text-sm">
                <label><input type="checkbox" checked={item.isAvailable} onChange={(e) => setDraft({ ...draft, items: draft.items.map((x) => (x.id === item.id ? { ...x, isAvailable: e.target.checked } : x)) })} /> Available</label>
                <button className="border rounded px-2 py-1" onClick={() => setDraft({ ...draft, items: draft.items.filter((x) => x.id !== item.id).map((x) => x) })}>Remove</button>
              </div>
              <p className="text-xs text-[#6B7280]">Sort order: {index + 1}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="border rounded px-3 py-1" disabled={saving} onClick={async () => { const saved = await saveDraft(draft); setDraft(saved); toast.success('Daily menu draft saved.'); }}>Save Draft</button>
          <button className="border rounded px-3 py-1" disabled={saving} onClick={async () => { const saved = await publish(draft); setDraft(saved); toast.success('Daily menu published.'); }}>Publish Menu</button>
          <button className="border rounded px-3 py-1" disabled={saving} onClick={async () => { const saved = await unpublish(); setDraft(saved); toast.info('Daily menu unpublished.'); }}>Unpublish</button>
          <button className="border rounded px-3 py-1" disabled={saving} onClick={async () => { const saved = await clearMenu(); setDraft(saved); toast.info('Daily menu cleared.'); }}>Clear Menu</button>
        </div>
      </section>

      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3">
        <h3 className="font-semibold">Owner Preview</h3>
        <p className="text-sm">Date: {draft.menuDate}</p>
        <p className="text-sm">State: {draft.isPublished ? 'Live for customers' : 'Not currently visible to customers'}</p>
        <div className="space-y-2">
          {draft.items.map((item) => <div key={item.id} className="border rounded p-3 text-sm">Menu Item ID: {item.menuItemId || 'Unset'} · {item.isAvailable ? 'Available' : 'Unavailable'}</div>)}
        </div>
      </section>
    </div>
  );
};
