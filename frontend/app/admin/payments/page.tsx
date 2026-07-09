'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingState, ErrorState } from '@/components/shared/query-states';
import { StatusBadge } from '@/components/shared/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminTableShell } from '@/components/admin/table-shell';
import { useAdminTransactions } from '@/hooks/use-api';
import { formatNaira } from '@/lib/utils';
import { getAuthErrorMessage } from '@/contexts/auth-context';

const FILTERS = ['all', 'successful', 'failed', 'pending'] as const;
type Filter = typeof FILTERS[number];

export default function AdminPaymentsPage() {
  const { data: transactions, isLoading, error, refetch } = useAdminTransactions();
  const [filter, setFilter] = useState<Filter>('all');

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getAuthErrorMessage(error)} onRetry={() => refetch()} />;

  const filtered = filter === 'all'
    ? (transactions ?? [])
    : (transactions ?? []).filter((t) => t.status === filter);

  return (
    <div>
      <PageHeader title="Payments In" description="All money received across every campaign on the platform" />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = f === 'all'
            ? (transactions?.length ?? 0)
            : (transactions ?? []).filter((t) => t.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {f} ({count})
            </button>
          );
        })}
      </div>

      <AdminTableShell title={filter === 'all' ? 'All Transactions' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Transactions`}>
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
            {!filtered.length ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No {filter === 'all' ? '' : filter} transactions</TableCell></TableRow>
            ) : filtered.map((txn) => (
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
