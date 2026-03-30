import { useCallback, useEffect, useState } from 'react';
import { dailyMenuService } from '@/services/dailyMenuService';
import type { DailyMenu } from '@/types/dailyMenu';

export const useDailyMenu = () => {
  const [menu, setMenu] = useState<DailyMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setMenu(await dailyMenuService.getCurrentDailyMenu());
    } catch (loadError) {
      console.error('Failed to load daily menu', loadError);
      setError('Unable to load daily menu.');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveDraft = useCallback(async (next: DailyMenu) => {
    setSaving(true);
    try {
      const saved = await dailyMenuService.saveDailyMenu(next);
      setMenu(saved);
      return saved;
    } finally {
      setSaving(false);
    }
  }, []);

  const publish = useCallback(async (next: DailyMenu) => {
    setSaving(true);
    try {
      const saved = await dailyMenuService.publishDailyMenu(next);
      setMenu(saved);
      return saved;
    } finally {
      setSaving(false);
    }
  }, []);

  const unpublish = useCallback(async () => {
    setSaving(true);
    try {
      const saved = await dailyMenuService.unpublishDailyMenu();
      setMenu(saved);
      return saved;
    } finally {
      setSaving(false);
    }
  }, []);

  const clearMenu = useCallback(async () => {
    setSaving(true);
    try {
      const saved = await dailyMenuService.clearDailyMenu();
      setMenu(saved);
      return saved;
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { menu, loading, saving, error, saveDraft, publish, unpublish, clearMenu, refresh: load };
};
