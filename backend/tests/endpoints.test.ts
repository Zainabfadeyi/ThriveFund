import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import { Readable, Writable } from 'node:stream';
import { setTestEnv } from './helpers';

setTestEnv();
process.env.LOG_HTTP = 'false';

type EndpointCase = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  auth?: 'user' | 'admin';
  body?: unknown;
  accept?: string;
};

let app: { handle: (req: unknown, res: unknown) => void };
let userToken = '';
let adminToken = '';

before(async () => {
  await stubControllers();
  const requestLoggerModule = await import('../src/middleware/request-logger.middleware');
  requestLoggerModule.requestLogger = (_req: unknown, _res: unknown, next: () => void) => next();
  const imported = await import('../src/app');
  const { env } = await import('../src/config/env');
  userToken = jwt.sign({ sub: 'usr_test', role: 'user', email: 'user@example.com' }, env.JWT_SECRET);
  adminToken = jwt.sign({ sub: 'adm_test', role: 'admin', email: 'admin@example.com' }, env.JWT_SECRET);
  app = imported.app;
});

after(async () => {
  const database = await import('../src/config/database');
  await database.db.end();
});

const endpoints: EndpointCase[] = [
  { method: 'POST', path: '/api/v1/auth/register', body: {
    full_name: 'Test User',
    email: 'user@example.com',
    password: 'Password1234567890',
    organization_name: 'Acme School',
    organization_type: 'school',
  } },
  { method: 'POST', path: '/api/v1/auth/login', body: { email: 'user@example.com', password: 'Password1234567890' } },
  { method: 'POST', path: '/api/v1/auth/refresh', body: { refresh_token: 'refresh_123' } },
  { method: 'POST', path: '/api/v1/auth/logout', auth: 'user', body: { refresh_token: 'refresh_123' } },
  { method: 'POST', path: '/api/v1/auth/forgot-password', body: { email: 'user@example.com' } },
  { method: 'POST', path: '/api/v1/auth/reset-password', body: { token: 'reset_123', password: 'Password1234567890' } },
  { method: 'POST', path: '/api/v1/auth/verify-email', body: { token: 'verify_123' } },
  { method: 'POST', path: '/api/v1/auth/resend-verification', body: { email: 'user@example.com' } },
  { method: 'GET', path: '/api/v1/auth/me', auth: 'user' },

  { method: 'GET', path: '/api/v1/users/me', auth: 'user' },
  { method: 'PATCH', path: '/api/v1/users/me', auth: 'user', body: { name: 'Updated User' } },
  { method: 'PATCH', path: '/api/v1/users/me/password', auth: 'user', body: { current_password: 'old_password', new_password: 'new_password' } },
  { method: 'GET', path: '/api/v1/users/me/notification-preferences', auth: 'user' },
  { method: 'PATCH', path: '/api/v1/users/me/notification-preferences', auth: 'user', body: { email_payments: true } },

  { method: 'POST', path: '/api/v1/organizations', auth: 'user', body: { name: 'Acme School', type: 'education' } },
  { method: 'GET', path: '/api/v1/organizations', auth: 'user' },
  { method: 'GET', path: '/api/v1/organizations/org_123', auth: 'user' },
  { method: 'PATCH', path: '/api/v1/organizations/org_123', auth: 'user', body: { name: 'Acme Updated' } },

  { method: 'GET', path: '/api/v1/organizations/org_123/members', auth: 'user' },
  { method: 'POST', path: '/api/v1/organizations/org_123/members', auth: 'user', body: { email: 'member@example.com', role: 'member' } },
  { method: 'PATCH', path: '/api/v1/organizations/org_123/members/member_123', auth: 'user', body: { role: 'admin' } },
  { method: 'DELETE', path: '/api/v1/organizations/org_123/members/member_123', auth: 'user' },

  { method: 'POST', path: '/api/v1/goals', auth: 'user', body: { title: 'School Fees', target_amount: 50000, category: 'education', deadline: '2026-12-31' } },
  { method: 'GET', path: '/api/v1/goals', auth: 'user' },
  { method: 'GET', path: '/api/v1/goals/goal_123/overview', auth: 'user' },
  { method: 'GET', path: '/api/v1/goals/goal_123', auth: 'user' },
  { method: 'PATCH', path: '/api/v1/goals/goal_123', auth: 'user', body: { title: 'Updated Goal' } },
  { method: 'DELETE', path: '/api/v1/goals/goal_123', auth: 'user' },
  { method: 'POST', path: '/api/v1/goals/goal_123/close', auth: 'user' },
  { method: 'POST', path: '/api/v1/goals/goal_123/close-out', auth: 'user', body: { account_number: '0123456789', account_name: 'Test User', bank_code: '058' } },
  { method: 'GET', path: '/api/v1/goals/goal_123/share', auth: 'user' },
  { method: 'GET', path: '/api/v1/goals/goal_123/export', auth: 'user', accept: 'text/csv' },
  { method: 'GET', path: '/api/v1/goals/goal_123/withdrawals', auth: 'user' },
  { method: 'POST', path: '/api/v1/goals/goal_123/withdraw', auth: 'user', body: { payout_account_id: 'poa_123', amount: 1000 } },
  { method: 'POST', path: '/api/v1/goals/goal_123/virtual-account', auth: 'user', body: {} },
  { method: 'GET', path: '/api/v1/goals/goal_123/virtual-account', auth: 'user' },
  { method: 'GET', path: '/api/v1/goals/goal_123/transactions', auth: 'user' },
  { method: 'GET', path: '/api/v1/goals/goal_123/contributors', auth: 'user' },
  { method: 'GET', path: '/api/v1/goals/goal_123/contributors/summary', auth: 'user' },
  { method: 'POST', path: '/api/v1/goals/goal_123/contributors', auth: 'user', body: { name: 'Ada', email: 'ada@example.com' } },
  { method: 'POST', path: '/api/v1/goals/goal_123/invitations/reminders', auth: 'user' },
  { method: 'POST', path: '/api/v1/goals/goal_123/invitations', auth: 'user', body: { recipients: [{ email: 'ada@example.com' }] } },
  { method: 'GET', path: '/api/v1/goals/goal_123/invitations', auth: 'user' },

  { method: 'GET', path: '/api/v1/virtual-accounts', auth: 'user' },
  { method: 'GET', path: '/api/v1/virtual-accounts/va_123', auth: 'user' },
  { method: 'GET', path: '/api/v1/payout-accounts', auth: 'user' },
  { method: 'POST', path: '/api/v1/payout-accounts/verify', auth: 'user', body: { account_number: '0123456789', bank_code: '058' } },
  { method: 'POST', path: '/api/v1/payout-accounts', auth: 'user', body: { account_number: '0123456789', account_name: 'Test User', bank_code: '058' } },
  { method: 'PATCH', path: '/api/v1/payout-accounts/poa_123/default', auth: 'user' },
  { method: 'DELETE', path: '/api/v1/payout-accounts/poa_123', auth: 'user' },
  { method: 'GET', path: '/api/v1/withdrawals', auth: 'user' },
  { method: 'GET', path: '/api/v1/transactions/export', auth: 'user', accept: 'text/csv' },
  { method: 'GET', path: '/api/v1/transactions', auth: 'user' },
  { method: 'GET', path: '/api/v1/transactions/txn_123', auth: 'user' },
  { method: 'GET', path: '/api/v1/payments', auth: 'admin' },
  { method: 'GET', path: '/api/v1/payments/pay_123', auth: 'admin' },
  { method: 'GET', path: '/api/v1/contributors', auth: 'user' },

  { method: 'GET', path: '/api/v1/reconciliation', auth: 'user' },
  { method: 'GET', path: '/api/v1/reconciliation/overview', auth: 'user' },
  { method: 'GET', path: '/api/v1/reconciliation/rec_123', auth: 'user' },
  { method: 'GET', path: '/api/v1/reports/financial-summary', auth: 'user' },
  { method: 'GET', path: '/api/v1/reports/campaigns/goal_123/export', auth: 'user', accept: 'text/csv' },
  { method: 'GET', path: '/api/v1/reports/transactions/export', auth: 'user', accept: 'text/csv' },
  { method: 'GET', path: '/api/v1/reports/reconciliation', auth: 'user' },

  { method: 'GET', path: '/api/v1/dashboard/overview', auth: 'user' },
  { method: 'GET', path: '/api/v1/dashboard/bootstrap', auth: 'user' },
  { method: 'GET', path: '/api/v1/dashboard/monthly-contributions', auth: 'user' },
  { method: 'GET', path: '/api/v1/dashboard/category-breakdown', auth: 'user' },
  { method: 'GET', path: '/api/v1/dashboard/top-contributors', auth: 'user' },
  { method: 'GET', path: '/api/v1/dashboard/goal-performance', auth: 'user' },
  { method: 'GET', path: '/api/v1/analytics/overview', auth: 'user' },
  { method: 'GET', path: '/api/v1/analytics/monthly-contributions', auth: 'user' },
  { method: 'GET', path: '/api/v1/analytics/category-breakdown', auth: 'user' },
  { method: 'GET', path: '/api/v1/analytics/top-contributors', auth: 'user' },
  { method: 'GET', path: '/api/v1/analytics/goal-performance', auth: 'user' },

  { method: 'GET', path: '/api/v1/notifications', auth: 'user' },
  { method: 'GET', path: '/api/v1/notifications/unread-count', auth: 'user' },
  { method: 'PATCH', path: '/api/v1/notifications/ntf_123/read', auth: 'user' },
  { method: 'POST', path: '/api/v1/notifications/read-all', auth: 'user' },
  { method: 'GET', path: '/api/v1/community-projects', auth: 'user' },
  { method: 'GET', path: '/api/v1/search?q=school', auth: 'user' },

  { method: 'GET', path: '/api/v1/public/goals/school-fees' },
  { method: 'GET', path: '/api/v1/public/goals/school-fees/virtual-account' },
  { method: 'POST', path: '/api/v1/invitations/inv_123/accept', body: { name: 'Ada' } },
  { method: 'GET', path: '/api/v1/categories' },
  { method: 'GET', path: '/api/v1/banks/supported' },
  { method: 'POST', path: '/api/v1/banks/lookup', auth: 'user', body: { account_number: '0123456789', bank_code: '058' } },
  { method: 'GET', path: '/api/v1/content/faqs' },
  { method: 'POST', path: '/api/webhooks/nomba', body: { event_type: 'payment_success' } },

  { method: 'GET', path: '/api/v1/admin/overview', auth: 'admin' },
  { method: 'GET', path: '/api/v1/admin/reconciliation', auth: 'admin' },
  { method: 'GET', path: '/api/v1/admin/reconciliation/rec_123', auth: 'admin' },
  { method: 'POST', path: '/api/v1/admin/reconciliation/rec_123/resolve', auth: 'admin', body: { goal_id: 'goal_123' } },
  { method: 'GET', path: '/api/v1/admin/webhook-events', auth: 'admin' },
  { method: 'POST', path: '/api/v1/admin/webhook-events/wh_123/retry', auth: 'admin' },
  { method: 'GET', path: '/api/v1/admin/organizations', auth: 'admin' },
  { method: 'GET', path: '/api/v1/admin/organizations/org_123', auth: 'admin' },
  { method: 'PATCH', path: '/api/v1/admin/organizations/org_123', auth: 'admin', body: { description: 'Updated by admin' } },
  { method: 'GET', path: '/api/v1/admin/users', auth: 'admin' },
  { method: 'GET', path: '/api/v1/admin/goals', auth: 'admin' },
  { method: 'PATCH', path: '/api/v1/admin/goals/goal_123/status', auth: 'admin', body: { status: 'paused' } },
  { method: 'GET', path: '/api/v1/admin/goals/goal_123/export', auth: 'admin', accept: 'text/csv' },
  { method: 'GET', path: '/api/v1/admin/transactions', auth: 'admin' },
  { method: 'GET', path: '/api/v1/admin/audit-logs', auth: 'admin' },
  { method: 'GET', path: '/api/v1/health' },
  { method: 'GET', path: '/api/v1/health/ready' },
  { method: 'GET', path: '/health' },
  { method: 'GET', path: '/health/ready' },
];

