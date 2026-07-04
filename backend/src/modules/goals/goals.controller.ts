import type { Request, Response, NextFunction } from 'express';
import { ok, created, noContent } from '../../lib/response';
import { goalsService } from './goals.service';
import { closeOutGoalSchema, createGoalSchema, updateGoalSchema } from './goals.schema';

export const goalsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const body = createGoalSchema.parse(req.body);
      const data = await goalsService.create(req.user!.sub, body);
      created(res, data);
    } catch (err) { next(err); }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, meta } = await goalsService.list(req.user!.sub, {
        status:   req.query.status as string | undefined,
        category: req.query.category as string | undefined,
        q:        req.query.q as string | undefined,
        page:     req.query.page ? Number(req.query.page) : undefined,
        per_page: req.query.per_page ? Number(req.query.per_page) : undefined,
      });
      ok(res, data, meta);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await goalsService.getById(req.user!.sub, req.params.id);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async overview(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await goalsService.overview(req.user!.sub, req.params.id);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const body = updateGoalSchema.parse(req.body);
      const data = await goalsService.update(req.user!.sub, req.params.id, body);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await goalsService.delete(req.user!.sub, req.params.id);
      noContent(res);
    } catch (err) { next(err); }
  },

  async close(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await goalsService.close(req.user!.sub, req.params.id);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async closeOut(req: Request, res: Response, next: NextFunction) {
    try {
      const body = closeOutGoalSchema.parse(req.body);
      const data = await goalsService.closeOut(req.user!.sub, req.params.id, body);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async getShareLink(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await goalsService.getShareLink(req.user!.sub, req.params.id);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async exportCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const format = req.query.format === 'pdf' ? 'pdf' : 'csv';
      const file = await goalsService.exportCampaign(req.user!.sub, req.params.id, format);
      res.setHeader('Content-Type', file.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.send(file.body);
    } catch (err) { next(err); }
  },
};
