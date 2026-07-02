import { v4 as uuid } from 'uuid';
import { Errors } from '../../lib/errors';
import { logAudit } from '../../lib/audit';
import { AuditAction, ReconciliationStatus, TransactionStatus } from '../../shared/types/enums';
import { parsePagination, buildMeta } from '../../shared/utils/pagination';
import { reconciliationRepository } from './reconciliation.repository';
import { virtualAccountsRepository } from '../virtual-accounts/virtual-accounts.repository';
import { transactionsRepository } from '../transactions/transactions.repository';
import { goalsRepository } from '../goals/goals.repository';
import { notificationsRepository } from '../notifications/notifications.repository';
import { webhooksRepository } from '../webhooks/webhooks.repository';
import { sendEmail, sendPaymentReceivedEmail, campaignCompletedEmail } from '../../lib/email';
import { env } from '../../config/env';
import { execute } from '../../config/database';
import { getPaymentProvider } from '../../providers/payment';
import { broadcastRealtime } from '../../lib/realtime';
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
    const txnStatus = payment.status === 'verified' ? TransactionStatus.Successful : TransactionStatus.Pending;

    const txnId = `txn_${uuid().replace(/-/g, '').slice(0, 12)}`;
    await transactionsRepository.insert({
      id: txnId,
      goal_id: goalId,
      virtual_account_id: va.id as string,
      contributor_name: payment.payer_name,
      amount: Number(payment.amount),
      reference: payment.reference,
      provider_reference: payment.provider_reference,
      status: txnStatus,
      paid_at: payment.paid_at ?? new Date().toISOString(),
      organization_id: orgId,
      payment_id: payment.id,
    });

    if (txnStatus === TransactionStatus.Successful) {
      await goalsRepository.incrementAmount(goalId, Number(payment.amount));
    }

    const rec = await reconciliationRepository.insert({
      id: `rec_${uuid().replace(/-/g, '').slice(0, 12)}`,
      payment_id: payment.id,
      webhook_event_id: payment.webhook_event_id,
      organization_id: orgId ?? undefined,
      goal_id: goalId,
      virtual_account_id: va.id as string,
      transaction_id: txnId,
      status: ReconciliationStatus.Matched,
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
        amount: Number(payment.amount),
        payer_name: payment.payer_name,
        status: txnStatus,
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
        title: 'Payment received',
        body: `${payment.payer_name} contributed ₦${Number(payment.amount).toLocaleString()} to ${goal.title}`,
      });

      if (goal.email) {
        await sendPaymentReceivedEmail(goal.email as string, {
          payerName: payment.payer_name,
          amount: Number(payment.amount),
          goalTitle: goal.title as string,
        }).catch(() => undefined);
      }
    }

    await logAudit({
      action: AuditAction.ReconciliationMatched,
      resource_type: 'reconciliation',
      resource_id: rec.id as string,
      metadata: { goal_id: goalId, transaction_id: txnId, amount: payment.amount },
    });

    return { matched: true, reconciliation: rec, transaction_id: txnId, completed: Boolean(completion?.completed) };
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
      },
    });

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
