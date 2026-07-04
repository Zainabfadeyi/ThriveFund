import { env } from '../config/env';

export function getPayoutTransferFeeNgn(): number {
  return env.NOMBA_TRANSFER_FEE_NGN;
}

export function collectionTargetFromNetPayout(netPayoutNgn: number): number {
  return netPayoutNgn + getPayoutTransferFeeNgn();
}

export function netPayoutFromCollectionTarget(collectionTargetNgn: number): number {
  return Math.max(0, collectionTargetNgn - getPayoutTransferFeeNgn());
}

export function excessCollectedNgn(collectedNgn: number, targetNgn: number): number {
  return Math.max(0, collectedNgn - targetNgn);
}

export function estimatedNetAvailable(collectedNgn: number, _collectionTargetNgn?: number): number {
  return Math.max(0, collectedNgn - getPayoutTransferFeeNgn());
}

export function requiredWalletBalanceForPayout(payoutAmountNgn: number): number {
  return payoutAmountNgn + getPayoutTransferFeeNgn();
}

export function pendingWalletCommitmentNgn(pendingAmountNgn: number, pendingCount: number): number {
  return pendingAmountNgn + pendingCount * getPayoutTransferFeeNgn();
}

export function walletHeadroomNgn(nombaBalance: number, pendingAmountNgn: number, pendingCount: number): number {
  return Math.max(0, nombaBalance - pendingWalletCommitmentNgn(pendingAmountNgn, pendingCount));
}

export function canFundPendingCommitments(
  nombaBalance: number,
  pendingAmountNgn: number,
  pendingCount: number,
): boolean {
  return nombaBalance >= pendingWalletCommitmentNgn(pendingAmountNgn, pendingCount);
}

export function canAffordNewPayout(
  payoutAmountNgn: number,
  nombaBalance: number,
  pendingAmountNgn = 0,
  pendingCount = 0,
): boolean {
  return canFundPendingCommitments(
    nombaBalance,
    pendingAmountNgn + payoutAmountNgn,
    pendingCount + 1,
  );
}

export function maxWithdrawableNgn(
  campaignAvailable: number,
  nombaBalance: number | null,
  pendingAmountNgn = 0,
  pendingCount = 0,
): number {
  const fee = getPayoutTransferFeeNgn();
  const afterFeeCampaign = Math.max(0, campaignAvailable - fee);

  if (nombaBalance == null) {
    return 0;
  }

  const headroom = walletHeadroomNgn(nombaBalance, pendingAmountNgn, pendingCount);
  const afterFeeWallet = Math.max(0, headroom - fee);
  return Math.min(afterFeeCampaign, afterFeeWallet);
}

export function enrichGoalWithPayoutFee<T extends Record<string, unknown>>(goal: T) {
  const target = Number(goal.target_amount ?? 0);
  const current = Number(goal.current_amount ?? 0);
  const fee = getPayoutTransferFeeNgn();
  const excess = excessCollectedNgn(current, target);
  return {
    ...goal,
    payout_fee_ngn: fee,
    net_payout_target: netPayoutFromCollectionTarget(target),
    estimated_net_available: estimatedNetAvailable(current),
    excess_amount: excess,
  };
}

export function getPayoutFeeInfo() {
  const transfer_fee_ngn = getPayoutTransferFeeNgn();
  return {
    transfer_fee_ngn,
    description:
      'Nomba charges a transfer fee on each payout. Set your collection target to include this fee so you receive your desired amount.',
  };
}
