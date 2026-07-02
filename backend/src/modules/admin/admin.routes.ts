import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';
import { adminController } from './admin.controller';
import { nombaSyncController } from './nomba-sync.controller';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get('/overview', adminController.overview);

adminRouter.get('/reconciliation', adminController.listReconciliation);
adminRouter.get('/reconciliation/:id', adminController.getReconciliation);
adminRouter.post('/reconciliation/:id/resolve', adminController.resolveReconciliation);

adminRouter.get('/webhook-events', adminController.listWebhookEvents);
adminRouter.post('/webhook-events/:id/retry', adminController.retryWebhookEvent);

adminRouter.get('/organizations', adminController.listOrganizations);
adminRouter.get('/organizations/:id', adminController.getOrganization);
adminRouter.patch('/organizations/:id', adminController.updateOrganization);

adminRouter.get('/users', adminController.listUsers);
adminRouter.get('/goals', adminController.listGoals);
adminRouter.patch('/goals/:id/status', adminController.updateGoalStatus);
adminRouter.get('/goals/:id/export', adminController.exportGoal);
adminRouter.get('/transactions', adminController.listTransactions);
adminRouter.get('/withdrawals', adminController.listWithdrawals);
adminRouter.get('/nomba-sync/latest', nombaSyncController.latest);
adminRouter.get('/nomba-sync/runs', nombaSyncController.list);
adminRouter.post('/nomba-sync/run', nombaSyncController.run);
