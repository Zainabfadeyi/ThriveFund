import { v4 as uuid } from 'uuid';
import {
  maxWithdrawableNgn,
  getPayoutTransferFeeNgn,
  canAffordNewPayout,
  canFundPendingCommitments,
  requiredWalletBalanceForPayout,
  pendingWalletCommitmentNgn,
} from '../../lib/payout-fees';
import { AppError, Errors } from '../../lib/errors';
import { logAudit } from '../../lib/audit';
import { sendEmail, withdrawalEmail } from '../../lib/email';
import { getPaymentProvider } from '../../providers/payment';
import { AuditAction } from '../../shared/types/enums';
import { goalsRepository } from '../goals/goals.repository';
import { payoutAccountsRepository } from '../payout-accounts/payout-accounts.repository';
import { virtualAccountsRepository } from '../virtual-accounts/virtual-accounts.repository';
import { withdrawalsRepository } from './withdrawals.repository';
import type { CreateWithdrawalInput } from './withdrawals.schema';

export const withdrawalsService = {
  async getAvailability(userId: string, goalId: string) {
    const goal = await goalsRepository.findByIdRaw(goalId, userId);
    if (!goal) throw Errors.notFound('Goal');

    const collected = Number(goal.current_amount);
    const reserved = await withdrawalsRepository.sumReservedByGoal(goalId);
    const campaignAvailable = Math.max(0, collected - reserved);
    const feeReserve = getPayoutTransferFeeNgn();
    const pendingWallet = await withdrawalsRepository.sumPendingWalletCommitment();

    let nombaBalance: number | null = null;
    let balanceError: string | null = null;
    try {
      nombaBalance = await getPaymentProvider().getAccountBalance();
    } catch (err) {
      nombaBalance = null;
      balanceError = err instanceof Error ? err.message : 'Unable to read settled payout balance';
    }

    const settlementAvailable = maxWithdrawableNgn(
      campaignAvailable,
      nombaBalance,
      pendingWallet.amount,
      pendingWallet.count,
    );

    const settlementLag = nombaBalance != null && nombaBalance < campaignAvailable;

    return {
      campaign_collected: collected,
      campaign_reserved: reserved,
      campaign_available: campaignAvailable,
      nomba_balance: nombaBalance,
      transfer_fee_reserve: feeReserve,
      max_withdrawable: settlementAvailable,
      nomba_balance_available: nombaBalance != null,
      settlement_lag: settlementLag,
      pending_wallet_commitment: pendingWalletCommitmentNgn(pendingWallet.amount, pendingWallet.count),
      balance_error: balanceError,
    };
  },

  async list(userId: string, query: { goal_id?: string; status?: string; page?: number; per_page?: number }) {
    const page = query.page ?? 1;
    const perPage = Math.min(query.per_page ?? 20, 100);
    const { rows, total } = await withdrawalsRepository.findByUser(userId, {
      goal_id: query.goal_id,
      status: query.status,
      page,
      perPage,
    });
    return { data: rows, meta: { page, per_page: perPage, total } };
  },

  async listByGoal(userId: string, goalId: string) {
    const goal = await goalsRepository.findByIdRaw(goalId, userId);
    if (!goal) throw Errors.notFound('Goal');
    return withdrawalsRepository.findByGoal(goalId, userId);
  },

  async createForGoal(userId: string, goalId: string, body: CreateWithdrawalInput) {
    const goal = await goalsRepository.findByIdRaw(goalId, userId);
    if (!goal) throw Errors.notFound('Goal');
    if ((goal.status as string) !== 'completed') {
      throw Errors.conflict('Campaign must be completed before withdrawal');
    }

    const provider = getPaymentProvider();
    const account = body.payout_account_id
      ? await payoutAccountsRepository.findByIdForUser(body.payout_account_id, userId)
      : await payoutAccountsRepository.findDefaultForUser(userId);
    if (!account) throw Errors.notFound('Payout account');

    const collected = Number(goal.current_amount);
    const reserved = await withdrawalsRepository.sumReservedByGoal(goalId);
    const campaignAvailable = Math.max(0, collected - reserved);
    const feeReserve = getPayoutTransferFeeNgn();
    const pendingWallet = await withdrawalsRepository.sumPendingWalletCommitment();

    let nombaBalance: number | null = null;
    try {
      nombaBalance = await provider.getAccountBalance();
    } catch {
      nombaBalance = null;
    }

    if (nombaBalance == null) {
      throw Errors.conflict(
        'We could not verify the settled payout balance right now. Payments may still be settling — please try again in a few hours.',
      );
    }

    const maxWithdrawable = maxWithdrawableNgn(
      campaignAvailable,
      nombaBalance,
      pendingWallet.amount,
      pendingWallet.count,
    );

    const amount = body.amount ?? maxWithdrawable;
    if (amount <= 0) {
      throw Errors.conflict(
        nombaBalance <= feeReserve
          ? `The settled payout balance is only ${formatNaira(nombaBalance)}. A payout needs the withdrawal amount plus ${formatNaira(feeReserve)} transfer fee.`
          : 'No campaign balance is available for withdrawal',
      );
    }
    if (amount > campaignAvailable) {
      throw Errors.validation('Withdrawal amount exceeds available campaign balance', { available: campaignAvailable });
    }
    if (amount > maxWithdrawable) {
      throw Errors.validation(
        buildWithdrawalCapMessage({
          amount,
          maxWithdrawable,
          nombaBalance,
          campaignAvailable,
          feeReserve,
          pendingWallet,
        }),
        {
          max_withdrawable: maxWithdrawable,
          nomba_balance: nombaBalance,
          transfer_fee_reserve: feeReserve,
          required_wallet_balance: requiredWalletBalanceForPayout(amount),
        },
      );
    }

    if (!canAffordNewPayout(amount, nombaBalance, pendingWallet.amount, pendingWallet.count)) {
      throw Errors.validation(
        buildWithdrawalCapMessage({
          amount,
          maxWithdrawable,
          nombaBalance,
          campaignAvailable,
          feeReserve,
          pendingWallet,
        }),
        {
          max_withdrawable: maxWithdrawable,
          nomba_balance: nombaBalance,
          transfer_fee_reserve: feeReserve,
          required_wallet_balance: requiredWalletBalanceForPayout(amount),
        },
      );
    }

    const withdrawalId = `wd_${uuid().replace(/-/g, '').slice(0, 12)}`;
    const withdrawal = await withdrawalsRepository.insert({
      id: withdrawalId,
      goal_id: goalId,
      organization_id: (goal.organization_id as string | null) ?? null,
      user_id: userId,
      payout_account_id: account.id as string,
      provider: provider.name,
      amount,
    });

    const owner = await goalsRepository.findOwnerByGoalId(goalId);

    await logAudit({
      action: AuditAction.WithdrawalCreated,
      actor_id: userId,
      organization_id: (goal.organization_id as string | null) ?? null,
      resource_type: 'withdrawal',
      resource_id: withdrawalId,
      metadata: { goal_id: goalId, amount, payout_account_id: account.id },
    });

    try {
      const freshBalance = await provider.getAccountBalance();
      const livePending = await withdrawalsRepository.sumPendingWalletCommitment();
      if (!canFundPendingCommitments(freshBalance, livePending.amount, livePending.count)) {
        const reason = buildWithdrawalCapMessage({
          amount,
          maxWithdrawable: maxWithdrawableNgn(
            campaignAvailable,
            freshBalance,
            Math.max(0, livePending.amount - amount),
            Math.max(0, livePending.count - 1),
          ),
          nombaBalance: freshBalance,
          campaignAvailable,
          feeReserve,
          pendingWallet: {
            amount: Math.max(0, livePending.amount - amount),
            count: Math.max(0, livePending.count - 1),
          },
        });
        await withdrawalsRepository.markFailed(withdrawalId, reason);
        throw Errors.validation(reason, {
          max_withdrawable: maxWithdrawable,
          nomba_balance: freshBalance,
          required_wallet_balance: pendingWalletCommitmentNgn(livePending.amount, livePending.count),
        });
      }

      const merchantTxRef = `TF-WD-${withdrawalId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 48)}`.slice(0, 64);
      const lookup = await provider.lookupBankAccount(
        account.account_number as string,
        account.bank_code as string,
      );
      const transfer = await provider.transferToBank({
        amount,
        accountNumber: lookup.accountNumber,
        accountName: lookup.accountName,
        bankCode: lookup.bankCode,
        merchantTxRef,
        senderName: 'ThriveFund',
        narration: body.narration ?? `ThriveFund withdrawal - ${goal.title as string}`,
      });

      const updated = await this.applyTransferResult({
        withdrawalId,
        goalId,
        userId,
        goalTitle: goal.title as string,
        amount,
        account,
        ownerEmail: owner?.email,
        organizationId: (goal.organization_id as string | null) ?? null,
        transfer,
      });

      const { raw: _raw, ...transferResponse } = transfer;
      return { withdrawal: updated ?? withdrawal, transfer: transferResponse, available_before_withdrawal: maxWithdrawable };
    } catch (err) {
      if (err instanceof AppError && err.code === 'VALIDATION_ERROR') {
        throw err;
      }

      const details = (err as { details?: Record<string, unknown> }).details;
      const providerReference = extractProviderReference(details);
      const providerCode = typeof details?.providerCode === 'string' ? details.providerCode : undefined;
      const merchantTxRef = merchantTxRefFromWithdrawalId(withdrawalId);
      const likelySubmitted = Boolean(providerReference) || providerCode === '201' || !isDefinitiveTransferFailure(err);

      if (likelySubmitted) {
        const processingWithdrawal = await withdrawalsRepository.markProcessing(
          withdrawalId,
          providerReference ?? merchantTxRef,
        );
        return {
          withdrawal: processingWithdrawal ?? withdrawal,
          transfer: null,
          available_before_withdrawal: maxWithdrawable,
        };
      }

      const reason = humanizeTransferError(err, nombaBalance, amount, feeReserve);
      const { row: failed } = await withdrawalsRepository.markFailed(withdrawalId, reason, providerReference);
      await logAudit({
        action: AuditAction.WithdrawalFailed,
        actor_id: userId,
        organization_id: (goal.organization_id as string | null) ?? null,
        resource_type: 'withdrawal',
        resource_id: withdrawalId,
        metadata: { reason, provider_reference: providerReference ?? null },
      });
      return { withdrawal: failed ?? withdrawal, transfer: null, available_before_withdrawal: maxWithdrawable };
    }
  },

  async applyTransferResult(input: {
    withdrawalId: string;
    goalId: string;
    userId: string;
    goalTitle: string;
    amount: number;
    account: Record<string, unknown>;
    ownerEmail?: string;
    organizationId?: string | null;
    transfer: { status: string; providerReference: string; fee?: number };
  }) {
    const { withdrawalId, goalId, userId, goalTitle, amount, account, ownerEmail, organizationId, transfer } = input;
    const existing = await withdrawalsRepository.findById(withdrawalId);
    const previousStatus = (existing?.status as string | undefined) ?? 'pending';
    if (previousStatus === 'successful' && transfer.status === 'failed') {
      return existing;
    }

    const updated = transfer.status === 'failed'
      ? (await withdrawalsRepository.markFailed(
        withdrawalId,
        'Provider returned failed status',
        transfer.providerReference,
        transfer.fee,
      )).row
      : transfer.status === 'successful'
        ? await withdrawalsRepository.markSuccessful(withdrawalId, transfer.providerReference, transfer.fee)
        : await withdrawalsRepository.markProcessing(withdrawalId, transfer.providerReference, transfer.fee);

    if (transfer.status === 'successful' && previousStatus !== 'successful') {
      await goalsRepository.markClosedOut(goalId, userId);
      const activeVa = await virtualAccountsRepository.findByGoalAndUser(goalId, userId);
      if (activeVa) {
        const identifier = (activeVa.provider_reference as string) || (activeVa.account_number as string);
        await getPaymentProvider().expireVirtualAccount(identifier).catch(() => undefined);
        await virtualAccountsRepository.markInactive(activeVa.id as string);
      }
      await this.emailOwner(ownerEmail, 'successful', goalTitle, amount, account);
      await logAudit({
        action: AuditAction.WithdrawalCompleted,
        actor_id: userId,
        organization_id: organizationId ?? null,
        resource_type: 'withdrawal',
        resource_id: withdrawalId,
        metadata: { provider_reference: transfer.providerReference, fee: transfer.fee },
      });
    }

    return updated;
  },

  async reconcileFromWebhook(input: {
    event: string;
    merchantTxRef?: string;
    providerReference?: string;
    fee?: number;
  }) {
    const withdrawal =
      (input.merchantTxRef ? await withdrawalsRepository.findOpenByMerchantTxRef(input.merchantTxRef) : null) ??
      (input.providerReference ? await withdrawalsRepository.findByProviderReference(input.providerReference) : null);

    if (!withdrawal) {
      return { matched: false as const };
    }

    if ((withdrawal.status as string) === 'successful') {
      return { matched: true as const, duplicate: true as const, withdrawal };
    }

    const goal = await goalsRepository.findByIdRaw(withdrawal.goal_id as string, withdrawal.user_id as string);
    if (!goal) return { matched: false as const };

    const account = await payoutAccountsRepository.findByIdForUser(
      withdrawal.payout_account_id as string,
      withdrawal.user_id as string,
    );
    if (!account) return { matched: false as const };

    const owner = await goalsRepository.findOwnerByGoalId(withdrawal.goal_id as string);
    const successEvents = ['payout_success', 'payout.success', 'transfer_success'];
    const failureEvents = ['payout_failed', 'payout.failed', 'transfer_failed'];
    const previousStatus = withdrawal.status as string;

    if (successEvents.includes(input.event)) {
      const updated = await this.applyTransferResult({
        withdrawalId: withdrawal.id as string,
        goalId: withdrawal.goal_id as string,
        userId: withdrawal.user_id as string,
        goalTitle: goal.title as string,
        amount: Number(withdrawal.amount),
        account,
        ownerEmail: owner?.email,
        organizationId: (goal.organization_id as string | null) ?? null,
        transfer: {
          status: 'successful',
          providerReference: input.providerReference ?? (withdrawal.provider_reference as string),
          fee: input.fee,
        },
      });
      return { matched: true as const, withdrawal: updated };
    }

    if (failureEvents.includes(input.event)) {
      if (previousStatus === 'successful' || previousStatus === 'failed') {
        return { matched: true as const, duplicate: true as const, withdrawal };
      }

      const { row: updated, transitioned } = await withdrawalsRepository.markFailed(
        withdrawal.id as string,
        'Provider reported payout failure',
        input.providerReference ?? (withdrawal.provider_reference as string | undefined),
        input.fee,
      );
      if (transitioned && updated) {
        await this.emailOwner(
          owner?.email,
          'failed',
          goal.title as string,
          Number(withdrawal.amount),
          account,
          'Provider reported payout failure',
        );
      }
      return { matched: true as const, withdrawal: updated ?? withdrawal };
    }

    return { matched: false as const };
  },

  async emailOwner(
    email: string | undefined,
    status: 'initiated' | 'successful' | 'failed',
    goalTitle: string,
    amount: number,
    account: Record<string, unknown>,
    failureReason?: string,
  ) {
    if (!email) return;
    const { subject, html } = withdrawalEmail({
      goalTitle,
      amount,
      accountName: account.account_name as string,
      accountNumber: account.account_number as string,
      bankName: account.bank_name as string | null,
      status,
      failureReason,
    });
    await sendEmail({ to: { email }, subject, html }).catch(() => undefined);
  },
};

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG')}`;
}

