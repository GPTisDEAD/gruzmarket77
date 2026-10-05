<!-- MARKER: gruzmarket77-canon -->
<!-- READ FIRST — новая сессия входит в проект через ЭТОТ файл. -->
# CANON — ориентация ассистента по проекту «Сайт ИП Таиров / GruzMarket77»

> Новая cloud-сессия Claude Code читает ЭТОТ файл целиком и сразу в работу.
> Опора на `../Running 01 10 26/CLAUDE.md`, `corpus.md`, `summary.md`, `Выбор референса.md`.
> ADR с решениями — рядом в `./adr/`. Больше ничего открывать не нужно для входа в контекст.

## 1. Кто и что
- **Заказчик:** ИП Таиров Г.К., ИНН 050401330914, ОГРНИП 318057100042760, тел. +7 926 614-39-59.
  Профиль — аутстаффинг рабочих, мастеров и бригад на объекты Москвы и МО (ремонт, демонтаж, клининг, грузчики, отделка, электрика, ландшафт).
- **Исполнитель:** ООО «СИРИУС ПРО», Артём Якшин. Pre-revenue R&D. Сайт делаем за свой счёт как кейс/партнёрство.
- **Проект:** корпоративный многостраничник (33 страницы) + лендинг-главная + форма заявки → Telegram+Sheets.
- **Домены:** `gruzmarket77.ru` (основной, канонический), `грузмаркет77.рф` → 301 на `.ru`. Оба зарегистрированы 18.06.2026.
- **Горизонт:** MVP сайта → индексация → первые заявки → продвижение по плану summary.md §4 (3 мес, 20–40 тыс ₽/мес).
- **Текущая стадия:** собран контент-корпус, выбор дизайн-референса в ожидании ответа Таирова, каркас сайта ещё не поднят.

## 2. Регистр работы ассистента
- Короткие ответы по умолчанию. Один пункт за раз. Сначала диагноз, потом решение.
- Не сервильничать, не предлагать радикальные переделки без оценки последствий.
- Приоритеты расставляет Артём. Задача ассистента — держать критерии, подсвечивать дыры.
- Роль: инженер-партнёр + держатель контекста. Не автор маркетинговых текстов — тексты из corpus.md, точка.
- Риски — одной фразой, без катастроф-сценариев.
- Фамильярность допустима в бытовых обменах, НЕ допустима в инженерных блоках (отвлекает).
- Коммуникация с Артёмом — на «ты», русский. Коммуникация в коде/коммитах — английский (стандарт).

## 3. Карта проекта
Единственный репозиторий: **github.com/GPTisDEAD/ciriycpro-online** (публичный).
Рабочая ветка ассистента: **`claude/vibrant-lovelace-m8u2cd`**. Пушим сюда, Артём мерджит в `main`.

