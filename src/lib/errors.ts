/**
 * Базовый класс ошибок приложения.
 */
export class AppError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = 'APP_ERROR') {
    super(message);
    this.name = 'AppError';
    this.code = code;
  }
}

/**
 * Ошибка конфигурации.
 */
export class ConfigError extends AppError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR');
    this.name = 'ConfigError';
  }
}

/**
 * Ошибка взаимодействия с MAX API.
 */
export class MaxApiError extends AppError {
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message, 'MAX_API_ERROR');
    this.name = 'MaxApiError';
    this.statusCode = statusCode;
  }
}
