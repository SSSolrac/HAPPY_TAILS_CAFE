import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useDailyMenu } from '@/hooks/useDailyMenu';
import type { DailyMenu, DailyMenuCategory, DailyMenuItem } from '@/types/dailyMenu';

const makeId = () => Math.random().toString(36).slice(2, 9);

const ensureMenu = (menu: DailyMenu | null): DailyMenu => menu ?? {
  id: `menu-${makeId()}`,
  title: 'Menu of the Day',
  subtitle: '',
  mode: 'manual',
  isActive: false,
  categories: [],
  updatedAt: new Date().toISOString(),
};

const validateMenu = (menu: DailyMenu): string[] => {
  const errors: string[] = [];
  if (menu.categories.some((category) => !category.name.trim())) {
    errors.push('Category name is required.');
  }

  if (menu.categories.some((category) => category.items.length === 0)) {
    errors.push('Each category needs at least one item.');
  }

  if (menu.categories.some((category) => category.items.some((item) => !item.name.trim()))) {
    errors.push('Item name is required.');
  }

  return errors;
};

export const DailyMenuPage = () => {
  const { menu, loading, error, saving, saveDraft, publish, unpublish, clearMenu } = useDailyMenu();
  const [draft, setDraft] = useState<DailyMenu | null>(null);

  const working = draft ?? menu;
  const preview = ensureMenu(working ?? menu);

  const validationErrors = useMemo(() => (working ? validateMenu(working) : []), [working]);

  useEffect(() => {
    if (!draft && menu) setDraft(menu);
  }, [draft, menu]);

  if (loading) return <p>Loading daily menu...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!working) return <p>No daily menu loaded.</p>;

  const updateCategory = (categoryId: string, updater: (category: DailyMenuCategory) => DailyMenuCategory) => {
    setDraft((prev) => {
      const base = ensureMenu(prev ?? menu);
      return {
        ...base,
        categories: base.categories.map((category) => (category.id === categoryId ? updater(category) : category)),
      };
    });
  };

  const addCategory = () => {
    setDraft((prev) => {
      const base = ensureMenu(prev ?? menu);
      return {
        ...base,
        categories: [...base.categories, { id: `cat-${makeId()}`, name: '', items: [{ id: `item-${makeId()}`, name: '' }] }],
      };
    });
  };

  const removeCategory = (categoryId: string) => {
    setDraft((prev) => {
      const base = ensureMenu(prev ?? menu);
      return { ...base, categories: base.categories.filter((category) => category.id !== categoryId) };
    });
  };

  const addItem = (categoryId: string) => {
    updateCategory(categoryId, (category) => ({
      ...category,
      items: [...category.items, { id: `item-${makeId()}`, name: '' }],
    }));
  };

  const updateItem = (categoryId: string, itemId: string, updater: (item: DailyMenuItem) => DailyMenuItem) => {
    updateCategory(categoryId, (category) => ({
      ...category,
      items: category.items.map((item) => (item.id === itemId ? updater(item) : item)),
    }));
  };

  const removeItem = (categoryId: string, itemId: string) => {
    updateCategory(categoryId, (category) => ({
      ...category,
      items: category.items.filter((item) => item.id !== itemId),
    }));
  };

  const canPublish = validationErrors.length === 0 && working.categories.length > 0;

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Daily Menu Management</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Manage today&apos;s menu in staff/admin only mode.
            </p>
          </div>
          <span className={`text-xs px-2 py-1 rounded ${working.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
            {working.isActive ? 'Published' : 'Draft'}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm">
            Title
            <input
              className="block border rounded mt-1 px-2 py-1 w-full"
              value={working.title}
              onChange={(e) => setDraft({ ...working, title: e.target.value })}
            />
          </label>
          <label className="text-sm">
            Mode
            <select
              className="block border rounded mt-1 px-2 py-1 w-full"
              value={working.mode}
              onChange={(e) => setDraft({ ...working, mode: e.target.value as DailyMenu['mode'] })}
            >
              <option value="manual">Manual current menu</option>
              <option value="date-based">Date-based menu (future-ready)</option>
            </select>
          </label>
          <label className="text-sm sm:col-span-2">
            Subtitle
            <input
              className="block border rounded mt-1 px-2 py-1 w-full"
              value={working.subtitle}
              onChange={(e) => setDraft({ ...working, subtitle: e.target.value })}
            />
          </label>
          <label className="text-sm sm:col-span-2">
            Menu Date (optional)
            <input
              type="date"
              className="block border rounded mt-1 px-2 py-1 w-full"
              value={working.date ?? ''}
              onChange={(e) => setDraft({ ...working, date: e.target.value || undefined })}
            />
          </label>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Categories</h3>
            <button className="border rounded px-2 py-1" onClick={addCategory}>Add category</button>
          </div>

          {working.categories.map((category) => (
            <div key={category.id} className="border rounded p-3 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  className="border rounded px-2 py-1 flex-1"
                  placeholder="Category name (e.g. Pasta)"
                  value={category.name}
                  onChange={(e) => updateCategory(category.id, (current) => ({ ...current, name: e.target.value }))}
                />
                <button className="border rounded px-2 py-1" onClick={() => removeCategory(category.id)}>Remove</button>
              </div>

              <div className="space-y-2">
                {category.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <input
                      className="border rounded px-2 py-1 flex-1"
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => updateItem(category.id, item.id, (current) => ({ ...current, name: e.target.value }))}
                    />
                    <button className="border rounded px-2 py-1" onClick={() => removeItem(category.id, item.id)}>Remove</button>
                  </div>
                ))}
                <button className="border rounded px-2 py-1" onClick={() => addItem(category.id)}>Add item</button>
              </div>
            </div>
          ))}
        </div>

        {validationErrors.length > 0 && (
          <ul className="text-sm text-red-600 list-disc pl-5">
            {validationErrors.map((item) => <li key={item}>{item}</li>)}
          </ul>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            className="border rounded px-3 py-1"
            disabled={saving || validationErrors.length > 0}
            onClick={async () => {
              const saved = await saveDraft(working);
              setDraft(saved);
              toast.success('Daily menu draft saved.');
            }}
          >
            Save Draft
          </button>
          <button
            className="border rounded px-3 py-1"
            disabled={saving || !canPublish}
            onClick={async () => {
              if (!canPublish) {
                toast.error('Cannot publish an empty or invalid menu.');
                return;
              }
              const saved = await publish(working);
              setDraft(saved);
              toast.success('Daily menu published.');
            }}
          >
            Publish Menu
          </button>
          <button
            className="border rounded px-3 py-1"
            disabled={saving}
            onClick={async () => {
              const saved = await unpublish();
              setDraft(saved);
              toast.info('Daily menu unpublished.');
            }}
          >
            Unpublish
          </button>
          <button
            className="border rounded px-3 py-1"
            disabled={saving}
            onClick={async () => {
              const saved = await clearMenu();
              setDraft(saved);
              toast.info('Daily menu cleared.');
            }}
          >
            Clear Menu
          </button>
        </div>
      </section>

      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3">
        <h3 className="font-semibold">Preview</h3>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This is a staff/admin preview only. Customer app integration is pending shared API.
        </p>
        <div className="border rounded p-3 space-y-1">
          <p className="font-medium">{preview.title || 'Untitled menu'}</p>
          {preview.subtitle && <p className="text-sm text-slate-600 dark:text-slate-300">{preview.subtitle}</p>}
          {preview.date && <p className="text-xs">Date: {preview.date}</p>}
          <p className="text-xs">Mode: {preview.mode}</p>
        </div>

        {preview.categories.length === 0 ? (
          <p className="text-sm italic">No categories yet.</p>
        ) : (
          <div className="space-y-3">
            {preview.categories.map((category) => (
              <div key={category.id} className="border rounded p-3">
                <p className="font-medium">{category.name || 'Unnamed category'}</p>
                <ul className="list-disc pl-5 text-sm">
                  {category.items.map((item) => (
                    <li key={item.id}>{item.name || 'Unnamed item'}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