function buildWithdrawalCapMessage(input: {
  amount: number;
  maxWithdrawable: number;
  nombaBalance: number;
  campaignAvailable: number;
  feeReserve: number;
  pendingWallet: { amount: number; count: number };
}) {
  const {
    amount,
    maxWithdrawable,
    nombaBalance,
    campaignAvailable,
    feeReserve,
    pendingWallet,
  } = input;
  const required = requiredWalletBalanceForPayout(amount);
  const pendingNote = pendingWallet.count > 0
    ? ` ${formatNaira(pendingWalletCommitmentNgn(pendingWallet.amount, pendingWallet.count))} is already reserved for other in-flight payouts.`
    : '';

  if (nombaBalance < campaignAvailable) {
    return `Your campaign shows ${formatNaira(campaignAvailable)} available, but only ${formatNaira(nombaBalance)} has settled for payout right now.${pendingNote} A ${formatNaira(amount)} payout needs ${formatNaira(required)} available, including the ${formatNaira(feeReserve)} transfer fee. Maximum you can withdraw now is ${formatNaira(maxWithdrawable)}. Payments may still be settling — try a smaller amount or wait a few hours.`;
  }

  return `The settled payout balance is ${formatNaira(nombaBalance)}.${pendingNote} A ${formatNaira(amount)} payout needs ${formatNaira(required)} available, including the ${formatNaira(feeReserve)} transfer fee. Maximum you can withdraw now is ${formatNaira(maxWithdrawable)}.`;
}

