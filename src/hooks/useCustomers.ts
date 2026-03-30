import { useCallback, useEffect, useState } from 'react';
import { customerService } from '@/services/customerService';
import type { CustomerWithLoyalty } from '@/types/customer';

export const useCustomers = () => {
  const [customers, setCustomers] = useState<CustomerWithLoyalty[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await customerService.getCustomers();
      setCustomers(rows);
    } catch (loadError) {
      console.error('Failed to load customers', loadError);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  return { customers, loading, refresh: loadCustomers };
};
