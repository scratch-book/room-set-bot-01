# === Этап 1: Сборка ===
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Устанавливаем зависимости
RUN npm ci --ignore-scripts

# Копируем исходный код
COPY tsconfig.json ./
COPY src/ ./src/

# Собираем TypeScript
RUN npm run build

# === Этап 2: Production ===
FROM node:20-alpine AS production

WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Устанавливаем только production-зависимости
RUN npm ci --omit=dev --ignore-scripts

# Копируем собранный код
COPY --from=builder /app/dist ./dist

# Создаём непривилегированного пользователя
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

USER appuser

# Порт по умолчанию
EXPOSE 3000

# Переменные окружения по умолчанию
ENV NODE_ENV=production

# Запуск приложения
CMD ["node", "dist/index.js"]
