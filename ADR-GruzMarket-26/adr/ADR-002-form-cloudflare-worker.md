# ADR-002: Form backend — Cloudflare Worker

**Status:** Accepted · 2026-10-01

## Context
Форма заявки с любой страницы должна уходить:
1. В Telegram Таирова (мгновенное уведомление).
2. В Google Sheets (CRM-журнал: источник, UTM, страница, время).

Требования: бесплатно или почти бесплатно, низкая латентность из РФ, honeypot + rate-limit, секреты не в репе.

Рассмотрены:
- **Firebase Functions** — vendor lock-in Google, холодный старт, сложнее с РФ-биллингом.
- **Formspree / Getform** — платно от 10 заявок/мес, нет гибкости по интеграциям.
- **Собственный VPS + Node** — overhead, нужен сервер, uptime на мне.
- **GitHub Actions webhook** — не для production, overhead.

## Decision
**Cloudflare Worker** на бесплатном tier (100k запросов/день). Один endpoint `/api/lead`, принимает POST → проверяет honeypot и rate-limit (по IP, через Cloudflare KV) → параллельно `fetch` в Telegram Bot API и Google Sheets API → возвращает JSON.

Секреты (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `GOOGLE_SA_KEY`) — через Cloudflare Worker Secrets, в репу не попадают.

## Consequences
**Плюсы:**
- Бесплатно на нашем объёме (ожидаем <500 заявок/мес).
- Edge-latency, worker запускается близко к пользователю.
- Secrets management встроен.
- Простой deploy через `wrangler deploy`.

**Минусы:**
- Worker-код хранится отдельно от Astro-сайта (отдельный `wrangler.toml` в подпапке `worker/`).
- Нужен Cloudflare-аккаунт у Артёма (бесплатный).
- Rate-limit через KV требует настройки namespace.
