# Фото-план GruzMarket77 — карта слотов + промпты генерации

> Ответ на вопрос «где будут фото». Сейчас все слоты закрыты CSS-градиентами
> с диагональным паттерном — сайт выглядит целостно и без фото. Фото добавляются
> двумя волнами: (1) AI-генерация нейтральных сцен БЕЗ ЛИЦ, (2) замена на
> реальные фото Таирова (10–20 с телефона, по summary §6) — приоритет реальным.

## Карта слотов (17 файлов)

| № | Слот | Где на сайте | Размер | Файл |
|---|------|--------------|--------|------|
| 1 | OG-image | шаринг в соцсети/мессенджеры | 1200×630 | `public/og-default.jpg` — СДЕЛАН (текстовый, замена опциональна) |
| 2 | Hero главной (фон за формой) | `/` блок 1 | 900×700 | `public/img/hero.webp` — опционально, сейчас чистый фон |
| 3–7 | Карточки кейсов ×5 | `/kejsy/` + блок 6 главной | 640×320 | `public/img/cases/{slug}-card.webp` |
| 8–12 | «До» страницы кейсов ×5 | `/kejsy/{slug}/` левая панель | 900×560 | `public/img/cases/{slug}-before.webp` |
| 13–17 | «После» страницы кейсов ×5 | `/kejsy/{slug}/` правая панель | 900×560 | `public/img/cases/{slug}-after.webp` |

Отдельная волна (после MVP, НЕ сейчас): горизонтальные фото в hero каждой из
14 услуг (1200×400) и фото бригад на `/mastera/` — только реальные, не AI.

## Правила генерации (все промпты)

- БЕЗ ЛИЦ крупным планом. Люди — только со спины/в перчатках/силуэтом, либо без людей.
- Палитра кадра: графитовые тона + тёплый оранжевый акцент (каска, перчатки, инструмент).
- Стиль: документальная индустриальная фотография, не глянец. Лёгкий шум, естественный свет.
- Негатив-промпт везде: `no faces, no visible logos, no text, no watermark, photorealistic, no cartoon`.

## Промпты (Gemini / Imagen, EN — генерят лучше)

### 3. Кейс demontazh-kvartiry-78 (card + before + after)
- **before:** `Documentary photo, empty soviet-era apartment interior before renovation: old wallpaper, cracked plaster walls, worn parquet floor, dusty window light, no people, muted graphite tones, photorealistic, 35mm`
- **after:** `Documentary photo, apartment stripped to bare concrete after demolition: clean concrete walls and floor, construction debris bags stacked neatly, bright window light, orange safety helmet on floor as accent, no people, photorealistic`
- **card:** использовать «after» с кропом 2:1.

### 4. Кейс uborka-ofisa-240
- **before:** `Open-space office after renovation, before cleaning: construction dust on floor, protective film on windows, paint buckets, scattered packaging, daylight, no people, photorealistic, graphite tones`
- **after:** `Same open-space office spotless after professional cleaning: shiny floor, clean glass walls, daylight, one orange cleaning caddy with supplies as accent, no people, photorealistic`

### 5. Кейс helpery-vystavka
- **before:** `Exhibition hall during stand construction: metal frames, stacked panels, cargo trolleys, workers in orange vests seen from behind in far distance, industrial lighting, photorealistic, no faces`
- **after:** `Finished exhibition stands in a convention hall, rows of chairs neatly arranged, clean aisles, bright hall lighting, no people, photorealistic`

### 6. Кейс sanuzel-kuhnya
- **before:** `Small bathroom stripped for renovation: bare walls with pipe grooves, exposed plumbing points, concrete floor, work light, no people, photorealistic`
- **after:** `Newly renovated bathroom: fresh large-format gray tiles, white bathtub, chrome fixtures, warm spot lighting, no people, photorealistic, clean modern`

### 7. Кейс abonent-klining-120
- **before:** `Office kitchen and desks at evening, slightly messy after workday: cups, paper, bins full, dim light, no people, photorealistic`
- **after:** `Same office spotless in the morning: clean desks, shiny kitchen counter, empty bins, soft daylight, small orange detail (cleaning cloth) as accent, no people, photorealistic`

### 2. Hero главной (опционально)
`Wide documentary photo of a construction site interior in Moscow: worker in orange helmet and vest seen from behind carrying material, graphite concrete tones, warm window light, shallow depth of field, photorealistic, no faces, no logos`

## Как вставлять после генерации

1. Файлы класть в `site/public/img/cases/` по именам из таблицы, формат WebP (или JPG — конвертну).
2. Сказать ассистенту «фото залиты» — он заменит CSS-градиенты на `<img>` с `loading="lazy"`, `width/height`, `alt` в компонентах CaseCard и страницах кейсов. Один коммит.
3. Реальные фото Таирова при поступлении кладутся в те же имена — сайт подхватит без правок кода.
