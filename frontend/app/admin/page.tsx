'use client';

import { ArrowLeftRight, Building2, CreditCard, Target, TrendingUp, Users, Webhook } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { LoadingState, ErrorState } from '@/components/shared/query-states';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useAdminGoals,
  useAdminOrganizations,
  useAdminOverview,
  useAdminReconciliation,
  useAdminTransactions,
  useAdminUsers,
  useAdminWebhooks,
  useAnalyticsMonthly,
  useUpdateAdminGoalStatus,
} from '@/hooks/use-api';
import { MonthlyChart } from '@/components/charts/monthly-chart';
import { formatNaira } from '@/lib/utils';
import { getAuthErrorMessage } from '@/contexts/auth-context';
import { ApiError } from '@/lib/api/client';

function TableShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading, error, refetch } = useAdminOverview();
  const { data: monthly } = useAnalyticsMonthly();
  const { data: organizations } = useAdminOrganizations();
  const { data: goals } = useAdminGoals();
  const { data: transactions } = useAdminTransactions();
  const { data: webhooks } = useAdminWebhooks();
  const { data: reconciliation } = useAdminReconciliation();
  const { data: users } = useAdminUsers();
  const updateStatus = useUpdateAdminGoalStatus();

  if (isLoading) return <LoadingState />;
  if (error) {
    const msg = error instanceof ApiError && error.status === 403
      ? 'Admin access required. Log in as admin@thrivefund.ng'
      : getAuthErrorMessage(error);
    return <ErrorState message={msg} onRetry={() => refetch()} />;
  }

  const handleStatus = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Campaign marked ${status}`);
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader title="Platform Admin" description="Superadmin visibility across organizations, campaigns, transactions, webhooks, and reconciliation" />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Users" value={String(data?.total_users ?? 0)} icon={Users} />
        <StatCard title="Campaigns" value={String(data?.total_goals ?? 0)} icon={Target} />
        <StatCard title="Transactions" value={String(data?.total_transactions ?? 0)} icon={ArrowLeftRight} />
        <StatCard title="Total Volume" value={formatNaira(Number(data?.total_volume_ngn ?? 0))} icon={TrendingUp} />
        <StatCard title="Matched" value={String(data?.reconciliation?.matched ?? 0)} icon={CreditCard} subtitle={data?.reconciliation?.auto_match_rate} />
      </div>

      <Tabs defaultValue="organizations">
        <TabsList className="mb-4 flex h-auto flex-wrap justify-start">
          <TabsTrigger value="organizations"><Building2 className="mr-2 h-4 w-4" /> Organizations</TabsTrigger>
          <TabsTrigger value="campaigns"><Target className="mr-2 h-4 w-4" /> Campaigns</TabsTrigger>
          <TabsTrigger value="transactions"><ArrowLeftRight className="mr-2 h-4 w-4" /> Transactions</TabsTrigger>
          <TabsTrigger value="webhooks"><Webhook className="mr-2 h-4 w-4" /> Webhooks</TabsTrigger>
          <TabsTrigger value="reconciliation"><CreditCard className="mr-2 h-4 w-4" /> Reconciliation</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-2 h-4 w-4" /> Users</TabsTrigger>
        </TabsList>

        <TabsContent value="organizations">
          <TableShell title="Organizations">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Owner</TableHead><TableHead>Type</TableHead><TableHead>Campaigns</TableHead><TableHead>Collected</TableHead></TableRow></TableHeader>
              <TableBody>
                {!organizations?.length ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No organizations</TableCell></TableRow> : organizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell>{org.owner_name ?? org.owner_email ?? org.owner_id}</TableCell>
                    <TableCell>{org.type}</TableCell>
                    <TableCell>{org.campaigns_count ?? 0}</TableCell>
                    <TableCell>{formatNaira(Number(org.total_collected ?? 0))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
        </TabsContent>

        <TabsContent value="campaigns">
          <TableShell title="Campaigns">
            <Table>
              <TableHeader><TableRow><TableHead>Campaign</TableHead><TableHead>Organization</TableHead><TableHead>Raised</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Admin Override</TableHead></TableRow></TableHeader>
              <TableBody>
                {!goals?.length ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No campaigns</TableCell></TableRow> : goals.map((goal) => (
                  <TableRow key={goal.id}>
                    <TableCell className="font-medium">{goal.title}</TableCell>
                    <TableCell>{goal.organization_name ?? '-'}</TableCell>
                    <TableCell>{formatNaira(Number(goal.current_amount))} / {formatNaira(Number(goal.target_amount))}</TableCell>
                    <TableCell><StatusBadge status={goal.status} /></TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => handleStatus(goal.id, 'active')}>Active</Button>
                      <Button size="sm" variant="outline" onClick={() => handleStatus(goal.id, 'paused')}>Pause</Button>
                      <Button size="sm" variant="outline" onClick={() => handleStatus(goal.id, 'completed')}>Complete</Button>
                      <Button size="sm" variant="outline" onClick={() => handleStatus(goal.id, 'cancelled')}>Cancel</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
        </TabsContent>

        <TabsContent value="transactions">
          <TableShell title="Transactions">
            <Table>
              <TableHeader><TableRow><TableHead>Payer</TableHead><TableHead>Campaign</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Reference</TableHead></TableRow></TableHeader>
              <TableBody>
                {!transactions?.length ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No transactions</TableCell></TableRow> : transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell>{txn.contributor_name}</TableCell>
                    <TableCell>{txn.goal_title}</TableCell>
                    <TableCell>{formatNaira(Number(txn.amount))}</TableCell>
                    <TableCell><StatusBadge status={txn.status} /></TableCell>
                    <TableCell className="font-mono text-xs">{txn.reference}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
        </TabsContent>

        <TabsContent value="webhooks">
          <TableShell title="Webhook Health">
            <Table>
              <TableHeader><TableRow><TableHead>Event</TableHead><TableHead>Reference</TableHead><TableHead>Status</TableHead><TableHead>Processed</TableHead><TableHead>Received</TableHead></TableRow></TableHeader>
              <TableBody>
                {!webhooks?.length ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No webhook deliveries</TableCell></TableRow> : webhooks.map((event) => {
                  const row = event as Record<string, unknown>;
                  return (
                    <TableRow key={String(row.id)}>
                      <TableCell>{String(row.event_type ?? '-')}</TableCell>
                      <TableCell className="font-mono text-xs">{String(row.provider_reference ?? '-')}</TableCell>
                      <TableCell><StatusBadge status={String(row.status ?? 'received')} /></TableCell>
                      <TableCell>{row.processed ? 'Yes' : 'No'}</TableCell>
                      <TableCell>{String(row.received_at ?? '-')}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableShell>
        </TabsContent>

        <TabsContent value="reconciliation">
          <TableShell title="Reconciliation">
            <Table>
              <TableHeader><TableRow><TableHead>Payer</TableHead><TableHead>Campaign</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
              <TableBody>
                {!reconciliation?.length ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No reconciliation rows</TableCell></TableRow> : reconciliation.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.payer_name ?? '-'}</TableCell>
                    <TableCell>{row.goal_title ?? '-'}</TableCell>
                    <TableCell>{row.amount ? formatNaira(Number(row.amount)) : '-'}</TableCell>
                    <TableCell><StatusBadge status={row.status} /></TableCell>
                    <TableCell>{row.notes ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
        </TabsContent>

        <TabsContent value="users">
          <TableShell title="Users">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Joined</TableHead></TableRow></TableHeader>
              <TableBody>
                {!users?.length ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No users</TableCell></TableRow> : users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><StatusBadge status={user.role} /></TableCell>
                    <TableCell>{user.created_at ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
        </TabsContent>
      </Tabs>

      <Card className="mt-8">
        <CardHeader><CardTitle>Monthly Volume</CardTitle></CardHeader>
        <CardContent>{monthly?.length ? <MonthlyChart data={monthly.map((m) => ({ month: m.month, amount: Number(m.amount) }))} /> : null}</CardContent>
      </Card>
    </div>
  );
}
