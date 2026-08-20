# Watchlist — implementation plan

## Статус

- Этапы 0–8 завершены.
- MVP развёрнут в production.
- Production URL: https://watchlist-silk-three.vercel.app
- Добавлен один Playwright smoke-тест.
- Тест автоматически запускается через GitHub Actions.
- Оставшаяся часть файла сохранена как исторический пошаговый план.

## Зафиксированное понимание

**Продукт:** личный watchlist фильмов/сериалов, несколько пользователей с приватными списками, всё приложение за авторизацией.

**Стек:**
- Next.js 16.3.1 (App Router, `proxy.ts` вместо `middleware.ts`, legacy-модель кэширования — Cache Components не включаем)
- Neon Postgres (dev-ветка + отдельный production branch)
- Drizzle ORM + drizzle-kit (`generate`/`migrate`, драйвер `neon-http`)
- Better Auth (email/password, Drizzle-адаптер, схема генерируется через `npx auth@latest generate`)
- TMDB API (`/search/multi`, Bearer-токен, только через серверный Route Handler)
- Чистый Tailwind без UI-библиотек
- Деплой на Vercel, автодеплой на push в `main`

**MVP-функционал:** поиск в TMDB → добавление в список (без ручного ввода) → отметка «просмотрено» (bool-поле) → удаление. Дубликаты блокирует уникальный индекс `(user_id, tmdb_id, media_type)`. Изначально тесты не входили в MVP; после стабилизации добавлен один Playwright smoke-тест для редиректа неавторизованного пользователя на /login.

**Порядок:** сначала Better Auth (таблицы `user`/`session`/`account`/`verification`), затем `watchlist_items` — она ссылается на `user.id`, поэтому таблицы Better Auth должны существовать первыми.

---

## Пошаговый план

