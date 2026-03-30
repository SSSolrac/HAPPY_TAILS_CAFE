import { apiClient } from './client';
import type { LoginHistoryEntry, LoginHistoryFilters } from '@/types/loginHistory';
import type { SessionUser, UserRole } from '@/types/user';

export const authApi = {
  async login(payload: { email: string; password: string; role: UserRole; device: string }): Promise<SessionUser> {
    return apiClient.post<SessionUser>('/api/auth/login', payload);
  },

  async recordLoginHistory(entry: Omit<LoginHistoryEntry, 'id'>): Promise<LoginHistoryEntry> {
    return apiClient.post<LoginHistoryEntry>('/api/auth/login-history', entry);
  },

  async listLoginHistory(filters: LoginHistoryFilters): Promise<{ rows: LoginHistoryEntry[]; total: number }> {
    return apiClient.get<{ rows: LoginHistoryEntry[]; total: number }>('/api/auth/login-history', {
      query: filters.query,
      role: filters.role,
      status: filters.status,
      date: filters.date,
      page: filters.page,
      pageSize: filters.pageSize,
    });
  },

  async loginHistoryStats(): Promise<{ totalToday: number; failed: number; staff: number; customer: number }> {
    return apiClient.get<{ totalToday: number; failed: number; staff: number; customer: number }>('/api/auth/login-history/stats');
  },
};
