#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Диагностика доставки лидов: подписки вебхука Авито + доступность GAS + Telegram getMe."""
import json, os, urllib.parse, urllib.request

API="https://api.avito.ru"
GAS="https://script.google.com/macros/s/AKfycbwlKnAZnDPqRqVf7s84G88Wte8rbwDVd2zXSPDvOo91WNwa0M33PinQrHq4YDv6OmPxjw/exec"

def req(url, data=None, headers=None, form=False, method=None):
    h={"User-Agent":"gm77-diag/1.0"}
    if headers: h.update(headers)
    body=None
    if data is not None:
        body=urllib.parse.urlencode(data).encode() if form else json.dumps(data).encode()
        h["Content-Type"]="application/x-www-form-urlencoded" if form else "application/json"
    r=urllib.request.Request(url, data=body, headers=h, method=method)
    with urllib.request.urlopen(r, timeout=30) as resp:
        return resp.status, resp.read().decode()

print("=== WEBHOOK DIAG ===")
try:
    _, tok = req(f"{API}/token", {"grant_type":"client_credentials",
        "client_id":os.environ["AVITO_CLIENT_ID"],
        "client_secret":os.environ["AVITO_CLIENT_SECRET"]}, form=True)
    token=json.loads(tok)["access_token"]
    print("avito token: OK")
except Exception as e:
    print(f"avito token FAIL: {e}"); raise SystemExit(0)

try:
    st, body = req(f"{API}/messenger/v1/subscriptions", data={}, headers={"Authorization":f"Bearer {token}"})
    print(f"subscriptions HTTP {st}: {body[:500]}")
except Exception as e:
    print(f"subscriptions FAIL: {e}")

try:
    st, body = req(GAS, {"source":"diag","text":"webhook-diag ping"}, form=True)
    print(f"GAS HTTP {st}: {body[:200]}")
except Exception as e:
    print(f"GAS FAIL: {e}")

try:
    st, body = req(f"https://api.telegram.org/bot{os.environ['TG_BOT_TOKEN']}/getMe", data={})
    print(f"tg getMe HTTP {st}: {body[:200]}")
except Exception as e:
    print(f"tg getMe FAIL: {e}")
