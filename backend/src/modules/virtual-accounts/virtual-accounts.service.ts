import { getPaymentProvider } from '../../providers/payment';
import { logAudit } from '../../lib/audit';
import { AuditAction } from '../../shared/types/enums';
import { v4 as uuid } from 'uuid';
import { Errors } from '../../lib/errors';
import { virtualAccountsRepository } from './virtual-accounts.repository';
import { goalsRepository } from '../goals/goals.repository';

export const virtualAccountsService = {
  async createForGoal(userId: string, goalId: string, body: { account_name_suffix?: string; preferred_bank?: string }) {
    const goal = await goalsRepository.findByIdRaw(goalId, userId);
    if (!goal) throw Errors.notFound('Goal');

    const existing = await virtualAccountsRepository.findActiveByGoalId(goalId);
    if (existing) throw Errors.conflict('A virtual account already exists for this goal');

    const provider = getPaymentProvider();
    const accountName = `ThriveFund / ${body.account_name_suffix ?? (goal.title as string)}`;
    const result = await provider.createVirtualAccount({
      accountName,
      reference: goalId,
      preferredBank: body.preferred_bank,
    });

    const va = await virtualAccountsRepository.insert({
      id: `va_${uuid().replace(/-/g, '').slice(0, 12)}`,
      goal_id: goalId,
      provider: result.provider,
      provider_account_id: result.providerAccountId,
      account_number: result.accountNumber,
      account_name: result.accountName,
      bank_name: result.bankName,
      provider_reference: result.providerReference,
    });

    await logAudit({
      action: AuditAction.VirtualAccountCreated,
      actor_id: userId,
      resource_type: 'virtual_account',
      resource_id: va.id as string,
      metadata: { goal_id: goalId, provider: result.provider },
    });

    return va;
  },

  async getForGoal(userId: string, goalId: string) {
    const va = await virtualAccountsRepository.findByGoalAndUser(goalId, userId);
    if (!va) throw Errors.notFound('Virtual account');
    return va;
  },

  async listAll(userId: string) {
    return virtualAccountsRepository.findAllByUser(userId);
  },

  async getById(userId: string, vaId: string) {
    const va = await virtualAccountsRepository.findByIdAndUser(vaId, userId);
    if (!va) throw Errors.notFound('Virtual account');
    return va;
  },
};
