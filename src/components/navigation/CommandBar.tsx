import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/hooks/useAuth';

export const CommandBar = () => {
  const [query, setQuery] = useState('');
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const links = useMemo(() => [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Orders', path: '/orders' },
    { label: 'Daily Menu', path: '/daily-menu' },
    { label: 'Menu', path: '/menu' },
    { label: 'Customers / Loyalty', path: '/customers' },
    ...(isOwner ? [{ label: 'Imports / Reports', path: '/imports' }] : []),
    { label: 'Settings', path: '/settings' },
    { label: 'Profile', path: '/profile' },
    ...(isOwner ? [{ label: 'Admin Logs', path: '/admin/activity-log' }, { label: 'Login History', path: '/admin/login-history' }] : []),
  ], [isOwner]);

  const filtered = useMemo(() => links.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())), [query, links]);

  return (
    <div className="relative">
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Quick search" className="rounded-xl border border-[#F3D6DB] bg-white px-3 py-1.5 text-sm w-56" />
      {query && (
        <div className="absolute z-10 mt-1 w-full rounded-xl border border-[#F3D6DB] bg-white p-1 shadow-sm">
          {filtered.map((item) => (
            <Link key={item.path} to={item.path} className="block rounded-lg px-2 py-1 text-sm text-[#1F2937] hover:bg-[#FFE4E8]">
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
