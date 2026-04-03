import { apiClient } from './client';
import { unwrapDataObject } from './response';
import type { LoginHistoryEntry, LoginHistoryFilters } from '@/types/loginHistory';
import type { SessionUser, UserRole } from '@/types/user';

type LoginHistoryListResponse = { rows: LoginHistoryEntry[]; total: number };
type LoginHistoryStats = { totalToday: number; failed: number; staff: number; customer: number };

export const authApi = {
  async login(payload: { email: string; password: string; role: UserRole; device: string }): Promise<SessionUser> {
    const response = await apiClient.post<unknown>('/api/auth/login', payload);
    return unwrapDataObject<SessionUser>(response);
  },

  async recordLoginHistory(entry: Omit<LoginHistoryEntry, 'id'>): Promise<LoginHistoryEntry> {
    const response = await apiClient.post<unknown>('/api/auth/login-history', entry);
    return unwrapDataObject<LoginHistoryEntry>(response);
  },

  async listLoginHistory(filters: LoginHistoryFilters): Promise<LoginHistoryListResponse> {
    const response = await apiClient.get<unknown>('/api/auth/login-history', {
      query: filters.query,
      role: filters.role,
      status: filters.status,
      date: filters.date,
      page: filters.page,
      pageSize: filters.pageSize,
    });
    return unwrapDataObject<LoginHistoryListResponse>(response);
  },

  async loginHistoryStats(): Promise<LoginHistoryStats> {
    const response = await apiClient.get<unknown>('/api/auth/login-history/stats');
    return unwrapDataObject<LoginHistoryStats>(response);
  },
};
