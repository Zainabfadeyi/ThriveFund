import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { transactionsController } from './transactions.controller';

export const transactionsRouter = Router();

transactionsRouter.use(requireAuth);

// NOTE: /export must be defined before /:id to avoid Express matching "export" as an id
transactionsRouter.get('/export', transactionsController.exportCsv);
transactionsRouter.get('/:id/receipt', transactionsController.receiptPdf);
transactionsRouter.get('/', transactionsController.list);
transactionsRouter.get('/:id', transactionsController.getById);
