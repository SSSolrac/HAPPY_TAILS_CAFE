import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertsPanel, DateRangeFilter, RecentOrdersTable, TopItemsChart } from '@/components/dashboard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { formatCurrency } from '@/utils/currency';
import type { DateRangePreset } from '@/types/dashboard';

export const DashboardPage = () => {
  const { data, loading, error, selectedRange, setSelectedRange } = useDashboardData();

  const rangeLabel = (preset: DateRangePreset) => {
    const map: Record<DateRangePreset, string> = {
      today: 'Today',
      '7d': 'Last 7 days',
      '30d': 'Last 30 days',
      '90d': 'Last 90 days',
      '3m': 'Last 3 months',
      '6m': 'Last 6 months',
      '1y': 'Last 1 year',
      all: 'All time',
    };
    return map[preset];
  };

  const toDayKey = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const salesSeries = useMemo(() => {
    const recentOrders = data?.recentOrders ?? [];
    const totals = new Map<string, number>();
    recentOrders.forEach((order) => {
      const dayKey = toDayKey(order.placedAt || order.createdAt);
      if (!dayKey) return;
      totals.set(dayKey, (totals.get(dayKey) ?? 0) + (order.totalAmount ?? 0));
    });

    return Array.from(totals.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dayKey, sales]) => {
        const [year, month, day] = dayKey.split('-').map((value) => Number(value));
        const localDate = Number.isFinite(year) && Number.isFinite(month) && Number.isFinite(day) ? new Date(year!, month! - 1, day!) : new Date();
        return {
          label: localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sales,
        };
      });
  }, [data]);

  if (loading) return <p>Loading dashboard...</p>;
  if (error || !data) return <p className="text-red-600">{error || 'Error'}</p>;

  const grossSales = data.sales.rangeTotal;
  const refundsTotal = data.recentOrders.reduce((sum, order) => {
    const isRefunded = order.paymentStatus === 'refunded' || order.status === 'refunded';
    if (!isRefunded) return sum;
    return sum + (order.totalAmount ?? 0);
  }, 0);
  const discountsTotal = data.recentOrders.reduce((sum, order) => sum + (order.discountTotal ?? 0), 0);
  const netSales = Math.max(0, grossSales - refundsTotal - discountsTotal);
  const grossProfitEstimate = netSales;

  const SummaryCard = ({ title, value, subtitle }: { title: string; value: string; subtitle: string }) => (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-xs text-slate-500">{subtitle}</p>
      <div className="mt-3 h-0.5 w-full bg-[#FF8FA3] opacity-70" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Dashboard Overview</p>
            <p className="text-xs text-slate-500">A quick performance overview using your Supabase dashboard summary.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeFilter value={selectedRange} onChange={setSelectedRange} variant="select" />
            <label className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-slate-500">
              <span>Time</span>
              <select className="bg-transparent outline-none" disabled value="all_day">
                <option value="all_day">All day</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-slate-500">
              <span>Employees</span>
              <select className="bg-transparent outline-none" disabled value="all_employees">
                <option value="all_employees">All employees</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <SummaryCard title="Gross sales" value={formatCurrency(grossSales)} subtitle={rangeLabel(selectedRange)} />
        <SummaryCard title="Refunds" value={formatCurrency(refundsTotal)} subtitle="Based on recent orders" />
        <SummaryCard title="Discounts" value={formatCurrency(discountsTotal)} subtitle="Based on recent orders" />
        <SummaryCard title="Net sales" value={formatCurrency(netSales)} subtitle="Gross - refunds - discounts" />
        <SummaryCard title="Gross profit" value={formatCurrency(grossProfitEstimate)} subtitle="Estimate (costs not configured)" />
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-medium">Gross sales</h3>
            <p className="text-xs text-slate-500">Grouped by day (based on recent orders returned by the summary function).</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-slate-600">
              <span>Chart</span>
              <select className="bg-transparent outline-none" disabled value="area">
                <option value="area">Area</option>
              </select>
            </label>
            <label className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm text-slate-600">
              <span>Group</span>
              <select className="bg-transparent outline-none" disabled value="days">
                <option value="days">Days</option>
              </select>
            </label>
          </div>
        </div>

        <div className="mt-4 h-72">
          {salesSeries.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-sm text-slate-500">No sales data available for this range yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesSeries} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                <defs>
                  <linearGradient id="grossSalesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF8FA3" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#FF8FA3" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value: number) => formatCurrency(value).replace('.00', '')} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Area type="monotone" dataKey="sales" stroke="#FF8FA3" fill="url(#grossSalesFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TopItemsChart title="Top Selling Items (Qty)" data={data.topItems.map((item) => ({ label: item.itemName, value: item.quantity }))} />
        </div>
        <AlertsPanel alerts={data.alerts} />
      </div>

      <RecentOrdersTable title="Recent orders" rows={data.recentOrders} />
    </div>
  );
};
