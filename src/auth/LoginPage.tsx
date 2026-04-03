import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/user';

export const LoginPage = () => {
  const [email, setEmail] = useState('admin@happytails.com');
  const [password, setPassword] = useState('password');
  const [role, setRole] = useState<UserRole>('admin');
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await login(email, password, role);
      toast.success('Login successful');
      navigate(role === 'admin' ? '/dashboard' : '/dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF7F9] flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-xl bg-white border border-[#F3D6DB] p-6 shadow-[0_2px_10px_rgba(31,41,55,0.05)] space-y-4">
        <h1 className="text-2xl font-semibold">Staffowner Login</h1>
        <input className="w-full border rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full border rounded px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <select className="w-full border rounded px-3 py-2" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
        </select>
        <button className="w-full rounded bg-[#FFB6C1] text-[#1F2937] py-2">Sign in</button>
        <p className="text-xs text-[#6B7280]">Use admin@happytails.com or staff@happytails.com with any password.</p>
      </form>
    </div>
  );
};