for (const endpoint of endpoints) {
  test(`${endpoint.method} ${endpoint.path}`, async () => {
    const response = await request(endpoint);
    assert.equal(response.status, 200);
    if (endpoint.accept === 'text/csv') {
      assert.match(response.headers.get('content-type') ?? '', /text\/csv/);
      assert.match(await response.text(), /id/);
    } else {
      const json = await response.json();
      assert.equal(json.success, true);
    }
  });
}

test('protected endpoints return 401 without a bearer token', async () => {
  const response = await request({ method: 'GET', path: '/api/v1/goals' });
  const json = await response.json();

  assert.equal(response.status, 401);
  assert.equal(json.error.code, 'UNAUTHORIZED');
});

test('admin endpoints return 403 for regular users', async () => {
  const response = await request({ method: 'GET', path: '/api/v1/admin/overview', auth: 'user' });
  const json = await response.json();

  assert.equal(response.status, 403);
  assert.equal(json.error.code, 'FORBIDDEN');
});

async function request(endpoint: EndpointCase) {
  const headers: Record<string, string> = {};
  if (endpoint.body !== undefined) headers['Content-Type'] = 'application/json';
  if (endpoint.auth) headers.Authorization = `Bearer ${endpoint.auth === 'admin' ? adminToken : userToken}`;
  const body = endpoint.body !== undefined ? JSON.stringify(endpoint.body) : '';

  return inject({
    method: endpoint.method,
    url: endpoint.path,
    headers: {
      ...headers,
      ...(body ? { 'Content-Length': Buffer.byteLength(body).toString() } : {}),
    },
    body,
  });
}

