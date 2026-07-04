import type { Request, Response, NextFunction } from 'express';
import { ok } from '../../lib/response';
import { analyticsService } from './analytics.service';

export const analyticsController = {
  async overview(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.overview(req.user!.sub);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async bootstrap(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.bootstrap(req.user!.sub);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async monthlyContributions(req: Request, res: Response, next: NextFunction) {
    try {
      const months = req.query.months ? Number(req.query.months) : 6;
      const data = await analyticsService.monthlyContributions(req.user!.sub, months);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async categoryBreakdown(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.categoryBreakdown(req.user!.sub);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async topContributors(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 10;
      const data = await analyticsService.topContributors(req.user!.sub, limit);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async goalPerformance(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await analyticsService.goalPerformance(req.user!.sub);
      ok(res, data);
    } catch (err) { next(err); }
  },
};
