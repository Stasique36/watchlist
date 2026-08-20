# Watchlist

Приложение для ведения личного списка фильмов и сериалов: поиск через TMDB, добавление в приватный watchlist, отметка просмотренного и удаление.

## Production

https://watchlist-silk-three.vercel.app

## Возможности

- регистрация
- вход
- приватный список
- поиск TMDB
- добавление
- watched
- удаление
- фильтрация списка: все / не просмотрено / просмотрено

## Стек

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Neon PostgreSQL
- Drizzle ORM
- Better Auth
- TMDB
- Vercel

## Локальный запуск

```bash
npm ci
npm run dev
```

## Переменные окружения

Необходимо задать в `.env.local`:

- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `TMDB_API_TOKEN`

## Команды

```bash
npm run dev       # запуск dev-сервера
npm run build     # production-сборка
npm run lint      # линт
npm run test:e2e  # e2e-тесты (Playwright)
```

## Перед первым локальным E2E-запуском

```bash
npx playwright install chromium
```