```
ciriycpro-online/
├── Running 01 10 26/                   # вводные от Артёма (READ-ONLY для ассистента)
│   ├── CLAUDE.md                       # техбриф: стек, 33 страницы, SEO, LLM
│   ├── corpus.md                       # ИСТОЧНИК ПРАВДЫ по контенту, 1545 строк, 18 разделов
│   ├── summary.md                      # бриф для Таирова
│   └── Выбор референса.md              # 10 сайтов, ждёт выбор 2–3
├── ADR-GruzMarket-26/                  # ЭТОТ блок — ориентация ассистента
│   ├── CANON.md                        # вы здесь
│   ├── BACKLOG.md                      # очередь работ, что ждёт от кого
│   ├── TODO-artem.md                   # пошаговый чек-лист Артёма на утро
│   ├── photo-plan.md                   # 17 слотов фото + промпты для Gemini
│   └── adr/                            # архитектурные решения по Найгарду
│       ├── ADR-001-stack-astro.md
│       ├── ADR-002-form-cloudflare-worker.md
│       ├── ADR-003-hosting-github-pages.md
│       ├── ADR-004-css-vanilla-no-tailwind.md
│       ├── ADR-005-content-source-of-truth.md
│       ├── ADR-006-delivery-via-fork-relay.md         # schему sync вместо патчей/App
│       ├── ADR-007-project-pages-preview.md           # ВРЕМЕННЫЙ — URL rewrite до DNS
│       ├── ADR-008-form-fallback-and-env-endpoint.md  # форма: WhatsApp → Worker по env
│       ├── ADR-009-llm-layer.md                       # /llms.txt + md-зеркала
│       ├── ADR-010-env-driven-analytics.md            # PUBLIC_* env без хардкода
│       ├── ADR-011-quality-gate-check-contacts.md     # chk-скрипт 226 контактов
│       ├── ADR-012-trailing-slash-directory-format.md # SEO + canonical без редиректов
│       └── ADR-013-vanilla-js-forms-no-react.md       # отход от ADR-001 для формы
├── site/                               # Astro-проект, рабочая копия (пушим в ciriycpro/gruzmarket77)
│   ├── src/
│   │   ├── content/                    # Astro 5 collections (нарезка corpus.md)
│   │   │   ├── services/   (14 .md)
│   │   │   ├── cases/      (5 .md)
│   │   │   ├── audiences/  (4 .md)
│   │   │   ├── company.json  prices.json  faq.json
│   │   ├── pages/                      # 34 страницы + llms.txt + llms-full.txt + md-зеркала
│   │   ├── layouts/BaseLayout.astro    # OG, canonical, Google Fonts, Analytics
│   │   ├── components/                 # Header, Footer, MobileBar, Hero, ServiceCard, CaseCard,
│   │   │                               # FaqList (JSON-LD), LeadForm, PriceTable, Breadcrumbs,
│   │   │                               # JsonLd (LocalBusiness/Service), Analytics (YM)
│   │   └── styles/global.css           # дизайн-токены §8 CANON
│   ├── public/                         # robots.txt, favicon.svg, og-default.jpg (1200×630)
│   ├── worker/                         # Cloudflare Worker: honeypot+rate-limit+Telegram+Sheets
│   ├── .github/workflows/deploy.yml    # GitHub Pages build (URL rewrite — ADR-007)
│   ├── astro.config.mjs                # SSG, sitemap integration, site = gruzmarket77.ru
│   ├── content.config.ts               # Zod-схемы коллекций
│   └── package.json
├── scripts/                            # операционные скрипты (не часть сайта)
│   ├── split-corpus.mjs                # идемпотентная нарезка corpus → collections
│   ├── check-contacts.mjs              # ADR-011, quality gate
│   ├── sync-site.sh                    # ADR-006, доставка в прод
│   ├── enable-pages.sh                 # первый запуск Pages без браузера
│   └── fetch-refs*.sh / fix-github-auth.sh  # исторические, инцидент 2026-10-01
└── Running 01 10 26/references/        # снапшоты 3 референсов, ~8 МБ CSS/IMG/fonts (можно удалить после утверждения дизайна)
```

Прочие артефакты вне этого пути (`AI-telematica-brief/`, `compliance-assistant/`, `mvp/`, `site_copy/`, `ciriyc-ru-assistant/`) — соседние проекты в той же репе, нас не касаются. Не редактировать.

## 4. Среда и стек
- **Фреймворк:** Astro (SSG, статический вывод). React-острова только для интерактива (форма, калькулятор).
- **Контент:** Markdown + JSON через Astro Content Collections. Источник правды — `Running 01 10 26/corpus.md`.
- **Стили:** vanilla CSS + custom properties (без Tailwind). Один `global.css` + scoped-стили компонентов.
- **Шрифты:** Manrope 700/800 (заголовки), Inter 400/500/600 (текст). Google Fonts, `font-display: swap`.
- **Иконки:** Lucide, монохром.
- **Хостинг:** GitHub Pages через GitHub Actions. Домен `gruzmarket77.ru` подключается CNAME.
- **Форма:** Cloudflare Worker → Telegram Bot API + Google Sheets. Honeypot + rate-limit. Скрытые поля: URL, UTM, timestamp.
- **Аналитика:** Яндекс.Метрика (обязательно), опционально Umami/Plausible.
- **Среда разработки ассистента:** cloud-сессия Claude Code в контейнере Anthropic. Пушу напрямую в ветку `claude/vibrant-lovelace-m8u2cd`.
- **Среда Артёма:** MacBook Pro, pull → review → merge PR в `main` → auto-deploy через Actions.

