import { dashboardApi } from '@/api/dashboard';
import type { DashboardSummary, DateRangePreset } from '@/types/dashboard';

export const dashboardService = {
  async getDashboardData(range: DateRangePreset): Promise<DashboardSummary> {
    return dashboardApi.getDashboardData(range);
  },
};
