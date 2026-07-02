'use client';

import { Radio } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePublicRecentPayments } from '@/hooks/use-api';
import { formatNaira } from '@/lib/utils';

export function PaymentRadar({ slug }: { slug: string }) {
  const { data: payments } = usePublicRecentPayments(slug);

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio className="h-4 w-4 animate-pulse text-primary" />
          Live Payment Radar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!payments?.length ? (
          <p className="text-sm text-muted-foreground">Waiting for the first payment…</p>
        ) : payments.map((payment) => (
          <div key={payment.id} className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{payment.contributor_name}</p>
              <p className="text-xs text-muted-foreground">
                {payment.paid_at ? new Date(payment.paid_at).toLocaleString() : 'Just now'}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-primary">{formatNaira(Number(payment.amount))}</p>
              <p className="text-xs capitalize text-muted-foreground">{payment.status.replace('_', ' ')}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
