import type { Request, Response, NextFunction } from 'express';
import { webhooksService } from './webhooks.service';

export const webhooksController = {
  async nomba(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = (
        req.headers['nomba-signature'] ??
        req.headers['nomba-sig-value'] ??
        req.headers['x-nomba-signature'] ??
        req.headers['x-webhook-signature'] ??
        ''
      ) as string;
      const timestamp = (req.headers['nomba-timestamp'] ?? '') as string;
      const rawBody = (req as Request & { rawBody?: string }).rawBody ?? JSON.stringify(req.body);
      const result = await webhooksService.processNomba(rawBody, signature, req.body, timestamp);
      res.json({ received: true, ...result as object });
    } catch (err) { next(err); }
  },
};
