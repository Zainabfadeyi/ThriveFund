'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowLeftRight,
  Building2,
  CreditCard,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  PanelLeftClose,
  RefreshCw,
  Shield,
  Target,
  Users,
  Webhook,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { LoadingState } from '@/components/shared/query-states';

const adminNavItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/organizations', label: 'Organizations', icon: Building2 },
  { href: '/admin/campaigns', label: 'Campaigns', icon: Target },
  { href: '/admin/payments', label: 'Payments In', icon: ArrowLeftRight },
  { href: '/admin/payouts', label: 'Payouts', icon: CreditCard },
  { href: '/admin/reconciliation', label: 'Reconciliation', icon: RefreshCw },
  { href: '/admin/webhooks', label: 'Webhooks', icon: Webhook },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
      return;
    }
    if (!loading && user && user.role !== 'admin') {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0F172A]">
        <LoadingState message="Loading admin console..." />
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="flex min-h-screen bg-slate-100">
      {open && <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          'fixed left-0 top-0 z-30 flex h-full flex-col overflow-hidden bg-[#0F172A] transition-all duration-300',
          open ? 'w-64' : 'w-0 lg:w-16',
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500">
            <Shield size={16} className="text-white" />
          </div>
          {open && (
            <div>
              <p className="whitespace-nowrap text-sm font-bold text-white">ThriveFund Admin</p>
              <p className="text-xs text-slate-400">Platform console</p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
          {adminNavItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => window.innerWidth < 1024 && setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                  active ? 'bg-amber-500 text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white',
                )}
              >
                <Icon size={18} className="shrink-0" />
                {open && <span className="font-medium">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {open && (
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500 text-sm font-semibold text-white">
                {getInitials(user.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{user.full_name}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
              <button type="button" onClick={() => logout()} className="text-slate-500 hover:text-white">
                <LogOut size={15} />
              </button>
            </div>
          </div>
        )}
      </aside>

      <div className={cn('flex min-h-screen flex-1 flex-col transition-all', open ? 'lg:ml-64' : 'lg:ml-16')}>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-6 py-3.5 backdrop-blur">
          <button type="button" onClick={() => setOpen(!open)} className="text-slate-500 hover:text-slate-900">
            {open ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
          </button>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">Super Admin</span>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
