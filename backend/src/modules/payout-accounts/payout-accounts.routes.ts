import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { payoutAccountsController } from './payout-accounts.controller';

export const payoutAccountsRouter = Router();

payoutAccountsRouter.use(requireAuth);

payoutAccountsRouter.get('/', payoutAccountsController.list);
payoutAccountsRouter.post('/verify', payoutAccountsController.verify);
payoutAccountsRouter.post('/', payoutAccountsController.create);
payoutAccountsRouter.patch('/:id/default', payoutAccountsController.setDefault);
payoutAccountsRouter.delete('/:id', payoutAccountsController.delete);
