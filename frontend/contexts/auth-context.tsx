'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api/services';
import { clearTokens, getRefreshToken, setTokens } from '@/lib/api/client';
import type { User } from '@/lib/api/types';
import { ApiError } from '@/lib/api/client';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    full_name: string;
    email: string;
    password: string;
    phone_number?: string;
    organization_name: string;
    organization_type: string;
    organization_description?: string;
    organization_email?: string;
    organization_phone?: string;
    organization_address?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      setUser(data);
    } catch {
      setUser(null);
      clearTokens();
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const token = typeof window !== 'undefined' ? localStorage.getItem('thrivefund_access_token') : null;

    const finish = () => {
      if (!cancelled) setLoading(false);
    };

    const safetyTimer = window.setTimeout(finish, 12_000);

    if (token) {
      refreshUser().finally(() => {
        window.clearTimeout(safetyTimer);
        finish();
      });
    } else {
      window.clearTimeout(safetyTimer);
      finish();
    }

    return () => {
      cancelled = true;
      window.clearTimeout(safetyTimer);
    };
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });
    setTokens(data.tokens);
    setUser(data.user);
    router.push(data.user.role === 'admin' ? '/admin' : '/dashboard');
  }, [router]);

  const register = useCallback(async (data: {
    full_name: string;
    email: string;
    password: string;
    phone_number?: string;
    organization_name: string;
    organization_type: string;
    organization_description?: string;
    organization_email?: string;
    organization_phone?: string;
    organization_address?: string;
  }) => {
    await authApi.register(data);
    router.push(`/check-email?email=${encodeURIComponent(data.email)}`);
  }, [router]);

  const logout = useCallback(async () => {
    const refresh = getRefreshToken();
    try {
      if (refresh) await authApi.logout(refresh);
    } catch {
      // ignore
    }
    clearTokens();
    setUser(null);
    router.push('/login');
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function getAuthErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}
