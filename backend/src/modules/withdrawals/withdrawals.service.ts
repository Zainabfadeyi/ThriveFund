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
    await this.emailOwner(owner?.email, 'initiated', goal.title as string, amount, account);

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
      const transfer = await provider.transferToBank({
        amount,
        accountNumber: account.account_number as string,
        accountName: account.account_name as string,
        bankCode: account.bank_code as string,
        merchantTxRef,
        senderName: 'ThriveFund',
        narration: body.narration ?? `ThriveFund withdrawal - ${goal.title as string}`,
      });

      const updated = transfer.status === 'failed'
        ? await withdrawalsRepository.markFailed(withdrawalId, 'Provider returned failed status', transfer.providerReference, transfer.fee)
        : transfer.status === 'successful'
          ? await withdrawalsRepository.markSuccessful(withdrawalId, transfer.providerReference, transfer.fee)
          : await withdrawalsRepository.markProcessing(withdrawalId, transfer.providerReference, transfer.fee);

      if (transfer.status === 'successful') {
        await goalsRepository.markClosedOut(goalId, userId);
        await this.emailOwner(owner?.email, 'successful', goal.title as string, amount, account);
        await logAudit({
          action: AuditAction.WithdrawalCompleted,
          actor_id: userId,
          organization_id: (goal.organization_id as string | null) ?? null,
          resource_type: 'withdrawal',
          resource_id: withdrawalId,
          metadata: { provider_reference: transfer.providerReference, fee: transfer.fee },
        });
      }

      if (transfer.status === 'failed') {
        await this.emailOwner(owner?.email, 'failed', goal.title as string, amount, account, 'Provider returned failed status');
      }

      const { raw: _raw, ...transferResponse } = transfer;
      return { withdrawal: updated ?? withdrawal, transfer: transferResponse, available_before_withdrawal: available };
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'Withdrawal failed';
      const failed = await withdrawalsRepository.markFailed(withdrawalId, reason);
      await this.emailOwner(owner?.email, 'failed', goal.title as string, amount, account, reason);
      await logAudit({
        action: AuditAction.WithdrawalFailed,
        actor_id: userId,
        organization_id: (goal.organization_id as string | null) ?? null,
        resource_type: 'withdrawal',
        resource_id: withdrawalId,
        metadata: { reason },
      });
      return { withdrawal: failed ?? withdrawal, transfer: null, available_before_withdrawal: available };
    }
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
