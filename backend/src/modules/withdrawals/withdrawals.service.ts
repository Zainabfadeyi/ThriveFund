import { v4 as uuid } from 'uuid';
import { Errors } from '../../lib/errors';
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
    const available = Math.max(0, collected - reserved);
    const amount = body.amount ?? available;
    if (amount <= 0) throw Errors.conflict('No campaign balance is available for withdrawal');
    if (amount > available) {
      throw Errors.validation('Withdrawal amount exceeds available campaign balance', { available });
    }

    const activeVa = await virtualAccountsRepository.findByGoalAndUser(goalId, userId);
    if (activeVa) {
      const identifier = (activeVa.provider_reference as string) || (activeVa.account_number as string);
      await provider.expireVirtualAccount(identifier).catch(() => undefined);
      await virtualAccountsRepository.markInactive(activeVa.id as string);
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
      return { withdrawal: updated ?? withdrawal, transfer: transferResponse, available_before_withdrawal: available };
    } catch (err) {
      const details = (err as { details?: Record<string, unknown> }).details;
      const providerReference = extractProviderReference(details);
      const providerCode = typeof details?.providerCode === 'string' ? details.providerCode : undefined;
      const likelySubmitted = Boolean(providerReference) || providerCode === '201';

      if (likelySubmitted) {
        const processingWithdrawal = await withdrawalsRepository.markProcessing(
          withdrawalId,
          providerReference ?? merchantTxRefFromWithdrawalId(withdrawalId),
        );
        return {
          withdrawal: processingWithdrawal ?? withdrawal,
          transfer: null,
          available_before_withdrawal: available,
        };
      }

      const reason = err instanceof Error ? err.message : 'Withdrawal failed';
      const failed = await withdrawalsRepository.markFailed(withdrawalId, reason, providerReference);
      await this.emailOwner(owner?.email, 'failed', goal.title as string, amount, account, reason);
      await logAudit({
        action: AuditAction.WithdrawalFailed,
        actor_id: userId,
        organization_id: (goal.organization_id as string | null) ?? null,
        resource_type: 'withdrawal',
        resource_id: withdrawalId,
        metadata: { reason, provider_reference: providerReference ?? null },
      });
      return { withdrawal: failed ?? withdrawal, transfer: null, available_before_withdrawal: available };
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

    const updated = transfer.status === 'failed'
      ? await withdrawalsRepository.markFailed(withdrawalId, 'Provider returned failed status', transfer.providerReference, transfer.fee)
      : transfer.status === 'successful'
        ? await withdrawalsRepository.markSuccessful(withdrawalId, transfer.providerReference, transfer.fee)
        : await withdrawalsRepository.markProcessing(withdrawalId, transfer.providerReference, transfer.fee);

    if (transfer.status === 'successful' && previousStatus !== 'successful') {
      await goalsRepository.markClosedOut(goalId, userId);
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

  async autoPayoutForCompletedGoal(userId: string, goalId: string) {
    const account = await payoutAccountsRepository.findDefaultForUser(userId);
    if (!account) {
      await logAudit({
        action: AuditAction.AutoPayoutInitiated,
        actor_id: userId,
        resource_type: 'goal',
        resource_id: goalId,
        metadata: { skipped: true, reason: 'no_default_payout_account' },
      });
      return null;
    }

    const result = await this.createForGoal(userId, goalId, {
      payout_account_id: account.id as string,
      narration: 'ThriveFund auto-payout on campaign completion',
    });

    await logAudit({
      action: AuditAction.AutoPayoutInitiated,
      actor_id: userId,
      resource_type: 'goal',
      resource_id: goalId,
      metadata: {
        withdrawal_id: (result.withdrawal as { id?: string })?.id,
        amount: (result.withdrawal as { amount?: number })?.amount,
      },
    });

    return result;
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
    const failureEvents = ['payout_failed', 'payout.failed', 'payout_refund', 'transfer_failed'];

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
      if ((withdrawal.status as string) === 'failed') {
        return { matched: true as const, duplicate: true as const, withdrawal };
      }

      const updated = await withdrawalsRepository.markFailed(
        withdrawal.id as string,
        'Provider reported payout failure',
        input.providerReference ?? (withdrawal.provider_reference as string | undefined),
        input.fee,
      );
      if ((withdrawal.status as string) !== 'successful') {
        await this.emailOwner(
          owner?.email,
          'failed',
          goal.title as string,
          Number(withdrawal.amount),
          account,
          'Provider reported payout failure',
        );
      }
      return { matched: true as const, withdrawal: updated };
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
