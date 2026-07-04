import { v4 as uuid } from 'uuid';
import { Errors } from '../../lib/errors';
import { logAudit } from '../../lib/audit';
import { AuditAction, ReconciliationStatus, TransactionStatus } from '../../shared/types/enums';
import { parsePagination, buildMeta } from '../../shared/utils/pagination';
import { reconciliationRepository } from './reconciliation.repository';
import { virtualAccountsRepository } from '../virtual-accounts/virtual-accounts.repository';
import { transactionsRepository } from '../transactions/transactions.repository';
import { goalsRepository } from '../goals/goals.repository';
import { contributorsRepository } from '../contributors/contributors.repository';
import { notificationsRepository } from '../notifications/notifications.repository';
import { webhooksRepository } from '../webhooks/webhooks.repository';
import { sendEmail, sendPaymentReceivedEmail, campaignCompletedEmail, paymentMismatchEmail } from '../../lib/email';
import { env } from '../../config/env';
import { execute } from '../../config/database';
import { getPaymentProvider } from '../../providers/payment';
import { broadcastRealtime } from '../../lib/realtime';
import { withdrawalsService } from '../withdrawals/withdrawals.service';
import type { ResolveReconciliationDto } from './reconciliation.validators';

interface PaymentRecord {
  id: string;
  webhook_event_id?: string;
  provider_reference: string;
  account_number: string;
  amount: number;
  payer_name: string;
  reference: string;
  status: string;
  paid_at?: string;
}

type PaymentMatchType = 'exact' | 'under' | 'over';

function normalizedPayerName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

function shouldAutoCreateContributor(name: string): boolean {
  const normalized = normalizedPayerName(name).toLowerCase();
  return Boolean(normalized) && normalized !== 'anonymous';
}

function classifyPayment(amount: number, currentAmount: number, targetAmount: number): {
  matchType: PaymentMatchType;
  creditAmount: number;
  excessAmount: number;
  remainingBefore: number;
} {
  const remaining = Math.max(0, targetAmount - currentAmount);
  if (remaining <= 0) {
    return { matchType: 'over', creditAmount: 0, excessAmount: amount, remainingBefore: 0 };
  }
  if (amount > remaining) {
    return { matchType: 'over', creditAmount: remaining, excessAmount: amount - remaining, remainingBefore: remaining };
  }
  if (amount < remaining) {
    return { matchType: 'under', creditAmount: amount, excessAmount: 0, remainingBefore: remaining };
  }
  return { matchType: 'exact', creditAmount: amount, excessAmount: 0, remainingBefore: remaining };
}

