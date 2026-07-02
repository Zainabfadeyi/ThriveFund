import { Errors } from '../../lib/errors';
import { goalsRepository } from '../goals/goals.repository';
import { virtualAccountsRepository } from '../virtual-accounts/virtual-accounts.repository';
import { transactionsRepository } from '../transactions/transactions.repository';

export const publicService = {
  async getGoalBySlug(slug: string) {
    const goal = await goalsRepository.findBySlug(slug);
    if (!goal) throw Errors.notFound('Goal');
    return goal;
  },

  async getVirtualAccountBySlug(slug: string) {
    const va = await virtualAccountsRepository.findBySlug(slug);
    if (!va) throw Errors.notFound('Virtual account');
    return va;
  },

  async getRecentPaymentsBySlug(slug: string) {
    const goal = await goalsRepository.findBySlug(slug);
    if (!goal) throw Errors.notFound('Goal');
    const rows = await transactionsRepository.findRecentByGoal(goal.id as string, 8);
    return rows.map((row) => ({
      id: row.id,
      contributor_name: maskName(row.contributor_name as string),
      amount: Number(row.amount),
      status: row.status,
      paid_at: row.paid_at,
    }));
  },
};

function maskName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Anonymous';
  if (parts.length === 1) return `${parts[0]!.charAt(0).toUpperCase()}***`;
  return `${parts[0]} ${parts[parts.length - 1]!.charAt(0).toUpperCase()}.`;
}
