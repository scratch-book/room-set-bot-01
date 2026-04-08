import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Bot, Context, Keyboard } from '@maxhub/max-bot-api';
import { createBot, processWebhookUpdate } from '../src/bot/bot';
import { AppConfig } from '../src/config/env';
import { DEFAULT_WELCOME_MESSAGE, DEFAULT_CONTACTS_MESSAGE } from '../src/content/messages';
import { CATALOG_BUTTON_TEXT } from '../src/config/constants';
import { FALLBACK_MESSAGE } from '../src/config/constants';
import pino from 'pino';

// Тихий логгер для тестов
const logger = pino({ level: 'silent' });

// Тестовая конфигурация
const testConfig: AppConfig = {
  botToken: 'test-token-12345678',
  port: 3000,
  webhookPath: '/webhook/max',
  publicBaseUrl: 'https://test.example.com',
  catalogUrl: 'https://room-set.ru/virtualnyj-shourum/',
  secondMessageDelayMs: 1000,
  logLevel: 'silent',
  nodeEnv: 'development',
};

describe('Keyboard service', () => {
  it('создаёт inline-клавиатуру с link-кнопкой', () => {
    const keyboard = Keyboard.inlineKeyboard([
      [Keyboard.button.link(CATALOG_BUTTON_TEXT, testConfig.catalogUrl)],
    ]);

    expect(keyboard).toBeDefined();
    expect(keyboard.type).toBe('inline_keyboard');
    expect(keyboard.payload.buttons).toHaveLength(1);
    expect(keyboard.payload.buttons[0]).toHaveLength(1);
    expect(keyboard.payload.buttons[0][0]).toEqual({
      type: 'link',
      text: CATALOG_BUTTON_TEXT,
      url: testConfig.catalogUrl,
    });
  });
});

describe('Content messages', () => {
  it('приветственное сообщение содержит РУМСЭТ', () => {
    expect(DEFAULT_WELCOME_MESSAGE).toContain('РУМСЭТ');
  });

  it('приветственное сообщение содержит упоминание коллекций', () => {
    expect(DEFAULT_WELCOME_MESSAGE).toContain('Male');
    expect(DEFAULT_WELCOME_MESSAGE).toContain('Granola');
    expect(DEFAULT_WELCOME_MESSAGE).toContain('Seta');
  });

  it('сообщение с контактами содержит телефоны', () => {
    expect(DEFAULT_CONTACTS_MESSAGE).toContain('+7(925)012-22-42');
    expect(DEFAULT_CONTACTS_MESSAGE).toContain('+7(950)730-72-02');
  });

  it('сообщение с контактами содержит адрес', () => {
    expect(DEFAULT_CONTACTS_MESSAGE).toContain('Челябинск');
    expect(DEFAULT_CONTACTS_MESSAGE).toContain('Чайковского');
  });
});

describe('Bot creation', () => {
  it('создаёт экземпляр бота без ошибок', () => {
    const bot = createBot(testConfig, logger);
    expect(bot).toBeDefined();
    expect(bot).toBeInstanceOf(Bot);
  });
});

describe('FALLBACK_MESSAGE', () => {
  it('содержит /start', () => {
    expect(FALLBACK_MESSAGE).toContain('/start');
  });
});
