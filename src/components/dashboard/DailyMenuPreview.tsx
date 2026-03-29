import type { MenuSection } from '@/types/dashboard';

export const DailyMenuPreview = ({ menu }: { menu: MenuSection }) => (
  <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-medium">Current Menu of the Day</h3>
        <p className="text-sm text-slate-500">{menu.subtitle}</p>
      </div>
      <span className={`text-xs px-2 py-1 rounded ${menu.isPublished ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
        {menu.isPublished ? 'Published' : 'Not published'}
      </span>
    </div>

    <div className="space-y-2">
      {menu.categories.map((category) => (
        <div key={category.name} className="border rounded p-3">
          <p className="font-medium">{category.name}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">{category.items.join(', ')}</p>
        </div>
      ))}
    </div>
  </section>
);