## 5. Git / gh — минимум
Коммит-формат: короткий императив, по-английски. Один коммит = одна осмысленная единица.
```
scaffold: astro project init
content(services): add demontazh page from corpus §6.1
seo: add JSON-LD LocalBusiness to layout
```
Цикл в cloud-сессии:
```
git checkout claude/vibrant-lovelace-m8u2cd
# правки
git add <files>
git commit -m "..."
git push -u origin claude/vibrant-lovelace-m8u2cd
```
Pull Request в `main` открывает Артём (сервер иногда отказывает PR от App).
Атрибуция в коммите: обязательные футеры Claude Code (`Co-Authored-By`, `Claude-Session`). В теле коммита — без упоминания модели (запрет из системного промпта).

## 6. Антипаттерны
- **НЕ** коммитить секреты. Токены Telegram, Google Sheets credentials, UTM-ключи, PAT GitHub — только `.env` + Cloudflare Worker Secrets. `.gitignore`: `*.env`, `*.key`, `*_rsa`, `secrets/`, `*.local`.
- **НЕ** вставлять токены в чат. Если нужен для настройки — Артём кладёт в Cloudflare dashboard напрямую.
- **НЕ** добавлять услуги/цены/кейсы, которых нет в `corpus.md`. Если нужно — пометка `TODO:согласовать` и в STATUS.
- **НЕ** менять цены без явного утверждения Артёмом.
- **НЕ** ставить Tailwind, jQuery, Material UI, Chakra, тяжёлые UI-киты. Это решение зафиксировано в ADR-004.
- **НЕ** использовать `localStorage` для состояния формы (приватность, GDPR-гигиена).
- **НЕ** писать сервильных текстов («будем рады», «с удовольствием», «мы — команда профессионалов»). Регистр — прямой, деловой. B2B.
- **НЕ** вставлять стоковые фото людей. До появления реальных фото — CSS-градиенты/паттерны/иконки.
- **НЕ** использовать эмодзи в коде, коммитах, UI сайта. В чате с Артёмом — изредка допустимо.
- **НЕ** писать документацию в код-комментах. Комментарий — только если WHY неочевидно.
- **НЕ** импровизировать с дизайном до выбора референса Таировым. Пока — нейтральные CSS custom properties, подменяемые.
- **НЕ** деплоить в `main` напрямую. Только через PR.

## 7. Источник правды по контенту
**Если код расходится с `corpus.md` — прав `corpus.md`.** Безоговорочно.
Если `corpus.md` расходится с живым словом Таирова — ассистент помечает `TODO:согласовать`, не выдумывает.
Правки корпуса делает Артём после разговора с Таировым. Ассистент корпус не редактирует.

Матрица «аудитория → услуги → кейс» — `corpus.md §3.3`. Все внутренние ссылки обязательны по матрице.

Данные компании (NAP) — одинаковые везде. Единственный источник: `src/content/company.json`.

## 8. Дизайн-контракт (v2 — утверждён 2026-10-01)

Таиров выбрал референсы 4, 6, 7 из `Выбор референса.md`: autpersonal.ru, autsorsing-personala.ru, gruzchikimoscow.ru. CSS скачаны в `Running 01 10 26/references/`. Значения ниже выверены по их реальным токенам.

