import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { analyticsController } from './analytics.controller';

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

// Mounted at both /dashboard and /analytics in app.ts
// GET /dashboard/overview  → overview
// GET /analytics/monthly-contributions → monthlyContributions
analyticsRouter.get('/overview', analyticsController.overview);
analyticsRouter.get('/bootstrap', analyticsController.bootstrap);
analyticsRouter.get('/monthly-contributions', analyticsController.monthlyContributions);
analyticsRouter.get('/category-breakdown', analyticsController.categoryBreakdown);
analyticsRouter.get('/top-contributors', analyticsController.topContributors);
analyticsRouter.get('/goal-performance', analyticsController.goalPerformance);
