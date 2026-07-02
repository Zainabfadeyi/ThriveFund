import type { Request, Response, NextFunction } from 'express';
import { created, ok } from '../../lib/response';
import { withdrawalsService } from './withdrawals.service';
import { createWithdrawalSchema } from './withdrawals.schema';

export const withdrawalsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, meta } = await withdrawalsService.list(req.user!.sub, {
        goal_id: req.query.goal_id as string | undefined,
        status: req.query.status as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        per_page: req.query.per_page ? Number(req.query.per_page) : undefined,
      });
      ok(res, data, meta);
    } catch (err) { next(err); }
  },

  async listByGoal(req: Request, res: Response, next: NextFunction) {
    try {
      ok(res, await withdrawalsService.listByGoal(req.user!.sub, req.params.id));
    } catch (err) { next(err); }
  },

  async availability(req: Request, res: Response, next: NextFunction) {
    try {
      ok(res, await withdrawalsService.getAvailability(req.user!.sub, req.params.id));
    } catch (err) { next(err); }
  },

  async createForGoal(req: Request, res: Response, next: NextFunction) {
    try {
      const body = createWithdrawalSchema.parse(req.body);
      created(res, await withdrawalsService.createForGoal(req.user!.sub, req.params.id, body));
    } catch (err) { next(err); }
  },
};
