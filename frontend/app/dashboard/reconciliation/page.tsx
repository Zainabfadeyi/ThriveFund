'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Copy, RefreshCw, Search } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { ReconciliationBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { reconciliationOverview, reconciliationRecords } from '@/lib/mock-data';
import { formatNaira } from '@/lib/utils';

export default function ReconciliationPage() {
  const [tab, setTab] = useState('all');

  const filtered = tab === 'all'
    ? reconciliationRecords
    : reconciliationRecords.filter((r) => r.status === tab);

  return (
    <div>
      <PageHeader
        title="Reconciliation Dashboard"
        description="Automatic payment matching — review unmatched and duplicate payments"
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Incoming Payments" value={reconciliationOverview.incoming.toLocaleString()} icon={RefreshCw} />
        <StatCard title="Matched" value={reconciliationOverview.matched.toLocaleString()} icon={CheckCircle2} subtitle="Auto-reconciled" />
        <StatCard title="Unmatched" value={String(reconciliationOverview.unmatched)} icon={AlertTriangle} />
        <StatCard title="Duplicate" value={String(reconciliationOverview.duplicate)} icon={Copy} />
        <StatCard title="Pending Review" value={String(reconciliationOverview.pendingReview)} icon={Search} subtitle={`${reconciliationOverview.accuracy}% accuracy`} />
      </div>

      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-thrive-dark">Automatic Reconciliation Engine</p>
            <p className="text-sm text-muted-foreground">Payments to virtual accounts are matched to campaigns in real-time. Review exceptions below.</p>
          </div>
          <p className="text-3xl font-bold text-primary">{reconciliationOverview.accuracy}%</p>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="matched">Matched</TabsTrigger>
          <TabsTrigger value="unmatched">Unmatched</TabsTrigger>
          <TabsTrigger value="duplicate">Duplicate</TabsTrigger>
          <TabsTrigger value="pending_review">Pending Review</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          <Card>
            <CardHeader><CardTitle>Manual Review Queue</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Payer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Received</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.reference}</TableCell>
                      <TableCell className="font-medium">{r.payer}</TableCell>
                      <TableCell>{formatNaira(r.amount)}</TableCell>
                      <TableCell className="max-w-[160px] truncate">{r.campaignName}</TableCell>
                      <TableCell>{r.organizationName}</TableCell>
                      <TableCell><ReconciliationBadge status={r.status} /></TableCell>
                      <TableCell className="text-muted-foreground">{r.receivedAt}</TableCell>
                      <TableCell>
                        {(r.status === 'unmatched' || r.status === 'pending_review') && (
                          <Button size="sm" variant="outline">Review</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
