import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { KPICard } from '@/components/dashboard';
import { TierBadge } from '@/components/ui';
import { useCustomers } from '@/hooks/useCustomers';
import type { Customer } from '@/types/customer';

export const CustomersLoyaltyPage = () => {
  const { customers, loading } = useCustomers();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Customer | null>(null);

  const filtered = useMemo(() => customers.filter((customer) => (
    customer.name.toLowerCase().includes(query.toLowerCase()) || customer.email.toLowerCase().includes(query.toLowerCase())
  )), [customers, query]);

  const tierSummary = useMemo(() => ([
    { tier: 'Gold', total: customers.filter((c) => c.tier === 'Gold').length },
    { tier: 'Silver', total: customers.filter((c) => c.tier === 'Silver').length },
    { tier: 'Bronze', total: customers.filter((c) => c.tier === 'Bronze').length },
    { tier: 'Unranked', total: customers.filter((c) => c.tier === 'Unranked').length },
  ]), [customers]);

  if (loading) return <p>Loading customers...</p>;

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3">
        <h2 className="text-lg font-semibold">Customers & Loyalty</h2>
        <p className="text-sm text-slate-500">Secondary owner view for loyalty and customer profile tracking.</p>
        <input className="border rounded px-2 py-1 w-full md:w-80" placeholder="Search customer" value={query} onChange={(e) => setQuery(e.target.value)} />
      </section>

      <section className="grid md:grid-cols-4 gap-3">
        {tierSummary.map((item) => <KPICard key={item.tier} title={`${item.tier} customers`} value={String(item.total)} subtitle="Tier summary" />)}
      </section>

      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 overflow-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead><tr className="text-left"><th>Name</th><th>Email</th><th>Points</th><th>Tier</th><th>Rewards Redeemed</th><th>Action</th></tr></thead>
          <tbody>
            {filtered.map((customer) => (
              <tr key={customer.id} className="border-t">
                <td>{customer.name}</td>
                <td>{customer.email}</td>
                <td>{customer.points}</td>
                <td><TierBadge tier={customer.tier} /></td>
                <td>{Math.floor(customer.points / 120)}</td>
                <td><button className="border rounded px-2 py-1" onClick={() => setSelected(customer)}>Details</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-20">
          <div className="w-full max-w-xl rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{selected.name}</h3>
              <button className="border rounded px-2 py-1" onClick={() => setSelected(null)}>Close</button>
            </div>
            <p className="text-sm">Email: {selected.email}</p>
            <p className="text-sm">Tier: {selected.tier}</p>
            <p className="text-sm">Points: {selected.points}</p>
            <p className="text-sm">Rewards redeemed (placeholder): {Math.floor(selected.points / 120)}</p>
            <div className="border rounded p-3 text-sm">
              <p className="font-medium">Manual loyalty adjustment (placeholder)</p>
              <p className="text-slate-500">TODO: connect to backend permission checks + loyalty transaction logs.</p>
              <button className="border rounded px-2 py-1 mt-2" onClick={() => toast.info('Placeholder only: no points changed yet.')}>Adjust Points</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
