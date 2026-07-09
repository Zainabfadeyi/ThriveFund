'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Copy, HelpCircle, RefreshCw, Search, X } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { ReconciliationBadge } from '@/components/shared/status-badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/shared/query-states';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useReconciliationOverview, useReconciliation } from '@/hooks/use-api';
import { formatNaira } from '@/lib/utils';
import { getAuthErrorMessage } from '@/contexts/auth-context';

function ReconciliationHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={onClose}>
      <div
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
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

        <div className="overflow-y-auto p-5">
          <div className="space-y-3 text-sm">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="font-medium">How it works</p>
              <p className="mt-1 text-muted-foreground">
                When someone sends money to your campaign&apos;s virtual account, the bank notifies ThriveFund
                automatically. ThriveFund then verifies the payment, finds your campaign, records the transaction,
                and updates your campaign balance. This automatic matching is called reconciliation.
              </p>
            </div>

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="font-medium">What the statuses mean</p>
              <ul className="mt-1 space-y-1 text-muted-foreground">
                <li><span className="font-medium text-green-600">Matched</span> — payment was linked to your campaign successfully and your balance has been updated.</li>
                <li><span className="font-medium text-yellow-600">Pending</span> — payment was received but is being reviewed (e.g. the amount exceeded your campaign target).</li>
                <li><span className="font-medium text-red-600">Unmatched</span> — the system could not automatically link this payment. Contact support if you believe it belongs to you.</li>
                <li><span className="font-medium text-blue-600">Manual</span> — an admin reviewed and resolved this record by hand.</li>
              </ul>
            </div>

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="font-medium">Do I need to do anything?</p>
              <p className="mt-1 text-muted-foreground">
                Usually nothing — matched payments update your campaign balance automatically. If you see unmatched
                records and believe a payment was made, reach out to support with the payment reference number.
              </p>
            </div>

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="font-medium">What is the auto-match rate?</p>
              <p className="mt-1 text-muted-foreground">
                This shows the percentage of payments that ThriveFund matched automatically without any manual
                intervention. A high rate means the system is working well.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReconciliationPage() {
  const [tab, setTab] = useState<string>('all');
  const [showHelp, setShowHelp] = useState(false);
  const { data: overview, isLoading: oLoading, error: oError, refetch: refetchO } = useReconciliationOverview();
  const statusFilter = tab === 'all' ? undefined : tab;
  const { data, isLoading, error, refetch } = useReconciliation({ status: statusFilter });
  const records = data?.data ?? [];

  if (oLoading) return <LoadingState />;
  if (oError) return <ErrorState message={getAuthErrorMessage(oError)} onRetry={() => refetchO()} />;

  const total = (overview?.matched ?? 0) + (overview?.unmatched ?? 0) + (overview?.pending ?? 0) + (overview?.manual ?? 0);

  return (
    <div>
      {showHelp && <ReconciliationHelpModal onClose={() => setShowHelp(false)} />}

      <div className="flex items-start gap-3">
        <PageHeader title="Reconciliation Dashboard" description="Automatic payment matching — review exceptions" />
        <button
          onClick={() => setShowHelp(true)}
          className="mt-1 shrink-0 rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          title="What is reconciliation?"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Records" value={String(total)} icon={RefreshCw} />
        <StatCard title="Matched" value={String(overview?.matched ?? 0)} icon={CheckCircle2} />
        <StatCard title="Unmatched" value={String(overview?.unmatched ?? 0)} icon={AlertTriangle} />
        <StatCard title="Pending" value={String(overview?.pending ?? 0)} icon={Search} />
        <StatCard title="Manual" value={String(overview?.manual ?? 0)} icon={Copy} subtitle={overview?.auto_match_rate} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="matched">Matched</TabsTrigger>
          <TabsTrigger value="unmatched">Unmatched</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="manual">Manual</TabsTrigger>
        </TabsList>
        <TabsContent value={tab}>
          {isLoading ? <LoadingState /> : error ? <ErrorState message={getAuthErrorMessage(error)} onRetry={() => refetch()} /> : !records.length ? (
            <EmptyState title="No records" description="Reconciliation records appear after payments are received." />
          ) : (
            <Card>
              <CardHeader><CardTitle>Reconciliation Records</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Payer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-mono text-xs">{r.reference ?? r.id}</TableCell>
                        <TableCell>{r.payer_name ?? '—'}</TableCell>
                        <TableCell>{r.amount ? formatNaira(Number(r.amount)) : '—'}</TableCell>
                        <TableCell>{r.goal_title ?? '—'}</TableCell>
                        <TableCell><ReconciliationBadge status={r.status} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
