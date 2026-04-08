# Инструкции для Claude Code

## Что это за проект

Приветственный бот компании **РУМСЭТ** для мессенджера **MAX** (max.ru).
При запуске бот отправляет два сообщения: приветствие с кнопкой каталога и контакты менеджеров.
Бот не ведёт диалог и не использует AI/LLM. Это stateless-сервис без базы данных.

## Стек

- **Node.js 20+**, **TypeScript 5**
- **@maxhub/max-bot-api** — официальная библиотека MAX (Bot, Context, Keyboard, Api)
- **Express** — HTTP-сервер для webhook и health-check
- **pino** — логирование (JSON в production, цветной в development)
- **vitest** — тесты
- **tsx** — запуск TypeScript без сборки (dev-режим)

## Архитектура

```
src/
  index.ts              — точка входа, запуск сервера + polling/webhook
  app/
    server.ts           — создание Express-приложения
    routes.ts           — POST webhook endpoint → processWebhookUpdate()
    health.ts           — GET /health → { status: "ok" }
  bot/
    bot.ts              — createBot() (регистрация обработчиков), processWebhookUpdate(),
                          registerWebhook(), checkWebhookSubscription()
    handlers/
      start.handler.ts  — handleStartCtx(): приветствие + задержка + контакты
      fallback.handler.ts — handleFallbackCtx(): сервисное сообщение
      webhook.handler.ts — реэкспорт processWebhookUpdate (для совместимости)
    services/            — точки расширения (пока реэкспорты)
    types/               — реэкспорт типов из библиотеки
  config/
    env.ts              — loadConfig(): чтение и валидация всех env-переменных
    constants.ts        — APP_NAME, CATALOG_BUTTON_TEXT, FALLBACK_MESSAGE, MAX_API_BASE_URL
  content/
    messages.ts         — DEFAULT_WELCOME_MESSAGE, DEFAULT_CONTACTS_MESSAGE
  lib/
    logger.ts           — createLogger(), maskToken()
    delay.ts            — delay(ms) — Promise-based таймер
    errors.ts           — AppError, ConfigError, MaxApiError
```

## Два режима работы

- **production** (`NODE_ENV=production`): Express принимает webhook от MAX, обрабатывает через bot middleware. При старте регистрирует webhook в MAX API.
- **development** (`NODE_ENV=development`): запускает long polling через `bot.start()` из библиотеки. Express работает параллельно для health-check.

## Команды

```bash
npm run dev        # запуск с hot-reload (tsx watch), polling-режим
npm run build      # сборка TS → JS в dist/
npm start          # запуск собранного JS (production)
npm test           # запуск тестов (vitest)
npm run lint       # проверка типов без компиляции
```

## Как бот обрабатывает события

1. MAX отправляет update (webhook POST или через polling)
2. `bot.on('bot_started')` — пользователь нажал «Начать» или пришёл по deep link
3. `bot.command('start')` — пользователь отправил `/start` текстом
4. `bot.on('message_created')` — всё остальное → fallback
5. `handleStartCtx()`:
   - `ctx.reply(welcomeText, { attachments: [keyboard] })` — приветствие + link-кнопка
   - `delay(config.secondMessageDelayMs)` — пауза 1000–2000 мс
   - `ctx.reply(contactsText)` — контакты (ошибка ловится, не роняет процесс)

## Ключевые принципы

- **Всё через env** — никаких хардкоженных секретов, URL и текстов в бизнес-логике
- **Тексты отдельно** — `src/content/messages.ts`, переопределяются через `WELCOME_MESSAGE` / `CONTACTS_MESSAGE` env
- **Модульность** — каждый файл делает одну вещь
- **Graceful shutdown** — SIGINT/SIGTERM корректно останавливают сервер
- **Отказоустойчивость** — если второе сообщение не отправилось, первое уже доставлено, ошибка в логах

## MAX Bot API — ключевое

- Библиотека: `@maxhub/max-bot-api` (версия ^0.2.2)
- Отправка сообщений: `ctx.reply(text, extra?)` или `bot.api.sendMessageToChat(chatId, text, extra?)`
- Inline-кнопка: `Keyboard.inlineKeyboard([[Keyboard.button.link(text, url)]])`
- Webhook: `POST https://platform-api.max.ru/subscriptions` с `{ url, update_types }`
- Авторизация: заголовок `Authorization: <token>` (не query-параметр)
- Rate limit: 30 запросов/сек
- Deep link payload: `ctx.startPayload` (в bot_started) или текст после `/start ` (в message_created)

## Что НЕ делать

- Не добавлять базу данных — MVP без хранения состояния
- Не добавлять AI/LLM — бот отвечает фиксированными текстами
- Не хардкодить токен, URL, тексты сообщений — всё через env или content/messages.ts
- Не логировать полный токен — использовать maskToken()
- Не менять структуру каталогов без причины — она соответствует ТЗ
- Не удалять .env.example — это документация для env-переменных

## Что можно расширять (этап 2)

- Аналитика payload из deep link (сейчас только логирование)
- Кнопки выбора категории товара
- Разные сценарии для новых/повторных пользователей (нужна БД)
- Интеграция с CRM
- Автоответы на частые вопросы
- Мини-приложение MAX

## Тесты

Тесты в `tests/`. Используют vitest. Проверяют:
- Health endpoint (200 + JSON)
- Keyboard: создание link-кнопки с правильным URL
- Тексты: наличие РУМСЭТ, коллекций, телефонов, адреса
- Создание бота без ошибок
- Fallback-сообщение содержит /start

При добавлении новых обработчиков — добавлять тесты в `tests/`.

## Язык

Комментарии в коде, README, DEPLOY, commit-сообщения — на **русском** языке.
Имена переменных, функций, файлов — на **английском**.
