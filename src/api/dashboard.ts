import { apiClient } from './client';
import type { DashboardData, DateRangePreset } from '@/types/dashboard';

export const dashboardApi = {
  async getDashboardData(range: DateRangePreset): Promise<DashboardData> {
    return apiClient.get<DashboardData>('/api/dashboard', { range });
  },
};
