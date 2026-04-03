import { apiClient } from './client';
import { unwrapDataObject } from './response';
import type { DailyMenu } from '@/types/dailyMenu';

export const dailyMenuApi = {
  get(): Promise<DailyMenu> {
    return apiClient.get<unknown>('/api/menu/daily').then((payload) => unwrapDataObject<DailyMenu>(payload));
  },
  update(payload: DailyMenu): Promise<DailyMenu> {
    return apiClient.put<unknown>('/api/menu/daily', payload).then((result) => unwrapDataObject<DailyMenu>(result));
  },
  publish(): Promise<DailyMenu> {
    return apiClient.post<unknown>('/api/menu/daily/publish').then((result) => unwrapDataObject<DailyMenu>(result));
  },
  unpublish(): Promise<DailyMenu> {
    return apiClient.post<unknown>('/api/menu/daily/unpublish').then((result) => unwrapDataObject<DailyMenu>(result));
  },
  clear(): Promise<DailyMenu> {
    return apiClient.post<unknown>('/api/menu/daily/clear').then((result) => unwrapDataObject<DailyMenu>(result));
  },
};
