#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Бот лидов Авито → Telegram для GruzMarket77.
Запускается GitHub Actions по крону (каждые ~5 минут):
  1. OAuth-токен Авито (client_credentials)
  2. Непрочитанные чаты аккаунта → новые ВХОДЯЩИЕ сообщения (по state)
  3. Каждое новое — в Telegram всем из TG_CHAT_IDS
State (какие сообщения уже отправлены) — файл state.json, живёт в Actions cache,
в репозиторий не коммитится. В stdout НИКОГДА не печатаем контент переписки —
логи Actions в публичной репе видны всем. Только счётчики.

Секреты (GitHub Secrets → env):
  AVITO_CLIENT_ID, AVITO_CLIENT_SECRET  — кабинет Авито, «Интеграции и API»
  TG_BOT_TOKEN                          — токен бота от @BotFather
  TG_CHAT_IDS                           — id чатов через запятую (Артём, Таиров)
"""

import json
import os
import sys
import time
import urllib.parse
import urllib.request

AVITO_USER_ID = 449315472          # ID аккаунта GruzMarket77 на Авито
STATE_FILE = os.environ.get("STATE_FILE", "state.json")
FRESH_WINDOW = 2 * 3600            # без state берём сообщения за последние 2 часа
API = "https://api.avito.ru"


def http(url: str, data: dict | None = None, headers: dict | None = None,
         form: bool = False) -> dict:
    body = None
    h = {"User-Agent": "gm77-leads-bot/1.0"}
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


def avito_token() -> str:
    r = http(f"{API}/token", form=True, data={
        "grant_type": "client_credentials",
        "client_id": os.environ["AVITO_CLIENT_ID"],
        "client_secret": os.environ["AVITO_CLIENT_SECRET"],
    })
    return r["access_token"]


def tg_send(text: str) -> None:
    token = os.environ["TG_BOT_TOKEN"]
    for chat_id in os.environ["TG_CHAT_IDS"].split(","):
        chat_id = chat_id.strip()
        if not chat_id:
            continue
        try:
            http(f"https://api.telegram.org/bot{token}/sendMessage", data={
                "chat_id": chat_id, "text": text,
                "disable_web_page_preview": True,
            })
        except Exception as e:  # noqa: BLE001 — один сломанный chat_id не должен валить рассылку
            print(f"tg send failed for one chat: {type(e).__name__}")


def main() -> None:
    try:
        with open(STATE_FILE, encoding="utf-8") as f:
            state = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        state = {}

    tok = avito_token()
    auth = {"Authorization": f"Bearer {tok}"}

    chats = http(
        f"{API}/messenger/v2/accounts/{AVITO_USER_ID}/chats?unread_only=true&limit=50",
        headers=auth,
    ).get("chats", [])
    print(f"unread chats: {len(chats)}")

    cutoff_default = int(time.time()) - FRESH_WINDOW
    sent = 0
    for chat in chats:
        chat_id = chat["id"]
        last_seen = int(state.get(chat_id, cutoff_default))

        # имя собеседника и объявление — для текста уведомления (только в TG)
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
            lines = [
                "🔔 Лид с Авито",
                f"От: {name}",
            ]
            if item_title:
                lines.append(f"Объявление: {item_title}")
            lines.append(f"«{text[:500]}»")
            if item_url:
                lines.append(item_url)
            lines.append("Ответить: Авито → Сообщения")
            tg_send("\n".join(lines))
            sent += 1
            last_seen = max(last_seen, int(m.get("created", 0)))

        state[chat_id] = last_seen

    # подчистка state: держим только последние 200 чатов
    if len(state) > 200:
        state = dict(sorted(state.items(), key=lambda kv: kv[1])[-200:])
    with open(STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(state, f)
    print(f"sent to telegram: {sent}")


if __name__ == "__main__":
    try:
        main()
    except urllib.error.HTTPError as e:
        # тело ошибки может содержать чувствительное — печатаем только код и URL-хост
        print(f"HTTP {e.code} from {urllib.parse.urlparse(e.url).netloc}")
        sys.exit(1)
