import { Router, Request, Response } from 'express';
import type { Bot } from '@maxhub/max-bot-api';
import type pino from 'pino';
import { AppConfig } from '../config/env';
import { processWebhookUpdate } from '../bot/bot';

/**
 * Создаёт роутер для webhook-эндпоинта MAX.
 * POST <webhookPath> — принимает update от MAX и обрабатывает через middleware бота.
 */
export function createWebhookRouter(bot: Bot, config: AppConfig, logger: pino.Logger): Router {
  const router = Router();

  router.post(config.webhookPath, async (req: Request, res: Response) => {
    const update = req.body;

    // Базовая валидация
    if (!update || !update.update_type) {
      logger.warn({ body: req.body }, 'Получен невалидный webhook запрос (нет update_type)');
      res.status(400).json({ error: 'Invalid update: missing update_type' });
      return;
    }

    logger.info(
      { updateType: update.update_type, timestamp: update.timestamp },
      'Получен webhook update',
    );

    // Отвечаем MAX сразу — обработка идёт асинхронно
    res.status(200).json({ ok: true });

    // Обрабатываем update через middleware бота
    await processWebhookUpdate(bot, update, logger);
  });

  return router;
}