export const reconciliationService = {
  /** Match verified payment to virtual account → goal → transaction */
  async reconcilePayment(payment: PaymentRecord) {
    const va = await virtualAccountsRepository.findByAccountNumber(payment.account_number);

    if (!va) {
      const rec = await reconciliationRepository.insert({
        id: `rec_${uuid().replace(/-/g, '').slice(0, 12)}`,
        payment_id: payment.id,
        webhook_event_id: payment.webhook_event_id,
        status: ReconciliationStatus.Unmatched,
        notes: `No virtual account for ${payment.account_number}`,
      });
      return { matched: false, reconciliation: rec };
    }

    const goalId = va.goal_id as string;
    const orgId = (va as { organization_id?: string }).organization_id ?? null;
    const goalState = await goalsRepository.findCompletionState(goalId);
    const currentAmount = Number(goalState?.current_amount ?? 0);
    const targetAmount = Number(goalState?.target_amount ?? 0);
    const paymentAmount = Number(payment.amount);
    const classification = classifyPayment(paymentAmount, currentAmount, targetAmount);

    const txnStatus = payment.status !== 'verified'
      ? TransactionStatus.Pending
      : classification.creditAmount <= 0 && classification.excessAmount > 0
        ? TransactionStatus.PendingReview
        : TransactionStatus.Successful;

    if (txnStatus === TransactionStatus.Successful && shouldAutoCreateContributor(payment.payer_name)) {
      const contributorName = normalizedPayerName(payment.payer_name);
      const existingContributor = await contributorsRepository.findByGoalAndNormalizedName(goalId, contributorName);
      if (!existingContributor) {
        await contributorsRepository.insertAutoDetected({
          id: `ctr_${uuid().replace(/-/g, '').slice(0, 12)}`,
          goal_id: goalId,
          organization_id: orgId,
          name: contributorName,
          unique_reference: uuid().slice(0, 8).toUpperCase(),
        });
      }
    }

    const txnId = `txn_${uuid().replace(/-/g, '').slice(0, 12)}`;
    await transactionsRepository.insert({
      id: txnId,
      goal_id: goalId,
      virtual_account_id: va.id as string,
      contributor_name: payment.payer_name,
      amount: paymentAmount,
      reference: payment.reference,
      provider_reference: payment.provider_reference,
      status: txnStatus,
      paid_at: payment.paid_at ?? new Date().toISOString(),
      organization_id: orgId,
      payment_id: payment.id,
    });

    if (txnStatus === TransactionStatus.Successful && classification.creditAmount > 0) {
      await goalsRepository.incrementAmount(goalId, classification.creditAmount);
    }

    const recNotes = classification.matchType === 'exact'
      ? 'Exact payment matched'
      : classification.matchType === 'under'
        ? `Under-payment: ₦${paymentAmount.toLocaleString()} received, ₦${classification.remainingBefore.toLocaleString()} was remaining`
        : `Over-payment: credited ₦${classification.creditAmount.toLocaleString()}, excess ₦${classification.excessAmount.toLocaleString()}`;

    const rec = await reconciliationRepository.insert({
      id: `rec_${uuid().replace(/-/g, '').slice(0, 12)}`,
      payment_id: payment.id,
      webhook_event_id: payment.webhook_event_id,
      organization_id: orgId ?? undefined,
      goal_id: goalId,
      virtual_account_id: va.id as string,
      transaction_id: txnId,
      status: classification.matchType === 'over' && classification.excessAmount > 0
        ? ReconciliationStatus.Pending
        : ReconciliationStatus.Matched,
      notes: recNotes,
    });

    await webhooksRepository.markStatus(payment.provider_reference, 'processed');

    const goal = await goalsRepository.findOwnerByGoalId(goalId);
    const completionState = await goalsRepository.findCompletionState(goalId);

    broadcastRealtime({
      type: 'transaction.created',
      user_id: goal?.user_id as string | undefined,
      organization_id: orgId,
      goal_id: goalId,
      data: {
        transaction_id: txnId,
        amount: paymentAmount,
        payer_name: payment.payer_name,
        status: txnStatus,
        payment_match: classification.matchType,
        excess_amount: classification.excessAmount,
        credited_amount: classification.creditAmount,
        current_amount: completionState ? Number(completionState.current_amount) : undefined,
        target_amount: completionState ? Number(completionState.target_amount) : undefined,
        slug: completionState?.slug ?? null,
      },
    });

    const completion = txnStatus === TransactionStatus.Successful
      ? await this.completeCampaignIfTargetReached(goalId, va as Record<string, unknown>)
      : null;

    const updatedState = completion ? await goalsRepository.findCompletionState(goalId) : completionState;
    if (updatedState) {
      broadcastRealtime({
        type: 'campaign.balance_updated',
        user_id: updatedState.user_id as string,
        organization_id: updatedState.organization_id as string | null,
        goal_id: goalId,
        data: {
          current_amount: Number(updatedState.current_amount),
          target_amount: Number(updatedState.target_amount),
          status: updatedState.status,
          slug: updatedState.slug ?? null,
          completed: Boolean(completion?.completed),
        },
      });
    }

    if (goal && txnStatus === TransactionStatus.Successful) {
      await notificationsRepository.insert({
        id: `ntf_${uuid().replace(/-/g, '').slice(0, 12)}`,
        user_id: goal.user_id,
        type: 'payment',
        title: classification.matchType === 'under' ? 'Partial payment received' : 'Payment received',
        body: classification.matchType === 'under'
          ? `${payment.payer_name} paid ₦${paymentAmount.toLocaleString()} (₦${classification.remainingBefore - classification.creditAmount} still outstanding) for ${goal.title}`
          : `${payment.payer_name} contributed ₦${paymentAmount.toLocaleString()} to ${goal.title}`,
      });

      if (goal.email) {
        await sendPaymentReceivedEmail(goal.email as string, {
          payerName: payment.payer_name,
          amount: paymentAmount,
          goalTitle: goal.title as string,
        }).catch(() => undefined);
      }
    }

    if (goal && classification.matchType === 'over' && classification.excessAmount > 0 && goal.email) {
      await notificationsRepository.insert({
        id: `ntf_${uuid().replace(/-/g, '').slice(0, 12)}`,
        user_id: goal.user_id,
        type: 'payment',
        title: 'Over-payment received',
        body: `${payment.payer_name} overpaid by ₦${classification.excessAmount.toLocaleString()} on ${goal.title}. Review in reconciliation.`,
      });
      const { subject, html } = paymentMismatchEmail({
        goalTitle: goal.title as string,
        payerName: payment.payer_name,
        amount: paymentAmount,
        matchType: 'over',
        excessAmount: classification.excessAmount,
        dashboardLink: `${env.FRONTEND_URL}/dashboard/reconciliation`,
      });
      await sendEmail({ to: { email: goal.email as string }, subject, html }).catch(() => undefined);
    }

    await logAudit({
      action: AuditAction.ReconciliationMatched,
      resource_type: 'reconciliation',
      resource_id: rec.id as string,
      metadata: { goal_id: goalId, transaction_id: txnId, amount: payment.amount },
    });

    return {
      matched: true,
      reconciliation: rec,
      transaction_id: txnId,
      completed: Boolean(completion?.completed),
      payment_match: classification.matchType,
      excess_amount: classification.excessAmount,
    };
  },

  async completeCampaignIfTargetReached(goalId: string, virtualAccount: Record<string, unknown>) {
    const goal = await goalsRepository.findCompletionState(goalId);
    if (!goal) return null;
    const currentAmount = Number(goal.current_amount);
    const targetAmount = Number(goal.target_amount);
    if (currentAmount < targetAmount || (goal.status as string) === 'completed') return null;

    const provider = getPaymentProvider();
    const expireIdentifier = (virtualAccount.provider_reference as string) || (virtualAccount.account_number as string);
    const expiry = await provider.expireVirtualAccount(expireIdentifier);
    await virtualAccountsRepository.markInactive(virtualAccount.id as string);
    const updatedGoal = await goalsRepository.markCompleted(goalId);

    await notificationsRepository.insert({
      id: `ntf_${uuid().replace(/-/g, '').slice(0, 12)}`,
      user_id: goal.user_id as string,
      type: 'campaign_completed',
      title: 'Campaign target reached',
      body: `${goal.title as string} reached its target and the collection account was expired.`,
    });

    if (goal.email) {
      const { subject, html } = campaignCompletedEmail(
        goal.title as string,
        currentAmount,
        `${env.FRONTEND_URL}/dashboard/campaigns/${goalId}`,
      );
      await sendEmail({
        to: { email: goal.email as string },
        subject,
        html,
      }).catch(() => undefined);
    }

    await logAudit({
      action: AuditAction.GoalCompleted,
      actor_id: goal.user_id as string,
      organization_id: goal.organization_id as string | null,
      resource_type: 'goal',
      resource_id: goalId,
      metadata: {
        current_amount: currentAmount,
        target_amount: targetAmount,
        expired_virtual_account: expiry.expired,
      },
    });

    broadcastRealtime({
      type: 'campaign.completed',
      user_id: goal.user_id as string,
      organization_id: goal.organization_id as string | null,
      goal_id: goalId,
      data: {
        current_amount: Number(updatedGoal?.current_amount ?? currentAmount),
        target_amount: targetAmount,
        virtual_account_id: virtualAccount.id,
        slug: goal.slug ?? null,
      },
    });

    await withdrawalsService.autoPayoutForCompletedGoal(goal.user_id as string, goalId).catch(() => undefined);

    return { completed: true, goal: updatedGoal, expiry };
  },

  async list(userId: string, query: {
    status?: string; organization_id?: string; from?: string; to?: string;
    page?: number; per_page?: number;
  }) {
    const { page, per_page } = parsePagination(query);
    const { rows, total } = await reconciliationRepository.findAll({
      ...query, user_id: userId, page, perPage: per_page,
    });
    return { data: rows, meta: buildMeta(page, per_page, total) };
  },

  async listAdmin(query: {
    status?: string; from?: string; to?: string; page?: number; per_page?: number;
  }) {
    const { page, per_page } = parsePagination(query);
    const { rows, total } = await reconciliationRepository.findAll({ ...query, page, perPage: per_page });
    return { data: rows, meta: buildMeta(page, per_page, total) };
  },

  async getById(id: string) {
    const rec = await reconciliationRepository.findById(id);
    if (!rec) throw Errors.notFound('Reconciliation record');
    return rec;
  },

  async resolveManual(id: string, body: ResolveReconciliationDto) {
    const rec = await reconciliationRepository.findById(id);
    if (!rec) throw Errors.notFound('Reconciliation record');

    const va = await virtualAccountsRepository.findByGoalId(body.goal_id);
    if (!va) throw Errors.notFound('Virtual account for goal');

    const payment = {
      id: rec.payment_id as string,
      webhook_event_id: rec.webhook_event_id as string | undefined,
      provider_reference: rec.provider_reference as string,
      account_number: va.account_number as string,
      amount: Number(rec.amount),
      payer_name: rec.payer_name as string,
      reference: rec.reference as string,
      status: 'verified',
    };

    const result = await this.reconcilePayment(payment);

    await execute(
      `UPDATE reconciliation_records SET status = 'manual', notes = ?, processed_at = NOW() WHERE id = ?`,
      [body.notes ?? 'Manually resolved', id],
    );

    await logAudit({ action: AuditAction.ReconciliationManual, resource_id: id, metadata: body });

    return { resolved: true, ...result };
  },

  async overview(userId?: string) {
    const stats = await reconciliationRepository.getStats(userId);
    const summary: Record<string, number> = {};
    for (const row of stats) summary[row.status] = Number(row.count);
    return {
      matched: summary.matched ?? 0,
      unmatched: summary.unmatched ?? 0,
      manual: summary.manual ?? 0,
      failed: summary.failed ?? 0,
      pending: summary.pending ?? 0,
      auto_match_rate: summary.matched
        ? `${((summary.matched / (summary.matched + (summary.unmatched ?? 0) + 1)) * 100).toFixed(1)}%`
        : '0%',
    };
  },
};
