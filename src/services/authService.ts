import { authApi } from '@/api/auth';
import { loginHistoryService } from '@/services/loginHistoryService';
import type { SessionUser, UserRole } from '@/types/user';

export const authService = {
  async login(email: string, password: string, role: UserRole, device: string): Promise<SessionUser> {
    try {
      const session = await authApi.login({ email, password, role, device });

      await loginHistoryService.recordLogin({
        userId: session.id,
        userName: session.name,
        role,
        loginTime: new Date().toISOString(),
        logoutTime: '',
        ipAddress: '127.0.0.1',
        device,
        loginStatus: 'success',
      });

      return session;
    } catch (error) {
      await loginHistoryService.recordLogin({
        userId: 'unknown',
        userName: email,
        role,
        loginTime: new Date().toISOString(),
        logoutTime: '',
        ipAddress: '127.0.0.1',
        device,
        loginStatus: 'failed',
      });
      throw error;
    }
  },
};
