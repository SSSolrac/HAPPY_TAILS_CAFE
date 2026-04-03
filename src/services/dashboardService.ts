import { dashboardApi } from '@/api/dashboard';
import type { DashboardData, DateRangePreset } from '@/types/dashboard';

export const dashboardService = {
  async getDashboardData(range: DateRangePreset): Promise<DashboardData> {
    return dashboardApi.getDashboardData(range);
  },
};
