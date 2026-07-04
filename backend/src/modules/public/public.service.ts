import { Errors } from '../../lib/errors';
import { goalsRepository } from '../goals/goals.repository';
import { virtualAccountsRepository } from '../virtual-accounts/virtual-accounts.repository';
import { transactionsRepository } from '../transactions/transactions.repository';

export const publicService = {
  async getGoalBySlug(slug: string) {
    const goal = await goalsRepository.findBySlug(slug);
    if (!goal) throw Errors.notFound('Goal');
    const [recent_payments, virtual_account] = await Promise.all([
      this.getAnonymousRecentPayments(goal.id as string),
      virtualAccountsRepository.findBySlug(slug),
    ]);
    return { ...goal, recent_payments, virtual_account: virtual_account ?? null };
  },

  async getVirtualAccountBySlug(slug: string) {
    const va = await virtualAccountsRepository.findBySlug(slug);
    if (!va) throw Errors.notFound('Virtual account');
    return va;
  },

  async getRecentPaymentsBySlug(slug: string) {
    const goal = await goalsRepository.findBySlug(slug);
    if (!goal) throw Errors.notFound('Goal');
    return this.getAnonymousRecentPayments(goal.id as string);
  },

  async getAnonymousRecentPayments(goalId: string) {
    const rows = await transactionsRepository.findRecentByGoal(goalId, 8, { successfulOnly: true });
    return rows.map((row) => ({
      id: row.id,
      amount: Number(row.amount),
      status: row.status,
      paid_at: row.paid_at,
    }));
  },
};
