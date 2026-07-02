'use client';

import { PageHeader } from '@/components/shared/page-header';
import { LoadingState, ErrorState } from '@/components/shared/query-states';
import { StatusBadge } from '@/components/shared/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminTableShell } from '@/components/admin/table-shell';
import { useAdminTransactions } from '@/hooks/use-api';
import { formatNaira } from '@/lib/utils';
import { getAuthErrorMessage } from '@/contexts/auth-context';

export default function AdminPaymentsPage() {
  const { data: transactions, isLoading, error, refetch } = useAdminTransactions();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getAuthErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader title="Payments In" description="All money received across every campaign on the platform" />
      <AdminTableShell title="All Transactions">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payer</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Paid</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!transactions?.length ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No transactions</TableCell></TableRow>
            ) : transactions.map((txn) => (
              <TableRow key={txn.id}>
                <TableCell>{txn.contributor_name ?? '-'}</TableCell>
                <TableCell>{txn.goal_title}</TableCell>
                <TableCell>{txn.organization_name ?? '-'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{txn.owner_email ?? '-'}</TableCell>
                <TableCell>{formatNaira(Number(txn.amount))}</TableCell>
                <TableCell><StatusBadge status={txn.status} /></TableCell>
                <TableCell className="font-mono text-xs">{txn.reference}</TableCell>
                <TableCell>{txn.paid_at ? new Date(txn.paid_at).toLocaleString() : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableShell>
    </div>
  );
}
