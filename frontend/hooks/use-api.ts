import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  adminApi,
  analyticsApi,
  banksApi,
  contributorsApi,
  dashboardApi,
  goalsApi,
  notificationsApi,
  organizationsApi,
  payoutAccountsApi,
  publicApi,
  reconciliationApi,
  reportsApi,
  transactionsApi,
  virtualAccountsApi,
  withdrawalsApi,
} from '@/lib/api/services';
import { ApiError } from '@/lib/api/client';

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  goals: (params?: object) => ['goals', params] as const,
  goal: (id: string) => ['goal', id] as const,
  goalVa: (id: string) => ['goal-va', id] as const,
  goalTxns: (id: string) => ['goal-txns', id] as const,
  goalContributors: (id: string) => ['goal-contributors', id] as const,
  goalContributorsSummary: (id: string) => ['goal-contributors-summary', id] as const,
  goalInvitations: (id: string) => ['goal-invitations', id] as const,
  goalShare: (id: string) => ['goal-share', id] as const,
  organizations: ['organizations'] as const,
  virtualAccounts: ['virtual-accounts'] as const,
  payoutAccounts: ['payout-accounts'] as const,
  withdrawals: (params?: object) => ['withdrawals', params] as const,
  goalWithdrawals: (id: string) => ['goal-withdrawals', id] as const,
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
  adminOrganizations: (params?: object) => ['admin-organizations', params] as const,
  adminOrganization: (id: string) => ['admin-organization', id] as const,
  adminGoals: (params?: object) => ['admin-goals', params] as const,
  adminTransactions: (params?: object) => ['admin-transactions', params] as const,
  adminWebhooks: (params?: object) => ['admin-webhooks', params] as const,
  adminReconciliation: (params?: object) => ['admin-reconciliation', params] as const,
  adminUsers: (params?: object) => ['admin-users', params] as const,
  publicGoal: (slug: string) => ['public-goal', slug] as const,
  publicVa: (slug: string) => ['public-va', slug] as const,
  banks: ['banks'] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => (await dashboardApi.overview()).data,
    refetchInterval: 30_000,
  });
}

export function useGoals(params?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: queryKeys.goals(params),
    queryFn: async () => {
      const res = await goalsApi.list(params);
      return { data: res.data, meta: res.meta };
    },
    refetchInterval: 20_000,
  });
}

export function useGoal(id: string) {
  return useQuery({
    queryKey: queryKeys.goal(id),
    queryFn: async () => (await goalsApi.get(id)).data,
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && status !== 'completed' ? 10_000 : false;
    },
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

export function useGoalTransactions(id: string, params?: { status?: string; from?: string; to?: string; q?: string; page?: number }) {
  return useQuery({
    queryKey: [...queryKeys.goalTxns(id), params] as const,
    queryFn: async () => (await goalsApi.transactions(id, params)).data,
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

export function useGoalContributorsSummary(id: string) {
  return useQuery({
    queryKey: queryKeys.goalContributorsSummary(id),
    queryFn: async () => (await goalsApi.contributorsSummary(id)).data,
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

export function useExportCampaign() {
  return useMutation({
    mutationFn: ({ id, format }: { id: string; format: 'csv' | 'pdf' }) => goalsApi.exportReport(id, format),
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

export function useOrganization(id: string) {
  return useQuery({
    queryKey: ['organization', id],
    queryFn: async () => (await organizationsApi.get(id)).data,
    enabled: !!id,
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

export function usePayoutAccounts() {
  return useQuery({
    queryKey: queryKeys.payoutAccounts,
    queryFn: async () => (await payoutAccountsApi.list()).data,
  });
}

export function useBanks() {
  return useQuery({
    queryKey: queryKeys.banks,
    queryFn: async () => (await banksApi.supported()).data,
  });
}

export function useVerifyPayoutAccount() {
  return useMutation({
    mutationFn: payoutAccountsApi.verify,
  });
}

export function useCreatePayoutAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payoutAccountsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.payoutAccounts }),
  });
}

export function useSetDefaultPayoutAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payoutAccountsApi.setDefault,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.payoutAccounts }),
  });
}

export function useDeletePayoutAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payoutAccountsApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.payoutAccounts }),
  });
}

