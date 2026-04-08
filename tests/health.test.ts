import { describe, it, expect, beforeAll } from 'vitest';
import express from 'express';
import { createHealthRouter } from '../src/app/health';
import pino from 'pino';

// Тихий логгер для тестов
const logger = pino({ level: 'silent' });

describe('Health endpoint', () => {
  it('GET /health возвращает 200 и { status: "ok" }', () => {
    const router = createHealthRouter(logger);

    // Находим обработчик /health
    const layer = router.stack.find(
      (l: any) => l.route?.path === '/health' && l.route?.methods?.get,
    );

    expect(layer).toBeDefined();

    let responseStatus = 0;
    let responseBody: unknown = null;

    const mockReq = {} as express.Request;
    const mockRes = {
      status(code: number) {
        responseStatus = code;
        return this;
      },
      json(body: unknown) {
        responseBody = body;
        return this;
      },
    } as express.Response;

    // Вызываем обработчик напрямую
    layer!.route!.stack[0].handle(mockReq, mockRes, () => {});

    expect(responseStatus).toBe(200);
    expect(responseBody).toEqual({ status: 'ok' });
  });
});
