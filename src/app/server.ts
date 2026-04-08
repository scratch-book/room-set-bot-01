import express from 'express';
import type { Server } from 'http';
import type { Bot } from '@maxhub/max-bot-api';
import type pino from 'pino';
import { AppConfig } from '../config/env';
import { createHealthRouter } from './health';
import { createWebhookRouter } from './routes';

/**
 * Создаёт и настраивает Express-сервер.
 */
export function createServer(bot: Bot, config: AppConfig, logger: pino.Logger): express.Application {
  const app = express();

  // Парсинг JSON body (webhook от MAX приходит в JSON)
  app.use(express.json());

  // Health-check эндпоинт
  app.use(createHealthRouter(logger));

  // Webhook эндпоинт
  app.use(createWebhookRouter(bot, config, logger));

  return app;
}

/**
 * Запускает HTTP-сервер и возвращает экземпляр Server для управления.
 */
export function startServer(
  app: express.Application,
  config: AppConfig,
  logger: pino.Logger,
): Promise<Server> {
  return new Promise((resolve) => {
    const server = app.listen(config.port, () => {
      logger.info(
        { port: config.port, webhookPath: config.webhookPath },
        `Сервер запущен на порту ${config.port}`,
      );
      logger.info(
        { healthUrl: `http://localhost:${config.port}/health` },
        'Health-check доступен',
      );
      logger.info(
        { webhookUrl: `${config.publicBaseUrl}${config.webhookPath}` },
        'Webhook URL для MAX',
      );
      resolve(server);
    });
  });
}
