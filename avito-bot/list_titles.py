#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Снимает реальные заголовки объявлений из кабинета Авито через API.
Пишет avito-bot/titles-report.txt: id, статус, заголовок."""
import json, os, urllib.parse, urllib.request

API = "https://api.avito.ru"
OUT = "avito-bot/titles-report.txt"
lines = []

def log(s):
    print(s)
    lines.append(s)

def token():
    data = urllib.parse.urlencode({
        "grant_type": "client_credentials",
        "client_id": os.environ["AVITO_CLIENT_ID"],
        "client_secret": os.environ["AVITO_CLIENT_SECRET"],
    }).encode()
    req = urllib.request.Request(f"{API}/token", data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)["access_token"]

def main():
    tok = token()
    hdr = {"Authorization": f"Bearer {tok}"}
    total = 0
    for status in ("active", "rejected", "blocked", "old"):
        page = 1
        while True:
            url = f"{API}/core/v1/items?status={status}&per_page=100&page={page}"
            req = urllib.request.Request(url, headers=hdr)
            try:
                with urllib.request.urlopen(req, timeout=30) as r:
                    data = json.load(r)
            except Exception as e:
                log(f"[{status}] p{page}: ошибка {e}")
                break
            items = data.get("resources", [])
            if not items:
                break
            for it in items:
                total += 1
                log(f"[{status}] {it.get('id')} | {it.get('title','—')}")
            if len(items) < 100:
                break
            page += 1
    log(f"\nВсего объявлений: {total}")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log(f"FATAL: {e}")
    finally:
        with open(OUT, "w") as f:
            f.write("\n".join(lines) + "\n")
