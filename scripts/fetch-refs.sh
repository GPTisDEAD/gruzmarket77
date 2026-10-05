#!/bin/bash
# fetch-refs.sh — выкачивает 6 страниц с 3 референсных сайтов для анализа дизайна
# Запускать на Mac: curl -sSL <raw-url> | bash

set -e

REPO_URL="https://github.com/GPTisDEAD/ciriycpro-online.git"
BRANCH="claude/vibrant-lovelace-m8u2cd"
TMP_DIR="$HOME/gm-tmp"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15"

echo "=== 1/4 Проверка инструментов ==="
for cmd in git curl; do
  if ! command -v $cmd >/dev/null 2>&1; then
    echo "ERROR: $cmd не найден. Установи и повтори."
    exit 1
  fi
done

HAS_WGET=0
if command -v wget >/dev/null 2>&1; then
  HAS_WGET=1
  echo "wget: есть"
else
  echo "wget: нет, использую curl"
fi

echo ""
echo "=== 2/4 Клонирование репы ==="
rm -rf "$TMP_DIR"
git clone -b "$BRANCH" "$REPO_URL" "$TMP_DIR"
cd "$TMP_DIR"
mkdir -p "Running 01 10 26/references"
cd "Running 01 10 26/references"

echo ""
echo "=== 3/4 Выкачка 6 страниц ==="
PAGES=(
  "autpersonal.ru|/"
  "autsorsing-personala.ru|/"
  "autsorsing-personala.ru|/nashi-ceny/"
  "gruzchikimoscow.ru|/"
  "gruzchikimoscow.ru|/korporativnym-klientam/"
  "gruzchikimoscow.ru|/uslugi-i-tseny/"
)

for pair in "${PAGES[@]}"; do
  domain="${pair%%|*}"
  path="${pair##*|}"
  echo ">>> $domain$path"
  mkdir -p "$domain"
  if [ "$HAS_WGET" = "1" ]; then
    wget --page-requisites --convert-links --adjust-extension --no-parent \
         --timeout=30 --tries=2 --no-host-directories \
         --directory-prefix="$domain" -e robots=off \
         --user-agent="$UA" \
         "https://$domain$path" 2>&1 | tail -3 || true
  else
    # fallback на curl — только HTML, без ресурсов
    safe_name=$(echo "$path" | tr '/' '_' | sed 's/^_//;s/_$//')
    [ -z "$safe_name" ] && safe_name="index"
    curl -sSL -A "$UA" --max-time 30 \
         "https://$domain$path" \
         -o "$domain/${safe_name}.html" || true
    echo "  → $domain/${safe_name}.html"
  fi
done

echo ""
echo "=== 4/4 Коммит и пуш ==="
cd "$TMP_DIR"
git add "Running 01 10 26/references/"
git commit -m "refs: snapshot 3 reference sites (autpersonal, autsorsing-personala, gruzchikimoscow)"
git push origin "$BRANCH"

cd "$HOME"
rm -rf "$TMP_DIR"

echo ""
echo "=== DONE ==="
echo "Если wget не было — выкачаны только HTML без CSS. Для полного анализа:"
echo "  brew install wget   # и запусти скрипт ещё раз"
