'use client';

import Link from 'next/link';
import { ArrowRight, Building2, CheckCircle2, CreditCard, RefreshCw, Share2, Target, Users } from 'lucide-react';
import { MonthlyChart } from '@/components/charts/monthly-chart';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/query-states';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useDashboardBootstrap } from '@/hooks/use-api';
import { formatNaira } from '@/lib/utils';
import { getAuthErrorMessage } from '@/contexts/auth-context';

export default function DashboardPage() {
  const { data: bootstrap, isLoading, error, refetch } = useDashboardBootstrap();
  const overview = bootstrap?.overview;
  const recon = bootstrap?.reconciliation;
  const monthly = bootstrap?.monthly_contributions;
  const goals = bootstrap?.goals;
  const payoutAccounts = bootstrap?.payout_accounts;

  if (isLoading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState message={getAuthErrorMessage(error)} onRetry={() => refetch()} />;
  if (!overview) return <EmptyState title="No data yet" description="Create a campaign to start collecting payments." />;

  const pendingRecon = (recon?.unmatched ?? 0) + (recon?.pending ?? 0);
  const campaigns = goals ?? overview.recent_goals ?? [];
  const hasCampaigns = Boolean(campaigns.length);
  const hasPayoutAccount = Boolean(payoutAccounts?.length);
  const firstCampaign = campaigns[0];

  return (
    <div>
      <PageHeader
        title="Organization Dashboard"
        description="Payment collection and reconciliation overview"
        action={<Button asChild><Link href="/dashboard/campaigns/new">New Collection</Link></Button>}
      />

      {(!hasCampaigns || firstCampaign) && (
        <Card className="mb-8 border-primary/20">
          <CardContent className="p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-thrive-dark">Setup flow</h2>
                <p className="text-sm">Create collection → payment account is set up automatically → share link → withdraw when completed.</p>
              </div>
              {!hasCampaigns ? (
                <Button asChild><Link href="/dashboard/campaigns/new">Create Collection</Link></Button>
              ) : (
                <Button variant="outline" asChild><Link href={`/dashboard/campaigns/${firstCampaign.id}`}>Continue Setup</Link></Button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {[
                { label: 'Campaign', done: hasCampaigns, icon: Target },
                { label: 'Payment account', done: Boolean(firstCampaign?.virtual_account), icon: CreditCard },
                { label: 'Share link', done: hasCampaigns, icon: Share2 },
                { label: 'Payout account', done: hasPayoutAccount, icon: CreditCard },
              ].map(({ label, done, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm">
                  {done ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Icon className="h-4 w-4 text-muted-foreground" />}
                  <span className={done ? 'text-thrive-dark' : 'text-muted-foreground'}>{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Collected" value={formatNaira(Number(overview.total_saved))} icon={Building2} />
        <StatCard title="Active Campaigns" value={String(overview.active_goals)} icon={Target} />
        <StatCard title="Contributors" value={String(overview.contributors_count)} icon={Users} />
        <StatCard title="Pending Reconciliation" value={String(pendingRecon)} icon={RefreshCw} subtitle={recon ? `${recon.auto_match_rate} auto-match` : undefined} />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Monthly Collections — Last 4 Months</CardTitle></CardHeader>
          <CardContent>
            <MonthlyChart data={(() => {
              const now = new Date();
              return Array.from({ length: 4 }, (_, i) => {
                const d = new Date(now.getFullYear(), now.getMonth() - (3 - i), 1);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                const label = d.toLocaleString('default', { month: 'short' }) + ` '${String(d.getFullYear()).slice(2)}`;
                const found = monthly?.find((m) => m.month === key);
                return { month: label, amount: found ? Number(found.amount) : 0 };
              });
            })()} />
          </CardContent>
        </Card>
        {recon && (
          <Card>
            <CardHeader><CardTitle>Reconciliation Health</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { label: 'Matched', value: recon.matched },
                { label: 'Unmatched', value: recon.unmatched },
                { label: 'Pending', value: recon.pending },
                { label: 'Manual', value: recon.manual },
              ].map((item) => (
                <div key={item.label} className="flex justify-between">
                  <span>{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
              <p className="pt-2 font-semibold text-primary">{recon.auto_match_rate} accuracy</p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Payments</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/dashboard/transactions">View all <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </CardHeader>
          <CardContent className="p-0">
            {!overview.recent_transactions?.length ? (
              <EmptyState title="No transactions" description="Simulate a payment or wait for incoming transfers." />
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Payer</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {overview.recent_transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <p className="font-medium">{t.contributor_name}</p>
                        <p className="text-xs text-muted-foreground">{t.goal_title}</p>
                      </TableCell>
                      <TableCell>{formatNaira(Number(t.amount))}</TableCell>
                      <TableCell><StatusBadge status={t.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Campaigns</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/dashboard/campaigns">View all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-5">
            {!overview.recent_goals?.length ? (
              <EmptyState title="No campaigns" description="Create your first payment campaign." />
            ) : overview.recent_goals.map((c) => (
              <div key={c.id}>
                <div className="mb-2 flex justify-between text-sm">
                  <Link href={`/dashboard/campaigns/${c.id}`} className="font-medium hover:text-primary">{c.title}</Link>
                  <span>{c.progress_percent ?? 0}%</span>
                </div>
                <Progress value={Number(c.progress_percent ?? 0)} />
                <p className="mt-1 text-xs text-muted-foreground">{formatNaira(Number(c.current_amount))} of {formatNaira(Number(c.target_amount))}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