export function useWithdrawals(params?: { goal_id?: string; status?: string; page?: number }) {
  return useQuery({
    queryKey: queryKeys.withdrawals(params),
    queryFn: async () => {
      const res = await withdrawalsApi.list(params);
      return { data: res.data, meta: res.meta };
    },
  });
}

export function useGoalWithdrawals(id: string) {
  return useQuery({
    queryKey: queryKeys.goalWithdrawals(id),
    queryFn: async () => (await goalsApi.withdrawals(id)).data,
    enabled: !!id,
  });
}

export function useCreateWithdrawal(goalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { payout_account_id?: string; amount?: number; narration?: string }) => goalsApi.withdraw(goalId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goal(goalId) });
      qc.invalidateQueries({ queryKey: queryKeys.goalWithdrawals(goalId) });
      qc.invalidateQueries({ queryKey: ['withdrawals'] });
    },
  });
}

export function useTransactions(params?: { goal_id?: string; status?: string; from?: string; to?: string; page?: number; q?: string }) {
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

export function useAdminOrganizations(params?: { q?: string; type?: string; page?: number }) {
  return useQuery({
    queryKey: queryKeys.adminOrganizations(params),
    queryFn: async () => (await adminApi.organizations(params)).data,
  });
}

export function useAdminOrganization(id: string) {
  return useQuery({
    queryKey: queryKeys.adminOrganization(id),
    queryFn: async () => (await adminApi.organization(id)).data,
    enabled: !!id,
  });
}

export function useAdminGoals(params?: { q?: string; status?: string; organization_id?: string; page?: number }) {
  return useQuery({
    queryKey: queryKeys.adminGoals(params),
    queryFn: async () => (await adminApi.goals(params)).data,
  });
}

export function useAdminTransactions(params?: { page?: number }) {
  return useQuery({
    queryKey: queryKeys.adminTransactions(params),
    queryFn: async () => (await adminApi.transactions(params)).data,
  });
}

export function useAdminWebhooks(params?: { processed?: boolean; event_type?: string; page?: number }) {
  return useQuery({
    queryKey: queryKeys.adminWebhooks(params),
    queryFn: async () => (await adminApi.webhookEvents(params)).data,
  });
}

export function useAdminReconciliation(params?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: queryKeys.adminReconciliation(params),
    queryFn: async () => (await adminApi.reconciliation(params)).data,
  });
}

export function useAdminUsers(params?: { page?: number }) {
  return useQuery({
    queryKey: queryKeys.adminUsers(params),
    queryFn: async () => (await adminApi.users(params)).data,
  });
}

export function useUpdateAdminGoalStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => adminApi.updateGoalStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-goals'] });
      qc.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}

export function useAdminExportGoal() {
  return useMutation({
    mutationFn: adminApi.exportGoalCsv,
  });
}

export function usePublicGoal(slug: string) {
  return useQuery({
    queryKey: queryKeys.publicGoal(slug),
    queryFn: async () => (await publicApi.getGoal(slug)).data,
    enabled: !!slug,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && status !== 'completed' ? 10_000 : false;
    },
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
    mutationFn: (body: { recipients: { email: string; name?: string; phone_number?: string; group_label?: string; expected_amount?: number }[]; channel: 'email'; message?: string }) =>
      goalsApi.sendInvitations(goalId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goalInvitations(goalId) });
      qc.invalidateQueries({ queryKey: queryKeys.goalContributors(goalId) });
      qc.invalidateQueries({ queryKey: queryKeys.goalContributorsSummary(goalId) });
    },
  });
}

export function useSendOutstandingReminders(goalId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => goalsApi.sendReminders(goalId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.goalInvitations(goalId) });
    },
  });
}

export function useGoalInvitations(goalId: string) {
  return useQuery({
    queryKey: queryKeys.goalInvitations(goalId),
    queryFn: async () => (await goalsApi.listInvitations(goalId)).data,
    enabled: !!goalId,
  });
}
