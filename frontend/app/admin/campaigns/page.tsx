'use client';

import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingState, ErrorState } from '@/components/shared/query-states';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminTableShell } from '@/components/admin/table-shell';
import { useAdminGoals, useUpdateAdminGoalStatus } from '@/hooks/use-api';
import { formatNaira } from '@/lib/utils';
import { getAuthErrorMessage } from '@/contexts/auth-context';

export default function AdminCampaignsPage() {
  const { data: goals, isLoading, error, refetch } = useAdminGoals();
  const updateStatus = useUpdateAdminGoalStatus();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getAuthErrorMessage(error)} onRetry={() => refetch()} />;

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
      <PageHeader title="Campaigns" description="All campaigns across every user and organization" />
      <AdminTableShell title="All Campaigns">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Raised</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!goals?.length ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No campaigns</TableCell></TableRow>
            ) : goals.map((goal) => (
              <TableRow key={goal.id}>
                <TableCell className="font-medium">{goal.title}</TableCell>
                <TableCell>{goal.organization_name ?? '-'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{goal.owner_email ?? '-'}</TableCell>
                <TableCell>{formatNaira(Number(goal.current_amount))} / {formatNaira(Number(goal.target_amount))}</TableCell>
                <TableCell><StatusBadge status={goal.status} /></TableCell>
                <TableCell className="space-x-1 text-right">
                  <Button size="sm" variant="outline" onClick={() => handleStatus(goal.id, 'active')}>Active</Button>
                  <Button size="sm" variant="outline" onClick={() => handleStatus(goal.id, 'paused')}>Pause</Button>
                  <Button size="sm" variant="outline" onClick={() => handleStatus(goal.id, 'completed')}>Complete</Button>
                  <Button size="sm" variant="outline" onClick={() => handleStatus(goal.id, 'cancelled')}>Cancel</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableShell>
    </div>
  );
}
