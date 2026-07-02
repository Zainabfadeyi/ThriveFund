'use client';

import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingState, ErrorState } from '@/components/shared/query-states';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminTableShell } from '@/components/admin/table-shell';
import { useAdminReconciliation, useAdminNombaSync, useRunNombaSync } from '@/hooks/use-api';
import { formatNaira } from '@/lib/utils';
import { getAuthErrorMessage } from '@/contexts/auth-context';

export default function AdminReconciliationPage() {
  const { data: reconciliation, isLoading, error, refetch } = useAdminReconciliation();
  const { data: syncData, isLoading: syncLoading } = useAdminNombaSync();
  const runSync = useRunNombaSync();

  if (isLoading || syncLoading) return <LoadingState />;
  if (error) return <ErrorState message={getAuthErrorMessage(error)} onRetry={() => refetch()} />;

  const latest = syncData?.latest as Record<string, unknown> | null | undefined;
  const runs = (syncData?.runs ?? []) as Array<Record<string, unknown>>;

  const handleSync = async () => {
    try {
      await runSync.mutateAsync();
      toast.success('Nomba reconciliation sync completed');
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    }
  };

  return (
    <div>
      <PageHeader
        title="Reconciliation Command Center"
        description="Compare Nomba /transactions against your ledger and resolve mismatches"
      />

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Ledger Drift</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatNaira(Number(latest?.drift_ngn ?? 0))}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Matched</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{String(latest?.matched_count ?? 0)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Unmatched</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{String(latest?.unmatched_count ?? 0)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Last Sync</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm font-medium">{latest?.completed_at ? new Date(String(latest.completed_at)).toLocaleString() : 'Not yet run'}</p>
            <Button size="sm" className="mt-3" onClick={handleSync} disabled={runSync.isPending}>
              <RefreshCw className={`mr-2 h-4 w-4 ${runSync.isPending ? 'animate-spin' : ''}`} />
              Run sync now
            </Button>
          </CardContent>
        </Card>
      </div>

      <AdminTableShell title="Recent Nomba Sync Runs" description="Nightly job compares Nomba bank transactions to your ledger">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Started</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Nomba</TableHead>
              <TableHead>Ledger</TableHead>
              <TableHead>Matched</TableHead>
              <TableHead>Drift</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!runs.length ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">No sync runs yet</TableCell></TableRow>
            ) : runs.map((run) => (
              <TableRow key={String(run.id)}>
                <TableCell>{run.started_at ? new Date(String(run.started_at)).toLocaleString() : '-'}</TableCell>
                <TableCell><StatusBadge status={String(run.status)} /></TableCell>
                <TableCell>{String(run.nomba_count ?? 0)}</TableCell>
                <TableCell>{String(run.ledger_count ?? 0)}</TableCell>
                <TableCell>{String(run.matched_count ?? 0)}</TableCell>
                <TableCell>{formatNaira(Number(run.drift_ngn ?? 0))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminTableShell>

      <div className="mt-8">
        <AdminTableShell title="Payment Reconciliation Records">
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
                  <TableCell className="max-w-xs truncate">{row.notes ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </AdminTableShell>
      </div>
    </div>
  );
}