function inject(options: {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
}): Promise<{
  status: number;
  headers: { get: (name: string) => string | undefined };
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const req = new Readable({
      read() {
        this.push(options.body || null);
        this.push(null);
      },
    }) as http.IncomingMessage;

    req.method = options.method;
    req.url = options.url;
    req.headers = Object.fromEntries(
      Object.entries(options.headers).map(([key, value]) => [key.toLowerCase(), value]),
    );
    const reqSocket = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    }) as Writable & { remoteAddress?: string; encrypted?: boolean };
    reqSocket.remoteAddress = '127.0.0.1';
    reqSocket.encrypted = false;
    req.socket = reqSocket as never;

    const res = new http.ServerResponse(req);
    const socket = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    }) as Writable & { writable: boolean; destroyed: boolean };

    socket.writable = true;
    socket.destroyed = false;
    res.assignSocket(socket as never);

    const originalWrite = res.write.bind(res);
    res.write = ((chunk: unknown, ...args: unknown[]) => {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      return originalWrite(chunk as never, ...(args as [never]));
    }) as typeof res.write;

    const originalEnd = res.end.bind(res);
    res.end = ((chunk: unknown, ...args: unknown[]) => {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
      return originalEnd(chunk as never, ...(args as [never]));
    }) as typeof res.end;

    const timeout = setTimeout(() => reject(new Error(`${options.method} ${options.url} timed out`)), 2_000);

    res.on('finish', () => {
      clearTimeout(timeout);
      const body = Buffer.concat(chunks).toString('utf8');
      resolve({
        status: res.statusCode,
        headers: {
          get: (name: string) => {
            const value = res.getHeader(name);
            return Array.isArray(value) ? value.join(', ') : value?.toString();
          },
        },
        json: async () => JSON.parse(body || '{}'),
        text: async () => body,
      });
    });

    res.on('error', reject);
    app.handle(req, res);
  });
}

