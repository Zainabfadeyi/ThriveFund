import type { Request, Response, NextFunction } from 'express';
import { ok } from '../../lib/response';
import { nombaSyncService } from '../nomba-sync/nomba-sync.service';

export const nombaSyncController = {
  async latest(_req: Request, res: Response, next: NextFunction) {
    try { ok(res, await nombaSyncService.latest()); } catch (err) { next(err); }
  },

  async list(_req: Request, res: Response, next: NextFunction) {
    try { ok(res, await nombaSyncService.listRecent()); } catch (err) { next(err); }
  },

  async run(_req: Request, res: Response, next: NextFunction) {
    try { ok(res, await nombaSyncService.runSync()); } catch (err) { next(err); }
  },
};
