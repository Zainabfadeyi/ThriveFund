'use client';

import Link from 'next/link';
import {
  ArrowLeftRight,
  Building2,
  CreditCard,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Webhook,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { LoadingState, ErrorState } from '@/components/shared/query-states';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAdminNombaSync, useAdminOverview, useAnalyticsMonthly, useRunNombaSync } from '@/hooks/use-api';
import { MonthlyChart } from '@/components/charts/monthly-chart';
import { formatNaira } from '@/lib/utils';
import { getAuthErrorMessage } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api/client';

const quickLinks = [
  { href: '/admin/users', label: 'Manage users', icon: Users },
  { href: '/admin/organizations', label: 'All organizations', icon: Building2 },
  { href: '/admin/campaigns', label: 'All campaigns', icon: Target },
  { href: '/admin/payments', label: 'Payments received', icon: ArrowLeftRight },
  { href: '/admin/payouts', label: 'Payouts sent', icon: CreditCard },
  { href: '/admin/webhooks', label: 'Webhook health', icon: Webhook },
];

export default function AdminOverviewPage() {
  const { data, isLoading, error, refetch } = useAdminOverview();
  const { data: monthly } = useAnalyticsMonthly();
  const { data: nombaSync } = useAdminNombaSync();
  const runSync = useRunNombaSync();

  if (isLoading) return <LoadingState />;
  if (error) {
    const msg = error instanceof ApiError && error.status === 403
      ? 'Admin access required. Log in as admin@thrivefund.ng'
      : getAuthErrorMessage(error);
    return <ErrorState message={msg} onRetry={() => refetch()} />;
  }

  const latestSync = nombaSync?.latest as Record<string, unknown> | undefined;
  const latestStatus = String(latestSync?.status ?? 'not run');
  const latestAt = latestSync?.started_at ? new Date(String(latestSync.started_at)).toLocaleString('en-NG') : 'No sync run yet';
  const handleRunSync = async () => {
    try {
      await runSync.mutateAsync();
      toast.success('Nomba sync started');
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Platform Overview"
        description="Money in, money out, and health across all users, organizations, and campaigns"
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Users" value={String(data?.total_users ?? 0)} icon={Users} />
        <StatCard title="Organizations" value={String(data?.total_organizations ?? 0)} icon={Building2} />
        <StatCard title="Campaigns" value={String(data?.total_goals ?? 0)} icon={Target} />
        <StatCard title="Transactions" value={String(data?.total_transactions ?? 0)} icon={ArrowLeftRight} />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Collected"
          value={formatNaira(Number(data?.total_volume_ngn ?? 0))}
          icon={TrendingUp}
          subtitle="Successful payments platform-wide"
        />
        <StatCard
          title="Total Payouts"
          value={formatNaira(Number(data?.total_payouts_ngn ?? 0))}
          icon={TrendingDown}
          subtitle={`${data?.total_withdrawals ?? 0} withdrawal requests`}
        />
        <StatCard
          title="Reconciliation"
          value={String(data?.reconciliation?.matched ?? 0)}
          icon={CreditCard}
          subtitle={data?.reconciliation?.auto_match_rate ?? 'Auto-match rate'}
        />
        <StatCard
          title="Failed Webhooks (24h)"
          value={String(data?.failed_webhooks_24h ?? 0)}
          icon={Webhook}
          subtitle={`${data?.pending_reconciliation ?? 0} pending overall`}
        />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm transition hover:border-primary/40 hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon size={20} />
            </div>
            <span className="font-medium text-slate-800">{label}</span>
          </Link>
        ))}
      </div>

      <Card className="mb-8 border-primary/20">
        <CardHeader>
          <CardTitle>Nomba Recovery Controls</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">Latest sync</p>
              <p className="font-semibold capitalize">{latestStatus}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Started</p>
              <p className="font-semibold">{latestAt}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Webhook attention</p>
              <p className="font-semibold">{data?.failed_webhooks_24h ?? 0} failed in 24h</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleRunSync} disabled={runSync.isPending}>
              <RefreshCw className={`h-4 w-4 ${runSync.isPending ? 'animate-spin' : ''}`} /> Sync with Nomba
            </Button>
            <Button variant="outline" asChild><Link href="/admin/webhooks">Webhook Health</Link></Button>
            <Button variant="outline" asChild><Link href="/admin/reconciliation">Retry Reconciliation</Link></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Monthly Collection Volume</CardTitle></CardHeader>
        <CardContent>
          {monthly?.length ? (
            <MonthlyChart data={monthly.map((m) => ({ month: m.month, amount: Number(m.amount) }))} />
          ) : (
            <p className="text-sm text-muted-foreground">No payment data yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
