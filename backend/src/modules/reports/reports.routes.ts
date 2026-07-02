import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { reportsController } from './reports.controller';

export const reportsRouter = Router();
reportsRouter.use(requireAuth);

reportsRouter.get('/financial-summary', reportsController.financialSummary);
reportsRouter.get('/campaigns/:goalId/export', reportsController.campaignExport);
reportsRouter.get('/transactions/export', reportsController.transactionsExport);
reportsRouter.get('/reconciliation', reportsController.reconciliationReport);
