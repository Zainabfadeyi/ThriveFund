import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  adminApi,
  analyticsApi,
  contributorsApi,
  dashboardApi,
  goalsApi,
  notificationsApi,
  organizationsApi,
  publicApi,
  reconciliationApi,
  reportsApi,
  transactionsApi,
  virtualAccountsApi,
} from '@/lib/api/services';
import { ApiError } from '@/lib/api/client';

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  goals: (params?: object) => ['goals', params] as const,
  goal: (id: string) => ['goal', id] as const,
  goalVa: (id: string) => ['goal-va', id] as const,
  goalTxns: (id: string) => ['goal-txns', id] as const,
  goalContributors: (id: string) => ['goal-contributors', id] as const,
  goalInvitations: (id: string) => ['goal-invitations', id] as const,
  goalShare: (id: string) => ['goal-share', id] as const,
  organizations: ['organizations'] as const,
  virtualAccounts: ['virtual-accounts'] as const,
  transactions: (params?: object) => ['transactions', params] as const,
  contributors: ['contributors'] as const,
  reconciliationOverview: ['reconciliation-overview'] as const,
  reconciliation: (params?: object) => ['reconciliation', params] as const,
  reportsSummary: ['reports-summary'] as const,
  reportsReconciliation: ['reports-reconciliation'] as const,
  analyticsMonthly: ['analytics-monthly'] as const,
  analyticsCategories: ['analytics-categories'] as const,
  analyticsTopContributors: ['analytics-top'] as const,
  analyticsGoalPerformance: ['analytics-goals'] as const,
  notifications: (params?: object) => ['notifications', params] as const,
  notificationsUnread: ['notifications-unread'] as const,
  adminOverview: ['admin-overview'] as const,
  publicGoal: (slug: string) => ['public-goal', slug] as const,
  publicVa: (slug: string) => ['public-va', slug] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => (await dashboardApi.overview()).data,
  });
}

export function useGoals(params?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: queryKeys.goals(params),
    queryFn: async () => {
      const res = await goalsApi.list(params);
      return { data: res.data, meta: res.meta };
    },
  });
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: queryKeys.goal(id),
    queryFn: async () => (await goalsApi.get(id)).data,
    enabled: !!id,
  });
}

export function useGoalVirtualAccount(id: string) {
  return useQuery({
    queryKey: queryKeys.goalVa(id),
    queryFn: async () => {
      try {
        return (await goalsApi.getVirtualAccount(id)).data;
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    enabled: !!id,
  });
}

export function useCreateVirtualAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (goalId: string) => goalsApi.createVirtualAccount(goalId),
    onSuccess: (_, goalId) => {
      qc.invalidateQueries({ queryKey: queryKeys.goalVa(goalId) });
      qc.invalidateQueries({ queryKey: queryKeys.virtualAccounts });
    },
  });
}

export function useGoalTransactions(id: string) {
  return useQuery({
    queryKey: queryKeys.goalTxns(id),
    queryFn: async () => (await goalsApi.transactions(id)).data,
    enabled: !!id,
  });
}

export function useGoalContributors(id: string) {
  return useQuery({
    queryKey: queryKeys.goalContributors(id),
    queryFn: async () => (await goalsApi.contributors(id)).data,
    enabled: !!id,
  });
}

export function useGoalShare(id: string) {
  return useQuery({
    queryKey: queryKeys.goalShare(id),
    queryFn: async () => (await goalsApi.share(id)).data,
    enabled: !!id,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: goalsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useOrganizations() {
  return useQuery({
    queryKey: queryKeys.organizations,
    queryFn: async () => (await organizationsApi.list()).data,
  });
}

export function useCreateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: organizationsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.organizations }),
  });
}

export function useVirtualAccounts() {
  return useQuery({
    queryKey: queryKeys.virtualAccounts,
    queryFn: async () => (await virtualAccountsApi.list()).data,
  });
}

export function useTransactions(params?: { status?: string; page?: number; q?: string }) {
  return useQuery({
    queryKey: queryKeys.transactions(params),
    queryFn: async () => {
      const res = await transactionsApi.list(params);
      return { data: res.data, meta: res.meta };
    },
  });
}

export function useContributors() {
  return useQuery({
    queryKey: queryKeys.contributors,
    queryFn: async () => (await contributorsApi.listAll()).data,
  });
}

export function useReconciliationOverview() {
  return useQuery({
    queryKey: queryKeys.reconciliationOverview,
    queryFn: async () => (await reconciliationApi.overview()).data,
  });
}

export function useReconciliation(params?: { status?: string }) {
  return useQuery({
    queryKey: queryKeys.reconciliation(params),
    queryFn: async () => {
      const res = await reconciliationApi.list(params);
      return { data: res.data, meta: res.meta };
    },
  });
}

export function useFinancialSummary() {
  return useQuery({
    queryKey: queryKeys.reportsSummary,
    queryFn: async () => (await reportsApi.financialSummary()).data,
  });
}

export function useReportsReconciliation() {
  return useQuery({
    queryKey: queryKeys.reportsReconciliation,
    queryFn: async () => (await reportsApi.reconciliation()).data,
  });
}

export function useAnalyticsMonthly() {
  return useQuery({
    queryKey: queryKeys.analyticsMonthly,
    queryFn: async () => (await analyticsApi.monthlyContributions()).data,
  });
}

export function useAnalyticsCategories() {
  return useQuery({
    queryKey: queryKeys.analyticsCategories,
    queryFn: async () => (await analyticsApi.categoryBreakdown()).data,
  });
}

export function useAnalyticsTopContributors() {
  return useQuery({
    queryKey: queryKeys.analyticsTopContributors,
    queryFn: async () => (await analyticsApi.topContributors()).data,
  });
}

export function useAnalyticsGoalPerformance() {
  return useQuery({
    queryKey: queryKeys.analyticsGoalPerformance,
    queryFn: async () => (await analyticsApi.goalPerformance()).data,
  });
}

export function useNotifications(params?: { unread_only?: boolean }) {
  return useQuery({
    queryKey: queryKeys.notifications(params),
    queryFn: async () => (await notificationsApi.list(params)).data,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.notificationsUnread,
    queryFn: async () => (await notificationsApi.unreadCount()).data,
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: queryKeys.notificationsUnread });
    },
  });
}

export function useAdminOverview() {
  return useQuery({
    queryKey: queryKeys.adminOverview,
    queryFn: async () => (await adminApi.overview()).data,
    retry: false,
  });
}

export function usePublicGoal(slug: string) {
  return useQuery({
    queryKey: queryKeys.publicGoal(slug),
    queryFn: async () => (await publicApi.getGoal(slug)).data,
    enabled: !!slug,
  });
}

export function usePublicVirtualAccount(slug: string) {
  return useQuery({
    queryKey: queryKeys.publicVa(slug),
    queryFn: async () => {
      try {
        return (await publicApi.getVirtualAccount(slug)).data;
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    enabled: !!slug,
  });
}

export function useSendInvitations(goalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { recipients: { email: string; name?: string }[]; channel: string; message?: string }) =>
      goalsApi.sendInvitations(goalId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.goalInvitations(goalId) }),
  });
}

export function useGoalInvitations(goalId: string) {
  return useQuery({
    queryKey: queryKeys.goalInvitations(goalId),
    queryFn: async () => (await goalsApi.listInvitations(goalId)).data,
    enabled: !!goalId,
  });
}
