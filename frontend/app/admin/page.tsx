import { Building2, Target, Users, ArrowLeftRight, CreditCard, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { MonthlyChart } from '@/components/charts/monthly-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminStats, monthlyCollections, organizations, transactions } from '@/lib/mock-data';
import { formatNaira } from '@/lib/utils';

export default function AdminDashboardPage() {
  return (
    <div>
      <PageHeader title="Platform Admin" description="Platform-level overview — all users, organizations, and volume" />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Total Users" value={adminStats.totalUsers.toLocaleString()} icon={Users} />
        <StatCard title="Organizations" value={String(adminStats.totalOrganizations)} icon={Building2} />
        <StatCard title="Campaigns" value={adminStats.totalCampaigns.toLocaleString()} icon={Target} />
        <StatCard title="Transactions" value={adminStats.totalTransactions.toLocaleString()} icon={ArrowLeftRight} />
        <StatCard title="Total Volume" value={formatNaira(adminStats.totalVolume)} icon={TrendingUp} />
        <StatCard title="Active Virtual Accounts" value={adminStats.activeVirtualAccounts.toLocaleString()} icon={CreditCard} />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Platform Volume Trend</CardTitle></CardHeader>
          <CardContent><MonthlyChart data={monthlyCollections} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Organizations</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Organization</TableHead><TableHead>Collected</TableHead><TableHead>Members</TableHead></TableRow></TableHeader>
              <TableBody>
                {organizations.slice(0, 5).map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.name}</TableCell>
                    <TableCell>{formatNaira(o.totalCollected)}</TableCell>
                    <TableCell>{o.membersCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Recent Platform Transactions</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Reference</TableHead><TableHead>Payer</TableHead><TableHead>Amount</TableHead><TableHead>Organization</TableHead></TableRow></TableHeader>
            <TableBody>
              {transactions.slice(0, 6).map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-xs">{t.reference}</TableCell>
                  <TableCell>{t.payer}</TableCell>
                  <TableCell>{formatNaira(t.amount)}</TableCell>
                  <TableCell>{t.organizationName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
