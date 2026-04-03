import { Bell, LogOut } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { CommandBar } from '@/components/navigation/CommandBar';
import { MobileNav } from '@/components/navigation/MobileNav';
import { useNotifications } from '@/hooks/useNotifications';

const navBaseClass = 'block rounded-xl px-3 py-2 text-sm font-medium text-[#1F2937] transition-colors hover:bg-[#FFE4E8]';

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const isOwner = user?.role === 'owner';

  const onSignOut = async () => {
    localStorage.clear();
    sessionStorage.clear();
    await logout();
    toast.success('Signed out successfully');
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FFF7F9] text-[#1F2937]">
      <div className="flex">
        <aside className="hidden md:flex w-64 min-h-screen border-r border-[#F3D6DB] bg-white p-4 flex-col">
          <div className="space-y-2">
            <h2 className="font-semibold mb-3">Staffowner</h2>
            <NavLink className={({ isActive }) => `${navBaseClass} ${isActive ? 'bg-[#FFB6C1]' : ''}`} to="/dashboard">Dashboard</NavLink>
            <NavLink className={({ isActive }) => `${navBaseClass} ${isActive ? 'bg-[#FFB6C1]' : ''}`} to="/orders">Orders</NavLink>
            <NavLink className={({ isActive }) => `${navBaseClass} ${isActive ? 'bg-[#FFB6C1]' : ''}`} to="/daily-menu">Daily Menu</NavLink>
            <NavLink className={({ isActive }) => `${navBaseClass} ${isActive ? 'bg-[#FFB6C1]' : ''}`} to="/menu">Menu</NavLink>
            <NavLink className={({ isActive }) => `${navBaseClass} ${isActive ? 'bg-[#FFB6C1]' : ''}`} to="/customers">Customers / Loyalty</NavLink>
            {isOwner && <NavLink className={({ isActive }) => `${navBaseClass} ${isActive ? 'bg-[#FFB6C1]' : ''}`} to="/imports">Imports / Reports</NavLink>}
            <NavLink className={({ isActive }) => `${navBaseClass} ${isActive ? 'bg-[#FFB6C1]' : ''}`} to="/settings">Settings</NavLink>
            <NavLink className={({ isActive }) => `${navBaseClass} ${isActive ? 'bg-[#FFB6C1]' : ''}`} to="/profile">Profile</NavLink>
            {isOwner && <NavLink className={({ isActive }) => `${navBaseClass} ${isActive ? 'bg-[#FFB6C1]' : ''}`} to="/admin/activity-log">Admin Logs</NavLink>}
            {isOwner && <NavLink className={({ isActive }) => `${navBaseClass} ${isActive ? 'bg-[#FFB6C1]' : ''}`} to="/admin/login-history">Login History</NavLink>}
          </div>

          <div className="mt-auto pt-4 border-t border-[#F3D6DB]">
            <button
              onClick={onSignOut}
              className="w-full rounded-xl px-3 py-2 text-sm font-medium text-[#1F2937] flex items-center gap-2 hover:bg-[#FFE4E8] transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </aside>
        <section className="flex-1">
          <header className="h-14 border-b border-[#F3D6DB] bg-white px-4 flex items-center justify-between">
            <CommandBar />
            <div className="relative group">
              <button aria-label="open-alerts" className="rounded-xl p-2 hover:bg-[#FFE4E8] transition-colors relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 ? <span className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full bg-rose-500 text-white text-[10px] px-1">{unreadCount}</span> : null}
              </button>
              <div className="hidden group-focus-within:block group-hover:block absolute right-0 mt-1 w-80 rounded-xl border border-[#F3D6DB] bg-white shadow-lg z-20 p-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">Notifications</p>
                  <button className="text-xs underline" onClick={markAllRead}>Mark all as read</button>
                </div>
                <div className="max-h-80 overflow-auto space-y-1">
                  {notifications.length === 0 ? <p className="text-xs text-[#6B7280] p-2">No notifications yet.</p> : notifications.slice(0, 20).map((row) => (
                    <button key={row.id} className={`w-full text-left rounded p-2 border ${row.isRead ? 'bg-white' : 'bg-[#FFF3F5]'}`} onClick={() => markRead(row.id)}>
                      <p className="text-xs font-medium">{row.title}</p>
                      <p className="text-xs text-[#6B7280]">{row.message}</p>
                    </button>
                  ))}
                </div>
              </div>
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
