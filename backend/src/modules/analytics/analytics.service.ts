import { analyticsRepository } from './analytics.repository';
import { goalsRepository } from '../goals/goals.repository';
import { payoutAccountsRepository } from '../payout-accounts/payout-accounts.repository';
import { reconciliationService } from '../reconciliation/reconciliation.service';

export const analyticsService = {
  async overview(userId: string) {
    const [totals, recentTransactions, recentGoals] = await Promise.all([
      analyticsRepository.getOverview(userId),
      analyticsRepository.getRecentTransactions(userId),
      analyticsRepository.getRecentGoals(userId),
    ]);
    return { ...totals, recent_transactions: recentTransactions, recent_goals: recentGoals };
  },

  async monthlyContributions(userId: string, months = 6) {
    return analyticsRepository.getMonthlyContributions(userId, months);
  },

  async categoryBreakdown(userId: string) {
    return analyticsRepository.getCategoryBreakdown(userId);
  },

  async topContributors(userId: string, limit = 10) {
    return analyticsRepository.getTopContributors(userId, limit);
  },

  async goalPerformance(userId: string) {
    return analyticsRepository.getGoalPerformance(userId);
  },

  async bootstrap(userId: string) {
    const [overview, reconciliation, monthly, goals, payoutAccounts] = await Promise.all([
      this.overview(userId),
      reconciliationService.overview(userId),
      this.monthlyContributions(userId, 6),
      goalsRepository.findAllByUser(userId, { page: 1, perPage: 20 }),
      payoutAccountsRepository.findByUser(userId),
    ]);

    return {
      overview,
      reconciliation,
      monthly_contributions: monthly,
      goals: goals.rows,
      goals_meta: { page: 1, per_page: 20, total: goals.total },
      payout_accounts: payoutAccounts,
    };
  },
};
