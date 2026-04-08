import type { Context } from '@maxhub/max-bot-api';
import type pino from 'pino';
import { AppConfig } from '../../config/env';
import { FALLBACK_MESSAGE } from '../../config/constants';

/**
 * Обработчик любых сообщений, не являющихся командой /start.
 * Отправляет короткое сервисное сообщение.
 */
export async function handleFallbackCtx(
  ctx: Context,
  config: AppConfig,
  logger: pino.Logger,
): Promise<void> {
  const chatId = ctx.chatId;
  const childLogger = logger.child({ handler: 'fallback', chatId });

  if (!chatId) {
    childLogger.warn('Не удалось определить chatId для fallback');
    return;
  }

  childLogger.info('Отправка fallback-сообщения');

  try {
    await ctx.reply(FALLBACK_MESSAGE);
    childLogger.info('Fallback-сообщение отправлено');
  } catch (error) {
    childLogger.error({ err: error }, 'Не удалось отправить fallback-сообщение');
  }
}
