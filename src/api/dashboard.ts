import { apiClient } from './client';
import { unwrapObject } from './response';
import type { DashboardSummary, DateRangePreset } from '@/types/dashboard';

export const dashboardApi = {
  async getDashboardData(range: DateRangePreset): Promise<DashboardSummary> {
    const payload = await apiClient.get<unknown>('/api/dashboard', { range });
    return (unwrapObject<DashboardSummary>(payload) ?? payload) as DashboardSummary;
  },
};