### Палитра (CSS custom properties)
```css
:root {
  --ink: #1C252B;              /* основной текст, от autsorsing */
  --ink-muted: #4B5053;        /* вторичный текст */
  --paper: #FFFFFF;
  --paper-soft: #F7F9FB;       /* фон секций, от autsorsing */
  --paper-stripe: #EEF1F5;     /* чередование строк в прайсе */

  --accent: #F47B20;           /* CTA, акценты — подтверждён у gruzchiki template (#f69323) */
  --accent-hover: #D96610;
  --accent-soft: #FFF2E6;      /* бейджи, светлые акценты */

  --success: #2E7D32;
  --warning: #FBBF24;
  --danger: #D40000;

  --border: #EDEDED;           /* мягкие границы */
  --border-strong: #D9DDDF;    /* сильные границы, от autsorsing */
}
```

### Типографика
```css
--font-heading: 'Manrope', system-ui, sans-serif;   /* 700/800 — подтверждён у autsorsing */
--font-body:    'Inter', system-ui, sans-serif;     /* 400/500/600 — замена Gilroy (платный) */

--fs-xs: 13px; --fs-sm: 14px; --fs-base: 16px; --fs-lg: 18px;
--fs-h3: 22px; --fs-h2: 32px; --fs-h1: 48px;
--lh-tight: 1.2; --lh-base: 1.5; --lh-loose: 1.7;
```

### Форма и геометрия
```css
--radius-sm: 5px;             /* кнопки, инпуты — доминант рынка (autsorsing 32 вхождения) */
--radius-md: 10px;            /* карточки */
--radius-lg: 20px;            /* большие блоки, от autsorsing */

--shadow-sm:   0 1px 2px rgba(0,0,0,.05);
--shadow-md:   0 4px 18px rgba(8,35,48,.08);         /* мягкая, с синевой */
--shadow-lift: 0 6px 36px rgba(38,62,77,.1);         /* фирменная autsorsing */

--container: 1200px;
--grid-gap: 24px;
```

### Hero
- Слева: H1 (Manrope 800, 48px) + подзаголовок + CTA primary + CTA ghost + 4 trust-badge.
- Справа: калькулятор-мини «Кого? → Сколько? → На сколько? → Рассчитать».
- Фон: `--paper-soft`.

### Прайс — HTML-таблица
`Услуга | Бригада | Срок | Цена от | CTA`. Чередование строк `--paper-stripe`. Заголовок sticky при скролле. Hover подсвечивает строку `--accent-soft`.

### Карточки услуг
Плитка 3-в-ряд (мобилка 1-в-ряд). Заголовок + бейдж с ценой `--accent-soft` + 1 строка-ответ + ссылка «Подробнее →».

### Кнопки
- `.btn-primary`: `--accent` фон, белый текст, 14×28px, `--radius-sm`, Manrope 700.
- `.btn-ghost`: прозрачный фон, `--border-strong` рамка 1.5px, hover — рамка `--ink`.

### Мобильная нижняя панель
Фон `--ink`, три секции: `WhatsApp · Позвонить · Заявка`. CTA «Заявка» — на фоне `--accent`.

### B2B-акцент
Отдельная вкладка «Для бизнеса» в хедере → `/dlya-biznesa/` с крупными цифрами («24ч», «от 400 ₽», «бесплатная замена»).

### Фото
Пока нет — CSS-паттерн или градиент `linear-gradient(135deg, #1C252B 0%, #3A4047 100%)` + диагональный паттерн. Слоты под «до/после» в кейсах.

### Live preview
`Running 01 10 26/design-preview.html` — живой образец всего визуального языка на реальных данных из `corpus.md`. Открывается через https://raw.githack.com/GPTisDEAD/ciriycpro-online/claude/vibrant-lovelace-m8u2cd/Running%2001%2010%2026/design-preview.html.

### Что НЕ менять без согласования
Все значения выше. Правка требует правки CANON + апдейта `design-preview.html` + показа Таирову.

