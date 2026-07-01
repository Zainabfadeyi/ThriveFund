import type { Request, Response, NextFunction } from 'express';
import { ok, created } from '../../lib/response';
import { contributorsService } from './contributors.service';

export const contributorsController = {
  async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await contributorsService.listAll(req.user!.sub);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async getByGoal(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await contributorsService.getByGoal(req.user!.sub, req.params.id);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async addToGoal(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await contributorsService.addToGoal(req.user!.sub, req.params.id, req.body);
      created(res, data);
    } catch (err) { next(err); }
  },

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await contributorsService.getSummary(req.user!.sub, req.params.id);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async sendInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await contributorsService.sendInvitation(req.user!.sub, req.params.id, req.body);
      created(res, data);
    } catch (err) { next(err); }
  },

  async getInvitations(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await contributorsService.getInvitations(req.user!.sub, req.params.id);
      ok(res, data);
    } catch (err) { next(err); }
  },
};
