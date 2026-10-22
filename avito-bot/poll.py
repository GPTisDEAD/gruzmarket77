#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Бот лидов Авито → Telegram для GruzMarket77.
Запускается GitHub Actions по крону (каждые ~5 минут):
  1. Подписчики: каждый, кто написал боту в Telegram, подписывается сам
     (getUpdates → новым приходит «✅ Вы подключены»). Никаких chat_id руками.
  2. OAuth-токен Авито → непрочитанные чаты → новые ВХОДЯЩИЕ сообщения
  3. Каждое новое — в Telegram всем подписчикам
State (подписчики + что уже отправлено) — файл state.json в Actions cache,
в репозиторий не коммитится. В stdout НИКОГДА не печатаем контент переписки —
логи Actions в публичной репе видны всем. Только счётчики.

Секреты (GitHub Secrets → env):
  AVITO_CLIENT_ID, AVITO_CLIENT_SECRET  — кабинет Авито, «Интеграции и API»
  TG_BOT_TOKEN                          — токен бота от @BotFather
  TG_CHAT_IDS                           — (необязательно) доп. id через запятую
"""

import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

AVITO_USER_ID = 449315472          # ID аккаунта GruzMarket77 на Авито
DIAG_LINES: list[str] = []         # копия диагностики → avito-bot/diag.log (коммитится)


def diag(line: str) -> None:
    print(line)
    DIAG_LINES.append(line)
STATE_FILE = os.environ.get("STATE_FILE", "state.json")
FRESH_WINDOW = 24 * 3600           # без state берём сообщения за последние сутки
API = "https://api.avito.ru"
TG = "https://api.telegram.org"


def http(url: str, data: dict | None = None, headers: dict | None = None,
         form: bool = False) -> dict:
    body = None
    h = {"User-Agent": "gm77-leads-bot/1.1"}
    if headers:
        h.update(headers)
    if data is not None:
        if form:
            body = urllib.parse.urlencode(data).encode()
            h["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            body = json.dumps(data).encode()
            h["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, headers=h)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def tg_call(method: str, data: dict) -> dict:
    return http(f"{TG}/bot{os.environ['TG_BOT_TOKEN']}/{method}", data=data)


def sync_subscribers(state: dict) -> list[str]:
    """Все, кто когда-либо написал боту, — подписчики. Новым шлём подтверждение."""
    subs = set(state.get("subscribers", []))
    # необязательный ручной довесок из секрета (только валидные числа)
    extra = os.environ.get("TG_CHAT_IDS", "")
    subs |= {c.strip() for c in extra.split(",") if re.fullmatch(r"-?\d+", c.strip())}
    try:
        ups = tg_call("getUpdates", {"timeout": 0}).get("result", [])
    except Exception as e:  # noqa: BLE001
        print(f"getUpdates failed: {type(e).__name__}")
        ups = []
    for u in ups:
        m = u.get("message")
        if not m:
            continue
        cid = str(m["chat"]["id"])
        if cid not in subs:
            subs.add(cid)
            try:
                tg_call("sendMessage", {
                    "chat_id": cid,
                    "text": "✅ Вы подключены к лидам GruzMarket77 с Авито. "
                            "Новые сообщения покупателей будут приходить сюда.",
                })
                diag(f"new subscriber confirmed: {cid}")
            except Exception as e:  # noqa: BLE001
                diag(f"confirm failed for {cid}: {type(e).__name__}")
    state["subscribers"] = sorted(subs)
    diag(f"subscribers: {len(subs)}")
    # диагностика: кто эти чаты (маскированно — логи и репа публичны)
    for cid in sorted(subs):
        try:
            ch = tg_call("getChat", {"chat_id": cid}).get("result", {})
            un = ch.get("username") or "-"
            fn = ch.get("first_name") or "-"
            diag(f"who {cid}: username={un[:4]}… name={fn[:2]}…({len(fn)})")
        except Exception as e:  # noqa: BLE001
            diag(f"who {cid}: getChat failed {type(e).__name__}")
    return sorted(subs)


def tg_broadcast(subs: list[str], text: str) -> None:
    for chat_id in subs:
        try:
            tg_call("sendMessage", {
                "chat_id": chat_id, "text": text,
                "disable_web_page_preview": True,
            })
        except Exception as e:  # noqa: BLE001 — один сломанный chat_id не валит рассылку
            print(f"tg send failed for one chat: {type(e).__name__}")


def avito_token() -> str:
    r = http(f"{API}/token", form=True, data={
        "grant_type": "client_credentials",
        "client_id": os.environ["AVITO_CLIENT_ID"],
        "client_secret": os.environ["AVITO_CLIENT_SECRET"],
    })
    return r["access_token"]


def main() -> None:
    try:
        with open(STATE_FILE, encoding="utf-8") as f:
            state = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        state = {}
    if "subscribers" not in state:           # миграция со старого формата
        state = {"subscribers": [], "chats": state if all(
            isinstance(v, int) for v in state.values()) else {}}
    chats_state = state.setdefault("chats", {})

    subs = sync_subscribers(state)

    tok = avito_token()
    auth = {"Authorization": f"Bearer {tok}"}

    # сводка по новым отчётам автозагрузки (Авито забирает фид ~раз в час)
    try:
        reps = http(f"{API}/autoload/v2/reports?per_page=3&page=0", headers=auth)
        reps = reps.get("reports") or reps.get("items") or []
        seen_rep = set(state.get("seen_reports", []))
        for rep in sorted(reps, key=lambda r: str(r.get("started_at"))):
            rid = rep.get("id")
            st_ = (rep.get("status") or "").lower()
            if rid is None or rid in seen_rep or st_.startswith(
                    ("processing", "created", "pending", "in_progress")):
                continue
            seen_rep.add(rid)
            s = rep.get("section_stats") or {}
            top = "; ".join(f"{sec.get('title')}: {sec.get('count')}"
                            for sec in (s.get("sections") or []) if isinstance(sec, dict))
            tg_broadcast(sorted(subs), f"📦 Авито: автозагрузка №{rid}\n"
                                       f"Обработано: {s.get('count', '?')}\n{top}")
            diag(f"autoload report {rid} summarized")
        state["seen_reports"] = sorted(seen_rep)[-20:]
    except Exception as e:  # noqa: BLE001
        diag(f"autoload reports check failed: {type(e).__name__}")
    # ВСЕ свежие чаты, не только непрочитанные: если Таиров открыл чат в
    # приложении раньше бота, флаг unread снимается и лид терялся бы.
    chats = http(
        f"{API}/messenger/v2/accounts/{AVITO_USER_ID}/chats?limit=50",
        headers=auth,
    ).get("chats", [])
    print(f"avito chats fetched: {len(chats)}")

    cutoff_default = int(time.time()) - FRESH_WINDOW
    sent = 0
    for chat in chats:
        chat_id = chat["id"]
        last_seen = int(chats_state.get(chat_id, cutoff_default))

        other = next((u for u in chat.get("users", [])
                      if u.get("id") != AVITO_USER_ID), {})
        name = other.get("name") or "Покупатель"
        ctx = (chat.get("context") or {}).get("value") or {}
        item_title = ctx.get("title") or ""
        item_url = ctx.get("url") or ""

        msgs = http(
            f"{API}/messenger/v3/accounts/{AVITO_USER_ID}/chats/{chat_id}/messages/?limit=20",
            headers=auth,
        ).get("messages", [])
        new_in = sorted(
            (m for m in msgs
             if m.get("direction") == "in" and int(m.get("created", 0)) > last_seen),
            key=lambda m: int(m.get("created", 0)),
        )
        for m in new_in:
            text = (m.get("content") or {}).get("text") or f"[{m.get('type', 'вложение')}]"
            lines = ["🔔 Лид с Авито", f"От: {name}"]
            if item_title:
                lines.append(f"Объявление: {item_title}")
            lines.append(f"«{text[:500]}»")
            if item_url:
                lines.append(item_url)
            lines.append("Ответить: Авито → Сообщения")
            tg_broadcast(subs, "\n".join(lines))
            sent += 1
            last_seen = max(last_seen, int(m.get("created", 0)))

        chats_state[chat_id] = last_seen

    if len(chats_state) > 200:               # подчистка: последние 200 чатов
        state["chats"] = dict(sorted(chats_state.items(), key=lambda kv: kv[1])[-200:])
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f)
    diag(f"unread avito chats: {len(chats)}; leads sent: {sent}")
    try:
        # метка с точностью до часа: diag-коммит не чаще раза в час (heartbeat),
        # плюс немедленно при любом событии (новый подписчик, отчёт, ошибка)
        with open("avito-bot/diag.log", "w", encoding="utf-8") as f:
            f.write(time.strftime("%Y-%m-%d %H:00Z", time.gmtime()) + "\n"
                    + "\n".join(DIAG_LINES) + "\n")
    except OSError:
        pass


if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as e:
        # тело ошибки может содержать чувствительное — только код и хост
        print(f"HTTP {e.code} from {urllib.parse.urlparse(e.url).netloc}")
        sys.exit(1)
