import type { Request, Response, NextFunction } from 'express';
import { ok, created } from '../../lib/response';
import { adminService } from './admin.service';

export const adminController = {
  async overview(_req: Request, res: Response, next: NextFunction) {
    try { ok(res, await adminService.overview()); } catch (err) { next(err); }
  },

  async listReconciliation(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, meta } = await adminService.listReconciliation({
        status:   req.query.status as string | undefined,
        from:     req.query.from as string | undefined,
        to:       req.query.to as string | undefined,
        page:     req.query.page ? Number(req.query.page) : undefined,
        per_page: req.query.per_page ? Number(req.query.per_page) : undefined,
      });
      ok(res, data, meta);
    } catch (err) { next(err); }
  },

  async getReconciliation(req: Request, res: Response, next: NextFunction) {
    try { ok(res, await adminService.getReconciliation(req.params.id)); } catch (err) { next(err); }
  },

  async resolveReconciliation(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.resolveReconciliation(req.params.id, req.body);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async listWebhookEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.listWebhookEvents({
        processed:  req.query.processed as string | undefined,
        event_type: req.query.event_type as string | undefined,
        page:       req.query.page ? Number(req.query.page) : undefined,
        per_page:   req.query.per_page ? Number(req.query.per_page) : undefined,
      });
      ok(res, data);
    } catch (err) { next(err); }
  },

  async retryWebhookEvent(req: Request, res: Response, next: NextFunction) {
    try { ok(res, await adminService.retryWebhookEvent(req.params.id)); } catch (err) { next(err); }
  },

  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, meta } = await adminService.listUsers({
        page: req.query.page ? Number(req.query.page) : undefined,
        per_page: req.query.per_page ? Number(req.query.per_page) : undefined,
      });
      ok(res, data, meta);
    } catch (err) { next(err); }
  },

  async listGoals(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, meta } = await adminService.listGoalsEnhanced({
        page: req.query.page ? Number(req.query.page) : undefined,
        per_page: req.query.per_page ? Number(req.query.per_page) : undefined,
        organization_id: req.query.organization_id as string | undefined,
        status: req.query.status as string | undefined,
        q: req.query.q as string | undefined,
      });
      ok(res, data, meta);
    } catch (err) { next(err); }
  },

  async listOrganizations(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, meta } = await adminService.listOrganizations({
        q: req.query.q as string | undefined,
        type: req.query.type as string | undefined,
        page: req.query.page ? Number(req.query.page) : undefined,
        per_page: req.query.per_page ? Number(req.query.per_page) : undefined,
      });
      ok(res, data, meta);
    } catch (err) { next(err); }
  },

  async getOrganization(req: Request, res: Response, next: NextFunction) {
    try { ok(res, await adminService.getOrganization(req.params.id)); } catch (err) { next(err); }
  },

  async updateOrganization(req: Request, res: Response, next: NextFunction) {
    try { ok(res, await adminService.updateOrganization(req.params.id, req.body)); } catch (err) { next(err); }
  },

  async updateGoalStatus(req: Request, res: Response, next: NextFunction) {
    try { ok(res, await adminService.updateGoalStatus(req.params.id, req.body)); } catch (err) { next(err); }
  },

  async exportGoal(req: Request, res: Response, next: NextFunction) {
    try {
      const format = req.query.format === 'pdf' ? 'pdf' : 'csv';
      const file = await adminService.exportGoal(req.params.id, format);
      res.setHeader('Content-Type', file.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.send(file.body);
    } catch (err) { next(err); }
  },

  async listTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, meta } = await adminService.listTransactions({
        page: req.query.page ? Number(req.query.page) : undefined,
        per_page: req.query.per_page ? Number(req.query.per_page) : undefined,
      });
      ok(res, data, meta);
    } catch (err) { next(err); }
  },

  async listWithdrawals(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, meta } = await adminService.listWithdrawals({
        page: req.query.page ? Number(req.query.page) : undefined,
        per_page: req.query.per_page ? Number(req.query.per_page) : undefined,
        status: req.query.status as string | undefined,
      });
      ok(res, data, meta);
    } catch (err) { next(err); }
  },
};
