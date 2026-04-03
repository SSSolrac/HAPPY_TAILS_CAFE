import type { CustomerProfile, LoyaltyAccount, Reward } from '@/types/customer';
import type { DailyMenu } from '@/types/dailyMenu';
import type { DashboardSummary, DateRangePreset } from '@/types/dashboard';
import type { LoginHistoryEntry } from '@/types/loginHistory';
import type { MenuItem } from '@/types/menuItem';
import type { Order, OrderStatus, PaymentStatus } from '@/types/order';
import type { Profile } from '@/api/profile';
import type { SessionUser, UserRole } from '@/types/user';
import { computeInventoryStatus } from '@/utils/inventory';
import { asRecord } from './response';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type Query = Record<string, string | number | undefined>;

type Db = {
  menuItems: MenuItem[];
  dailyMenu: DailyMenu;
  orders: Order[];
  customers: CustomerProfile[];
  loyalty: Record<string, LoyaltyAccount>;
  loginHistory: LoginHistoryEntry[];
  profile: Profile;
};

const now = () => new Date().toISOString();
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const ok = <T>(data: T) => ({ data });
const today = () => new Date().toISOString().slice(0, 10);

const rewardCatalog: Reward[] = [
  { id: 'reward-latte', label: 'Free Latte', requiredStamps: 6 },
  { id: 'reward-groom', label: 'Free Groom', requiredStamps: 10 },
];

let db: Db | null = null;
const getDb = (): Db => {
  if (db) return db;
  const menuItems: MenuItem[] = [{ id: 'mi-1', categoryId: 'coffee', name: 'Latte', description: '', price: 150, isAvailable: true, imageUrl: null, stock: 12, lowStockThreshold: 5, inventoryStatus: 'in_stock', discount: 0, createdAt: now(), updatedAt: now() }];
  const customers: CustomerProfile[] = [{ id: 'cus-1', fullName: 'Mia Santos', email: 'mia@example.com', createdAt: now(), updatedAt: now() }];
  const orders: Order[] = [{ id: 'ord-1', orderNumber: 'ORD-1', customerId: 'cus-1', customerName: 'Mia Santos', orderType: 'pickup', items: [{ id: 'oi-1', orderId: 'ord-1', menuItemId: 'mi-1', itemName: 'Latte', qty: 2, unitPrice: 150, lineTotal: 300 }], subtotal: 300, serviceFee: 0, discount: 0, total: 300, status: 'completed', paymentStatus: 'paid', paymentMethod: 'gcash', createdAt: now(), updatedAt: now(), statusTimeline: [] }];
  const dailyMenu: DailyMenu = { id: 'dm-1', menuDate: today(), isPublished: false, createdAt: now(), updatedAt: now(), items: [{ id: 'dmi-1', menuItemId: 'mi-1', name: 'Latte', price: 150, categoryId: 'coffee', isAvailable: true }] };
  const loyalty: Record<string, LoyaltyAccount> = { 'cus-1': { customerId: 'cus-1', stampCount: 7, availableRewards: [rewardCatalog[0]], redeemedRewards: [], updatedAt: now() } };
  const profile: Profile = { id: 'admin-1', name: 'Admin User', email: 'admin@happytails.com', phone: '', addresses: [], preferences: {}, createdAt: now(), updatedAt: now() };
  db = { menuItems, dailyMenu, orders, customers, loyalty, loginHistory: [], profile };
  return db;
};

const inRange = (createdAt: string, range: DateRangePreset) => {
  const days = range === 'today' ? 1 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return new Date(createdAt).getTime() >= cutoff;
};

const dashboard = (orders: Order[], range: DateRangePreset): DashboardSummary => {
  const scoped = orders.filter((o) => inRange(o.createdAt, range));
  const paid = scoped.filter((o) => o.paymentStatus === 'paid');
  const topMap = new Map<string, { itemName: string; quantity: number; revenue: number }>();

  scoped.forEach((order) => {
    order.items.forEach((item) => {
      const prev = topMap.get(item.itemName) ?? { itemName: item.itemName, quantity: 0, revenue: 0 };
      prev.quantity += item.qty;
      prev.revenue += item.lineTotal;
      topMap.set(item.itemName, prev);
    });
  });

  return {
    sales: {
      today: paid.filter((o) => o.createdAt.slice(0, 10) === today()).reduce((sum, o) => sum + o.total, 0),
      rangeTotal: paid.reduce((sum, o) => sum + o.total, 0),
      averageOrderValue: paid.length ? paid.reduce((sum, o) => sum + o.total, 0) / paid.length : 0,
    },
    orders: {
      today: scoped.filter((o) => o.createdAt.slice(0, 10) === today()).length,
      rangeTotal: scoped.length,
      pending: scoped.filter((o) => o.status === 'pending').length,
      preparing: scoped.filter((o) => o.status === 'preparing').length,
      ready: scoped.filter((o) => o.status === 'ready').length,
      outForDelivery: scoped.filter((o) => o.status === 'out_for_delivery').length,
      completed: scoped.filter((o) => o.status === 'completed').length,
      cancelled: scoped.filter((o) => o.status === 'cancelled').length,
    },
    topItems: [...topMap.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 8),
    recentOrders: [...scoped].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
    alerts: [],
  };
};

