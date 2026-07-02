import type { Request, Response, NextFunction } from 'express';
import { created, noContent, ok } from '../../lib/response';
import { payoutAccountsService } from './payout-accounts.service';
import { createPayoutAccountSchema, verifyPayoutAccountSchema } from './payout-accounts.schema';

export const payoutAccountsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      ok(res, await payoutAccountsService.list(req.user!.sub));
    } catch (err) { next(err); }
  },

  async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const body = verifyPayoutAccountSchema.parse(req.body);
      ok(res, await payoutAccountsService.verify(body));
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const body = createPayoutAccountSchema.parse(req.body);
      created(res, await payoutAccountsService.create(req.user!.sub, body));
    } catch (err) { next(err); }
  },

  async setDefault(req: Request, res: Response, next: NextFunction) {
    try {
      ok(res, await payoutAccountsService.setDefault(req.user!.sub, req.params.id));
    } catch (err) { next(err); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await payoutAccountsService.delete(req.user!.sub, req.params.id);
      noContent(res);
    } catch (err) { next(err); }
  },
};
