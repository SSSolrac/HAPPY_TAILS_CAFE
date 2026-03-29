import { useMemo, useState } from 'react';
import { Link } from 'react-router';

const links = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Orders', path: '/orders' },
  { label: 'Daily Menu', path: '/daily-menu' },
  { label: 'Menu', path: '/menu' },
  { label: 'Customers / Loyalty', path: '/customers' },
  { label: 'Imports / Reports', path: '/imports' },
  { label: 'Settings', path: '/settings' },
  { label: 'Profile', path: '/profile' },
  { label: 'Admin Logs', path: '/admin/activity-log' },
  { label: 'Login History', path: '/admin/login-history' },
];

export const CommandBar = () => {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => links.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())), [query]);

  return (
    <div className="relative">
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Quick search" className="rounded border px-2 py-1 text-sm w-56" />
      {query && (
        <div className="absolute z-10 mt-1 w-full rounded border bg-white dark:bg-slate-800 p-1">
          {filtered.map((item) => (
            <Link key={item.path} to={item.path} className="block rounded px-2 py-1 text-sm hover:bg-slate-100 dark:hover:bg-slate-700">
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
