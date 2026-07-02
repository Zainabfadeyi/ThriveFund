import type { Request, Response, NextFunction } from 'express';
import { ok } from '../../lib/response';
import { transactionsService } from './transactions.service';

function csvRow(row: Record<string, unknown>) {
  return Object.values(row).map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
}

export const transactionsController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, meta } = await transactionsService.list(req.user!.sub, {
        goal_id:  req.query.goal_id as string | undefined,
        status:   req.query.status as string | undefined,
        from:     req.query.from as string | undefined,
        to:       req.query.to as string | undefined,
        q:        req.query.q as string | undefined,
        page:     req.query.page ? Number(req.query.page) : undefined,
        per_page: req.query.per_page ? Number(req.query.per_page) : undefined,
      });
      ok(res, data, meta);
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await transactionsService.getById(req.user!.sub, req.params.id);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async getByGoal(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, meta } = await transactionsService.getByGoal(req.user!.sub, req.params.id, {
        status:   req.query.status as string | undefined,
        from:     req.query.from as string | undefined,
        to:       req.query.to as string | undefined,
        q:        req.query.q as string | undefined,
        page:     req.query.page ? Number(req.query.page) : undefined,
        per_page: req.query.per_page ? Number(req.query.per_page) : undefined,
      });
      ok(res, data, meta);
    } catch (err) { next(err); }
  },

  async exportCsv(req: Request, res: Response, next: NextFunction) {
    try {
      const rows = await transactionsService.export(req.user!.sub, {
        goal_id: req.query.goal_id as string | undefined,
        from:    req.query.from as string | undefined,
        to:      req.query.to as string | undefined,
        status:  req.query.status as string | undefined,
      });
      const header = 'reference,goal,contributor_name,amount,status,paid_at';
      const csv = [header, ...rows.map(csvRow)].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
      res.send(csv);
    } catch (err) { next(err); }
  },
};
