# ADR-003: Hosting — GitHub Pages

**Status:** Accepted · 2026-10-01

## Context
Нужен хостинг для статического сайта на домене `gruzmarket77.ru`. Требования: бесплатно, auto-deploy из репы при merge в `main`, HTTPS из коробки, работает из РФ.

Рассмотрены:
- **Vercel** — отличный DX, но для статики overhead; есть риски блокировок в РФ в отдельных ISP.
- **Netlify** — аналогично Vercel.
- **Cloudflare Pages** — реальный вариант, но у нас уже Cloudflare Worker — не хочется концентрировать всё у одного вендора.
- **VPS + Nginx** — overhead, uptime на мне.
- **Хостинг у reg.ru / timeweb** — платно, устаревший UX, ручной деплой.

## Decision
**GitHub Pages** с auto-deploy через GitHub Actions (`.github/workflows/deploy.yml`). Триггер — push в `main`. Домен подключается через CNAME (`CNAME` файл в `public/` + DNS A/CNAME-записи на `gruzmarket77.ru`).

`грузмаркет77.рф` — отдельный DNS, редирект 301 на `gruzmarket77.ru` через Cloudflare Page Rules или DNS-провайдера.

## Consequences
**Плюсы:**
- Полностью бесплатно.
- Auto-deploy из той же репы, где код — zero friction.
- HTTPS Let's Encrypt автоматический.
- Доступен из РФ стабильно.

**Минусы:**
- Нет серверной логики (решено через Cloudflare Worker — ADR-002).
- Публичный репозиторий обязателен для free tier (у нас и так публичный).
- `main` branch становится production — нужна дисциплина PR-review.
- Latency из РФ больше, чем у российского CDN — компенсируется статикой + Cloudflare перед доменом (опционально, позже).
