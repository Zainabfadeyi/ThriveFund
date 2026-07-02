'use client';

import { PageHeader } from '@/components/shared/page-header';
import { LoadingState, ErrorState } from '@/components/shared/query-states';
import { StatusBadge } from '@/components/shared/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminTableShell } from '@/components/admin/table-shell';
import { useAdminWithdrawals } from '@/hooks/use-api';
import { formatNaira } from '@/lib/utils';
import { getAuthErrorMessage } from '@/contexts/auth-context';

export default function AdminPayoutsPage() {
  const { data, isLoading, error, refetch } = useAdminWithdrawals();
  const withdrawals = data?.data ?? [];

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getAuthErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader title="Payouts" description="All withdrawal requests and transfers sent to campaign owners" />
      <AdminTableShell title="All Withdrawals">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Bank Account</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!withdrawals.length ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No payouts</TableCell></TableRow>
            ) : withdrawals.map((w) => (
              <TableRow key={w.id}>
                <TableCell className="font-medium">{w.goal_title ?? '-'}</TableCell>
                <TableCell>{w.organization_name ?? '-'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{w.owner_email ?? w.owner_name ?? '-'}</TableCell>
                <TableCell>{formatNaira(Number(w.amount))}</TableCell>
                <TableCell className="text-sm">
                  {w.bank_name ?? '-'}<br />
                  <span className="text-muted-foreground">{w.account_number} · {w.account_name}</span>
                </TableCell>
                <TableCell><StatusBadge status={w.status} /></TableCell>
                <TableCell className="font-mono text-xs">{w.provider_reference ?? '-'}</TableCell>
                <TableCell>{w.created_at ? new Date(w.created_at).toLocaleString() : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableShell>
    </div>
  );
}
