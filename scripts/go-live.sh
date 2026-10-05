#!/bin/bash
# go-live.sh — ТОТАЛ: домен gruzmarket77.ru на Pages + двойной деплой + проверки.
# Одна команда, никаких шагов руками.
set -u

REPO="ciriycpro/gruzmarket77"
WF="sync-and-deploy.yml"
DOMAIN="gruzmarket77.ru"

run_and_wait () {
  local tag="$1"
  gh workflow run "$WF" -R "$REPO" --ref main >/dev/null 2>&1 \
    || gh api -X POST "repos/$REPO/actions/workflows/$WF/dispatches" -f ref=main >/dev/null
  echo "    [$tag] запущен, жду..."
  sleep 10
  for i in $(seq 1 30); do
    local st
    st=$(gh run list -R "$REPO" --workflow="$WF" --limit 1 --json status,conclusion \
         -q '.[0].status + ":" + (.[0].conclusion // "-")' 2>/dev/null || echo "?:?")
    case "$st" in
      completed:success) echo "    [$tag] ✓ успех"; return 0 ;;
      completed:*)       echo "    [$tag] ✗ УПАЛ ($st) — лог: https://github.com/$REPO/actions"; return 1 ;;
      *)                 printf "    [$tag] %s (%ss)\r" "$st" $((i*10)) ;;
    esac
    sleep 10
  done
  echo "    [$tag] ✗ таймаут 5 мин — глянь https://github.com/$REPO/actions"
  return 1
}

echo "=== 1/6 gh → ciriycpro ==="
gh auth switch -u ciriycpro 2>/dev/null || true

echo ""
echo "=== 2/6 Привязываю домен $DOMAIN к Pages ==="
if gh api -X PUT "repos/$REPO/pages" -f cname="$DOMAIN" >/dev/null 2>&1; then
  echo "    Домен задан."
else
  echo "    Не вышло PUT — пробую проверить текущее состояние:"
  gh api "repos/$REPO/pages" --jq '"    cname: " + (.cname // "нет") + " | status: " + (.status // "?")' || true
fi

echo ""
echo "=== 3/6 Деплой №1 (обновляет workflow в проде) ==="
run_and_wait "ран-1" || exit 1

echo ""
echo "=== 4/6 Деплой №2 (собирает уже без URL-префикса, под домен) ==="
run_and_wait "ран-2" || exit 1

echo ""
echo "=== 5/6 DNS и HTTP проверка ==="
echo "    dig:"
dig +short "$DOMAIN" | sed 's/^/      /'
echo "    http:"
curl -sI -m 10 "http://$DOMAIN" 2>/dev/null | head -1 | sed 's/^/      /' || echo "      (пока не отвечает — DNS/деплой доезжает, норм)"

echo ""
echo "=== 6/6 HTTPS сертификат ==="
CERT=$(gh api "repos/$REPO/pages" --jq '.https_certificate.state // "unknown"' 2>/dev/null || echo unknown)
echo "    состояние: $CERT"
if [ "$CERT" = "issued" ] || [ "$CERT" = "approved" ]; then
  gh api -X PUT "repos/$REPO/pages" -F https_enforced=true >/dev/null 2>&1 \
    && echo "    Принудительный HTTPS ВКЛЮЧЁН." \
    || echo "    Enforce не встал — включим позже."
else
  echo "    Let's Encrypt ещё выпускает (5–60 мин). Enforce включим позже одной командой."
fi

echo ""
echo "=== DONE ==="
echo "  Сайт: http://$DOMAIN  (https подтянется после выпуска сертификата)"
