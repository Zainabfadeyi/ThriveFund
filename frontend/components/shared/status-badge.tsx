import { Badge } from '@/components/ui/badge';

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'muted' | 'secondary' }> = {
  successful: { label: 'Successful', variant: 'success' },
  matched: { label: 'Matched', variant: 'success' },
  active: { label: 'Active', variant: 'success' },
  paid: { label: 'Paid', variant: 'success' },
  sent: { label: 'Sent', variant: 'success' },
  accepted: { label: 'Accepted', variant: 'success' },
  ready: { label: 'Ready', variant: 'success' },
  not_set: { label: 'Not Set', variant: 'muted' },
  processing: { label: 'Processing', variant: 'warning' },
  pending_review: { label: 'Pending Review', variant: 'warning' },
  partial: { label: 'Partial', variant: 'warning' },
  unmatched: { label: 'Unmatched', variant: 'destructive' },
  failed: { label: 'Failed', variant: 'destructive' },
  outstanding: { label: 'Outstanding', variant: 'destructive' },
  unpaid: { label: 'Unpaid', variant: 'destructive' },
  invalid: { label: 'Invalid', variant: 'destructive' },
  'Invalid amount': { label: 'Invalid Amount', variant: 'destructive' },
  'Invalid email': { label: 'Invalid Email', variant: 'destructive' },
  'Missing email': { label: 'Missing Email', variant: 'destructive' },
  duplicate: { label: 'Duplicate', variant: 'secondary' },
  completed: { label: 'Completed', variant: 'muted' },
  inactive: { label: 'Inactive', variant: 'muted' },
  overpaid: { label: 'Overpaid', variant: 'secondary' },
  draft: { label: 'Draft', variant: 'muted' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusMap[status] ?? { label: status, variant: 'muted' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function ReconciliationBadge({ status }: { status: string }) {
  return <StatusBadge status={status} />;
}
