import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler } from './middleware/error.middleware';
import { requestLogger } from './middleware/request-logger.middleware';

import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { organizationsRouter } from './modules/organizations/organizations.routes';
import { organizationMembersRouter } from './modules/organization-members/organization-members.routes';
import { goalsRouter } from './modules/goals/goals.routes';
import { virtualAccountsRouter } from './modules/virtual-accounts/virtual-accounts.routes';
import { payoutAccountsRouter } from './modules/payout-accounts/payout-accounts.routes';
import { transactionsRouter } from './modules/transactions/transactions.routes';
import { withdrawalsRouter } from './modules/withdrawals/withdrawals.routes';
import { paymentsRouter } from './modules/payments/payments.routes';
import { contributorsRouter } from './modules/contributors/contributors.routes';
import { reconciliationRouter } from './modules/reconciliation/reconciliation.routes';
import { reportsRouter } from './modules/reports/reports.routes';
import { analyticsRouter } from './modules/analytics/analytics.routes';
import { notificationsRouter } from './modules/notifications/notifications.routes';
import { communityRouter } from './modules/community/community.routes';
import { publicRouter } from './modules/public/public.routes';
import { contentRouter } from './modules/content/content.routes';
import { invitationsPublicRouter } from './modules/invitations/invitations.routes';
import { webhooksRouter } from './modules/webhooks/webhooks.routes';
import { adminRouter } from './modules/admin/admin.routes';
import { auditLogsRouter } from './modules/audit-logs/audit-logs.routes';
import { healthRouter } from './modules/health/health.routes';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      env.CORS_ORIGIN,
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:5173',
      env.FRONTEND_URL,
    ].filter(Boolean);
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));
app.use(express.json({
  verify: (req, _res, buf) => {
    (req as express.Request & { rawBody?: string }).rawBody = buf.toString('utf8');
  },
}));
app.use(requestLogger);
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
    message: {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please wait a moment and try again.',
      },
    },
  }),
);

const API = '/api/v1';

app.use(`${API}/auth`, authRouter);
app.use(`${API}/users`, usersRouter);
app.use(`${API}/organizations`, organizationsRouter);
app.use(`${API}/organizations/:orgId/members`, organizationMembersRouter);
app.use(`${API}/goals`, goalsRouter);
app.use(`${API}/virtual-accounts`, virtualAccountsRouter);
app.use(`${API}/payout-accounts`, payoutAccountsRouter);
app.use(`${API}/transactions`, transactionsRouter);
app.use(`${API}/withdrawals`, withdrawalsRouter);
app.use(`${API}/payments`, paymentsRouter);
app.use(`${API}/contributors`, contributorsRouter);
app.use(`${API}/reconciliation`, reconciliationRouter);
app.use(`${API}/reports`, reportsRouter);
app.use(`${API}/dashboard`, analyticsRouter);
app.use(`${API}/analytics`, analyticsRouter);
app.use(`${API}/notifications`, notificationsRouter);
app.use(`${API}/community-projects`, communityRouter);
app.use(`${API}/search`, communityRouter);
app.use(`${API}/public`, publicRouter);
app.use(`${API}/invitations`, invitationsPublicRouter);
app.use(`${API}/categories`, contentRouter);
app.use(`${API}/banks`, contentRouter);
app.use(`${API}/content`, contentRouter);
app.use('/api/webhooks', webhooksRouter);
app.use(`${API}/admin`, adminRouter);
app.use(`${API}/admin/audit-logs`, auditLogsRouter);
app.use(`${API}/health`, healthRouter);
app.use('/health', healthRouter);

app.use(errorHandler);

export { app };