async function stubControllers() {
  const [
    auth,
    users,
    organizations,
    organizationMembers,
    goals,
    virtualAccounts,
    payoutAccounts,
    withdrawals,
    transactions,
    payments,
    contributors,
    invitations,
    reconciliation,
    reports,
    analytics,
    notifications,
    community,
    publicModule,
    content,
    webhooks,
    admin,
    auditLogs,
    health,
  ] = await Promise.all([
    import('../src/modules/auth/auth.controller'),
    import('../src/modules/users/users.controller'),
    import('../src/modules/organizations/organizations.controller'),
    import('../src/modules/organization-members/organization-members.controller'),
    import('../src/modules/goals/goals.controller'),
    import('../src/modules/virtual-accounts/virtual-accounts.controller'),
    import('../src/modules/payout-accounts/payout-accounts.controller'),
    import('../src/modules/withdrawals/withdrawals.controller'),
    import('../src/modules/transactions/transactions.controller'),
    import('../src/modules/payments/payments.controller'),
    import('../src/modules/contributors/contributors.controller'),
    import('../src/modules/invitations/invitations.controller'),
    import('../src/modules/reconciliation/reconciliation.controller'),
    import('../src/modules/reports/reports.controller'),
    import('../src/modules/analytics/analytics.controller'),
    import('../src/modules/notifications/notifications.controller'),
    import('../src/modules/community/community.controller'),
    import('../src/modules/public/public.controller'),
    import('../src/modules/content/content.controller'),
    import('../src/modules/webhooks/webhooks.controller'),
    import('../src/modules/admin/admin.controller'),
    import('../src/modules/audit-logs/audit-logs.controller'),
    import('../src/modules/health/health.controller'),
  ]);

  patchAll(auth.authController, jsonHandler);
  patchAll(users.usersController, jsonHandler);
  patchAll(organizations.organizationsController, jsonHandler);
  patchAll(organizationMembers.organizationMembersController, jsonHandler);
  patchAll(goals.goalsController, jsonHandler);
  goals.goalsController.exportCampaign = csvHandler;
  patchAll(virtualAccounts.virtualAccountsController, jsonHandler);
  patchAll(payoutAccounts.payoutAccountsController, jsonHandler);
  patchAll(withdrawals.withdrawalsController, jsonHandler);
  patchAll(payments.paymentsController, jsonHandler);
  patchAll(contributors.contributorsController, jsonHandler);
  patchAll(invitations.invitationsController, jsonHandler);
  patchAll(reconciliation.reconciliationController, jsonHandler);
  patchAll(analytics.analyticsController, jsonHandler);
  patchAll(notifications.notificationsController, jsonHandler);
  patchAll(community.communityController, jsonHandler);
  patchAll(publicModule.publicController, jsonHandler);
  patchAll(content.contentController, jsonHandler);
  patchAll(webhooks.webhooksController, jsonHandler);
  patchAll(admin.adminController, jsonHandler);
  admin.adminController.exportGoal = csvHandler;
  patchAll(auditLogs.auditLogsController, jsonHandler);

  patchAll(transactions.transactionsController, jsonHandler);
  transactions.transactionsController.exportCsv = csvHandler;
  patchAll(reports.reportsController, jsonHandler);
  reports.reportsController.transactionsExport = csvHandler;
  reports.reportsController.campaignExport = csvHandler;

  health.healthController.liveness = jsonHandler;
  health.healthController.readiness = jsonHandler;
}

function patchAll(controller: Record<string, unknown>, handler: unknown) {
  for (const key of Object.keys(controller)) {
    if (typeof controller[key] === 'function') controller[key] = handler;
  }
}

function jsonHandler(req: { method?: string; path?: string; originalUrl?: string }, res: { json: (body: unknown) => void }) {
  res.json({
    success: true,
    data: {
      method: req.method,
      path: req.originalUrl ?? req.path,
    },
  });
}

function csvHandler(_req: unknown, res: { type: (type: string) => unknown; send: (body: string) => void }) {
  res.type('text/csv');
  res.send('id,value\nrow_1,ok\n');
}
