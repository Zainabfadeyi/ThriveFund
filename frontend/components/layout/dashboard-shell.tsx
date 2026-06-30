'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Target,
  CreditCard,
  ArrowLeftRight,
  RefreshCw,
  Users,
  FileText,
  Mail,
  Shield,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Bell,
  BarChart3,
  Settings,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { LoadingState } from '@/components/shared/query-states';
import { useUnreadCount } from '@/hooks/use-api';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/campaigns', label: 'Campaigns', icon: Target },
  { href: '/dashboard/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/dashboard/reconciliation', label: 'Reconciliation', icon: RefreshCw },
  { href: '/dashboard/contributors', label: 'Contributors', icon: Users },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText },
];

const secondaryNavItems = [
  { href: '/dashboard/organizations', label: 'Organizations', icon: Building2 },
  { href: '/dashboard/virtual-accounts', label: 'Virtual Accounts', icon: CreditCard },
  { href: '/dashboard/invitations', label: 'Invitations', icon: Mail },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(true);
  const { data: unread } = useUnreadCount();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <LoadingState message="Checking session..." />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {open && <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          'fixed left-0 top-0 z-30 flex h-full flex-col overflow-hidden bg-thrive-dark transition-all duration-300',
          open ? 'w-64' : 'w-0 lg:w-16',
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          {open && <span className="whitespace-nowrap text-lg font-bold tracking-tight text-white">ThriveFund</span>}
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-4">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={() => window.innerWidth < 1024 && setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                  active ? 'bg-primary text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white',
                )}
              >
                <Icon size={18} className="shrink-0" />
                {open && <span className="flex-1 font-medium">{label}</span>}
              </Link>
            );
          })}

          <div className="my-3 border-t border-white/10" />

          {secondaryNavItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            const badge = href === '/dashboard/notifications' && unread?.count ? unread.count : null;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => window.innerWidth < 1024 && setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                  active ? 'bg-primary text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white',
                )}
              >
                <Icon size={18} className="shrink-0" />
                {open && (
                  <>
                    <span className="flex-1 font-medium">{label}</span>
                    {badge ? (
                      <span className="rounded-full bg-white/20 px-1.5 text-[10px] font-bold">{badge}</span>
                    ) : null}
                  </>
                )}
              </Link>
            );
          })}

          {user.role === 'admin' && (
            <>
              <div className="my-3 border-t border-white/10" />
              <Link
                href="/admin"
                onClick={() => window.innerWidth < 1024 && setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                  pathname === '/admin' || pathname.startsWith('/admin/')
                    ? 'bg-primary text-white'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white',
                )}
              >
                <Shield size={18} className="shrink-0" />
                {open && <span className="flex-1 font-medium">Admin</span>}
              </Link>
            </>
          )}
        </nav>

        {open && (
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
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
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-3.5 backdrop-blur">
          <button type="button" onClick={() => setOpen(!open)} className="text-slate-500 hover:text-thrive-dark">
            {open ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
            {getInitials(user.full_name)}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
