import { apiClient } from './client';
import { unwrapDataObject } from './response';
import type { DashboardSummary, DateRangePreset } from '@/types/dashboard';

export const dashboardApi = {
  async getDashboardData(range: DateRangePreset): Promise<DashboardSummary> {
    const payload = await apiClient.get<unknown>('/api/dashboard', { range });
    return unwrapDataObject<DashboardSummary>(payload);
  },
};
