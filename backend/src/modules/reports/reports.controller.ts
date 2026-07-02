import type { Request, Response, NextFunction } from 'express';
import { ok } from '../../lib/response';
import { reportsService } from './reports.service';

export const reportsController = {
  async financialSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await reportsService.financialSummary(req.user!.sub);
      ok(res, data);
    } catch (err) { next(err); }
  },

  async campaignExport(req: Request, res: Response, next: NextFunction) {
    try {
      const format = req.query.format === 'pdf' ? 'pdf' : 'csv';
      const file = await reportsService.campaignExport(req.user!.sub, req.params.goalId, format);
      res.setHeader('Content-Type', file.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.send(file.body);
    } catch (err) { next(err); }
  },

  async transactionsExport(req: Request, res: Response, next: NextFunction) {
    try {
      const csv = await reportsService.transactionsCsv(req.user!.sub, {
        from: req.query.from as string | undefined,
        to: req.query.to as string | undefined,
        goal_id: req.query.goal_id as string | undefined,
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
      res.send(csv);
    } catch (err) { next(err); }
  },

  async reconciliationReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { data, meta } = await reportsService.reconciliationReport(req.user!.sub, {
        page: req.query.page ? Number(req.query.page) : undefined,
        per_page: req.query.per_page ? Number(req.query.per_page) : undefined,
      });
      ok(res, data, meta);
    } catch (err) { next(err); }
  },
};
