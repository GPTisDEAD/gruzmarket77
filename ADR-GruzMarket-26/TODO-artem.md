# TODO Артёма — добиваем инфраструктуру (≈40 мин чистого времени)

> Порядок важен: 1→2→3 связаны (бот и таблица нужны воркеру).
> После каждого блока — отметь галку и скинь ассистенту указанные значения.

## 1. Telegram-бот (5 мин) — для приёма заявок

- [ ] В Telegram открой **@BotFather** → `/newbot` → имя: `GruzMarket77 Leads`,
  юзернейм: `gruzmarket77_bot` (или любой свободный) → получишь **BOT_TOKEN**.
- [ ] Открой **@userinfobot** → `/start` → он покажет твой **chat_id** (число).
  (Если заявки должны падать Таирову — пусть он сделает то же самое, его chat_id.)
- [ ] Напиши своему новому боту любое сообщение (иначе он не сможет писать первым).
- [ ] **Ассистенту:** BOT_TOKEN не присылай в чат! Он пойдёт только в Cloudflare
  (шаг 3). В чат пришли только **chat_id**.

## 2. Google-таблица + сервис-аккаунт (10 мин) — журнал заявок

- [ ] Создай таблицу на sheets.google.com, назови «Заявки GruzMarket77».
  Первая строка-шапка: `Время | Имя | Телефон | Задача | Когда | Страница | UTM`.
- [ ] Скопируй **SHEETS_ID** — кусок URL между `/d/` и `/edit`.
- [ ] console.cloud.google.com → создай проект `gruzmarket77` →
  APIs & Services → Enable **Google Sheets API**.
- [ ] IAM & Admin → **Service Accounts** → Create: имя `lead-writer` →
  Create Key → **JSON** → скачается файл ключа.
- [ ] Вернись в таблицу → Share → вставь email сервис-аккаунта
  (`lead-writer@gruzmarket77-...iam.gserviceaccount.com`) → роль **Editor**.
- [ ] **Ассистенту:** пришли только SHEETS_ID. JSON-ключ — в Cloudflare (шаг 3).

## 3. Cloudflare Worker (10 мин) — мотор формы

- [ ] Аккаунт на dash.cloudflare.com (бесплатный, без домена).
- [ ] В терминале на Маке:
  ```
  cd ~ && rm -rf gm-worker && git clone --depth 1 https://github.com/ciriycpro/gruzmarket77.git gm-worker && cd gm-worker/worker
  npx wrangler login        # откроет браузер один раз — это неизбежно, Cloudflare
  npx wrangler deploy
  npx wrangler secret put TELEGRAM_BOT_TOKEN   # вставишь токен из шага 1
  npx wrangler secret put TELEGRAM_CHAT_ID     # chat_id из шага 1
  npx wrangler secret put SHEETS_ID            # из шага 2
  npx wrangler secret put GOOGLE_SA_KEY        # содержимое JSON-файла ОДНОЙ строкой:
  #   cat ~/Downloads/gruzmarket77-*.json | tr -d '\n'  → скопируй вывод → вставь
  ```
- [ ] `wrangler deploy` в конце напечатает URL вида
  `https://gruzmarket77-lead.<твой-сабдомен>.workers.dev` — **пришли его ассистенту**,
  он пропишет в сборку сайта (PUBLIC_LEAD_ENDPOINT) и форма переключится
  с WhatsApp-фолбэка на Telegram+Sheets.
- [ ] Тест: ассистент после прописки дёрнет форму, заявка упадёт в твой Telegram
  и в таблицу.

## 4. Яндекс.Метрика (5 мин)

- [ ] metrika.yandex.ru → Добавить счётчик → сайт `gruzmarket77.ru`
  (пока укажи и `ciriycpro.github.io` в доп. доменах) → включи вебвизор.
- [ ] **Ассистенту:** пришли номер счётчика (8 цифр).

## 5. DNS в SpaceWeb (5 мин) — боевой домен

- [ ] Панель SpaceWeb → домен **gruzmarket77.ru** → DNS-записи:
  ```
  A     @    185.199.108.153
  A     @    185.199.109.153
  A     @    185.199.110.153
  A     @    185.199.111.153
  CNAME www  ciriycpro.github.io.
  ```
  (старые A/AAAA записи на @ — удалить, если есть)
- [ ] Домен **грузмаркет77.рф** → включи редирект 301 на `https://gruzmarket77.ru`
  (у SpaceWeb это пункт «Перенаправление» / «Редирект»).
- [ ] **Ассистенту:** напиши «DNS готов» — он вернёт CNAME в репу, уберёт
  временную перепись URL, включит домен в Pages и дождётся HTTPS-сертификата.
  С этого момента сайт живёт на https://gruzmarket77.ru.

## 6. Фото в Gemini (15 мин, можно позже)

- [ ] Открой `ADR-GruzMarket-26/photo-plan.md` — там 11 готовых промптов.
- [ ] Генерируй в Gemini/Imagen, складывай с именами из таблицы плана.
- [ ] Залей в `site/public/img/cases/` (через sync-скрипт или скажи ассистенту —
  примет любым путём) → он вставит в код.

## Что пришлёшь ассистенту одним сообщением (без секретов!)

```
chat_id: ...
SHEETS_ID: ...
worker URL: https://...workers.dev
метрика: ...
DNS: готов / не готов
```

Токен бота и JSON-ключ — ТОЛЬКО в wrangler secret, в чат не кидать (CANON §6).
