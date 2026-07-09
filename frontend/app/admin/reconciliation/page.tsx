'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { RefreshCw, HelpCircle, X } from 'lucide-react';
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

function ReconciliationHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* sticky header */}
        <div className="flex shrink-0 items-start justify-between border-b p-5">
          <div>
            <h2 className="text-lg font-semibold">What is Reconciliation?</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Reconciliation matches every bank payment to the right campaign in ThriveFund.
            </p>
          </div>
          <button onClick={onClose} className="ml-4 shrink-0 text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* scrollable body */}
        <div className="overflow-y-auto p-5">
          <div className="space-y-3 text-sm">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="font-medium">How it works</p>
              <p className="mt-1 text-muted-foreground">
                When a contributor sends money to a campaign&apos;s virtual account, Nomba fires a webhook. ThriveFund
                verifies the webhook, looks up which campaign owns that account, records the transaction, and updates
                the campaign balance. This matching step is called reconciliation.
              </p>
            </div>

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="font-medium">What the statuses mean</p>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                <li><span className="font-medium text-green-600">Matched</span> — payment was linked to a campaign successfully.</li>
                <li><span className="font-medium text-yellow-600">Pending</span> — payment arrived but needs a closer look (e.g. over-payment).</li>
                <li><span className="font-medium text-red-600">Unmatched</span> — no campaign was found for the account number; may need manual action.</li>
                <li><span className="font-medium text-blue-600">Manual</span> — an admin resolved the record by hand.</li>
              </ul>
            </div>

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="font-medium">What is Ledger Drift?</p>
              <p className="mt-1 text-muted-foreground">
                Drift is the difference between what Nomba reports as received and what ThriveFund has recorded
                in its database. A drift of ₦0 means everything is in sync. A positive drift means some payments
                from Nomba have not yet been recorded here.
              </p>
            </div>

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="font-medium">What does &quot;Run sync now&quot; do?</p>
              <p className="mt-1 text-muted-foreground">
                It fetches the latest transactions from Nomba and compares them against the local ledger.
                Any gaps are flagged so you can investigate or retry processing missing payments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminReconciliationPage() {
  const { data: reconciliation, isLoading, error, refetch } = useAdminReconciliation();
  const { data: syncData, isLoading: syncLoading } = useAdminNombaSync();
  const runSync = useRunNombaSync();
  const [showHelp, setShowHelp] = useState(false);

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
      {showHelp && <ReconciliationHelpModal onClose={() => setShowHelp(false)} />}

      <div className="flex items-start gap-3">
        <PageHeader
          title="Reconciliation Command Center"
          description="Compare Nomba /transactions against your ledger and resolve mismatches"
        />
        <button
          onClick={() => setShowHelp(true)}
          className="mt-1 shrink-0 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          title="What is reconciliation?"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      </div>

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