## 9. LLM-оптимизация (отдельный приоритет, не приложение)
Цель — попасть в цитирование ChatGPT/Claude/Perplexity/Яндекс.Нейро/Alice/Gemini по запросам «аренда бригады Москва», «демонтаж квартиры цена», «клининг после ремонта», «грузчики на объект» и т.д.

**Базовый минимум (из CLAUDE.md, обязательно):**
- `/llms.txt` по спецификации llmstxt.org (H1, blockquote, разделы `## Docs`, `## Optional`).
- `/llms-full.txt` — весь контент услуг и FAQ в plain text.
- Markdown-зеркало каждой страницы: `/uslugi/demontazh.md`, `/kejsy/sanuzel-kuhnya.md` и т.д. (Astro endpoint).
- `robots.txt` явно разрешает: `GPTBot`, `ClaudeBot`, `anthropic-ai`, `PerplexityBot`, `Google-Extended`, `YandexBot`, `Bingbot`.
- JSON-LD на каждой странице: `LocalBusiness` (главная/контакты), `Service`+`Offer` (14 услуг), `FAQPage` (FAQ и блоки), `Article` (блог), `BreadcrumbList` (везде).
- NAP-консистентность: телефон/адрес/часы одинаковые на всех страницах, источник — `company.json`.

**Усиление GEO/AEO (сверх базы, для топ-видимости):**
- **AEO-формат первого абзаца:** на каждой странице услуги — готовая цитата с цифрами, которую LLM процитирует дословно. Шаблон: *«Демонтаж квартиры в Москве — от 150 ₽/м², бригада 3–5 человек, срок 1–3 дня. Выезд в течение 24–48 часов.»*
- **E-E-A-T сигналы:** страница «О нас» с реальным опытом, фото бригад за работой (когда появятся), ИНН/ОГРНИП в футере, ссылки на разрешения/СРО если есть.
- **`Organization` schema с `sameAs`** — ссылки на все внешние профили (Авито, Профи.ру, Яндекс.Карты, 2ГИС, Telegram-канал).
- **`PriceSpecification` + `AggregateOffer`** с валютой `RUB`, зоной `areaServed: Moscow`, условиями.
- **Семантические якоря:** `<section id="demontazh-ceny">`, `<section id="demontazh-faq">` — чтобы LLM цитировал с якорем.
- **JSON-эндпоинты для агентов:** `/api/services/demontazh.json` со структурой `{slug, title, price_from, brigade, duration, area, description}`. LLM-агенты OpenAI/Perplexity умеют их читать.
- **`<link rel="alternate" type="text/markdown" href="/uslugi/demontazh.md">`** в `<head>` каждой страницы — указывает LLM каноническую plain-версию.
- **Отсутствие JS-only контента:** всё ключевое в HTML при первой загрузке. Astro это даёт, фиксируем правилом.
- **Короткие точные FAQ:** 1–2 предложения, никаких «воды для SEO». Факт + цифра.
- **Транскрипты голосовых отзывов** (когда появятся) — LLM предпочитает текст.

**Критерий успеха (как измерим):**
- Через 2–3 мес после запуска: тестовый запрос в ChatGPT/Claude/Perplexity «аренда бригады грузчиков Москва цена» — сайт либо в цитировании, либо в source-list.
- Метрика в Я.Метрике: доля заходов из AI-источников (ChatGPT, Perplexity, Google AI Overview).

## 10. Карта контента (сокращённая)
Полная — в `Running 01 10 26/CLAUDE.md` §Карта сайта. Здесь — что где лежит в коде.
```
corpus.md §4   → src/pages/index.astro (главная, 11 блоков)
corpus.md §5   → src/content/audiences/*.md (4 файла)
corpus.md §6   → src/content/services/*.md (14 файлов)
corpus.md §8   → src/content/cases/*.md (5 файлов)
corpus.md §7   → src/content/prices.json
corpus.md §11  → src/content/faq.json
corpus.md §12  → src/content/blog/*.md (8 стартовых тем)
corpus.md §13  → src/pages/kontakty.astro, zayavka.astro
corpus.md §17  → src/content/company.json
```
Единая структура страницы услуги (из CLAUDE.md): H1 → AEO-абзац → что входит → кому → прайс → бригада и сроки → как заказать (3 шага) → 3 связанные услуги → кейс → FAQ (3) → заявка.

