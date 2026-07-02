import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/use-api';
import type { Goal } from '@/lib/api/types';

type BalancePayload = {
  current_amount?: number;
  target_amount?: number;
  status?: string;
  slug?: string | null;
};

function progressPercent(current: number, target: number) {
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

function patchGoal(goal: Goal, payload: BalancePayload): Goal {
  const currentAmount = Number(payload.current_amount ?? goal.current_amount);
  const targetAmount = Number(payload.target_amount ?? goal.target_amount);
  return {
    ...goal,
    current_amount: currentAmount,
    target_amount: targetAmount,
    status: payload.status ?? goal.status,
    progress_percent: progressPercent(currentAmount, targetAmount),
    remaining_amount: Math.max(0, targetAmount - currentAmount),
  };
}

export function patchGoalBalanceInCache(
  queryClient: QueryClient,
  goalId: string,
  payload: BalancePayload,
) {
  queryClient.setQueryData<Goal | undefined>(queryKeys.goal(goalId), (old) => {
    if (!old) return old;
    return patchGoal(old, payload);
  });

  queryClient.setQueriesData<{ data: Goal[]; meta?: unknown }>({ queryKey: ['goals'] }, (old) => {
    if (!old?.data?.length) return old;
    return {
      ...old,
      data: old.data.map((goal) => (goal.id === goalId ? patchGoal(goal, payload) : goal)),
    };
  });

  if (payload.slug) {
    queryClient.setQueryData<Goal | undefined>(queryKeys.publicGoal(payload.slug), (old) => {
      if (!old) return old;
      return patchGoal(old, payload);
    });
  }
}

export function invalidateCampaignQueries(queryClient: QueryClient, goalId?: string) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard, refetchType: 'active' });
  void queryClient.invalidateQueries({ queryKey: ['goals'], refetchType: 'active' });
  void queryClient.invalidateQueries({ queryKey: ['public-goal'], refetchType: 'active' });
  void queryClient.invalidateQueries({ queryKey: queryKeys.virtualAccounts, refetchType: 'active' });
  void queryClient.invalidateQueries({ queryKey: queryKeys.notificationsUnread, refetchType: 'active' });
  void queryClient.invalidateQueries({ queryKey: ['transactions'], refetchType: 'active' });
  void queryClient.invalidateQueries({ queryKey: queryKeys.reconciliationOverview, refetchType: 'active' });
  void queryClient.invalidateQueries({ queryKey: ['reconciliation'], refetchType: 'active' });
  void queryClient.invalidateQueries({ queryKey: queryKeys.analyticsGoalPerformance, refetchType: 'active' });

  if (!goalId) return;

  void queryClient.invalidateQueries({ queryKey: queryKeys.goal(goalId), refetchType: 'active' });
  void queryClient.invalidateQueries({ queryKey: queryKeys.goalVa(goalId), refetchType: 'active' });
  void queryClient.invalidateQueries({ queryKey: queryKeys.goalTxns(goalId), refetchType: 'active' });
  void queryClient.invalidateQueries({ queryKey: queryKeys.goalContributors(goalId), refetchType: 'active' });
  void queryClient.invalidateQueries({ queryKey: queryKeys.goalContributorsSummary(goalId), refetchType: 'active' });
}
