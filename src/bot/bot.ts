import { Bot, Context } from '@maxhub/max-bot-api';
import type pino from 'pino';
import { AppConfig } from '../config/env';
import { handleStartCtx } from './handlers/start.handler';
import { handleFallbackCtx } from './handlers/fallback.handler';

/**
 * Создаёт и настраивает экземпляр бота MAX.
 * Регистрирует обработчики событий.
 */
export function createBot(config: AppConfig, logger: pino.Logger): Bot {
  const bot = new Bot(config.botToken);

  // Обработка события bot_started (пользователь нажал «Начать» или пришёл по deep link)
  bot.on('bot_started', async (ctx) => {
    const chatId = ctx.chatId;
    const user = ctx.user;
    const payload = ctx.startPayload;

    logger.info(
      { handler: 'bot_started', chatId, userId: user?.user_id, userName: user?.name, hasPayload: !!payload },
      'Обработка события bot_started',
    );

    if (payload) {
      logger.info({ chatId, userId: user?.user_id, payload }, 'Deep link payload получен');
    }

    await handleStartCtx(ctx, config, logger);
  });

  // Обработка команды /start
  bot.command('start', async (ctx) => {
    const chatId = ctx.chatId;
    const sender = ctx.message?.sender;

    logger.info(
      { handler: 'command_start', chatId, userId: sender?.user_id },
      'Обработка команды /start',
    );

    await handleStartCtx(ctx, config, logger);
  });

  // Обработка всех остальных сообщений (fallback)
  bot.on('message_created', async (ctx) => {
    const chatId = ctx.chatId;
    const text = ctx.message?.body?.text;

    // Проверяем, является ли сообщение командой /start
    if (text?.trim() === '/start' || text?.trim().startsWith('/start ')) {
      logger.info(
        { handler: 'message_start', chatId, text },
        'Обработка команды /start через message_created',
      );
      await handleStartCtx(ctx, config, logger);
      return;
    }

    logger.info(
      { handler: 'fallback', chatId, textPreview: text?.substring(0, 50) },
      'Получено прочее сообщение',
    );

    await handleFallbackCtx(ctx, config, logger);
  });

  // Обработка ошибок бота
  bot.catch((err, ctx) => {
    logger.error(
      { err, chatId: ctx.chatId, updateType: ctx.updateType },
      'Ошибка в обработчике бота',
    );
  });

  return bot;
}

/**
 * Обрабатывает входящий webhook update через middleware бота.
 * Создаёт Context из сырого update и прогоняет через цепочку обработчиков.
 */
export async function processWebhookUpdate(
  bot: Bot,
  update: Record<string, unknown>,
  logger: pino.Logger,
): Promise<void> {
  try {
    const ctx = new Context(update as any, bot.api, bot.botInfo);
    await bot.middleware()(ctx, async () => {});
  } catch (error) {
    logger.error({ err: error }, 'Ошибка обработки webhook update через middleware бота');
  }
}

/**
 * Регистрирует webhook-подписку в MAX API.
 */
export async function registerWebhook(config: AppConfig, logger: pino.Logger): Promise<void> {
  const webhookUrl = `${config.publicBaseUrl}${config.webhookPath}`;

  logger.info({ webhookUrl }, 'Регистрация webhook в MAX API');

  const response = await fetch('https://platform-api.max.ru/subscriptions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': config.botToken,
    },
    body: JSON.stringify({
      url: webhookUrl,
      update_types: ['bot_started', 'message_created'],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown');
    logger.error(
      { status: response.status, errorText, webhookUrl },
      'Не удалось зарегистрировать webhook в MAX',
    );
    throw new Error(`Ошибка регистрации webhook: ${response.status} ${errorText}`);
  }

  const data = await response.json().catch(() => ({}));
  logger.info({ webhookUrl, response: data }, 'Webhook успешно зарегистрирован в MAX');
}

/**
 * Проверяет текущую подписку webhook в MAX API.
 */
export async function checkWebhookSubscription(config: AppConfig, logger: pino.Logger): Promise<void> {
  try {
    const response = await fetch('https://platform-api.max.ru/subscriptions', {
      method: 'GET',
      headers: { 'Authorization': config.botToken },
    });

    if (response.ok) {
      const data = await response.json();
      logger.info({ subscription: data }, 'Текущая подписка webhook');
    } else {
      logger.warn({ status: response.status }, 'Не удалось проверить подписку webhook');
    }
  } catch (error) {
    logger.warn({ err: error }, 'Ошибка при проверке подписки webhook');
  }
}
