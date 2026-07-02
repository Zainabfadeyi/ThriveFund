'use client';

import { PageHeader } from '@/components/shared/page-header';
import { LoadingState, ErrorState } from '@/components/shared/query-states';
import { StatusBadge } from '@/components/shared/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminTableShell } from '@/components/admin/table-shell';
import { useAdminReconciliation } from '@/hooks/use-api';
import { formatNaira } from '@/lib/utils';
import { getAuthErrorMessage } from '@/contexts/auth-context';

export default function AdminReconciliationPage() {
  const { data: reconciliation, isLoading, error, refetch } = useAdminReconciliation();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getAuthErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader title="Reconciliation" description="Unmatched and manually resolved payments across the platform" />
      <AdminTableShell title="Reconciliation Records">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Payer</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!reconciliation?.length ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No reconciliation rows</TableCell></TableRow>
            ) : reconciliation.map((row) => (
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
      </AdminTableShell>
    </div>
  );
}
