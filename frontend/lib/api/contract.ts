/**
 * ThriveFund API contract — synced with backend modular monolith.
 * Base: /api/v1  |  Webhooks: /api/webhooks (no v1 prefix)
 */

export const API_ENDPOINTS = {
  auth: {
    register: 'POST /auth/register',
    login: 'POST /auth/login',
    refresh: 'POST /auth/refresh',
    logout: 'POST /auth/logout',
    me: 'GET /auth/me',
    forgotPassword: 'POST /auth/forgot-password',
    resetPassword: 'POST /auth/reset-password',
  },
  users: {
    profile: 'GET /users/me',
    updateProfile: 'PATCH /users/me',
    changePassword: 'PATCH /users/me/password',
    notificationPrefs: 'GET /users/me/notification-preferences',
    updateNotificationPrefs: 'PATCH /users/me/notification-preferences',
  },
  organizations: {
    list: 'GET /organizations',
    create: 'POST /organizations',
    get: 'GET /organizations/:id',
    update: 'PATCH /organizations/:id',
    members: {
      list: 'GET /organizations/:orgId/members',
      add: 'POST /organizations/:orgId/members',
      update: 'PATCH /organizations/:orgId/members/:memberId',
      remove: 'DELETE /organizations/:orgId/members/:memberId',
    },
  },
  goals: {
    list: 'GET /goals',
    create: 'POST /goals',
    get: 'GET /goals/:id',
    update: 'PATCH /goals/:id',
    delete: 'DELETE /goals/:id',
    close: 'POST /goals/:id/close',
    share: 'GET /goals/:id/share',
    virtualAccount: {
      create: 'POST /goals/:id/virtual-account',
      get: 'GET /goals/:id/virtual-account',
    },
    transactions: 'GET /goals/:id/transactions',
    contributors: {
      list: 'GET /goals/:id/contributors',
      add: 'POST /goals/:id/contributors',
    },
    invitations: {
      send: 'POST /goals/:id/invitations',
      list: 'GET /goals/:id/invitations',
    },
  },
  virtualAccounts: {
    list: 'GET /virtual-accounts',
    get: 'GET /virtual-accounts/:id',
  },
  transactions: {
    list: 'GET /transactions',
    get: 'GET /transactions/:id',
    export: 'GET /transactions/export',
  },
  contributors: {
    listAll: 'GET /contributors',
  },
  reconciliation: {
    list: 'GET /reconciliation',
    overview: 'GET /reconciliation/overview',
    get: 'GET /reconciliation/:id',
  },
  reports: {
    financialSummary: 'GET /reports/financial-summary',
    transactionsExport: 'GET /reports/transactions/export',
    reconciliation: 'GET /reports/reconciliation',
  },
  dashboard: {
    overview: 'GET /dashboard/overview',
  },
  analytics: {
    monthlyContributions: 'GET /analytics/monthly-contributions',
    categoryBreakdown: 'GET /analytics/category-breakdown',
    topContributors: 'GET /analytics/top-contributors',
    goalPerformance: 'GET /analytics/goal-performance',
  },
  notifications: {
    list: 'GET /notifications',
    unreadCount: 'GET /notifications/unread-count',
    markRead: 'PATCH /notifications/:id/read',
    markAllRead: 'POST /notifications/read-all',
  },
  invitations: {
    accept: 'POST /invitations/:token/accept',
  },
  public: {
    goal: 'GET /public/goals/:slug',
    virtualAccount: 'GET /public/goals/:slug/virtual-account',
  },
  admin: {
    overview: 'GET /admin/overview',
    reconciliation: 'GET /admin/reconciliation',
    resolveReconciliation: 'POST /admin/reconciliation/:id/resolve',
    webhookEvents: 'GET /admin/webhook-events',
    retryWebhook: 'POST /admin/webhook-events/:id/retry',
    users: 'GET /admin/users',
    goals: 'GET /admin/goals',
    transactions: 'GET /admin/transactions',
    auditLogs: 'GET /admin/audit-logs',
  },
  payments: {
    list: 'GET /payments',
    get: 'GET /payments/:id',
  },
  webhooks: {
    nomba: 'POST /api/webhooks/nomba',
  },
  health: {
    liveness: 'GET /health',
    readiness: 'GET /api/v1/health/ready',
  },
} as const;

/** Endpoints not yet implemented on backend */
export const MISSING_BACKEND_ENDPOINTS = [
  'GET /contributors/:id — single contributor detail with outstanding balance',
  'POST /reports/generate — on-demand PDF report generation',
  'GET /organizations/:id/stats — aggregated org stats (frontend derives from list)',
] as const;
