# ADR-004: CSS — Vanilla + custom properties, без Tailwind

**Status:** Accepted · 2026-10-01

## Context
Нужны стили для 33 страниц + компонентов. Требования: минимальный bundle, читаемый HTML для LLM, возможность быстрой подмены дизайн-токенов когда Таиров выберет референс.

Рассмотрены:
- **Tailwind CSS** — популярно, но утилитарные классы раздувают HTML (`class="flex items-center justify-between px-4 py-2 bg-gray-900 ..."`), ухудшают читаемость для LLM и ручного ревью. При подмене дизайн-токенов — надо переписывать классы, а не одно значение.
- **CSS Modules / Styled Components** — требуют JS runtime, Astro-острова усложняются.
- **SCSS** — лишняя preprocessing-ступень без ощутимой выгоды для нашего объёма.
- **CSS-in-JS (Emotion/Linaria)** — лишний слой, Astro это не любит.

## Decision
**Vanilla CSS + CSS custom properties.**

Структура:
- `src/styles/global.css` — токены (`--color-*`, `--font-*`, `--radius-*`, `--space-*`), reset, базовые стили.
- `src/styles/typography.css` — типографика.
- Scoped-стили в каждом Astro-компоненте (`<style>` блок внутри `.astro`).

Все дизайн-переменные вынесены в `:root` в `global.css`. Выбор референса Таирова меняет значения токенов, не вёрстку.

## Consequences
**Плюсы:**
- HTML читается глазами и LLM одинаково хорошо.
- Zero runtime overhead.
- Подмена дизайн-токенов — один файл.
- Astro scoped-стили работают из коробки.

**Минусы:**
- Нет готовых компонентов «из коробки» (придётся писать сами, но у нас всего ~10 компонентов).
- Больше дисциплины для консистентности — компенсируется токенами в `:root`.
- Нет Tailwind IntelliSense в VS Code (приемлемо для нашего объёма).