function isDefinitiveTransferFailure(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  if (/INSUFFICIENT_BALANCE/i.test(msg)) return true;
  if (/fetch failed|network|timeout|ECONNRESET|ETIMEDOUT|socket hang up/i.test(msg)) return false;
  const code = (err as { details?: { providerCode?: string } }).details?.providerCode;
  if (code === '201') return false;
  return false;
}

function humanizeTransferError(
  err: unknown,
  nombaBalance: number | null,
  amount: number,
  feeReserve: number,
): string {
  const msg = err instanceof Error ? err.message : 'Withdrawal failed';
  if (/INSUFFICIENT_BALANCE/i.test(msg)) {
    const required = requiredWalletBalanceForPayout(amount);
    const walletNote = nombaBalance != null
      ? ` The settled payout balance currently shows ${formatNaira(nombaBalance)}.`
      : '';
    return `This payout was rejected because there is not enough settled balance available for the payout and transfer fee (${formatNaira(required)} total).${walletNote} This usually means payments are still settling. Try withdrawing a smaller amount or wait a few hours before retrying.`;
  }
  return msg;
}

function merchantTxRefFromWithdrawalId(withdrawalId: string): string {
  return `TF-WD-${withdrawalId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 48)}`.slice(0, 64);
}

function extractProviderReference(details?: Record<string, unknown>): string | undefined {
  if (!details) return undefined;
  if (typeof details.providerReference === 'string' && details.providerReference.trim()) {
    return details.providerReference.trim();
  }

  const data = details.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const transferId = (data as Record<string, unknown>).id;
    if (typeof transferId === 'string' && transferId.trim()) return transferId.trim();
  }

  return undefined;
}