## 11. Доставка артефактов из cloud-сессии

### Два репозитория, два канала
- **`GPTisDEAD/ciriycpro-online`** (рабочая репа ассистента): App установлен, ассистент пушит НАПРЯМУЮ в ветку `claude/vibrant-lovelace-m8u2cd`. Здесь живут: CANON, ADR, вводные, references, скрипты, патчи, рабочая копия кода в `/site/`.
- **`ciriycpro/gruzmarket77`** (продакшн-репа сайта): App НЕ установлен, прямого push у ассистента НЕТ. Доставка — **только патчами** (см. ниже), как в ops-CANON v1.2.

### Инцидент 2026-10-01 и решение (НЕ повторять грабли)
**Проблема.** Потрачено ~2 часа на попытки дать ассистенту push в новую репу:
- токен `GPTisDEAD` в gh протух (401), relogin требует браузер/почту (sudo mode);
- у `ciriycpro` нет write в `GPTisDEAD/ciriycpro-online` (403), пришлось пушить через форк;
- скрипт `fix-github-auth.sh` поставил глобальную подмену `insteadOf https→ssh`, SSH-ключ при этом не был залит → ЛЮБОЙ https-push на Маке стал падать с «Permission denied (publickey)»;
- `gh repo create` под GPTisDEAD упал (протухший токен), репу создали под `ciriycpro`;
- установка Claude App требует браузер + email-верификацию — Артём это делать не обязан.

**Решение (работает, проверено).** Схема из ops-CANON v1.2 — `git format-patch` → `git am`:
1. Ассистент коммитит код в `/site/` рабочей репы (push туда есть).
2. Ассистент генерирует патч: `git format-patch -1 <sha> --stdout -- site/ > patches/NNNN-name.patch`, правит `From:` на `Artem Yakshin <inbox@ciriyc.ru>`, пушит в `patches/`.
3. Артём применяет ОДНОЙ командой: `curl -sSL <raw-url скрипта> | bash` — скрипт `scripts/apply-site-patch.sh` сам: переключает gh на ciriycpro, снимает insteadOf-подмену, клонит/пуллит `gruzmarket77`, применяет `git am -p2` (срезает префикс `site/` — файлы ложатся в корень), пушит строго токеном gh (`git -c credential.helper= -c credential.helper='!gh auth git-credential' push`), минуя keychain.

**Правила из инцидента:**
- НЕ трогать auth-настройки Mac Артёма скриптами без крайней нужды; если скрипт ставит глобальный git config — он ОБЯЗАН уметь его снять, и следующий скрипт снимает его защитно.
- НЕ просить Артёма ходить в браузер/почту для GitHub (sudo mode, App install, token refresh) — всё решается патч-схемой.
- Многострочные команды в чат НЕ давать — копипаст в zsh ломается на невидимых символах (NBSP): «command not found: mkdir». Только `curl <raw-url> | bash` из скрипта в репе.
- Долгие загрузки в скриптах: таймаут ≤8с, параллелизм, жёсткие лимиты количества файлов — иначе «висит» (инцидент с fetch-refs-full: 30с × десятки шрифтов).
- Пустая свежая репа: `git am` требует HEAD → сначала `git commit --allow-empty -m init`, затем `git branch -M main` (на старом git дефолт — master).

### Прочее
- По завершении логической единицы — обновлять §13 STATUS и пушить.
- Правка в уже доставленном коде — новым коммитом и новым патчем (не amend, не force-push, не history rewrite).