export const mockApi = {
  async request<T>(method: HttpMethod, path: string, query?: Query, body?: unknown): Promise<T> {
    const data = getDb();
    const p = path.startsWith('/') ? path : `/${path}`;

    if (method === 'POST' && p === '/api/auth/login') {
      const b = asRecord(body) ?? {};
      const email = String(b.email ?? '').toLowerCase();
      const role = String(b.role ?? 'staff') as UserRole;
      const valid = (email === 'admin@happytails.com' && role === 'admin') || (email === 'staff@happytails.com' && role === 'staff');
      if (!valid) throw new Error('Invalid credentials');
      const user: SessionUser = { id: role === 'admin' ? 'admin-1' : 'staff-1', name: role === 'admin' ? 'Admin User' : 'Staff User', email, role, token: 'mock-token' };
      return clone(ok(user)) as T;
    }
    if (method === 'POST' && p === '/api/auth/login-history') {
      const b = asRecord(body) ?? {};
      const row: LoginHistoryEntry = { id: `lh-${Math.random().toString(36).slice(2, 8)}`, userId: String(b.userId ?? ''), userName: String(b.userName ?? ''), role: String(b.role ?? 'staff'), loginTime: String(b.loginTime ?? now()), logoutTime: b.logoutTime ? String(b.logoutTime) : null, ipAddress: b.ipAddress ? String(b.ipAddress) : null, device: b.device ? String(b.device) : null, loginStatus: String(b.loginStatus ?? 'success') };
      data.loginHistory.unshift(row);
      return clone(ok(row)) as T;
    }
    if (method === 'GET' && p === '/api/auth/login-history') return clone(ok({ rows: data.loginHistory, total: data.loginHistory.length })) as T;
    if (method === 'GET' && p === '/api/auth/login-history/stats') return clone(ok({ totalToday: data.loginHistory.length, failed: data.loginHistory.filter((r) => r.loginStatus !== 'success').length, staff: data.loginHistory.filter((r) => r.role === 'staff').length, customer: data.loginHistory.filter((r) => r.role === 'customer').length })) as T;

    if (method === 'GET' && p === '/api/dashboard') {
      const range = (typeof query?.range === 'string' ? query.range : 'today') as DateRangePreset;
      return clone(ok(dashboard(data.orders, range))) as T;
    }

    if (method === 'GET' && p === '/api/orders') return clone(ok(data.orders)) as T;
    if (method === 'POST' && p === '/api/orders') {
      const b = asRecord(body) ?? {};
      const receiptImageUrl = b.receiptImageUrl;
      if (receiptImageUrl !== undefined && receiptImageUrl !== null && typeof receiptImageUrl !== 'string') throw new Error('receiptImageUrl must be a string when provided');
      const id = `ord-${Math.random().toString(36).slice(2, 8)}`;
      const next: Order = {
        id,
        orderNumber: String(b.orderNumber ?? id.toUpperCase()),
        customerId: b.customerId ? String(b.customerId) : undefined,
        customerName: String(b.customerName ?? 'Guest'),
        orderType: (b.orderType as Order['orderType']) ?? 'pickup',
        items: Array.isArray(b.items) ? (b.items as Order['items']) : [],
        subtotal: Number(b.subtotal ?? 0),
        serviceFee: Number(b.serviceFee ?? 0),
        discount: Number(b.discount ?? 0),
        total: Number(b.total ?? 0),
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'gcash',
        receiptImageUrl: typeof receiptImageUrl === 'string' && receiptImageUrl ? receiptImageUrl : undefined,
        createdAt: now(),
        updatedAt: now(),
        statusTimeline: [],
      };
      data.orders.unshift(next);
      return clone(ok(next)) as T;
    }

    const orderMatch = p.match(/^\/api\/orders\/([^/]+)$/);
    if (method === 'GET' && orderMatch) return clone(ok(data.orders.find((o) => o.id === orderMatch[1]))) as T;
    const orderHistory = p.match(/^\/api\/orders\/([^/]+)\/history$/);
    if (method === 'GET' && orderHistory) return clone(ok(data.orders.find((o) => o.id === orderHistory[1])?.statusTimeline ?? [])) as T;
    const orderStatus = p.match(/^\/api\/orders\/([^/]+)\/status$/);
    if (method === 'PATCH' && orderStatus) {
      const o = data.orders.find((x) => x.id === orderStatus[1]);
      if (!o) throw new Error('Order not found');
      o.status = String((asRecord(body) ?? {}).status ?? o.status) as OrderStatus;
      o.updatedAt = now();
      return clone(ok(o)) as T;
    }
    const orderPayment = p.match(/^\/api\/orders\/([^/]+)\/payment$/);
    if (method === 'PATCH' && orderPayment) {
      const o = data.orders.find((x) => x.id === orderPayment[1]);
      if (!o) throw new Error('Order not found');
      o.paymentStatus = String((asRecord(body) ?? {}).paymentStatus ?? o.paymentStatus) as PaymentStatus;
      o.updatedAt = now();
      return clone(ok(o)) as T;
    }

    if (method === 'GET' && p === '/api/customers') return clone(ok(data.customers)) as T;
    const customerMatch = p.match(/^\/api\/customers\/([^/]+)$/);
    if (method === 'GET' && customerMatch) return clone(ok(data.customers.find((c) => c.id === customerMatch[1]))) as T;

    if (method === 'GET' && p === '/api/profile/me') return clone(ok(data.profile)) as T;
    if (method === 'PUT' && p === '/api/profile/me') {
      data.profile = { ...data.profile, ...(asRecord(body) ?? {}), updatedAt: now() };
      return clone(ok(data.profile)) as T;
    }

    const loyaltyMatch = p.match(/^\/api\/loyalty\/([^/]+)$/);
    if (method === 'GET' && loyaltyMatch) return clone(ok(data.loyalty[loyaltyMatch[1]] ?? { customerId: loyaltyMatch[1], stampCount: 0, availableRewards: [], redeemedRewards: [], updatedAt: now() })) as T;

    if (method === 'GET' && p === '/api/menu') return clone(ok(data.menuItems)) as T;
    if (method === 'POST' && p === '/api/menu') {
      const b = asRecord(body) ?? {};
      const item: MenuItem = { id: `mi-${Math.random().toString(36).slice(2, 8)}`, categoryId: String(b.categoryId ?? ''), name: String(b.name ?? ''), description: String(b.description ?? ''), price: Number(b.price ?? 0), isAvailable: Boolean(b.isAvailable ?? true), imageUrl: b.imageUrl ? String(b.imageUrl) : null, stock: Number(b.stock ?? 0), lowStockThreshold: Number(b.lowStockThreshold ?? 5), inventoryStatus: computeInventoryStatus(Number(b.stock ?? 0), Number(b.lowStockThreshold ?? 5)), discount: Number(b.discount ?? 0), createdAt: now(), updatedAt: now() };
      data.menuItems.unshift(item);
      return clone(ok(item)) as T;
    }
    const menuMatch = p.match(/^\/api\/menu\/([^/]+)$/);
    if (method === 'PUT' && menuMatch) {
      const b = asRecord(body) ?? {};
      const item: MenuItem = { id: menuMatch[1], categoryId: String(b.categoryId ?? ''), name: String(b.name ?? ''), description: String(b.description ?? ''), price: Number(b.price ?? 0), isAvailable: Boolean(b.isAvailable ?? true), imageUrl: b.imageUrl ? String(b.imageUrl) : null, stock: Number(b.stock ?? 0), lowStockThreshold: Number(b.lowStockThreshold ?? 5), inventoryStatus: computeInventoryStatus(Number(b.stock ?? 0), Number(b.lowStockThreshold ?? 5)), discount: Number(b.discount ?? 0), createdAt: String(b.createdAt ?? now()), updatedAt: now() };
      data.menuItems = data.menuItems.filter((m) => m.id !== menuMatch[1]);
      data.menuItems.unshift(item);
      return clone(ok(item)) as T;
    }
    if (method === 'DELETE' && menuMatch) {
      data.menuItems = data.menuItems.filter((m) => m.id !== menuMatch[1]);
      return undefined as T;
    }

    if (method === 'GET' && p === '/api/menu/daily') return clone(ok(data.dailyMenu)) as T;
    if (method === 'PUT' && p === '/api/menu/daily') {
      const b = asRecord(body) ?? {};
      data.dailyMenu = { ...data.dailyMenu, ...b, updatedAt: now() } as DailyMenu;
      return clone(ok(data.dailyMenu)) as T;
    }
    if (method === 'POST' && p === '/api/menu/daily/publish') return clone(ok({ ...data.dailyMenu, isPublished: true, updatedAt: now() })) as T;
    if (method === 'POST' && p === '/api/menu/daily/unpublish') return clone(ok({ ...data.dailyMenu, isPublished: false, updatedAt: now() })) as T;
    if (method === 'POST' && p === '/api/menu/daily/clear') return clone(ok({ ...data.dailyMenu, items: [], isPublished: false, updatedAt: now() })) as T;

    throw new Error(`Mock API endpoint not implemented: ${method} ${p}`);
  },
};
