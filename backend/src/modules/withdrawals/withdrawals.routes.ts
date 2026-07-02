import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { withdrawalsController } from './withdrawals.controller';

export const withdrawalsRouter = Router();

withdrawalsRouter.use(requireAuth);
withdrawalsRouter.get('/', withdrawalsController.list);
