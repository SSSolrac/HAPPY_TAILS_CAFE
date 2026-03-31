import { LOYALTY_MILESTONES, LOYALTY_TOTAL_STAMPS } from '@/types/loyalty';
import type { CustomerProfile, LoyaltyAccount } from '@/types/customer';
import type { DailyMenu } from '@/types/dailyMenu';
import type { DashboardSummary, DateRangePreset } from '@/types/dashboard';
import type { LoginHistoryEntry } from '@/types/loginHistory';
import type { MenuItem } from '@/types/menuItem';
import type { Order, OrderItem, OrderStatus, PaymentMethod, PaymentStatus } from '@/types/order';
import type { SessionUser, UserRole } from '@/types/user';
import { asRecord } from './response';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type Query = Record<string, string | number | undefined>;

type MockProfile = {
  id: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

type MockDb = {
  menuItems: MenuItem[];
  dailyMenu: DailyMenu;
  orders: Order[];
  customers: CustomerProfile[];
  loyalty: Record<string, LoyaltyAccount>;
  loginHistory: LoginHistoryEntry[];
  profile: MockProfile;
};

let db: MockDb | null = null;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const nowIso = () => new Date().toISOString();
const today = () => nowIso().slice(0, 10);
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const makeMenuItem = (id: string, name: string, categoryId: string, price: number): MenuItem => ({
  id,
  name,
  categoryId,
  description: '',
  price,
  isAvailable: true,
  imageUrl: '',
  createdAt: daysAgo(30),
  updatedAt: daysAgo(1),
});

const makeCustomer = (id: string, fullName: string, email: string): CustomerProfile => ({
  id,
  fullName,
  email,
  phone: null,
  address: null,
  city: null,
  notes: null,
  createdAt: daysAgo(120),
  updatedAt: daysAgo(2),
});

const makeLoyalty = (customerId: string, currentStampCount: number, totalStampsEarned: number, rewardsUnlocked: string[], lastStampedOrderId: string | null): LoyaltyAccount => ({
  customerId,
  currentStampCount,
  totalStampsEarned,
  rewardsUnlocked,
  lastStampedOrderId,
  updatedAt: daysAgo(1),
});

const makeOrderItem = (orderId: string, index: number, menuItemId: string, itemName: string, qty: number, unitPrice: number): OrderItem => ({
  id: `${orderId}-item-${index + 1}`,
  orderId,
  menuItemId,
  itemName,
  qty,
  unitPrice,
  lineTotal: qty * unitPrice,
});

const makeOrder = (payload: {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  orderType: Order['orderType'];
  loyaltyStampStatus?: Order['loyaltyStampStatus'];
}): Order => {
  const subtotal = payload.items.reduce((sum, row) => sum + row.lineTotal, 0);
  const serviceFee = Math.round(subtotal * 0.05);
  const total = subtotal + serviceFee;
  return {
    id: payload.id,
    orderNumber: payload.orderNumber,
    customerId: payload.customerId,
    customerName: payload.customerName,
    orderType: payload.orderType,
    items: payload.items,
    subtotal,
    serviceFee,
    discount: 0,
    total,
    status: payload.status,
    statusTimeline: [{ id: `${payload.id}-status-1`, orderId: payload.id, status: payload.status, changedAt: payload.updatedAt }],
    paymentStatus: payload.paymentStatus,
    paymentMethod: payload.paymentMethod,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
    notes: '',
    loyaltyStampStatus: payload.loyaltyStampStatus,
  };
};

const seedDb = (): MockDb => {
  const menuItems = [
    makeMenuItem('mi-001', 'Cafe Latte', 'coffee', 150),
    makeMenuItem('mi-002', 'Cappuccino', 'coffee', 140),
    makeMenuItem('mi-003', 'Butter Croissant', 'pastry', 90),
    makeMenuItem('mi-004', 'Chicken Pesto Sandwich', 'sandwich', 210),
  ];

  const customers = [
    makeCustomer('cus-001', 'Mia Santos', 'mia.santos@example.com'),
    makeCustomer('cus-002', 'Paolo Reyes', 'paolo.reyes@example.com'),
    makeCustomer('cus-003', 'Alyssa Cruz', 'alyssa.cruz@example.com'),
  ];

  const loyalty: Record<string, LoyaltyAccount> = {
    'cus-001': makeLoyalty('cus-001', 5, 15, ['Free Latte'], 'ord-1001'),
    'cus-002': makeLoyalty('cus-002', 1, 1, [], 'ord-1002'),
    'cus-003': makeLoyalty('cus-003', 9, 19, ['Free Latte'], 'ord-1003'),
  };

  const orders: Order[] = [
    makeOrder({
      id: 'ord-1001',
      orderNumber: 'ORD-1001',
      customerId: 'cus-001',
      customerName: 'Mia Santos',
      orderType: 'pickup',
      items: [makeOrderItem('ord-1001', 0, 'mi-001', 'Cafe Latte', 2, 150), makeOrderItem('ord-1001', 1, 'mi-003', 'Butter Croissant', 1, 90)],
      status: 'completed',
      paymentStatus: 'paid',
      paymentMethod: 'gcash',
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
      loyaltyStampStatus: 'stamp-awarded',
    }),
    makeOrder({
      id: 'ord-1002',
      orderNumber: 'ORD-1002',
      customerId: 'cus-002',
      customerName: 'Paolo Reyes',
      orderType: 'dine_in',
      items: [makeOrderItem('ord-1002', 0, 'mi-002', 'Cappuccino', 1, 140)],
      status: 'preparing',
      paymentStatus: 'pending',
      paymentMethod: 'qrph',
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
    }),
    makeOrder({
      id: 'ord-1003',
      orderNumber: 'ORD-1003',
      customerId: 'cus-003',
      customerName: 'Alyssa Cruz',
      orderType: 'delivery',
      items: [makeOrderItem('ord-1003', 0, 'mi-004', 'Chicken Pesto Sandwich', 1, 210)],
      status: 'out_for_delivery',
      paymentStatus: 'paid',
      paymentMethod: 'bdo',
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
      loyaltyStampStatus: 'already-stamped',
    }),
  ];

  const todayKey = today();
  const dailyMenu: DailyMenu = {
    id: `dm-${todayKey}`,
    menuDate: todayKey,
    isPublished: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    items: [
      { id: 'dmi-001', dailyMenuId: `dm-${todayKey}`, menuItemId: 'mi-001', isAvailable: true, sortOrder: 1 },
      { id: 'dmi-002', dailyMenuId: `dm-${todayKey}`, menuItemId: 'mi-002', isAvailable: true, sortOrder: 2 },
      { id: 'dmi-003', dailyMenuId: `dm-${todayKey}`, menuItemId: 'mi-003', isAvailable: true, sortOrder: 3 },
    ],
  };

  const loginHistory: LoginHistoryEntry[] = [];

  const profile: MockProfile = {
    id: 'user-owner',
    fullName: 'Happy Tails Owner',
    email: 'owner@happytails.com',
    phone: null,
    address: null,
    city: null,
    notes: null,
    createdAt: daysAgo(365),
    updatedAt: daysAgo(1),
  };

  return { menuItems, dailyMenu, orders, customers, loyalty, loginHistory, profile };
};

const getDb = () => (db ??= seedDb());

const toNumber = (value: unknown, fallback: number) => {
  const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isFinite(numeric) ? numeric : fallback;
};

const requireOrder = (orders: Order[], orderId: string) => {
  const order = orders.find((row) => row.id === orderId);
  if (!order) throw new Error(`Order not found: ${orderId}`);
  return order;
};

const computeDashboard = (range: DateRangePreset, data: MockDb): DashboardSummary => {
  const rangeToDays: Record<DateRangePreset, number> = { '1M': 30, '3M': 90, '6M': 180, '1Y': 365, ALL: 36500 };
  const cutoff = range === 'ALL' ? 0 : Date.now() - rangeToDays[range] * 24 * 60 * 60 * 1000;

  const inRange = data.orders
    .filter((order) => new Date(order.createdAt).getTime() >= cutoff)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const baseStatusSummary: DashboardSummary['orderStatusSummary'] = {
    pending: 0,
    preparing: 0,
    ready: 0,
    out_for_delivery: 0,
    completed: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
  };

  const orderStatusSummary = inRange.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] ?? 0) + 1;
    return acc;
  }, { ...baseStatusSummary });

  const paidOrders = inRange.filter((order) => order.paymentStatus === 'paid');
  const sumTotals = (rows: Order[]) => rows.reduce((sum, row) => sum + row.total, 0);
  const withinDays = (rows: Order[], days: number) => {
    const cutoffMs = Date.now() - days * 24 * 60 * 60 * 1000;
    return rows.filter((row) => new Date(row.createdAt).getTime() >= cutoffMs);
  };

  const monthlyRows = withinDays(paidOrders, 30);
  const monthlySales = sumTotals(monthlyRows);

  const itemAgg = new Map<string, { itemName: string; qtySold: number; revenue: number }>();
  paidOrders.forEach((order) => {
    order.items.forEach((orderItem) => {
      const prev = itemAgg.get(orderItem.itemName) ?? { itemName: orderItem.itemName, qtySold: 0, revenue: 0 };
      prev.qtySold += orderItem.qty;
      prev.revenue += orderItem.qty * orderItem.unitPrice;
      itemAgg.set(orderItem.itemName, prev);
    });
  });

  return {
    salesSummary: {
      todaySales: sumTotals(paidOrders.filter((row) => row.createdAt.startsWith(today()))),
      weeklySales: sumTotals(withinDays(paidOrders, 7)),
      monthlySales,
      averageOrderValue: monthlyRows.length ? monthlySales / monthlyRows.length : 0,
    },
    orderStatusSummary,
    recentOrders: inRange.slice(0, 8),
    topSellingItems: Array.from(itemAgg.values()).sort((a, b) => b.qtySold - a.qtySold || b.revenue - a.revenue).slice(0, 8),
    customerSummary: {
      totalCustomers: data.customers.length,
      activeLoyaltyCustomers: Object.values(data.loyalty).filter((account) => account.currentStampCount > 0).length,
    },
  };
};

