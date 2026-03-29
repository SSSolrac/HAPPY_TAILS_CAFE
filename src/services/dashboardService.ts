import { customerService } from '@/services/customerService';
import type {
  DashboardData,
  DateRangePreset,
  DashboardOrderStatus,
  ItemMetric,
  KPIItem,
  RecentOrder,
  StatusMetric,
  TrendPoint,
} from '@/types/dashboard';

const delay = async () => new Promise((resolve) => setTimeout(resolve, 250));

const rangeScale: Record<DateRangePreset, number> = {
  '1M': 1,
  '3M': 2.8,
  '6M': 5.1,
  '1Y': 9.8,
  ALL: 14.7,
};

const periodLabels: Record<DateRangePreset, string[]> = {
  '1M': ['W1', 'W2', 'W3', 'W4'],
  '3M': ['Jan', 'Feb', 'Mar'],
  '6M': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  '1Y': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ALL: ['2023', '2024', '2025', '2026'],
};

const currency = (value: number) => `$${value.toLocaleString()}`;

const buildTrend = (range: DateRangePreset): TrendPoint[] => {
  const labels = periodLabels[range];
  const scale = rangeScale[range];
  return labels.map((label, index) => ({
    label,
    sales: Math.round((6200 + index * 850) * scale),
    orders: Math.round((280 + index * 32) * scale),
  }));
};

const buildRecentOrders = (range: DateRangePreset): RecentOrder[] => {
  const offsets = { '1M': 3, '3M': 14, '6M': 45, '1Y': 120, ALL: 220 } as const;
  const baseDate = new Date();
  const shiftDays = offsets[range];

  const rows: Array<{ id: string; customerName: string; total: number; status: DashboardOrderStatus }> = [
    { id: 'ORD-1048', customerName: 'Avery Johnson', total: 24.5, status: 'completed' },
    { id: 'ORD-1047', customerName: 'Nora Lin', total: 11.25, status: 'pending' },
    { id: 'ORD-1046', customerName: 'Leo Adams', total: 9.5, status: 'completed' },
    { id: 'ORD-1045', customerName: 'Walk-in', total: 6.0, status: 'cancelled' },
    { id: 'ORD-1044', customerName: 'Mia Turner', total: 14.75, status: 'refunded' },
    { id: 'ORD-1043', customerName: 'Carlos Vega', total: 19.0, status: 'completed' },
  ];

  return rows.map((row, index) => {
    const createdAt = new Date(baseDate);
    createdAt.setDate(baseDate.getDate() - shiftDays - index);
    return { ...row, createdAt: createdAt.toISOString() };
  });
};

const buildStatus = (range: DateRangePreset): StatusMetric[] => {
  const scale = rangeScale[range];
  return [
    { status: 'completed', total: Math.round(180 * scale) },
    { status: 'pending', total: Math.round(26 * scale) },
    { status: 'cancelled', total: Math.round(12 * scale) },
    { status: 'refunded', total: Math.round(7 * scale) },
  ];
};

export const dashboardService = {
  async getDashboardData(range: DateRangePreset): Promise<DashboardData> {
    await delay();
    const customers = await customerService.getCustomers();

    // TODO(dashboard-api): pass `range` to backend query params once analytics endpoint is ready.
    const trend = buildTrend(range);
    const recentOrders = buildRecentOrders(range);
    const statusSummary = buildStatus(range);
    const totalSales = trend.reduce((sum, point) => sum + point.sales, 0);
    const totalOrders = statusSummary.reduce((sum, point) => sum + point.total, 0);
    const pending = statusSummary.find((item) => item.status === 'pending')?.total ?? 0;

    const overviewKpis: KPIItem[] = [
      { label: 'Total Sales', value: currency(totalSales), helpText: `Range: ${range}` },
      { label: 'Total Orders', value: String(totalOrders), helpText: 'Paid + unpaid orders' },
      { label: 'Average Order Value', value: currency(totalSales / Math.max(totalOrders, 1)), helpText: 'Sales / orders' },
      { label: 'Pending Orders', value: String(pending), helpText: 'Needs staff action' },
    ];

    const topItems: ItemMetric[] = [
      { name: 'Chicken Alfredo', value: Math.round(92 * rangeScale[range]) },
      { name: 'Beef Rice Bowl', value: Math.round(88 * rangeScale[range]) },
      { name: 'Ham & Cheese Sandwich', value: Math.round(71 * rangeScale[range]) },
      { name: 'Truffle Fries', value: Math.round(57 * rangeScale[range]) },
      { name: 'Iced Latte', value: Math.round(51 * rangeScale[range]) },
    ];

    return {
      selectedRange: range,
      overview: {
        kpis: overviewKpis,
        salesTrend: trend,
        topSellingItems: topItems,
        alerts: [
          { id: 'a1', tone: 'warning', title: 'Low stock', message: 'Truffle Fries has fewer than 10 portions left.' },
          { id: 'a2', tone: 'danger', title: 'Pending confirmations', message: `${pending} orders are still pending payment confirmation.` },
          { id: 'a3', tone: 'info', title: 'Menu status', message: 'No daily menu is published for tomorrow yet.' },
        ],
        recentOrders,
      },
      orders: {
        statusSummary,
        statusChart: statusSummary,
        recentOrders,
      },
      menu: {
        isPublished: false,
        title: 'Menu of the Day',
        subtitle: 'Chef specials and cafe best-sellers',
        topSellingItems: topItems,
        categorySales: [
          { name: 'Pasta', value: Math.round(210 * rangeScale[range]) },
          { name: 'Rice Meals', value: Math.round(194 * rangeScale[range]) },
          { name: 'Sandwiches', value: Math.round(156 * rangeScale[range]) },
          { name: 'Snacks', value: Math.round(141 * rangeScale[range]) },
        ],
        categories: [
          { name: 'Pasta', items: ['Chicken Alfredo', 'Pesto Penne'] },
          { name: 'Sandwiches', items: ['Ham & Cheese', 'Tuna Melt'] },
          { name: 'Snacks', items: ['Truffle Fries', 'Onion Rings'] },
          { name: 'Rice Meals', items: ['Beef Rice Bowl', 'Salmon Teriyaki Rice'] },
        ],
      },
      customers: {
        summary: [
          { label: 'Total Customers', value: String(customers.length), helpText: 'Registered members' },
          { label: 'Active Loyalty Users', value: String(Math.round(customers.length * 0.72)), helpText: 'Ordered in selected period' },
          { label: 'Avg Loyalty Points', value: String(Math.round(customers.reduce((a, b) => a + b.points, 0) / customers.length)), helpText: 'Per customer' },
        ],
        tierSummary: [
          { tier: 'Gold', total: customers.filter((c) => c.tier === 'Gold').length },
          { tier: 'Silver', total: customers.filter((c) => c.tier === 'Silver').length },
          { tier: 'Bronze', total: customers.filter((c) => c.tier === 'Bronze').length },
          { tier: 'Unranked', total: customers.filter((c) => c.tier === 'Unranked').length },
        ],
        customers: customers.map((c, index) => ({ ...c, orders: Math.round((index + 2) * 3.2 * rangeScale[range]) })),
        mostActiveCustomers: customers
          .map((c, index) => ({ ...c, orders: Math.round((index + 6) * 4.3 * rangeScale[range]) }))
          .sort((a, b) => b.orders - a.orders)
          .slice(0, 4),
      },
    };
  },
};
