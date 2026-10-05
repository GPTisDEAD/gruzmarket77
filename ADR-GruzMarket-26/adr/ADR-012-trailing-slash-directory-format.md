# ADR-012: Trailing slash + directory format

**Status:** Accepted · 2026-10-01

## Context
Для 34 страниц + 19 markdown-зеркал + llms.txt нужно решить, в каком виде
Astro выводит URL. Варианты и последствия:

- `foo.html` в корне → `example.com/foo.html` — некрасиво, LLM и Google хуже
  индексируют (считают файлом).
- `foo/index.html` → `example.com/foo` (без слэша) → может редиректиться
  Pages/CDN на `example.com/foo/` → канонизация ломается, SEO двойные URL.
- `foo/index.html` → `example.com/foo/` (с слэшем) — чистый URL, стабильно
  работает на всех статических хостах, канонические совпадают с реальными.

## Decision
В `astro.config.mjs`:
```js
output: 'static',
trailingSlash: 'always',
build: { format: 'directory', assets: 'assets', inlineStylesheets: 'auto' }
```
Все страницы — `<slug>/index.html`. Все внутренние ссылки — `/foo/` с хвостовым
слэшем. canonical в `<head>` совпадает с реальным URL (без переадресаций).

Markdown-зеркала (`/uslugi/demontazh.md`) и llms.txt — исключение: эндпоинты
отдают один файл, без папки. Это осознанно, md/txt без слэша — стандартное
поведение файловых ссылок.

## Consequences
**Плюсы:**
- Нет 301-редиректов GitHub Pages на добавление `/`.
- Canonical URL = реальный URL = внутренняя ссылка. Google не дробит сигналы.
- Работает одинаково на локальном `npm run dev`, GH Pages, Cloudflare Pages,
  VPS с nginx (`try_files $uri $uri/index.html`).
- `assets: 'assets'` вместо дефолтного `_astro` — читаемые пути в DevTools
  и в sed-переписи URL (ADR-007).
- `inlineStylesheets: 'auto'` — малые CSS встраиваются в HTML, large → в
  отдельный файл; критический CSS не требует настройки.

**Минусы:**
- Если когда-то переедем на хост без index.html-разворота (CDN edge
  функции), придётся настраивать rewrite. Приемлемо: все известные варианты
  (GH Pages, Cloudflare, Vercel, Netlify) умеют.