Запрещено:
- `git push --force*`
- `git reset --hard` на origin/*
- `git commit --amend` на уже запушенные коммиты
- Прямой push в `main`
- Создание веток кроме рабочей без согласования

Чувствительное (телефоны, доступы, бюджет Таирова) — в этот файл НЕ попадает. Если нужно сослаться — ссылка на внешний приватный документ или в Cloudflare Secrets.

## 12. Хэндовер между сессиями
Когда у cloud-сессии кончаются кредиты / она закрывается / Артём стартует новую — следующий ассистент должен войти в контекст без расспросов.

**Что читает новая сессия (в этом порядке):**
1. `ADR-GruzMarket-26/CANON.md` — этот файл.
2. `ADR-GruzMarket-26/adr/*.md` — все ADR.
3. `Running 01 10 26/CLAUDE.md` — техбриф Артёма.
4. `Running 01 10 26/corpus.md` — если задача про контент.
5. §13 STATUS этого файла — что уже сделано, что в работе, что заблокировано.

**После чтения — не задаёт вопросов «а что мы делаем», сразу берёт из STATUS следующий пункт.**

**Правила обновления STATUS:**
- Коротко, по-телеграфному.
- Трёхрядная структура: Сделано / В работе / Заблокировано.
- Обновлять в конце каждой логической единицы работы.
- Дата последнего апдейта в заголовке блока.

## 13. STATUS (живой блок — обновляется по ходу)
**Апдейт:** 2026-10-01, вечер

**Фаза:** превью сайта в проде на github.io, инфра-ключи ждут Артёма.

**Сделано:**
- Вводные залиты (`CLAUDE.md`, `corpus.md`, `summary.md`, `Выбор референса.md`); CANON v1 + 5 ADR утверждены.
- Таиров выбрал референсы 4/6/7; снапшоты скачаны в `references/` (~8 МБ, HTML+CSS+IMG+fonts).
- Дизайн-код v2 выверен по реальным CSS референсов (§8), `design-preview.html` v3 (+5 блоков) утверждён Артёмом.
- Решён вопрос хостинга: отдельная репа **`ciriycpro/gruzmarket77`** (ADR-003 требует корректировки: CNAME корня занят ciriycpro.online).
- Налажена доставка патчами (§11): патч 0001 (каркас: package.json, config, токены, BaseLayout, Header) применён и запушен в `gruzmarket77` main.

**В работе:**
- Превью-сайт жив: https://ciriycpro.github.io/gruzmarket77/ (GitHub Pages прод-репы,
  временная перепись URL под подпапку — см. deploy.yml, уберётся при DNS).
- Сайт собран целиком: главная 11 блоков, 14 услуг, 5 кейсов, 4 аудитории,
  цены/FAQ/контакты/мастера/как-работаем/заявка/политика/блог-анонс.
- LLM-слой: /llms.txt, /llms-full.txt, 19 md-зеркал, JSON-LD (LocalBusiness,
  Service+Offer, FAQPage, BreadcrumbList), robots с allow для LLM-ботов.
- Форма жива: WhatsApp-фолбэк до деплоя воркера; код воркера готов в `site/worker/`.
- Контакты проверены скриптом `scripts/check-contacts.mjs`: 119 tel / 70 wa /
  37 mailto — все валидные, заглушек нет.
- Метрика: компонент готов, ждёт PUBLIC_YM_ID. OG-картинка 1200×630 сгенерена.

**Очередь и блокеры — в `BACKLOG.md` (этой же папки).** Коротко, ждёт Артёма:
- Telegram-бот (токен+chat_id), Google SA+таблица, Cloudflare деплой воркера.
- Номер счётчика Я.Метрики.
- DNS в SpaceWeb (записи — в BACKLOG).
- AI-фото по `photo-plan.md` (промпты готовы) / реальные фото Таирова.
- Согласование прайса и кейсов Таировым.

**Отложено:**
- Чистка ветки `claude/awesome-goodall-bmsrsb` (у App нет прав, Артём удалит через GitHub UI).
- Фото «до/после» для кейсов — появятся позже.
- Блог (8 тем из corpus §12) — после MVP.
