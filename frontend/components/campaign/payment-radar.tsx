'use client';

import { useEffect, useState } from 'react';
import { Radio } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNaira } from '@/lib/utils';
import type { PublicPaymentActivity } from '@/lib/api/types';

function formatPaidAt(paidAt?: string): string {
  if (!paidAt) return 'Just now';
  const date = new Date(paidAt);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleString('en-NG', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PaymentRadar({ payments }: { payments?: PublicPaymentActivity[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const items = payments ?? [];

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio className="h-4 w-4 animate-pulse text-primary" />
          Live Payment Radar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!items.length ? (
          <p className="text-sm text-muted-foreground">Waiting for the first payment…</p>
        ) : items.map((payment) => (
          <div key={payment.id} className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 text-sm">
            <div>
              <p className="font-medium">New contribution</p>
              <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                {mounted ? formatPaidAt(payment.paid_at) : 'Just now'}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-primary">{formatNaira(Number(payment.amount))}</p>
              <p className="text-xs text-muted-foreground">Reconciled</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
