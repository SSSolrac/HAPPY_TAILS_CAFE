import { useMemo, useState } from 'react';
import {
  AlertsPanel,
  DailyMenuPreview,
  DashboardTabs,
  DateRangeFilter,
  KPICard,
  OrderStatusChart,
  RecentOrdersTable,
  SalesTrendChart,
  TopItemsChart,
} from '@/components/dashboard';
import { useDashboardData } from '@/hooks/useDashboardData';
import type { DashboardTabKey } from '@/components/dashboard/DashboardTabs';

export const DashboardPage = () => {
  const { data, loading, error, selectedRange, setSelectedRange } = useDashboardData();
  const [activeTab, setActiveTab] = useState<DashboardTabKey>('overview');

  const statusCards = useMemo(() => data?.orders.statusSummary ?? [], [data]);

  if (loading) return <p>Loading dashboard...</p>;
  if (error || !data) return <p className="text-red-600">{error || 'Error'}</p>;

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Cafe Owner Dashboard</h1>
          <p className="text-sm text-slate-500">Operational overview for daily cafe performance.</p>
        </div>
        <DateRangeFilter value={selectedRange} onChange={setSelectedRange} />
      </header>

      <DashboardTabs value={activeTab} onChange={setActiveTab}>
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <section className="grid md:grid-cols-4 gap-3">
              {data.overview.kpis.map((item) => (
                <KPICard key={item.label} title={item.label} value={item.value} subtitle={item.helpText} />
              ))}
            </section>

            <section className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <SalesTrendChart data={data.overview.salesTrend} />
              </div>
              <AlertsPanel alerts={data.overview.alerts} />
            </section>

            <section className="grid lg:grid-cols-2 gap-4">
              <TopItemsChart title="Top Selling Items" data={data.overview.topSellingItems.slice(0, 5)} />
              <RecentOrdersTable title="Recent Orders" rows={data.overview.recentOrders} />
            </section>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {statusCards.map((status) => (
                <KPICard
                  key={status.status}
                  title={`${status.status[0].toUpperCase()}${status.status.slice(1)} Orders`}
                  value={String(status.total)}
                  subtitle={`Within ${selectedRange}`}
                />
              ))}
            </section>
            <section className="grid lg:grid-cols-2 gap-4">
              <OrderStatusChart data={data.orders.statusChart} />
              <RecentOrdersTable title="Order Activity" rows={data.orders.recentOrders} />
            </section>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="space-y-4">
            <section className="grid lg:grid-cols-2 gap-4">
              <DailyMenuPreview menu={data.menu} />
              <TopItemsChart title="Top Menu Items" data={data.menu.topSellingItems.slice(0, 5)} />
            </section>
            <TopItemsChart title="Category Sales" data={data.menu.categorySales} />
          </div>
        )}
      </DashboardTabs>
    </div>
  );
};