**Этап 0 — Инфраструктура и деплой-петля**
Реализуем: Neon-проект (prod branch + dev branch), Vercel-проект, подключённый к GitHub, переменные окружения (`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, TMDB-токен) для Development/Preview/Production в Vercel.
Файлы: `.env.local` (не коммитится).
Научиться: интеграция Vercel↔Neon (pooled vs unpooled connection string), окружения Vercel (Production/Preview/Development), почему секреты не коммитятся.
Проверка: текущий статичный мок задеплоен на боевой Vercel-URL; в Vercel dashboard видны все переменные для нужных окружений.

**Этап 1 — Подключение Drizzle к Neon**
Реализуем: `drizzle-orm` + `drizzle-kit` + `@neondatabase/serverless`, `drizzle.config.ts`, клиент БД на `neon-http`.
Файлы: `drizzle.config.ts`, `db/index.ts`, временный локальный скрипт (например `scripts/check-db.ts`, запускается через `npx tsx` вне Next.js-сервера, не HTTP-роут) — удаляется после проверки.
Научиться: анатомия `drizzle.config.ts`, зачем два connection string (pooled для рантайма, unpooled для миграций).
Проверка: локальный скрипт делает `SELECT 1` (или `NOW()`) и печатает ответ от Neon dev-ветки в терминал — без ошибок. Никакого публичного роута для этого не создаём.

**Этап 2 — Better Auth: схема и серверная настройка**
Реализуем: `lib/auth.ts` (`betterAuth` + `drizzleAdapter` + `emailAndPassword.enabled`), генерация схемы командой `npx auth@latest generate` (→ `user`/`session`/`account`/`verification`), миграция в dev-ветку, роут `app/api/auth/[...all]/route.ts`, `lib/auth-client.ts`.
Файлы: `lib/auth.ts`, `lib/auth-client.ts`, `app/api/auth/[...all]/route.ts`, `db/schema/auth.ts` (сгенерированный), папка миграций.
Научиться: разделение server/client в Better Auth, что каждая из четырёх таблиц делает, разница `generate`/`migrate`/`push`.
Проверка: `curl -X POST /api/auth/sign-up/email` с тестовыми данными → в Neon (SQL editor / drizzle studio) появляется строка в `user`; ответ содержит session-cookie.

**Этап 3 — Схема watchlist_items**
Реализуем: таблица `watchlist_items` (`id`, `userId` → FK на `user.id`, `tmdbId`, `mediaType`, `title`, `posterPath`, `watched: boolean`, `createdAt`) + уникальный индекс `(userId, tmdbId, mediaType)`.
Файлы: `db/schema/watchlist.ts`, новая миграция.
Научиться: внешние ключи и составные уникальные ограничения в Drizzle.
Проверка: миграция применена к dev-ветке; вручную вставленная дублирующая запись отклоняется БД.

**Этап 4 — Auth UI и защита маршрутов**
Реализуем: `/login`, `/register` через `authClient.signIn.email`/`signUp.email`, выход из сессии, `proxy.ts` для быстрого редиректа неавторизованных (оптимистическая проверка), + серверная проверка сессии в layout защищённых страниц (по документации Next 16, Proxy сам по себе — не полноценная защита).
Файлы: `app/login/page.tsx`, `app/register/page.tsx`, `proxy.ts`, обёртка/layout для защищённых страниц.
Научиться: почему нужна связка «Proxy + серверная проверка», а не только Proxy; клиентские хуки Better Auth.
Проверка: регистрация и вход в браузере работают; попытка открыть защищённую страницу без логина редиректит на `/login`; выход очищает сессию.

**Этап 5 — Поиск через TMDB**
Реализуем: `app/api/search/route.ts` — принимает `?q=`, дергает TMDB `/search/multi` с Bearer-токеном на сервере, нормализует ответ (`id`, `mediaType`, `title`, `posterPath`, `year`).
Файлы: `app/api/search/route.ts`, `lib/tmdb.ts`.
Научиться: серверные секреты в Route Handler, нормализация разнородного JSON (movie vs tv поля).
Проверка: `/api/search?q=dune` в браузере/curl возвращает реальные результаты TMDB.

**Этап 6 — CRUD для watchlist**
Реализуем: `app/api/watchlist/route.ts` (`GET` список текущего пользователя, `POST` добавление с обработкой конфликта уникальности), `app/api/watchlist/[id]/route.ts` (`DELETE`, `PATCH` toggle watched) — все с проверкой сессии.
Файлы: `app/api/watchlist/route.ts`, `app/api/watchlist/[id]/route.ts`.
Научиться: скоупинг запросов по `userId` из сессии, аккуратная обработка нарушения constraint (не 500, а понятный ответ).
Проверка: с активной сессией через curl/devtools добавить/получить список/удалить/переключить watched; изменения видны в Neon dev-ветке.

**Этап 7 — Фронтенд поверх реального API**
Реализуем: `app/page.tsx` — поиск (debounce → `/api/search`, кнопка «добавить» → `POST /api/watchlist`), список (`GET /api/watchlist`, кнопки «просмотрено»/удалить).
Файлы: `app/page.tsx` (+ при разрастании — компоненты типа `SearchBar`, `WatchlistCard`).
Научиться: `'use client'` vs серверные компоненты, обновление UI после мутаций (refetch/optimistic).
Проверка: полный ручной сценарий в браузере — логин → поиск «Interstellar» → добавить → отметить просмотренным → удалить → обновить страницу и убедиться, что данные сохранились.

**Этап 8 — Проверка на production-ветке**
Реализуем: убедиться, что Production-окружение Vercel указывает на Neon prod branch, прогнать миграции на prod, пройти весь сценарий на боевом URL.
Файлы: без изменений кода — конфигурация окружений.
Научиться: разница env-переменных по окружениям Vercel, безопасный порядок выката миграций.
Проверка: на боевом URL регистрация нового пользователя и полный сценарий работают, данные изолированы от dev-ветки.

*(Позже, вне этого плана: один Playwright e2e-тест на сценарий логин → поиск → добавление, когда флоу стабилизируется.)*
