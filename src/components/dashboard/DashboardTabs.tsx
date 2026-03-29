import type { ReactNode } from 'react';

export type DashboardTabKey = 'overview' | 'orders' | 'menu';

const tabs: Array<{ key: DashboardTabKey; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'orders', label: 'Orders' },
  { key: 'menu', label: 'Menu' },
];

export const DashboardTabs = ({
  value,
  onChange,
  children,
}: {
  value: DashboardTabKey;
  onChange: (key: DashboardTabKey) => void;
  children: ReactNode;
}) => (
  <div className="space-y-4">
    <div className="rounded-lg border bg-white dark:bg-slate-800 p-2 flex gap-2 overflow-auto">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`px-3 py-1.5 rounded text-sm whitespace-nowrap ${value === tab.key ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
    {children}
  </div>
);
