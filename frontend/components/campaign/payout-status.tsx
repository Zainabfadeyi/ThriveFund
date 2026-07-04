'use client';

import { useState } from 'react';
import { formatNaira } from '@/lib/utils';

export type PayoutPhase =
  | 'needs_payout_account'
  | 'ready'
  | 'settling'
  | 'paused'
  | 'processing'
  | 'paid_out';

export function resolvePayoutPhase(input: {
  isCompleted: boolean;
  hasPayoutAccount: boolean;
  payoutProcessing: boolean;
  payoutSuccessful: boolean;
  availableForWithdrawal: number;
  nombaBalanceAvailable: boolean;
  campaignAvailable: number;
}): PayoutPhase | null {
  if (!input.isCompleted) return null;
  if (!input.hasPayoutAccount) return 'needs_payout_account';
  if (input.payoutSuccessful) return 'paid_out';
  if (input.payoutProcessing) return 'processing';
  if (!input.nombaBalanceAvailable && input.campaignAvailable > 0) return 'paused';
  if (input.availableForWithdrawal > 0) return 'ready';
  return 'settling';
}

const LABELS: Record<PayoutPhase, string> = {
  needs_payout_account: 'Add payout account',
  ready: 'Ready to withdraw',
  settling: 'Funds still settling',
  paused: 'Withdrawals paused',
  processing: 'Payout processing',
  paid_out: 'Paid out',
};

const DESCRIPTIONS: Record<PayoutPhase, string> = {
  needs_payout_account: 'Save a verified bank account in Settings before withdrawing.',
  ready: 'Your settled balance is ready to send to your payout account.',
  settling: 'Payments are recorded. We are waiting for the settled balance to become available.',
  paused: 'We could not verify the settled payout balance yet. Try again in a few hours.',
  processing: 'Your withdrawal is being processed. This page will update automatically.',
  paid_out: 'Funds have been sent to your payout account.',
};

export function PayoutStatus({
  phase,
  availableForWithdrawal,
  feeReserve,
  nombaBalance,
  campaignAvailable,
  settlementLag,
  balanceError,
  children,
}: {
  phase: PayoutPhase;
  availableForWithdrawal: number;
  feeReserve: number;
  nombaBalance: number | null | undefined;
  campaignAvailable: number;
  settlementLag: boolean;
  balanceError?: string | null;
  children?: React.ReactNode;
}) {
  const [showDetails, setShowDetails] = useState(false);

  const detailLines: string[] = [];
  if (phase === 'ready') {
    detailLines.push(`Available now: ${formatNaira(availableForWithdrawal)}`);
    detailLines.push(`Transfer fee reserve: ${formatNaira(feeReserve)}`);
  }
  if (settlementLag && nombaBalance != null) {
    detailLines.push(`Campaign balance: ${formatNaira(campaignAvailable)} · Settled for payout: ${formatNaira(nombaBalance)}`);
  }
  if (balanceError) detailLines.push(balanceError);
  if (phase === 'settling' && campaignAvailable > feeReserve) {
    detailLines.push(`Recorded on campaign: ${formatNaira(campaignAvailable)}`);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-4">
        <p className="font-semibold">{LABELS[phase]}</p>
        <p className="mt-1 text-sm text-muted-foreground">{DESCRIPTIONS[phase]}</p>
        {phase === 'ready' && (
          <p className="mt-2 text-lg font-bold text-primary">{formatNaira(availableForWithdrawal)}</p>
        )}
      </div>

      {children}

      {detailLines.length > 0 && (
        <div>
          <button
            type="button"
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
            onClick={() => setShowDetails((v) => !v)}
          >
            {showDetails ? 'Hide details' : 'Details'}
          </button>
          {showDetails && (
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              {detailLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
