import { Bell, LogOut, Moon, Sun } from 'lucide-react';
import { Link, Outlet } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { CommandBar } from '@/components/navigation/CommandBar';
import { MobileNav } from '@/components/navigation/MobileNav';

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const isOwner = user?.role === 'owner';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="flex">
        <aside className="hidden md:block w-64 min-h-screen border-r bg-white dark:bg-slate-800 p-4 space-y-2">
          <h2 className="font-semibold mb-3">Staffowner</h2>
          <Link className="block" to="/dashboard">Dashboard</Link>
          <Link className="block" to="/orders">Orders</Link>
          <Link className="block" to="/daily-menu">Daily Menu</Link>
          <Link className="block" to="/menu">Menu</Link>
          <Link className="block" to="/customers">Customers / Loyalty</Link>
          <Link className="block" to="/imports">Imports / Reports</Link>
          <Link className="block" to="/settings">Settings</Link>
          <Link className="block" to="/profile">Profile</Link>
          {isOwner && <Link className="block" to="/admin/activity-log">Admin Logs</Link>}
          {isOwner && <Link className="block" to="/admin/login-history">Login History</Link>}
        </aside>
        <section className="flex-1">
          <header className="h-14 border-b bg-white dark:bg-slate-800 px-4 flex items-center justify-between">
            <CommandBar />
            <div className="flex items-center gap-3">
              <button onClick={() => { document.documentElement.classList.toggle('dark'); }} aria-label="theme-toggle">
                <Sun className="h-4 w-4 inline dark:hidden" />
                <Moon className="h-4 w-4 hidden dark:inline" />
              </button>
              <button className="relative" onClick={() => toast.info('Operational alerts are available in Dashboard Overview')}>
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-2 text-[10px] bg-indigo-600 text-white rounded-full px-1">3</span>
              </button>
              <button onClick={async () => { await logout(); toast.success('Logged out'); }}>
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>
          <main className="p-4 pb-20 md:pb-4">
            <Outlet />
          </main>
        </section>
      </div>
      <MobileNav isOwner={Boolean(isOwner)} />
    </div>
  );
};
