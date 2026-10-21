#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Принудительная проверка фида Авито:
  1. POST /autoload/v1/upload — заставить Авито забрать фид прямо сейчас
  2. ждать свежий отчёт (last_completed_report), до ~10 минут
  3. постатейные ошибки → avito-bot/feed-report.txt (коммитится отдельным шагом)
  4. короткая сводка → Telegram всем подписчикам бота (из state)
Секреты: AVITO_CLIENT_ID, AVITO_CLIENT_SECRET, TG_BOT_TOKEN.
"""

import json
import os
import time
import urllib.error
import urllib.parse
import urllib.request

API = "https://api.avito.ru"
TG = "https://api.telegram.org"
STATE_FILE = os.environ.get("STATE_FILE", "state.json")
OUT = "avito-bot/feed-report.txt"
lines: list[str] = []


def log(s: str) -> None:
    print(s)
    lines.append(s)


def http(url: str, data=None, headers=None, form=False, method=None):
    body = None
    h = {"User-Agent": "gm77-feed-check/1.0"}
    if headers:
        h.update(headers)
    if data is not None:
        if form:
            body = urllib.parse.urlencode(data).encode()
            h["Content-Type"] = "application/x-www-form-urlencoded"
        else:
            body = json.dumps(data).encode()
            h["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, headers=h, method=method)
    with urllib.request.urlopen(req, timeout=60) as r:
        raw = r.read().decode()
        return json.loads(raw) if raw.strip() else {}


def main() -> None:
    tok = http(f"{API}/token", form=True, data={
        "grant_type": "client_credentials",
        "client_id": os.environ["AVITO_CLIENT_ID"],
        "client_secret": os.environ["AVITO_CLIENT_SECRET"],
    })["access_token"]
    auth = {"Authorization": f"Bearer {tok}"}
    start = int(time.time())

    # 0) какие отчёты уже есть (чтобы отличить свежий от старых)
    def reports_list():
        try:
            r = http(f"{API}/autoload/v2/reports?per_page=5&page=0", headers=auth)
            return r.get("reports") or r.get("items") or []
        except urllib.error.HTTPError as e:
            log(f"reports list: HTTP {e.code} — {e.read().decode()[:200]}")
            return []

    before = reports_list()
    known = {r.get("id") for r in before}
    log(f"existing reports: {[(r.get('id'), r.get('status'), r.get('started_at')) for r in before[:3]]}")

    # 1) форсировать выгрузку
    try:
        r = http(f"{API}/autoload/v1/upload", data={}, headers=auth, method="POST")
        log(f"force upload: OK {json.dumps(r, ensure_ascii=False)[:200]}")
    except urllib.error.HTTPError as e:
        log(f"force upload: HTTP {e.code} — {e.read().decode()[:300]}")

    # 2) ждать НОВЫЙ завершённый отчёт (до ~11 минут)
    report = None
    for _ in range(45):
        time.sleep(15)
        reps = reports_list()
        fresh = [r for r in reps if r.get("id") not in known]
        if fresh:
            cand = fresh[0]
            st = (cand.get("status") or "").lower()
            log(f"new report id={cand.get('id')} status={st}")
            if st and not st.startswith(("processing", "created", "pending", "in_progress")):
                report = cand
                break
    if not report:
        # фолбэк: последний завершённый
        report = http(f"{API}/autoload/v2/reports/last_completed_report", headers=auth)
        log(f"fallback last_completed: id={report.get('id')} status={report.get('status')}"
            f" finished_at={report.get('finished_at')}")

    rid = report.get("id")
    s = report.get("section_stats") or report.get("statistics") or {}
    log(f"report id={rid} summary: {json.dumps(s, ensure_ascii=False)[:600]}")
    if rid is None:
        log("у отчёта нет id — постатейные ошибки недоступны этим путём")
        return

    # 3) постатейные статусы/ошибки
    errs, ok_count = [], 0
    try:
        page = 0
        while True:
            items = http(f"{API}/autoload/v2/reports/{rid}/items?per_page=200&page={page}",
                         headers=auth).get("items", [])
            if not items:
                break
            for it in items:
                ad = it.get("ad_id") or it.get("id")
                statuses = it.get("statuses") or []
                msgs = []
                for st in statuses:
                    for m in (st.get("messages") or []):
                        t = m.get("title") or m.get("description") or str(m)[:100]
                        msgs.append(t)
                if msgs:
                    errs.append(f"{ad}: " + "; ".join(msgs[:3]))
                else:
                    ok_count += 1
            page += 1
            if page > 10:
                break
    except urllib.error.HTTPError as e:
        log(f"items: HTTP {e.code} — {e.read().decode()[:200]}")

    log(f"ads ok: {ok_count}, ads with messages: {len(errs)}")
    for e in errs[:60]:
        log("ERR " + e)

    # 4) сводка в Telegram подписчикам
    try:
        with open(STATE_FILE, encoding="utf-8") as f:
            subs = json.load(f).get("subscribers", [])
    except (FileNotFoundError, json.JSONDecodeError):
        subs = []
    top = "; ".join(f"{sec.get('title')}: {sec.get('count')}"
                    for sec in (s.get("sections") or []) if isinstance(sec, dict))
    summary = (f"📦 Авито обработал фид\nВсего обработано: {s.get('count', '?')}\n"
               f"{top}\nБез замечаний: {ok_count}, с замечаниями: {len(errs)}")
    if errs:
        summary += "\n\nПервые ошибки:\n" + "\n".join("• " + e[:120] for e in errs[:7])
    for cid in subs:
        try:
            http(f"{TG}/bot{os.environ['TG_BOT_TOKEN']}/sendMessage",
                 data={"chat_id": cid, "text": summary})
        except Exception as e:  # noqa: BLE001
            print(f"tg send failed: {type(e).__name__}")
    print("summary sent to", len(subs), "subscribers")


if __name__ == "__main__":
    try:
        main()
    finally:
        with open(OUT, "w", encoding="utf-8") as f:
            f.write(time.strftime("%Y-%m-%d %H:%M:%SZ", time.gmtime()) + "\n"
                    + "\n".join(lines) + "\n")
