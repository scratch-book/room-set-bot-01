import { Router, Request, Response } from 'express';
import type pino from 'pino';

/**
 * Создаёт роутер для health-check эндпоинта.
 * GET /health → 200 { "status": "ok" }
 */
export function createHealthRouter(logger: pino.Logger): Router {
  const router = Router();

  router.get('/health', (_req: Request, res: Response) => {
    logger.debug('Health-check запрос');
    res.status(200).json({ status: 'ok' });
  });

  return router;
}
