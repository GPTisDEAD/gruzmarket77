# ADR-009: LLM-слой — /llms.txt + /llms-full.txt + md-зеркала каждой страницы

**Status:** Accepted · 2026-10-01 · Implements: CANON §9

## Context
По CANON §9 LLM-видимость — отдельный приоритет (цель: цитирование в
ChatGPT/Claude/Perplexity/Яндекс.Нейро по запросам ниши). Требуется
декларативная реализация, а не разовое упоминание в CLAUDE.md.

Варианты реализации, что сделать «форматом по умолчанию» для LLM:
- **A. Только HTML + JSON-LD** — минимум, но LLM тратят токены на вёрстку.
- **B. HTML + отдельные Markdown-эндпоинты каждой страницы — выбран** (пункт
  llmstxt.org спецификации + промышленный паттерн 2026).

## Decision
Три уровня LLM-канонизации:

**1. `/llms.txt`** — по спецификации llmstxt.org:
H1 название компании, blockquote-UTP, разделы `## Услуги`, `## Аудитории`,
`## Кейсы`, `## Ключевые страницы`, `## Optional`. Каждая ссылка с кратким
описанием одной строкой. Отдаётся text/plain. Генерируется из content
collections (`src/pages/llms.txt.ts`).

**2. `/llms-full.txt`** — полный plain-text дамп: все 14 услуг (H1, AEO,
прайс, что входит), 5 кейсов, 4 аудитории, прайс-таблица, 18 FAQ, контакты.
~30 KB, одним файлом, без вёрстки. Для LLM, которые хотят скачать весь
корпус разом.

**3. Markdown-зеркала каждой услуги и кейса** — `/uslugi/{slug}.md`,
`/kejsy/{slug}.md`. На каждой HTML-странице в `<head>`:
`<link rel="alternate" type="text/markdown" href="...md">`. Это сигнал
LLM: «вот каноническая версия без HTML, используй её для цитирования».
Эндпоинты в `src/pages/uslugi/[slug].md.ts` и `src/pages/kejsy/[slug].md.ts`.

**4. robots.txt** явно разрешает (не Disallow): GPTBot, ClaudeBot,
anthropic-ai, PerplexityBot, Google-Extended, YandexBot, Bingbot.

**5. JSON-LD** — не вместо, а вместе: LocalBusiness, Service+Offer+PriceSpecification,
FAQPage, BreadcrumbList — традиционный Schema.org для Google Rich Snippets.

## Consequences
**Плюсы:**
- Три формата перекрывают разные LLM-pipeline: index-based (llms.txt),
  full-dump (llms-full.txt), per-page citation (md-зеркала).
- Контент — единый источник (Astro collections), все три формата
  генерируются при сборке, не рассинхронизируются.
- Zero cost: добавляет ~50 KB к сборке, 19 markdown-эндпоинтов,
  время сборки +1 сек.

**Минусы:**
- Дублирование контента (HTML + MD + llms-full). Приемлемо: контент мал (~30 KB).
- Нет метрики цитируемости — замерять руками через ChatGPT/Perplexity
  раз в месяц, пока индустрия не выработает стандарт (запланировано в BACKLOG).

## Критерий успеха
Через 2–3 мес после запуска: тестовые запросы в ChatGPT/Claude/Perplexity
(«аренда бригады грузчиков Москва цена», «демонтаж квартиры цена Москва») —
сайт либо в citations, либо в source list. Если нет — пересматриваем структуру.
