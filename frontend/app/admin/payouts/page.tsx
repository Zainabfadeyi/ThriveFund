'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingState, ErrorState } from '@/components/shared/query-states';
import { StatusBadge } from '@/components/shared/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminTableShell } from '@/components/admin/table-shell';
import { useAdminWithdrawals } from '@/hooks/use-api';
import { formatNaira } from '@/lib/utils';
import { getAuthErrorMessage } from '@/contexts/auth-context';

const FILTERS = ['all', 'successful', 'failed', 'pending', 'processing'] as const;
type Filter = typeof FILTERS[number];

export default function AdminPayoutsPage() {
  const { data, isLoading, error, refetch } = useAdminWithdrawals();
  const withdrawals = data?.data ?? [];
  const [filter, setFilter] = useState<Filter>('all');

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getAuthErrorMessage(error)} onRetry={() => refetch()} />;

  const filtered = filter === 'all' ? withdrawals : withdrawals.filter((w) => w.status === filter);

  return (
    <div>
      <PageHeader title="Payouts" description="All withdrawal requests and transfers sent to campaign owners" />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = f === 'all' ? withdrawals.length : withdrawals.filter((w) => w.status === f).length;
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

      <AdminTableShell title={filter === 'all' ? 'All Withdrawals' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Withdrawals`}>
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
            {!filtered.length ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">No {filter === 'all' ? '' : filter} payouts</TableCell></TableRow>
            ) : filtered.map((w) => (
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
