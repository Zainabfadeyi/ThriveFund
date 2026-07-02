import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { goalsController } from './goals.controller';
// Nested sub-resource controllers imported here to keep all /goals/:id/* routes in one file
import { virtualAccountsController } from '../virtual-accounts/virtual-accounts.controller';
import { transactionsController } from '../transactions/transactions.controller';
import { contributorsController } from '../contributors/contributors.controller';
import { invitationsController } from '../invitations/invitations.controller';
import { withdrawalsController } from '../withdrawals/withdrawals.controller';

export const goalsRouter = Router();

goalsRouter.use(requireAuth);

// Core CRUD
goalsRouter.post('/', goalsController.create);
goalsRouter.get('/', goalsController.list);
goalsRouter.get('/:id', goalsController.getById);
goalsRouter.patch('/:id', goalsController.update);
goalsRouter.delete('/:id', goalsController.delete);
goalsRouter.post('/:id/close', goalsController.close);
goalsRouter.post('/:id/close-out', goalsController.closeOut);
goalsRouter.get('/:id/share', goalsController.getShareLink);
goalsRouter.get('/:id/export', goalsController.exportCampaign);
goalsRouter.get('/:id/withdrawals', withdrawalsController.listByGoal);
goalsRouter.post('/:id/withdraw', withdrawalsController.createForGoal);

// Virtual account (nested)
goalsRouter.post('/:id/virtual-account', virtualAccountsController.createForGoal);
goalsRouter.get('/:id/virtual-account', virtualAccountsController.getForGoal);

// Transactions (nested)
goalsRouter.get('/:id/transactions', transactionsController.getByGoal);

// Contributors (nested)
goalsRouter.get('/:id/contributors', contributorsController.getByGoal);
goalsRouter.get('/:id/contributors/summary', contributorsController.getSummary);
goalsRouter.post('/:id/contributors', contributorsController.addToGoal);

// Invitations (nested — delegated to invitations module)
goalsRouter.post('/:id/invitations/reminders', invitationsController.remindOutstanding);
goalsRouter.post('/:id/invitations', invitationsController.sendToGoal);
goalsRouter.get('/:id/invitations', invitationsController.listByGoal);
