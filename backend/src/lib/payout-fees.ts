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

export function estimatedNetAvailable(collectedNgn: number, collectionTargetNgn?: number): number {
  const cap = collectionTargetNgn != null ? Math.min(collectedNgn, collectionTargetNgn) : collectedNgn;
  return Math.max(0, cap - getPayoutTransferFeeNgn());
}

export function maxWithdrawableNgn(campaignAvailable: number, nombaBalance: number | null): number {
  const fee = getPayoutTransferFeeNgn();
  const afterFeeCampaign = Math.max(0, campaignAvailable - fee);
  const afterFeeNomba = nombaBalance != null
    ? Math.max(0, nombaBalance - fee)
    : afterFeeCampaign;
  return Math.min(afterFeeCampaign, afterFeeNomba);
}

export function enrichGoalWithPayoutFee<T extends Record<string, unknown>>(goal: T) {
  const target = Number(goal.target_amount ?? 0);
  const current = Number(goal.current_amount ?? 0);
  const fee = getPayoutTransferFeeNgn();
  return {
    ...goal,
    payout_fee_ngn: fee,
    net_payout_target: netPayoutFromCollectionTarget(target),
    estimated_net_available: estimatedNetAvailable(current, target),
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
