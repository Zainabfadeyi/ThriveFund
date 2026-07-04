'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingState, ErrorState } from '@/components/shared/query-states';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminTableShell } from '@/components/admin/table-shell';
import { useAdminWebhooks, useRetryAdminWebhook } from '@/hooks/use-api';
import { getAuthErrorMessage } from '@/contexts/auth-context';

function canRetryWebhook(row: Record<string, unknown>): boolean {
  const status = String(row.status ?? '');
  return status === 'failed' || !row.processed;
}

export default function AdminWebhooksPage() {
  const { data: webhooks, isLoading, error, refetch } = useAdminWebhooks();
  const retryWebhook = useRetryAdminWebhook();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={getAuthErrorMessage(error)} onRetry={() => refetch()} />;

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    try {
      const res = await retryWebhook.mutateAsync(id);
      const data = res.data;
      if (data?.matched) {
        toast.success('Webhook retried — payment credited to campaign');
      } else if (data?.duplicate && data?.reason === 'request_id') {
        toast.error('Retry blocked on server — deploy the latest backend fix, then try again');
      } else if (data?.duplicate) {
        toast.success('Already processed — no duplicate credit applied');
      } else {
        toast.success('Webhook retry completed');
      }
    } catch (err) {
      toast.error(getAuthErrorMessage(err));
    } finally {
      setRetryingId(null);
    }
  };

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
              <TableHead>Error</TableHead>
              <TableHead>Received</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!webhooks?.length ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground">No webhook deliveries</TableCell></TableRow>
            ) : webhooks.map((event) => {
              const row = event as Record<string, unknown>;
              const id = String(row.id);
              const showRetry = canRetryWebhook(row);
              const isRetrying = retryingId === id;

              return (
                <TableRow key={id}>
                  <TableCell>{String(row.event_type ?? '-')}</TableCell>
                  <TableCell className="font-mono text-xs">{String(row.provider_reference ?? '-')}</TableCell>
                  <TableCell><StatusBadge status={String(row.status ?? 'received')} /></TableCell>
                  <TableCell>{row.processed ? 'Yes' : 'No'}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                    {String(row.error_message ?? '-')}
                  </TableCell>
                  <TableCell>{String(row.received_at ?? '-')}</TableCell>
                  <TableCell className="text-right">
                    {showRetry ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isRetrying}
                        onClick={() => handleRetry(id)}
                      >
                        <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                        Retry
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminTableShell>
    </div>
  );
}
