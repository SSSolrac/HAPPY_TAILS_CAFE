import { Link } from 'react-router';

export const MobileNav = ({ isOwner }: { isOwner: boolean }) => (
  <nav className="md:hidden fixed bottom-0 inset-x-0 border-t bg-white dark:bg-slate-800 p-2 flex justify-around text-xs">
    <Link to="/dashboard">Dashboard</Link>
    <Link to="/orders">Orders</Link>
    <Link to="/menu">Menu</Link>
    <Link to="/customers">Customers</Link>
    {isOwner && <Link to="/imports">Imports</Link>}
  </nav>
);
