'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/query-states';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useGoals, useWithdrawals } from '@/hooks/use-api';
import { getAuthErrorMessage } from '@/contexts/auth-context';
import { formatNaira } from '@/lib/utils';

export default function PayoutsPage() {
  const [status, setStatus] = useState('all');
  const [goalId, setGoalId] = useState('all');
  const { data: goals } = useGoals({ page: 1 });
  const { data, isLoading, error, refetch } = useWithdrawals({
    status: status === 'all' ? undefined : status,
    goal_id: goalId === 'all' ? undefined : goalId,
  });
  const withdrawals = data?.data ?? [];

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getAuthErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader
        title="Payouts"
        description="Withdrawals from completed campaigns to your saved payout account"
        action={<Button asChild><Link href="/dashboard/settings">Payout Account</Link></Button>}
      />
      <Card className="mb-6">
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
          <Select value={goalId} onValueChange={setGoalId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All campaigns</SelectItem>
              {goals?.data?.map((goal) => <SelectItem key={goal.id} value={goal.id}>{goal.title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="successful">Successful</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      {!withdrawals.length ? (
        <EmptyState title="No payouts yet" description="Completed campaigns can be withdrawn to your saved payout account." />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Campaign</TableHead><TableHead>Amount</TableHead><TableHead>Destination</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>{withdrawal.goal_title}</TableCell>
                    <TableCell>{formatNaira(Number(withdrawal.amount))}</TableCell>
                    <TableCell>{withdrawal.account_name} · {withdrawal.bank_name ?? ''}</TableCell>
                    <TableCell><StatusBadge status={withdrawal.status} /></TableCell>
                    <TableCell>{withdrawal.created_at ? new Date(withdrawal.created_at).toLocaleDateString('en-NG') : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
