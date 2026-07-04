import { apiRequest } from './client';
import type {
  AdminOverview,
  AdminUser,
  AdminWithdrawal,
  AuthPayload,
  AuthTokens,
  Bank,
  CategoryBreakdown,
  Contributor,
  DashboardOverview,
  DashboardBootstrap,
  FinancialSummary,
  Goal,
  GoalOverview,
  GoalPerformance,
  Invitation,
  MonthlyContribution,
  Notification,
  Organization,
  PayoutAccount,
  PayoutFeeInfo,
  PublicGoal,
  PublicPaymentActivity,
  ReconciliationOverview,
  ReconciliationRecord,
  ShareLink,
  TopContributor,
  Transaction,
  User,
  VirtualAccount,
  ContributorSummary,
  Withdrawal,
  WithdrawalAvailability,
} from './types';

export const authApi = {
  register: (body: {
    full_name: string;
    email: string;
    password: string;
    phone_number?: string;
    organization_name: string;
    organization_type: string;
    organization_description?: string;
    organization_email?: string;
    organization_phone?: string;
    organization_address?: string;
  }) =>
    apiRequest<AuthPayload>('/auth/register', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),
  login: (body: { email: string; password: string }) =>
    apiRequest<{ user: User; tokens: AuthTokens }>('/auth/login', { method: 'POST', body: JSON.stringify(body), skipAuth: true }),
  logout: (refresh_token: string) =>
    apiRequest<void>('/auth/logout', { method: 'POST', body: JSON.stringify({ refresh_token }) }),
  verifyEmail: (token: string) =>
    apiRequest<{ verified: boolean }>('/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }), skipAuth: true }),
  resendVerification: (email: string) =>
    apiRequest<{ message: string }>('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }), skipAuth: true }),
  me: () => apiRequest<User>('/auth/me'),
};

export const usersApi = {
  getProfile: () => apiRequest<User>('/users/me'),
  updateProfile: (body: Partial<{ full_name: string; phone_number: string }>) =>
    apiRequest<User>('/users/me', { method: 'PATCH', body: JSON.stringify(body) }),
  changePassword: (body: { current_password: string; new_password: string }) =>
    apiRequest<{ message: string }>('/users/me/password', { method: 'PATCH', body: JSON.stringify(body) }),
};

export const organizationsApi = {
  list: (params?: { page?: number; per_page?: number }) =>
    apiRequest<Organization[]>('/organizations', { params }),
  get: (id: string) => apiRequest<Organization>(`/organizations/${id}`),
  create: (body: { name: string; type: string; description?: string; email?: string; phone?: string; address?: string }) =>
    apiRequest<Organization>('/organizations', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Record<string, unknown>) =>
    apiRequest<Organization>(`/organizations/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
};

export const goalsApi = {
  list: (params?: { status?: string; category?: string; q?: string; page?: number; per_page?: number }) =>
    apiRequest<Goal[]>('/goals', { params }),
  get: (id: string) => apiRequest<Goal>(`/goals/${id}`),
  overview: (id: string) => apiRequest<GoalOverview>(`/goals/${id}/overview`),
  create: (body: { organization_id?: string; title: string; description?: string; target_amount: number; category: string; deadline: string; color?: string }) =>
    apiRequest<Goal>('/goals', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: Record<string, unknown>) =>
    apiRequest<Goal>(`/goals/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id: string) => apiRequest<void>(`/goals/${id}`, { method: 'DELETE' }),
  close: (id: string) => apiRequest<Goal>(`/goals/${id}/close`, { method: 'POST' }),
  expireCollection: (id: string) =>
    apiRequest<{ goal: Goal; virtual_account: VirtualAccount | null; expiry: { expired: boolean } | null }>(
      `/goals/${id}/expire-collection`,
      { method: 'POST' },
    ),
  withdraw: (id: string, body: { payout_account_id?: string; amount?: number; narration?: string }) =>
    apiRequest<{ withdrawal: Withdrawal; transfer: unknown; available_before_withdrawal: number }>(`/goals/${id}/withdraw`, { method: 'POST', body: JSON.stringify(body) }),
  withdrawals: (id: string) => apiRequest<Withdrawal[]>(`/goals/${id}/withdrawals`),
  withdrawalAvailability: (id: string) =>
    apiRequest<WithdrawalAvailability>(`/goals/${id}/withdrawal-availability`),
  share: (id: string) => apiRequest<ShareLink>(`/goals/${id}/share`),
  exportReport: (id: string, format: 'csv' | 'pdf' = 'csv') =>
    apiRequest<string | Blob>(`/goals/${id}/export`, { params: { format } }),
  createVirtualAccount: (id: string, body?: { account_name_suffix?: string; preferred_bank?: string }) =>
    apiRequest<VirtualAccount>(`/goals/${id}/virtual-account`, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  getVirtualAccount: (id: string) => apiRequest<VirtualAccount>(`/goals/${id}/virtual-account`),
  transactions: (id: string, params?: { page?: number; per_page?: number; status?: string; from?: string; to?: string; q?: string }) =>
    apiRequest<Transaction[]>(`/goals/${id}/transactions`, { params }),
  contributors: (id: string) => apiRequest<Contributor[]>(`/goals/${id}/contributors`),
  contributorsSummary: (id: string) => apiRequest<ContributorSummary>(`/goals/${id}/contributors/summary`),
  addContributor: (id: string, body: { name: string; email?: string; phone_number?: string; group_label?: string; expected_amount?: number }) =>
    apiRequest<Contributor>(`/goals/${id}/contributors`, { method: 'POST', body: JSON.stringify(body) }),
  sendInvitations: (id: string, body: { recipients: { email: string; name?: string; phone_number?: string; group_label?: string; expected_amount?: number }[]; channel: 'email'; message?: string }) =>
    apiRequest<Invitation[]>(`/goals/${id}/invitations`, { method: 'POST', body: JSON.stringify(body) }),
  sendReminders: (id: string) =>
    apiRequest<{ sent_count: number; recipients: Array<{ email: string; name: string; outstanding_amount: number }> }>(`/goals/${id}/invitations/reminders`, { method: 'POST' }),
  listInvitations: (id: string) => apiRequest<Invitation[]>(`/goals/${id}/invitations`),
};

export const payoutAccountsApi = {
  list: () => apiRequest<PayoutAccount[]>('/payout-accounts'),
  verify: (body: { account_number: string; bank_code: string }) =>
    apiRequest<{ account_number: string; account_name: string; bank_code: string; bank_name?: string | null; provider: string }>('/payout-accounts/verify', { method: 'POST', body: JSON.stringify(body) }),
  create: (body: { account_number: string; bank_code: string; bank_name?: string; account_name: string; is_default?: boolean }) =>
    apiRequest<PayoutAccount>('/payout-accounts', { method: 'POST', body: JSON.stringify(body) }),
  setDefault: (id: string) => apiRequest<PayoutAccount>(`/payout-accounts/${id}/default`, { method: 'PATCH' }),
  delete: (id: string) => apiRequest<void>(`/payout-accounts/${id}`, { method: 'DELETE' }),
};

export const virtualAccountsApi = {
  list: () => apiRequest<VirtualAccount[]>('/virtual-accounts'),
  get: (id: string) => apiRequest<VirtualAccount>(`/virtual-accounts/${id}`),
};

export const transactionsApi = {
  list: (params?: { goal_id?: string; status?: string; from?: string; to?: string; q?: string; page?: number; per_page?: number }) =>
    apiRequest<Transaction[]>('/transactions', { params }),
  exportCsv: (params?: { goal_id?: string; from?: string; to?: string; status?: string }) =>
    apiRequest<string>('/transactions/export', { params }),
};

export const withdrawalsApi = {
  list: (params?: { goal_id?: string; status?: string; page?: number; per_page?: number }) =>
    apiRequest<Withdrawal[]>('/withdrawals', { params }),
};

export const contributorsApi = {
  listAll: () => apiRequest<Contributor[]>('/contributors'),
};

export const banksApi = {
  supported: () => apiRequest<Bank[]>('/banks/supported'),
};

export const contentApi = {
  payoutInfo: () => apiRequest<PayoutFeeInfo>('/content/payout-info', { skipAuth: true }),
};

export const reconciliationApi = {
  overview: () => apiRequest<ReconciliationOverview>('/reconciliation/overview'),
  list: (params?: { status?: string; page?: number; per_page?: number }) =>
    apiRequest<ReconciliationRecord[]>('/reconciliation', { params }),
  get: (id: string) => apiRequest<ReconciliationRecord>(`/reconciliation/${id}`),
};

export const reportsApi = {
  financialSummary: () => apiRequest<FinancialSummary>('/reports/financial-summary'),
  campaignExport: (goalId: string, format: 'csv' | 'pdf' = 'csv') =>
    apiRequest<string | Blob>(`/reports/campaigns/${goalId}/export`, { params: { format } }),
  transactionsExport: (params?: { goal_id?: string; from?: string; to?: string }) =>
    apiRequest<string>('/reports/transactions/export', { params }),
  reconciliation: (params?: { page?: number; per_page?: number }) =>
    apiRequest<ReconciliationRecord[]>('/reports/reconciliation', { params }),
};

export const dashboardApi = {
  overview: () => apiRequest<DashboardOverview>('/dashboard/overview'),
  bootstrap: () => apiRequest<DashboardBootstrap>('/dashboard/bootstrap'),
};

export const analyticsApi = {
  monthlyContributions: (months = 6) =>
    apiRequest<MonthlyContribution[]>('/analytics/monthly-contributions', { params: { months } }),
  categoryBreakdown: () => apiRequest<CategoryBreakdown[]>('/analytics/category-breakdown'),
  topContributors: (limit = 10) =>
    apiRequest<TopContributor[]>('/analytics/top-contributors', { params: { limit } }),
  goalPerformance: () => apiRequest<GoalPerformance[]>('/analytics/goal-performance'),
};

export const notificationsApi = {
  list: (params?: { unread_only?: boolean; page?: number; per_page?: number }) =>
    apiRequest<Notification[]>('/notifications', { params: { ...params, unread_only: params?.unread_only } }),
  unreadCount: () => apiRequest<{ count: number }>('/notifications/unread-count'),
  markRead: (id: string) => apiRequest<void>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => apiRequest<void>('/notifications/read-all', { method: 'POST' }),
};

export const publicApi = {
  getGoal: (slug: string) => apiRequest<PublicGoal>(`/public/goals/${slug}`, { skipAuth: true }),
  getVirtualAccount: (slug: string) => apiRequest<VirtualAccount>(`/public/goals/${slug}/virtual-account`, { skipAuth: true }),
  getRecentPayments: (slug: string) =>
    apiRequest<PublicPaymentActivity[]>(`/public/goals/${slug}/payments`, { skipAuth: true }),
};

export const adminApi = {
  overview: () => apiRequest<AdminOverview>('/admin/overview'),
  organizations: (params?: { q?: string; type?: string; page?: number; per_page?: number }) =>
    apiRequest<Organization[]>('/admin/organizations', { params }),
  organization: (id: string) => apiRequest<Organization>(`/admin/organizations/${id}`),
  updateOrganization: (id: string, body: Partial<Organization>) =>
    apiRequest<Organization>(`/admin/organizations/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  goals: (params?: { page?: number; per_page?: number; organization_id?: string; status?: string; q?: string }) =>
    apiRequest<Goal[]>('/admin/goals', { params }),
  updateGoalStatus: (id: string, status: string) =>
    apiRequest<Goal>(`/admin/goals/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  exportGoalCsv: (id: string) => apiRequest<string | Blob>(`/admin/goals/${id}/export`, { params: { format: 'csv' } }),
  transactions: (params?: { page?: number; per_page?: number }) => apiRequest<Transaction[]>('/admin/transactions', { params }),
  withdrawals: (params?: { page?: number; per_page?: number; status?: string }) =>
    apiRequest<AdminWithdrawal[]>('/admin/withdrawals', { params }),
  webhookEvents: (params?: { processed?: boolean; event_type?: string; page?: number; per_page?: number }) =>
    apiRequest<unknown[]>('/admin/webhook-events', { params }),
  reconciliation: (params?: { status?: string; page?: number; per_page?: number }) =>
    apiRequest<ReconciliationRecord[]>('/admin/reconciliation', { params }),
  users: (params?: { page?: number; per_page?: number }) => apiRequest<AdminUser[]>('/admin/users', { params }),
  nombaSyncLatest: () => apiRequest<Record<string, unknown>>('/admin/nomba-sync/latest'),
  nombaSyncRuns: () => apiRequest<Record<string, unknown>[]>('/admin/nomba-sync/runs'),
  runNombaSync: () => apiRequest<Record<string, unknown>>('/admin/nomba-sync/run', { method: 'POST' }),
};
