import { Router } from 'express';
import { publicController } from './public.controller';

export const publicRouter = Router();

// No auth — these are shared contribution pages
publicRouter.get('/goals/:slug', publicController.getGoal);
publicRouter.get('/goals/:slug/virtual-account', publicController.getVirtualAccount);
publicRouter.get('/goals/:slug/payments', publicController.getRecentPayments);
