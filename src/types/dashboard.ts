import type { CustomerTier } from './customer';

export type DateRangePreset = '1M' | '3M' | '6M' | '1Y' | 'ALL';

export type KPIItem = {
  label: string;
  value: string;
  helpText: string;
};

export type TrendPoint = {
  label: string;
  sales: number;
  orders: number;
};

export type ItemMetric = {
  name: string;
  value: number;
};

export type DashboardAlertTone = 'info' | 'warning' | 'danger';

export type DashboardAlert = {
  id: string;
  tone: DashboardAlertTone;
  title: string;
  message: string;
};

export type DashboardOrderStatus = 'completed' | 'pending' | 'cancelled' | 'refunded';

export type RecentOrder = {
  id: string;
  customerName: string;
  total: number;
  status: DashboardOrderStatus;
  createdAt: string;
};

export type StatusMetric = {
  status: DashboardOrderStatus;
  total: number;
};

export type TierSummary = {
  tier: CustomerTier;
  total: number;
};

export type CustomerRow = {
  id: string;
  name: string;
  email: string;
  points: number;
  tier: CustomerTier;
  orders: number;
};

export type MenuCategoryPreview = {
  name: string;
  items: string[];
};

export type OverviewSection = {
  kpis: KPIItem[];
  salesTrend: TrendPoint[];
  topSellingItems: ItemMetric[];
  alerts: DashboardAlert[];
  recentOrders: RecentOrder[];
};

export type OrdersSection = {
  statusSummary: StatusMetric[];
  statusChart: StatusMetric[];
  recentOrders: RecentOrder[];
};

export type MenuSection = {
  isPublished: boolean;
  title: string;
  subtitle: string;
  topSellingItems: ItemMetric[];
  categorySales: ItemMetric[];
  categories: MenuCategoryPreview[];
};

export type CustomersSection = {
  summary: KPIItem[];
  tierSummary: TierSummary[];
  customers: CustomerRow[];
  mostActiveCustomers: CustomerRow[];
};

export type DashboardData = {
  selectedRange: DateRangePreset;
  overview: OverviewSection;
  orders: OrdersSection;
  menu: MenuSection;
  customers: CustomersSection;
};

export type CsvImportType = 'orders' | 'customers' | 'menu-items';

export type CsvValidationResult = {
  validRows: Record<string, string>[];
  invalidRows: Array<{ rowNumber: number; reason: string; row: Record<string, string> }>;
};
