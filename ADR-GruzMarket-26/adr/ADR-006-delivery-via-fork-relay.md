# ADR-006: Доставка кода в прод-репу через fork-relay и sync-скрипт

**Status:** Accepted · 2026-10-01 · Supersedes-part-of: ADR-003

## Context
Прод-репа сайта — **`ciriycpro/gruzmarket77`** (создана отдельно, так как в
`GPTisDEAD/ciriycpro-online` CNAME уже занят `ciriycpro.online`).

Ограничения, выявленные инцидентом 2026-10-01:
- Claude GitHub App установлен только на рабочую репу (GPTisDEAD/ciriycpro-online),
  в прод-репу ciriycpro/gruzmarket77 — нет; установка требует браузер + sudo-режим.
- Токен ciriycpro у Артёма рабочий, но push в GPTisDEAD/ciriycpro-online у него нет.
- Токен GPTisDEAD протух, перелогин через браузер — Артёма гонять туда нежелательно.
- Прямой push ассистента в прод-репу невозможен из-за отсутствия App.

Рассмотрены:
- **A. Установить App в прод-репу** — требует браузер+почту Артёма, против CANON.
- **B. Патчи `git format-patch` → `git am` на Маке** — рабочая, но ломкая схема
  v1.2: каждый коммит = патч, легко рассинхрон кода и прода, Артём применяет руками.
- **C. Fork+relay+sync — выбран.**

## Decision
**Fork-relay с sync-скриптом:**
1. Ассистент пушит код в `GPTisDEAD/ciriycpro-online` в ветку
   `claude/vibrant-lovelace-m8u2cd`, папка `/site/*` — рабочая копия сайта.
2. На Mac Артём запускает **`scripts/sync-site.sh`**: клонит обе репы,
   `rsync -a --delete --exclude .git site/ → prod/`, коммитит от имени Артёма,
   пушит в прод через `git -c credential.helper='!gh auth git-credential'`
   (минуя keychain, строго токеном gh/ciriycpro).
3. Прод-репа всегда — зеркало `site/`, drift исключён.
4. Патчи оставлены как исторический артефакт (`patches/`), для текущей работы
   не используются — sync надёжнее.

## Consequences
**Плюсы:**
- Одна команда на Mac после каждой итерации, вне зависимости от объёма изменений.
- Нет App на прод-репе → никаких браузерных sudo-подтверждений.
- Полное зеркало исключает «забыл применить патч».

**Минусы:**
- История коммитов прод-репы = `sync: ...` сообщения; реальная история — в
  рабочей репе. Для аудита смотреть `GPTisDEAD/ciriycpro-online/claude/vibrant-lovelace-m8u2cd`.
- Если Артём правит код прямо в прод-репе — sync затрёт (`--delete`).
  Правило: прод-репа read-only для правок, все изменения — через рабочую.