const applyLoyaltyStamp = (data: MockDb, order: Order) => {
  if (!order.customerId) return;

  const account = data.loyalty[order.customerId] ?? makeLoyalty(order.customerId, 0, 0, [], null);
  const alreadyStamped = account.lastStampedOrderId === order.id || order.loyaltyStampStatus === 'already-stamped' || order.loyaltyStampStatus === 'stamp-awarded';

  if (alreadyStamped) {
    order.loyaltyStampStatus = 'already-stamped';
    order.loyaltyMessage = 'Stamp already applied for this order.';
    return;
  }

  account.totalStampsEarned += 1;
  account.currentStampCount = Math.min(LOYALTY_TOTAL_STAMPS, account.currentStampCount + 1);
  account.lastStampedOrderId = order.id;
  account.updatedAt = nowIso();

  const unlocked = LOYALTY_MILESTONES
    .filter((milestone) => account.currentStampCount >= milestone.stampCount)
    .map((milestone) => milestone.reward)
    .filter((reward) => !account.rewardsUnlocked.includes(reward));

  if (unlocked.length) account.rewardsUnlocked = [...account.rewardsUnlocked, ...unlocked];

  data.loyalty[order.customerId] = account;

  order.loyaltyStampStatus = 'stamp-awarded';
  order.loyaltyStampedAt = nowIso();
  order.loyaltyStampedBy = 'automatic-order-confirmation';
  order.loyaltyMessage = unlocked.length ? `Stamp awarded. Reward unlocked: ${unlocked.join(', ')}.` : 'Stamp awarded automatically after payment confirmation.';
  order.loyaltyUnlockedRewards = unlocked;
};

