# ADR-007: Превью на Project Pages с переписью URL до подключения домена

**Status:** Removed · 2026-10-02 (действовало 2026-10-01 → 2026-10-02 ночь)

## Context
Домен `gruzmarket77.ru` ещё не подключён (DNS в SpaceWeb, задача на Артёма).
Но Таиров и Артём должны видеть **живой сайт сегодня**, не ждать неделю DNS.

GitHub Pages проекта по умолчанию живёт по URL
`https://ciriycpro.github.io/gruzmarket77/` — **в подпапке `/gruzmarket77/`**.
Astro-сайт собран с `site: 'https://gruzmarket77.ru'` и корневыми путями
(`href="/uslugi/..."`). Открывается в подпапке — все внутренние ссылки ведут в 404.

Рассмотрены:
- **A. Пересобрать с `base: '/gruzmarket77'`** — потребует две конфигурации
  (preview и prod), риск забыть переключить при финальном деплое.
- **B. Отдельная ветка под превью** — удвоение CI, лишние моменты рассинхрона.
- **C. Переписать URL в HTML после сборки — выбран.**

## Decision
В `.github/workflows/deploy.yml` после `npm run build` добавлен шаг:
```yaml
- name: Rewrite root-absolute URLs for project-pages preview
  run: |
    find dist \( -name '*.html' -o -name '*.xml' \) -print0 | xargs -0 sed -i \
      -e 's|href="/|href="/gruzmarket77/|g' \
      -e 's|src="/|src="/gruzmarket77/|g' \
      -e 's|href="/gruzmarket77/gruzmarket77/|href="/gruzmarket77/|g'
```
Третий sed — защита от двойного префикса, если какая-то ссылка уже содержит
`/gruzmarket77/` (в sitemap, например).

Файл `public/CNAME` временно удалён из репы — иначе Pages редиректит github.io
на несуществующий домен и сайт недоступен.

## Consequences
**Плюсы:**
- Сайт работает с первого push, без ожидания DNS.
- Код остаётся с корневыми путями (чистый, под продакшн).
- Один шаг workflow, легко удалить.

**Минусы:**
- При удалении шага и возврате CNAME нужна внимательность: удалить sed-блок,
  вернуть `public/CNAME` со значением `gruzmarket77.ru`, задать custom domain
  через `gh api -X PUT repos/ciriycpro/gruzmarket77/pages -f cname=gruzmarket77.ru`.
- Абсолютные URL с `/gruzmarket77/` могут протечь в кэш CDN/мессенджеров
  (OG-картинки), после перехода на домен — одна волна рефрешей шарингов.

**Удаление этого ADR:** при переходе на домен — пометить status `Removed`,
PR с удалением sed-шага и возвратом CNAME. Не удалять файл — пусть лежит
как исторический след.

## Removed 2026-10-02
sed-блок убран из `.github/workflows/deploy.yml` и
`.github/workflows/sync-and-deploy.yml`. `public/CNAME` восстановлен со
значением `gruzmarket77.ru`. Custom domain в Pages задан через
`gh api -X PUT repos/ciriycpro/gruzmarket77/pages -f cname=gruzmarket77.ru`.
Сайт переехал на https://gruzmarket77.ru, ciriycpro.github.io/gruzmarket77/
даёт 404 либо редирект (как GitHub решит).
