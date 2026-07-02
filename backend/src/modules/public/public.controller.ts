import type { Request, Response, NextFunction } from 'express';
import { ok } from '../../lib/response';
import { publicService } from './public.service';

export const publicController = {
  async getGoal(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await publicService.getGoalBySlug(req.params.slug);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async getVirtualAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await publicService.getVirtualAccountBySlug(req.params.slug);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async getRecentPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await publicService.getRecentPaymentsBySlug(req.params.slug);
      ok(res, data);
    } catch (err) { next(err); }
  },
};
