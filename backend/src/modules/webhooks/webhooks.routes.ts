import { Router } from 'express';
import { webhooksController } from './webhooks.controller';

export const webhooksRouter = Router();

// Mounted at /api/webhooks (no /v1 prefix)
webhooksRouter.post('/nomba', webhooksController.nomba);
