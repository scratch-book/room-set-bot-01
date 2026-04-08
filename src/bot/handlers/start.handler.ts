import type { Context } from '@maxhub/max-bot-api';
import { Keyboard } from '@maxhub/max-bot-api';
import type pino from 'pino';
import { AppConfig } from '../../config/env';
import { delay } from '../../lib/delay';
import { DEFAULT_WELCOME_MESSAGE, DEFAULT_CONTACTS_MESSAGE } from '../../content/messages';
import { CATALOG_BUTTON_TEXT } from '../../config/constants';

/**
 * Обработчик команды /start и события bot_started.
 *
 * 1. Отправляет приветственное сообщение с inline-кнопкой каталога.
 * 2. Ждёт настраиваемую задержку.
 * 3. Отправляет сообщение с контактами.
 *
 * Если первое сообщение отправлено, а второе — нет,
 * ошибка логируется, но приложение не падает.
 */
export async function handleStartCtx(
  ctx: Context,
  config: AppConfig,
  logger: pino.Logger,
): Promise<void> {
  const chatId = ctx.chatId;
  const childLogger = logger.child({ handler: 'start', chatId });

  if (!chatId) {
    childLogger.warn('Не удалось определить chatId, пропускаем обработку');
    return;
  }

  // Шаг 1: Приветственное сообщение с кнопкой каталога
  const welcomeText = config.welcomeMessageOverride || DEFAULT_WELCOME_MESSAGE;
  const keyboard = Keyboard.inlineKeyboard([
    [Keyboard.button.link(CATALOG_BUTTON_TEXT, config.catalogUrl)],
  ]);

  childLogger.info('Отправка приветственного сообщения');
  await ctx.reply(welcomeText, { attachments: [keyboard] });
  childLogger.info('Приветственное сообщение отправлено успешно');

  // Шаг 2: Задержка перед вторым сообщением
  childLogger.debug({ delayMs: config.secondMessageDelayMs }, 'Ожидание перед вторым сообщением');
  await delay(config.secondMessageDelayMs);

  // Шаг 3: Сообщение с контактами
  try {
    const contactsText = config.contactsMessageOverride || DEFAULT_CONTACTS_MESSAGE;
    childLogger.info('Отправка сообщения с контактами');
    await ctx.reply(contactsText);
    childLogger.info('Сообщение с контактами отправлено успешно');
  } catch (error) {
    childLogger.error(
      { err: error },
      'Не удалось отправить второе сообщение (контакты). Первое сообщение уже доставлено.',
    );
  }
}