export const mockApi = {
  async request<T>(method: HttpMethod, path: string, query?: Query, body?: unknown): Promise<T> {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const data = getDb();

    if (method === 'POST' && normalizedPath === '/api/auth/login') {
      const payload = asRecord(body) ?? {};
      const email = typeof payload.email === 'string' ? payload.email : '';
      const password = typeof payload.password === 'string' ? payload.password : '';
      const role = typeof payload.role === 'string' ? (payload.role as UserRole) : 'staff';

      const ownerOk = email.toLowerCase() === 'owner@happytails.com' && role === 'owner';
      const staffOk = email.toLowerCase() === 'staff@happytails.com' && role === 'staff';

      if (!password.trim() || (!ownerOk && !staffOk)) {
        throw new Error('Invalid demo credentials. Use owner@happytails.com or staff@happytails.com with any non-empty password.');
      }

      const user: Omit<SessionUser, 'token'> = ownerOk
        ? { id: 'user-owner', name: 'Happy Tails Owner', email, role: 'owner', avatar: '' }
        : { id: 'user-staff', name: 'Happy Tails Staff', email, role: 'staff', avatar: '' };

      return { ...user, token: `mock-token-${Math.random().toString(36).slice(2, 12)}` } as T;
    }

    if (method === 'POST' && normalizedPath === '/api/auth/login-history') {
      const payload = asRecord(body) ?? {};
      const entry: LoginHistoryEntry = {
        id: `lh-${Math.random().toString(36).slice(2, 10)}`,
        userId: typeof payload.userId === 'string' ? payload.userId : 'unknown',
        userName: typeof payload.userName === 'string' ? payload.userName : 'unknown',
        role: typeof payload.role === 'string' ? payload.role : 'staff',
        loginTime: typeof payload.loginTime === 'string' ? payload.loginTime : nowIso(),
        logoutTime: typeof payload.logoutTime === 'string' ? payload.logoutTime : null,
        ipAddress: typeof payload.ipAddress === 'string' ? payload.ipAddress : '127.0.0.1',
        device: typeof payload.device === 'string' ? payload.device : 'unknown',
        loginStatus: typeof payload.loginStatus === 'string' ? payload.loginStatus : 'success',
      };
      data.loginHistory = [entry, ...data.loginHistory];
      return clone(entry) as T;
    }

    if (method === 'GET' && normalizedPath === '/api/auth/login-history') {
      const q = typeof query?.query === 'string' ? query.query.trim().toLowerCase() : '';
      const role = typeof query?.role === 'string' ? query.role : 'all';
      const status = typeof query?.status === 'string' ? query.status : 'all';
      const date = typeof query?.date === 'string' ? query.date : '';
      const page = toNumber(query?.page, 1);
      const pageSize = toNumber(query?.pageSize, 10);

      const filtered = data.loginHistory
        .filter((row) => (q ? row.userName.toLowerCase().includes(q) : true))
        .filter((row) => (role && role !== 'all' ? row.role === role : true))
        .filter((row) => (status && status !== 'all' ? row.loginStatus === status : true))
        .filter((row) => (date ? row.loginTime.startsWith(date) : true))
        .sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime());

      const total = filtered.length;
      const start = Math.max(0, (page - 1) * pageSize);
      const rows = filtered.slice(start, start + pageSize);
      return clone({ rows, total }) as T;
    }

    if (method === 'GET' && normalizedPath === '/api/auth/login-history/stats') {
      const todayKey = today();
      const todayRows = data.loginHistory.filter((row) => row.loginTime.startsWith(todayKey));
      return clone({
        totalToday: todayRows.length,
        failed: todayRows.filter((row) => row.loginStatus !== 'success').length,
        staff: todayRows.filter((row) => row.role === 'staff').length,
        customer: todayRows.filter((row) => row.role === 'customer').length,
      }) as T;
    }

    if (method === 'GET' && normalizedPath === '/api/dashboard') {
      const range = (typeof query?.range === 'string' ? query.range : '1M') as DateRangePreset;
      return clone(computeDashboard(range, data)) as T;
    }

    if (method === 'GET' && normalizedPath === '/api/orders') return clone(data.orders) as T;

    const orderByIdMatch = normalizedPath.match(/^\/api\/orders\/([^/]+)$/);
    if (method === 'GET' && orderByIdMatch) return clone(requireOrder(data.orders, orderByIdMatch[1])) as T;

    const orderHistoryMatch = normalizedPath.match(/^\/api\/orders\/([^/]+)\/history$/);
    if (method === 'GET' && orderHistoryMatch) {
      const order = requireOrder(data.orders, orderHistoryMatch[1]);
      return clone(order.statusTimeline ?? []) as T;
    }

    const orderPaymentMatch = normalizedPath.match(/^\/api\/orders\/([^/]+)\/payment$/);
    if (method === 'PATCH' && orderPaymentMatch) {
      const order = requireOrder(data.orders, orderPaymentMatch[1]);
      const payload = asRecord(body) ?? {};
      const paymentStatus = typeof payload.paymentStatus === 'string' ? (payload.paymentStatus as PaymentStatus) : 'paid';

      order.paymentStatus = paymentStatus;
      order.updatedAt = nowIso();
      order.statusTimeline = [
        ...(order.statusTimeline ?? []),
        { id: `${order.id}-status-${(order.statusTimeline?.length ?? 0) + 1}`, orderId: order.id, status: order.status, note: `Payment updated: ${paymentStatus}`, changedAt: order.updatedAt },
      ];

      if (paymentStatus === 'paid') applyLoyaltyStamp(data, order);
      return clone(order) as T;
    }

    const orderStatusMatch = normalizedPath.match(/^\/api\/orders\/([^/]+)\/status$/);
    if (method === 'PATCH' && orderStatusMatch) {
      const order = requireOrder(data.orders, orderStatusMatch[1]);
      const payload = asRecord(body) ?? {};
      const status = typeof payload.status === 'string' ? (payload.status as OrderStatus) : order.status;
      order.status = status;
      order.updatedAt = nowIso();
      order.statusTimeline = [
        ...(order.statusTimeline ?? []),
        { id: `${order.id}-status-${(order.statusTimeline?.length ?? 0) + 1}`, orderId: order.id, status, changedAt: order.updatedAt },
      ];
      return clone(order) as T;
    }

    if (method === 'GET' && normalizedPath === '/api/menu') return clone(data.menuItems) as T;

    if (method === 'POST' && normalizedPath === '/api/menu') {
      const payload = asRecord(body) ?? {};
      const next: MenuItem = {
        id: `mi-${Math.random().toString(36).slice(2, 8)}`,
        name: typeof payload.name === 'string' ? payload.name : 'New item',
        categoryId: typeof payload.categoryId === 'string' ? payload.categoryId : '',
        description: typeof payload.description === 'string' ? payload.description : '',
        price: toNumber(payload.price, 0),
        isAvailable: typeof payload.isAvailable === 'boolean' ? payload.isAvailable : true,
        imageUrl: typeof payload.imageUrl === 'string' ? payload.imageUrl : '',
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      data.menuItems = [next, ...data.menuItems];
      return clone(next) as T;
    }

    const menuByIdMatch = normalizedPath.match(/^\/api\/menu\/([^/]+)$/);
    if (method === 'PUT' && menuByIdMatch) {
      const payload = asRecord(body) ?? {};
      const itemId = menuByIdMatch[1];
      const next: MenuItem = {
        id: itemId,
        name: typeof payload.name === 'string' ? payload.name : 'Menu item',
        categoryId: typeof payload.categoryId === 'string' ? payload.categoryId : '',
        description: typeof payload.description === 'string' ? payload.description : '',
        price: toNumber(payload.price, 0),
        isAvailable: typeof payload.isAvailable === 'boolean' ? payload.isAvailable : true,
        imageUrl: typeof payload.imageUrl === 'string' ? payload.imageUrl : '',
        createdAt: typeof payload.createdAt === 'string' ? payload.createdAt : nowIso(),
        updatedAt: nowIso(),
      };
      const index = data.menuItems.findIndex((row) => row.id === itemId);
      if (index >= 0) data.menuItems[index] = next;
      else data.menuItems = [next, ...data.menuItems];
      return clone(next) as T;
    }

    if (method === 'DELETE' && menuByIdMatch) {
      const itemId = menuByIdMatch[1];
      data.menuItems = data.menuItems.filter((row) => row.id !== itemId);
      data.dailyMenu.items = data.dailyMenu.items.filter((row) => row.menuItemId !== itemId);
      return undefined as T;
    }

    if (method === 'GET' && normalizedPath === '/api/menu/daily') return clone(data.dailyMenu) as T;

    if (method === 'PUT' && normalizedPath === '/api/menu/daily') {
      const payload = asRecord(body) ?? {};
      data.dailyMenu = {
        id: typeof payload.id === 'string' && payload.id ? payload.id : data.dailyMenu.id,
        menuDate: typeof payload.menuDate === 'string' ? payload.menuDate : today(),
        isPublished: typeof payload.isPublished === 'boolean' ? payload.isPublished : data.dailyMenu.isPublished,
        createdAt: typeof payload.createdAt === 'string' ? payload.createdAt : data.dailyMenu.createdAt,
        updatedAt: nowIso(),
        items: Array.isArray(payload.items)
          ? payload.items.map((row, index) => {
              const item = asRecord(row) ?? {};
              return {
                id: typeof item.id === 'string' && item.id ? item.id : `dmi-${Math.random().toString(36).slice(2, 10)}`,
                dailyMenuId: typeof item.dailyMenuId === 'string' && item.dailyMenuId ? item.dailyMenuId : data.dailyMenu.id,
                menuItemId: typeof item.menuItemId === 'string' ? item.menuItemId : '',
                isAvailable: typeof item.isAvailable === 'boolean' ? item.isAvailable : true,
                sortOrder: toNumber(item.sortOrder, index + 1),
              };
            })
          : data.dailyMenu.items,
      };
      return clone(data.dailyMenu) as T;
    }

    if (method === 'POST' && normalizedPath === '/api/menu/daily/publish') {
      data.dailyMenu.isPublished = true;
      data.dailyMenu.updatedAt = nowIso();
      return clone(data.dailyMenu) as T;
    }

    if (method === 'POST' && normalizedPath === '/api/menu/daily/unpublish') {
      data.dailyMenu.isPublished = false;
      data.dailyMenu.updatedAt = nowIso();
      return clone(data.dailyMenu) as T;
    }

    if (method === 'POST' && normalizedPath === '/api/menu/daily/clear') {
      data.dailyMenu.items = [];
      data.dailyMenu.isPublished = false;
      data.dailyMenu.updatedAt = nowIso();
      return clone(data.dailyMenu) as T;
    }

    if (method === 'GET' && normalizedPath === '/api/customers') return clone(data.customers) as T;

    const customerByIdMatch = normalizedPath.match(/^\/api\/customers\/([^/]+)$/);
    if (method === 'GET' && customerByIdMatch) {
      const customer = data.customers.find((row) => row.id === customerByIdMatch[1]);
      if (!customer) throw new Error(`Customer not found: ${customerByIdMatch[1]}`);
      return clone(customer) as T;
    }

    const loyaltyByIdMatch = normalizedPath.match(/^\/api\/loyalty\/([^/]+)$/);
    if (method === 'GET' && loyaltyByIdMatch) {
      const customerId = loyaltyByIdMatch[1];
      return clone(data.loyalty[customerId] ?? makeLoyalty(customerId, 0, 0, [], null)) as T;
    }

    if (method === 'GET' && normalizedPath === '/api/profile/me') return clone(data.profile) as T;

    if (method === 'PUT' && normalizedPath === '/api/profile/me') {
      const payload = asRecord(body) ?? {};
      data.profile = {
        ...data.profile,
        fullName: typeof payload.fullName === 'string' ? payload.fullName : data.profile.fullName,
        email: typeof payload.email === 'string' ? payload.email : data.profile.email,
        phone: typeof payload.phone === 'string' ? payload.phone : data.profile.phone,
        address: typeof payload.address === 'string' ? payload.address : data.profile.address,
        city: typeof payload.city === 'string' ? payload.city : data.profile.city,
        notes: typeof payload.notes === 'string' ? payload.notes : data.profile.notes,
        updatedAt: nowIso(),
      };
      return clone(data.profile) as T;
    }

    if (method === 'POST' && normalizedPath === '/api/imports/csv') {
      const payload = asRecord(body) ?? {};
      const rows = Array.isArray(payload.rows) ? payload.rows : [];
      return clone({ imported: rows.length }) as T;
    }

    throw new Error(`Mock API endpoint not implemented: ${method} ${normalizedPath}`);
  },
};
