import type { Request, Response, NextFunction } from 'express';
import { ok, created } from '../../lib/response';
import { invitationsService } from './invitations.service';
import { sendInvitationSchema } from './invitations.validators';

export const invitationsController = {
  async sendToGoal(req: Request, res: Response, next: NextFunction) {
    try {
      const goalId = req.params.id ?? req.params.goalId;
      const body = sendInvitationSchema.parse(req.body);
      const data = await invitationsService.sendToGoal(req.user!.sub, goalId, body);
      created(res, data);
    } catch (err) { next(err); }
  },

  async listByGoal(req: Request, res: Response, next: NextFunction) {
    try {
      const goalId = req.params.id ?? req.params.goalId;
      const data = await invitationsService.listByGoal(req.user!.sub, goalId);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async overview(req: Request, res: Response, next: NextFunction) {
    try {
      const goalId = req.params.id ?? req.params.goalId;
      const data = await invitationsService.overview(req.user!.sub, goalId);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async remindOutstanding(req: Request, res: Response, next: NextFunction) {
    try {
      const goalId = req.params.id ?? req.params.goalId;
      const data = await invitationsService.remindOutstanding(req.user!.sub, goalId);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await invitationsService.accept(req.params.token);
      ok(res, data);
    } catch (err) { next(err); }
  },
};
