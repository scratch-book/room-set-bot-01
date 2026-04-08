import pino from 'pino';
import { APP_NAME } from '../config/constants';

/**
 * Создаёт и настраивает логгер приложения.
 * Формат: JSON в production, человекочитаемый в development.
 */
export function createLogger(level: string = 'info', nodeEnv: string = 'production'): pino.Logger {
  const isDev = nodeEnv === 'development';

  return pino({
    name: APP_NAME,
    level,
    ...(isDev
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          },
        }
      : {}),
    // В production — стандартный JSON-вывод pino
    timestamp: pino.stdTimeFunctions.isoTime,
  });
}

/**
 * Маскирует токен для безопасного логирования.
 * Показывает только первые 8 символов.
 */
export function maskToken(token: string): string {
  if (token.length <= 8) return '***';
  return token.substring(0, 8) + '***';
}
