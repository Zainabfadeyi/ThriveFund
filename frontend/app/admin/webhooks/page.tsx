'use client';

import { PageHeader } from '@/components/shared/page-header';
import { LoadingState, ErrorState } from '@/components/shared/query-states';
import { StatusBadge } from '@/components/shared/status-badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminTableShell } from '@/components/admin/table-shell';
import { useAdminWebhooks } from '@/hooks/use-api';
import { getAuthErrorMessage } from '@/contexts/auth-context';

export default function AdminWebhooksPage() {
  const { data: webhooks, isLoading, error, refetch } = useAdminWebhooks();

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getAuthErrorMessage(error)} onRetry={() => refetch()} />;

  return (
    <div>
      <PageHeader title="Webhooks" description="Nomba webhook delivery health and processing status" />
      <AdminTableShell title="Webhook Events">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Processed</TableHead>
              <TableHead>Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!webhooks?.length ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">No webhook deliveries</TableCell></TableRow>
            ) : webhooks.map((event) => {
              const row = event as Record<string, unknown>;
              return (
                <TableRow key={String(row.id)}>
                  <TableCell>{String(row.event_type ?? '-')}</TableCell>
                  <TableCell className="font-mono text-xs">{String(row.provider_reference ?? '-')}</TableCell>
                  <TableCell><StatusBadge status={String(row.status ?? 'received')} /></TableCell>
                  <TableCell>{row.processed ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{String(row.received_at ?? '-')}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminTableShell>
    </div>
  );
}
