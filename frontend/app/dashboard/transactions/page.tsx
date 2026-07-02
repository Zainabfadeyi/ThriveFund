'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/query-states';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGoals, useTransactions } from '@/hooks/use-api';
import { formatNaira } from '@/lib/utils';
import { getAuthErrorMessage } from '@/contexts/auth-context';

export default function TransactionsPage() {
  const [status, setStatus] = useState('all');
  const [goalId, setGoalId] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const params = {
    status: status === 'all' ? undefined : status,
    goal_id: goalId === 'all' ? undefined : goalId,
    from: from || undefined,
    to: to || undefined,
    page,
    q: q || undefined,
  };
  const { data, isLoading, error, refetch } = useTransactions(params);
  const { data: goals } = useGoals({ page: 1 });
  const txns = data?.data ?? [];
  const meta = data?.meta;

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getAuthErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader title="Transactions" description="Incoming payments across campaigns" />
      <Card className="mb-6">
        <CardContent className="grid gap-4 p-4 md:grid-cols-[1.2fr_1fr_1fr_1fr_1fr]">
          <Input placeholder="Search payer or reference..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="sm:max-w-xs" />
          <Select value={goalId} onValueChange={(v) => { setGoalId(v); setPage(1); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All campaigns</SelectItem>
              {goals?.data?.map((goal) => <SelectItem key={goal.id} value={goal.id}>{goal.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="successful">Successful</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
          <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
        </CardContent>
      </Card>
      {!txns.length ? (
        <EmptyState title="No transactions" description="Payments appear after Nomba confirms incoming transfers." />
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Payer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txns.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.reference}</TableCell>
                      <TableCell className="font-medium">{t.contributor_name}</TableCell>
                      <TableCell>{formatNaira(Number(t.amount))}</TableCell>
                      <TableCell className="max-w-[160px] truncate">{t.goal_title}</TableCell>
                      <TableCell><StatusBadge status={t.status} /></TableCell>
                      <TableCell className="text-muted-foreground">{t.paid_at ? new Date(t.paid_at).toLocaleDateString('en-NG') : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {meta && (
            <div className="mt-4 flex justify-between">
              <p className="text-sm text-muted-foreground">Page {meta.page} · {meta.total} total</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page * meta.per_page >= meta.total} onClick={() => setPage(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
