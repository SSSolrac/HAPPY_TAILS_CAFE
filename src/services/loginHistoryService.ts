import { authApi } from '@/api/auth';
import type { LoginHistoryEntry, LoginHistoryFilters } from '@/types/loginHistory';

export const loginHistoryService = {
  async recordLogin(entry: Omit<LoginHistoryEntry, 'id'>) {
    return authApi.recordLoginHistory(entry);
  },

  async recordLogout(userId: string) {
    await authApi.recordLoginHistory({
      userId,
      userName: 'unknown',
      role: 'staff',
      loginTime: new Date().toISOString(),
      logoutTime: new Date().toISOString(),
      ipAddress: '0.0.0.0',
      device: 'unknown',
      loginStatus: 'success',
    });
  },

  async getLoginHistory(filters: LoginHistoryFilters) {
    return authApi.listLoginHistory(filters);
  },

  async getLoginStats() {
    return authApi.loginHistoryStats();
  },
};
