import dotenv from 'dotenv';
import path from 'path';

// Загружаем .env файл только в development-режиме
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

/**
 * Конфигурация приложения.
 * Все значения берутся из переменных окружения (env).
 */
export interface AppConfig {
  /** Токен бота MAX */
  botToken: string;
  /** Порт HTTP-сервера */
  port: number;
  /** Путь webhook-эндпоинта */
  webhookPath: string;
  /** Публичный HTTPS URL приложения */
  publicBaseUrl: string;
  /** URL каталога продукции */
  catalogUrl: string;
  /** Задержка перед вторым сообщением (мс) */
  secondMessageDelayMs: number;
  /** Уровень логирования */
  logLevel: string;
  /** Окружение (development / production) */
  nodeEnv: string;
  /** Текст приветственного сообщения (переопределение через env) */
  welcomeMessageOverride?: string;
  /** Текст сообщения с контактами (переопределение через env) */
  contactsMessageOverride?: string;
}

/**
 * Читает обязательную переменную окружения.
 * Если переменная не задана — выбрасывает ошибку с понятным сообщением.
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(
      `[CONFIG] Обязательная переменная окружения "${name}" не задана. ` +
      `Скопируйте .env.example в .env и заполните все обязательные поля.`
    );
  }
  return value.trim();
}

/**
 * Читает необязательную переменную окружения с значением по умолчанию.
 */
function optionalEnv(name: string, defaultValue: string): string {
  const value = process.env[name];
  return value && value.trim() !== '' ? value.trim() : defaultValue;
}

/**
 * Валидирует и загружает конфигурацию из переменных окружения.
 * Вызывается один раз при старте приложения.
 */
export function loadConfig(): AppConfig {
  const botToken = requireEnv('BOT_TOKEN');
  const port = parseInt(optionalEnv('PORT', '3000'), 10);
  const webhookPath = optionalEnv('WEBHOOK_PATH', '/webhook/max');
  const publicBaseUrl = requireEnv('PUBLIC_BASE_URL');
  const catalogUrl = optionalEnv('CATALOG_URL', 'https://room-set.ru/virtualnyj-shourum/');
  const secondMessageDelayMs = parseInt(optionalEnv('SECOND_MESSAGE_DELAY_MS', '1500'), 10);
  const logLevel = optionalEnv('LOG_LEVEL', 'info');
  const nodeEnv = optionalEnv('NODE_ENV', 'production');

  // Валидация порта
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`[CONFIG] PORT должен быть числом от 1 до 65535, получено: "${process.env.PORT}"`);
  }

  // Валидация задержки
  if (isNaN(secondMessageDelayMs) || secondMessageDelayMs < 1000 || secondMessageDelayMs > 2000) {
    throw new Error(
      `[CONFIG] SECOND_MESSAGE_DELAY_MS должен быть от 1000 до 2000 мс, получено: "${process.env.SECOND_MESSAGE_DELAY_MS}"`
    );
  }

  // Валидация webhookPath
  if (!webhookPath.startsWith('/')) {
    throw new Error(`[CONFIG] WEBHOOK_PATH должен начинаться с "/", получено: "${webhookPath}"`);
  }

  // Валидация publicBaseUrl
  if (!publicBaseUrl.startsWith('https://') && nodeEnv === 'production') {
    throw new Error(
      `[CONFIG] PUBLIC_BASE_URL должен начинаться с "https://" в production, получено: "${publicBaseUrl}"`
    );
  }

  // Чтение необязательных текстовых переопределений
  const welcomeMessageOverride = process.env.WELCOME_MESSAGE?.trim() || undefined;
  const contactsMessageOverride = process.env.CONTACTS_MESSAGE?.trim() || undefined;

  return {
    botToken,
    port,
    webhookPath,
    publicBaseUrl,
    catalogUrl,
    secondMessageDelayMs,
    logLevel,
    nodeEnv,
    welcomeMessageOverride,
    contactsMessageOverride,
  };
}
