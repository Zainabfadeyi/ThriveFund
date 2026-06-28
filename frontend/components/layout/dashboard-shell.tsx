'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { MockDataBanner } from '@/components/shared/mock-banner';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/dashboard/organizations', label: 'Organizations', icon: Building2 },
  { href: '/dashboard/campaigns', label: 'Campaigns', icon: Target },
  { href: '/dashboard/virtual-accounts', label: 'Virtual Accounts', icon: CreditCard },
  { href: '/dashboard/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { href: '/dashboard/reconciliation', label: 'Reconciliation', icon: RefreshCw },
  { href: '/dashboard/contributors', label: 'Contributors', icon: Users },
  { href: '/dashboard/reports', label: 'Reports', icon: FileText },
  { href: '/dashboard/invitations', label: 'Invitations', icon: Mail },
  { href: '/admin', label: 'Admin', icon: Shield },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {open && <div className="fixed inset-0 z-20 bg-black/30 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={cn(
          'fixed left-0 top-0 z-30 flex h-full flex-col overflow-hidden bg-thrive-dark transition-all duration-300',
          open ? 'w-64' : 'w-0 lg:w-16'
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
                  active ? 'bg-primary text-white' : 'text-slate-400 hover:bg-white/10 hover:text-white'
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
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">AO</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">Adebayo Okonkwo</p>
                <p className="truncate text-xs text-slate-500">adebayo@thrivefund.ng</p>
              </div>
              <Link href="/" className="text-slate-500 hover:text-white"><LogOut size={15} /></Link>
            </div>
          </div>
        )}
      </aside>

      <div className={cn('flex min-h-screen flex-1 flex-col transition-all', open ? 'lg:ml-64' : 'lg:ml-16')}>
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/90 px-6 py-3.5 backdrop-blur">
          <button type="button" onClick={() => setOpen(!open)} className="text-slate-500 hover:text-thrive-dark">
            {open ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">AO</div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mb-6"><MockDataBanner /></div>
          {children}
        </main>
      </div>
    </div>
  );
}
