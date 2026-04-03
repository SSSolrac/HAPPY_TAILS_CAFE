import { useMemo, useState } from 'react';
import { KPICard } from '@/components/dashboard';
import { useCustomers } from '@/hooks/useCustomers';
import { LOYALTY_MILESTONES, LOYALTY_TOTAL_STAMPS } from '@/types/loyalty';
import type { Customer } from '@/types/customer';

type RewardFilter = 'All' | 'Ready to redeem' | 'Building progress' | 'New card';

const rewardFilters: RewardFilter[] = ['All', 'Ready to redeem', 'Building progress', 'New card'];

const nextMilestoneLabel = (customer: Customer) => {
  const upcoming = LOYALTY_MILESTONES.find((milestone) => customer.loyalty.currentStampCount < milestone.stampCount);
  if (!upcoming) return `Card complete at ${LOYALTY_TOTAL_STAMPS}/${LOYALTY_TOTAL_STAMPS}`;
  const remaining = upcoming.stampCount - customer.loyalty.currentStampCount;
  return `${remaining} stamp${remaining === 1 ? '' : 's'} to ${upcoming.reward}`;
};

const rewardReadiness = (customer: Customer): RewardFilter => {
  if (customer.loyalty.rewardsUnlocked.length > 0) return 'Ready to redeem';
  if (customer.loyalty.currentStampCount > 0) return 'Building progress';
  return 'New card';
};

export const CustomersLoyaltyPage = () => {
  const { customers, loading } = useCustomers();
  const [query, setQuery] = useState('');
  const [rewardFilter, setRewardFilter] = useState<RewardFilter>('All');
  const [selected, setSelected] = useState<Customer | null>(null);

  const filtered = useMemo(() => customers.filter((customer) => {
    const byQuery = customer.fullName.toLowerCase().includes(query.toLowerCase()) || (customer.email ?? '').toLowerCase().includes(query.toLowerCase());
    const byReward = rewardFilter === 'All' || rewardReadiness(customer) === rewardFilter;
    return byQuery && byReward;
  }), [customers, query, rewardFilter]);

  const loyaltySummary = useMemo(() => {
    const readyToRedeem = customers.filter((customer) => customer.loyalty.rewardsUnlocked.length > 0).length;
    const buildingProgress = customers.filter((customer) => customer.loyalty.currentStampCount > 0 && customer.loyalty.rewardsUnlocked.length === 0).length;
    const newCard = customers.filter((customer) => customer.loyalty.currentStampCount === 0).length;
    const totalStampsIssued = customers.reduce((sum, customer) => sum + customer.loyalty.totalStampsEarned, 0);

    return { readyToRedeem, buildingProgress, newCard, totalStampsIssued };
  }, [customers]);

  if (loading) return <p>Loading customers...</p>;

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3">
        <h2 className="text-lg font-semibold">Customers & Loyalty</h2>
        <p className="text-sm text-[#6B7280]">10-stamp loyalty card: Free Latte at stamp 6, Free Groom at stamp 10.</p>
        <div className="flex flex-wrap gap-2">
          <input className="border rounded px-2 py-1 w-full md:w-80" placeholder="Search customer name or email" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="border rounded px-2 py-1" value={rewardFilter} onChange={(e) => setRewardFilter(e.target.value as RewardFilter)}>
            {rewardFilters.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </section>

      <section className="grid md:grid-cols-4 gap-3">
        <KPICard title="Ready to redeem" value={String(loyaltySummary.readyToRedeem)} subtitle="With unlocked rewards" />
        <KPICard title="Building progress" value={String(loyaltySummary.buildingProgress)} subtitle="Actively collecting stamps" />
        <KPICard title="New card" value={String(loyaltySummary.newCard)} subtitle="No stamp activity yet" />
        <KPICard title="Total stamps issued" value={String(loyaltySummary.totalStampsIssued)} subtitle="All-time awarded stamps" />
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-lg border bg-white dark:bg-slate-800 p-4 overflow-auto">
          <table className="w-full text-sm min-w-[880px]">
            <thead><tr className="text-left"><th>Name</th><th>Email</th><th>Stamps</th><th>Next Reward</th><th>Unlocked Rewards</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id} className="border-t">
                  <td>{customer.fullName}</td>
                  <td>{customer.email}</td>
                  <td>{customer.loyalty.currentStampCount}/{LOYALTY_TOTAL_STAMPS}</td>
                  <td>{nextMilestoneLabel(customer)}</td>
                  <td>{customer.loyalty.rewardsUnlocked.length ? customer.loyalty.rewardsUnlocked.join(', ') : 'None yet'}</td>
                  <td>{rewardReadiness(customer)}</td>
                  <td><button className="border rounded px-2 py-1" onClick={() => { setSelected(customer); }}>Details</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <aside className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3">
          <h3 className="font-medium">Customer activity snapshot</h3>
          <div className="text-sm space-y-2">
            <p>• Customers on active card: <strong>{customers.filter((customer) => customer.loyalty.currentStampCount > 0).length}</strong></p>
            <p>• Free Latte unlocked: <strong>{customers.filter((customer) => customer.loyalty.rewardsUnlocked.includes('Free Latte')).length}</strong></p>
            <p>• Free Groom unlocked: <strong>{customers.filter((customer) => customer.loyalty.rewardsUnlocked.includes('Free Groom')).length}</strong></p>
          </div>
        </aside>
      </section>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-20">
          <div className="w-full max-w-xl rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between"><h3 className="font-semibold">{selected.fullName}</h3><button className="border rounded px-2 py-1" onClick={() => setSelected(null)}>Close</button></div>
            <div className="grid sm:grid-cols-2 gap-2 text-sm">
              <p>Email: {selected.email}</p><p>Current card: {selected.loyalty.currentStampCount}/{LOYALTY_TOTAL_STAMPS} stamps</p><p>Total stamps earned: {selected.loyalty.totalStampsEarned}</p><p>Status: {rewardReadiness(selected)}</p>
            </div>
            <div className="border rounded p-3 text-sm space-y-1">
              <p className="font-medium">Loyalty summary</p>
              <p>Card structure: {LOYALTY_TOTAL_STAMPS} total stamps</p>
              <p>Reward milestones: stamp 6 = Free Latte, stamp 10 = Free Groom</p>
              <p>Next milestone: {nextMilestoneLabel(selected)}</p>
              <p>Unlocked rewards: {selected.loyalty.rewardsUnlocked.length ? selected.loyalty.rewardsUnlocked.join(', ') : 'None yet'}</p>
            </div>

            <div className="border rounded p-3 text-sm">
              <p className="font-medium mb-1">Recent loyalty activity</p>
              <p className="text-[#6B7280]">Loyalty activity details are not exposed by the backend contract.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
