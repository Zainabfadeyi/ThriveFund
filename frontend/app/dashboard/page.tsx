import Link from 'next/link';
import { ArrowRight, Building2, RefreshCw, Target, Users } from 'lucide-react';
import { MonthlyChart } from '@/components/charts/monthly-chart';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  campaigns,
  dashboardStats,
  monthlyCollections,
  reconciliationOverview,
  transactions,
} from '@/lib/mock-data';
import { calcProgress, formatNaira } from '@/lib/utils';

export default function DashboardPage() {
  const recentTxns = transactions.slice(0, 5);
  const topCampaigns = campaigns.filter((c) => c.status === 'active').slice(0, 4);

  return (
    <div>
      <PageHeader
        title="Organization Dashboard"
        description="Payment collection and reconciliation overview"
        action={<Button asChild><Link href="/dashboard/campaigns/new">New Campaign</Link></Button>}
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Collected" value={formatNaira(dashboardStats.totalCollected)} icon={Building2} trend={{ value: '+12.4% vs last month', positive: true }} />
        <StatCard title="Active Campaigns" value={String(dashboardStats.activeCampaigns)} icon={Target} subtitle="Across all organizations" />
        <StatCard title="Contributors / Members" value={dashboardStats.contributors.toLocaleString()} icon={Users} />
        <StatCard title="Pending Reconciliation" value={String(dashboardStats.pendingReconciliation)} icon={RefreshCw} subtitle={`${dashboardStats.reconciliationAccuracy}% auto-match rate`} />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Monthly Collections</CardTitle></CardHeader>
          <CardContent><MonthlyChart data={monthlyCollections} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Reconciliation Health</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Matched', value: reconciliationOverview.matched, color: 'bg-emerald-500' },
              { label: 'Unmatched', value: reconciliationOverview.unmatched, color: 'bg-red-500' },
              { label: 'Pending Review', value: reconciliationOverview.pendingReview, color: 'bg-amber-500' },
              { label: 'Duplicate', value: reconciliationOverview.duplicate, color: 'bg-slate-400' },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full ${item.color}`} style={{ width: `${(item.value / reconciliationOverview.incoming) * 100}%` }} />
                </div>
              </div>
            ))}
            <p className="text-sm font-semibold text-primary">{reconciliationOverview.accuracy}% reconciliation accuracy</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Payments</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/dashboard/transactions">View all <ArrowRight className="ml-1 h-4 w-4" /></Link></Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Payer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTxns.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div><p className="font-medium">{t.payer}</p><p className="text-xs text-muted-foreground">{t.campaignName}</p></div>
                    </TableCell>
                    <TableCell className="font-medium">{formatNaira(t.amount)}</TableCell>
                    <TableCell><StatusBadge status={t.reconciliationStatus} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Active Campaigns</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/dashboard/campaigns">View all</Link></Button>
          </CardHeader>
          <CardContent className="space-y-5">
            {topCampaigns.map((c) => (
              <div key={c.id}>
                <div className="mb-2 flex justify-between text-sm">
                  <Link href={`/dashboard/campaigns/${c.id}`} className="font-medium hover:text-primary">{c.name}</Link>
                  <span className="text-muted-foreground">{calcProgress(c.raised, c.target)}%</span>
                </div>
                <Progress value={calcProgress(c.raised, c.target)} />
                <p className="mt-1 text-xs text-muted-foreground">{formatNaira(c.raised)} of {formatNaira(c.target)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
