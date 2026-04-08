import { loadConfig } from './config/env';
import { createLogger, maskToken } from './lib/logger';
import { createServer, startServer } from './app/server';
import { createBot, registerWebhook, checkWebhookSubscription } from './bot/bot';
import { APP_NAME, APP_VERSION } from './config/constants';

/**
 * Точка входа приложения.
 *
 * Поддерживает два режима:
 * - webhook (production): Express принимает update, бот обрабатывает через middleware
 * - polling (development): библиотека сама опрашивает MAX API
 */
async function main(): Promise<void> {
  // Шаг 1: Загрузка конфигурации
  let config;
  try {
    config = loadConfig();
  } catch (error) {
    console.error('Ошибка загрузки конфигурации:', (error as Error).message);
    process.exit(1);
  }

  // Шаг 2: Создание логгера
  const logger = createLogger(config.logLevel, config.nodeEnv);

  logger.info(
    {
      app: APP_NAME,
      version: APP_VERSION,
      nodeEnv: config.nodeEnv,
      port: config.port,
      webhookPath: config.webhookPath,
      catalogUrl: config.catalogUrl,
      secondMessageDelayMs: config.secondMessageDelayMs,
      botToken: maskToken(config.botToken),
    },
    `${APP_NAME} v${APP_VERSION} запускается`,
  );

  // Шаг 3: Создание бота с обработчиками
  const bot = createBot(config, logger);
  logger.info('Бот создан, обработчики зарегистрированы');

  // Шаг 4: Создание и запуск HTTP-сервера (для health-check и webhook)
  const app = createServer(bot, config, logger);
  const server = await startServer(app, config, logger);

  // Шаг 5: Регистрация webhook в MAX (только в production/webhook режиме)
  if (config.nodeEnv === 'production') {
    try {
      await registerWebhook(config, logger);
    } catch (error) {
      logger.error(
        { err: error },
        'Не удалось зарегистрировать webhook при старте. Бот может не получать события. ' +
        'Проверьте PUBLIC_BASE_URL и BOT_TOKEN.',
      );
    }
    await checkWebhookSubscription(config, logger);
  } else {
    // В development можно использовать polling через библиотеку
    logger.info('Режим development: запуск long polling');
    try {
      await bot.start({ allowedUpdates: ['bot_started', 'message_created'] });
      logger.info('Long polling запущен');
    } catch (error) {
      logger.error({ err: error }, 'Не удалось запустить long polling');
    }
  }

  // Шаг 6: Graceful shutdown
  const shutdown = (signal: string) => {
    logger.info({ signal }, 'Получен сигнал завершения, останавливаем сервер...');

    // Останавливаем polling, если запущен
    try {
      bot.stop();
    } catch {
      // polling мог быть не запущен
    }

    server.close(() => {
      logger.info('HTTP-сервер остановлен. Завершение процесса.');
      process.exit(0);
    });

    setTimeout(() => {
      logger.warn('Принудительное завершение по таймауту');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Необработанный Promise rejection');
  });

  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Необработанное исключение — завершение процесса');
    process.exit(1);
  });
}

main().catch((error) => {
  console.error('Критическая ошибка при запуске:', error);
  process.exit(1);
});
