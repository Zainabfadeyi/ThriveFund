import { env } from '../../config/env';
import { Errors } from '../../lib/errors';
import { logAudit } from '../../lib/audit';
import { AuditAction } from '../../shared/types/enums';
import { getPaymentProvider } from '../../providers/payment';
import { goalsRepository } from './goals.repository';
import { virtualAccountsRepository } from '../virtual-accounts/virtual-accounts.repository';
import { notificationsRepository } from '../notifications/notifications.repository';
import { broadcastRealtime } from '../../lib/realtime';
import { v4 as uuid } from 'uuid';

export function getCollectionGraceDays(): number {
  const raw = process.env.COLLECTION_GRACE_DAYS ?? String(env.COLLECTION_GRACE_DAYS);
  return Math.max(0, Number(raw));
}

async function expireVirtualAccountRecord(virtualAccount: Record<string, unknown>) {
  const provider = getPaymentProvider();
  const expireIdentifier =
    (virtualAccount.provider_reference as string) || (virtualAccount.account_number as string);
  const expiry = await provider.expireVirtualAccount(expireIdentifier);
  const updatedVa = await virtualAccountsRepository.markInactive(virtualAccount.id as string);
  return { expiry, virtual_account: updatedVa };
}

export const collectionLifecycleService = {
  getCollectionGraceDays,

  async closeCollectionEarly(userId: string, goalId: string) {
    const goal = await goalsRepository.findByIdRaw(goalId, userId);
    if (!goal) throw Errors.notFound('Goal');

    const status = goal.status as string;
    if (status === 'completed') throw Errors.conflict('Collection is already closed');
    if (status !== 'active') throw Errors.conflict('Only active collections can be closed early');

    const va = await virtualAccountsRepository.findActiveByGoalAndUser(goalId, userId);
    let expiryResult: Awaited<ReturnType<typeof expireVirtualAccountRecord>> | null = null;

    if (va) {
      expiryResult = await expireVirtualAccountRecord(va as Record<string, unknown>);
    }

    const updatedGoal = await goalsRepository.markClosedEarly(goalId, userId);
    if (!updatedGoal) throw Errors.notFound('Goal');

    await notificationsRepository.insert({
      id: `ntf_${uuid().replace(/-/g, '').slice(0, 12)}`,
      user_id: userId,
      type: 'collection_closed_early',
      title: 'Collection closed early',
      body: `${goal.title as string} is no longer accepting payments. You can withdraw collected funds from your dashboard.`,
    });

    await logAudit({
      action: AuditAction.GoalCollectionClosedEarly,
      actor_id: userId,
      organization_id: goal.organization_id as string | null,
      resource_type: 'goal',
      resource_id: goalId,
      metadata: {
        virtual_account_id: va?.id ?? null,
        expired_virtual_account: expiryResult?.expiry.expired ?? false,
        current_amount: Number(goal.current_amount),
        target_amount: Number(goal.target_amount),
      },
    });

    broadcastRealtime({
      type: 'campaign.completed',
      user_id: userId,
      organization_id: goal.organization_id as string | null,
      goal_id: goalId,
      data: {
        current_amount: Number(updatedGoal.current_amount),
        target_amount: Number(goal.target_amount),
        virtual_account_id: va?.id ?? null,
        slug: goal.slug ?? null,
        closed_early: true,
      },
    });

    const { raw: _expiryRaw, ...expiryResponse } = expiryResult?.expiry ?? { expired: false, providerReference: null, raw: {} };

    return {
      goal: updatedGoal,
      virtual_account: expiryResult?.virtual_account ?? va ?? null,
      expiry: expiryResult ? expiryResponse : null,
    };
  },

  async expireCollectionNow(userId: string, goalId: string) {
    const goal = await goalsRepository.findByIdRaw(goalId, userId);
    if (!goal) throw Errors.notFound('Goal');

    const va = await virtualAccountsRepository.findActiveByGoalAndUser(goalId, userId);
    if (!va) throw Errors.conflict('No active collection account to expire');

    const expiryResult = await expireVirtualAccountRecord(va as Record<string, unknown>);
    await goalsRepository.clearCollectionExpiry(goalId);

    await notificationsRepository.insert({
      id: `ntf_${uuid().replace(/-/g, '').slice(0, 12)}`,
      user_id: userId,
      type: 'collection_account_expired',
      title: 'Collection account expired',
      body: `The payment account for ${goal.title as string} has been expired. Contributors should no longer transfer to it.`,
    });

    await logAudit({
      action: AuditAction.GoalCollectionExpired,
      actor_id: userId,
      organization_id: goal.organization_id as string | null,
      resource_type: 'goal',
      resource_id: goalId,
      metadata: {
        virtual_account_id: va.id,
        expired_virtual_account: expiryResult.expiry.expired,
        manual: true,
      },
    });

    broadcastRealtime({
      type: 'virtual_account.expired',
      user_id: userId,
      organization_id: goal.organization_id as string | null,
      goal_id: goalId,
      data: {
        virtual_account_id: va.id,
        slug: goal.slug ?? null,
      },
    });

    const { raw: _expiryRaw, ...expiryResponse } = expiryResult.expiry;

    return {
      goal,
      virtual_account: expiryResult.virtual_account,
      expiry: expiryResponse,
    };
  },

  /** Called when target is reached — completes campaign and optionally schedules grace before VA expiry. */
  async completeAtTarget(goalId: string, virtualAccount: Record<string, unknown>, goal: Record<string, unknown>) {
    const graceDays = getCollectionGraceDays();
    const updatedGoal = await goalsRepository.tryClaimTargetCompletion(goalId, graceDays > 0 ? graceDays : null);
    if (!updatedGoal) {
      return { updatedGoal: null, expiryResult: null, graceDays, claimed: false };
    }

    let expiryResult: Awaited<ReturnType<typeof expireVirtualAccountRecord>> | null = null;
    if (graceDays === 0) {
      expiryResult = await expireVirtualAccountRecord(virtualAccount);
      await goalsRepository.clearCollectionExpiry(goalId);
    }

    return { updatedGoal, expiryResult, graceDays, claimed: true };
  },

  async processDueExpirations() {
    const due = await goalsRepository.findDueForCollectionExpiry();
    const results: Array<{ goal_id: string; expired: boolean; error?: string }> = [];

    for (const row of due) {
      try {
        const expiryResult = await expireVirtualAccountRecord(row as Record<string, unknown>);
        await goalsRepository.clearCollectionExpiry(row.goal_id as string);

        await logAudit({
          action: AuditAction.GoalCollectionExpired,
          actor_id: row.user_id as string,
          organization_id: row.organization_id as string | null,
          resource_type: 'goal',
          resource_id: row.goal_id as string,
          metadata: {
            virtual_account_id: row.va_id,
            expired_virtual_account: expiryResult.expiry.expired,
            manual: false,
            grace_expired: true,
          },
        });

        broadcastRealtime({
          type: 'virtual_account.expired',
          user_id: row.user_id as string,
          organization_id: row.organization_id as string | null,
          goal_id: row.goal_id as string,
          data: {
            virtual_account_id: row.va_id,
            slug: row.slug ?? null,
            grace_expired: true,
          },
        });

        results.push({ goal_id: row.goal_id as string, expired: expiryResult.expiry.expired });
      } catch (err) {
        results.push({
          goal_id: row.goal_id as string,
          expired: false,
          error: err instanceof Error ? err.message : 'unknown',
        });
      }
    }

    return { processed: results.length, results };
  },
};
