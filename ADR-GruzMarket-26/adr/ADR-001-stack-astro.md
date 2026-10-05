# ADR-001: Stack — Astro

**Status:** Accepted · 2026-10-01

## Context
Нужен многостраничный корпоративный сайт (33 страницы) с акцентом на SEO, LLM-видимость и быструю загрузку (Lighthouse ≥90 на мобильном). Контент — markdown + JSON, редактируется в репе. Интерактив минимальный (форма заявки, калькулятор смены). 55%+ трафика с мобилок.

Рассмотрены:
- **Next.js** — overkill для статики, тащит React runtime на каждую страницу, медленнее на мобилке, сложнее SEO для multi-page.
- **Nuxt** — аналогично Next, меньше российской экосистемы под нашу задачу.
- **Vanilla HTML + build scripts** — нет content pipeline, медленно разрабатывать, сложно поддерживать 33 страницы в консистентности.
- **Hugo / 11ty** — рабочие варианты, но меньше гибкости для React-островов если понадобятся.

## Decision
**Astro** в режиме SSG (static output). React-острова (`client:visible` / `client:idle`) только для формы заявки и калькулятора — всё остальное статический HTML.

## Consequences
**Плюсы:**
- Нулевой JS по умолчанию → отличный Lighthouse, LLM-friendly (контент в HTML сразу).
- Content Collections из коробки — типизированные schemas для markdown/JSON.
- Простые Astro endpoints для `/llms.txt`, md-зеркал страниц, JSON API.
- Деплой на GitHub Pages работает без танцев.

**Минусы:**
- Island hydration требует аккуратности с состоянием формы (решается React Hook Form локально).
- Меньше готовых enterprise-паттернов, чем в Next.
