import { apiClient } from './client';
import { asRecord, unwrapData } from './response';

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  addresses: string[];
  preferences: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

const emptyProfile = (): Profile => ({
  id: '',
  name: '',
  email: '',
  phone: '',
  addresses: [],
  preferences: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const mapProfile = (raw: unknown): Profile => {
  const row = asRecord(raw);
  if (!row) return emptyProfile();
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    email: String(row.email ?? ''),
    phone: String(row.phone ?? ''),
    addresses: Array.isArray(row.addresses) ? row.addresses.map(String) : [],
    preferences: (asRecord(row.preferences) ?? {}) as Record<string, unknown>,
    createdAt: String(row.createdAt ?? new Date().toISOString()),
    updatedAt: String(row.updatedAt ?? row.createdAt ?? new Date().toISOString()),
  };
};

export const profileApi = {
  async getMe(): Promise<Profile> {
    const payload = await apiClient.get<unknown>('/api/profile/me');
    return mapProfile(unwrapData<unknown>(payload));
  },
  async updateMe(payload: Partial<Profile>): Promise<Profile> {
    const result = await apiClient.put<unknown>('/api/profile/me', payload);
    return mapProfile(unwrapData<unknown>(result));
  },
};
