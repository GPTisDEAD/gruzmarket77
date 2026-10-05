#!/bin/bash
# fetch-refs-v3.sh — быстрая выкачка: 8-сек таймауты, параллелизм, лимиты
set -u

FORK_URL="https://github.com/ciriycpro/ciriycpro-online.git"
BRANCH="claude/vibrant-lovelace-m8u2cd"
TMP="$HOME/gm-tmp"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15"
TIMEOUT=8
MAX_PARALLEL=8

PAGES=(
  "autpersonal.ru|/"
  "autsorsing-personala.ru|/"
  "autsorsing-personala.ru|/nashi-ceny/"
  "gruzchikimoscow.ru|/"
  "gruzchikimoscow.ru|/korporativnym-klientam/"
  "gruzchikimoscow.ru|/uslugi-i-tseny/"
)

resolve_url() {
  case "$2" in
    http://*|https://*) echo "$2" ;;
    //*)                echo "https:$2" ;;
    /*)                 echo "$1$2" ;;
    *)                  echo "$1/$2" ;;
  esac
}
url_to_local() { echo "$1" | sed -E 's|^https?://[^/]+||; s|\?.*$||; s|^/+||'; }

download_batch() {
  # читает строки "URL|LOCAL_PATH" со stdin, качает параллельно
  local base="$1"
  while IFS='|' read -r url local; do
    [ -z "$url" ] && continue
    mkdir -p "$(dirname "$local")"
    curl -sS -A "$UA" --max-time $TIMEOUT --max-filesize 3145728 \
         "$url" -o "$local" 2>/dev/null &
    # ограничение параллелизма
    while [ "$(jobs -r | wc -l)" -ge $MAX_PARALLEL ]; do sleep 0.1; done
  done
  wait
}

echo "=== 1/4 Клон fork ==="
rm -rf "$TMP"
git clone --depth 1 -b "$BRANCH" "$FORK_URL" "$TMP"
cd "$TMP/Running 01 10 26/references"

echo ""
echo "=== 2/4 Выкачка (${TIMEOUT}s timeout, ${MAX_PARALLEL} parallel) ==="
for pair in "${PAGES[@]}"; do
  domain="${pair%%|*}"; path="${pair##*|}"
  base="https://$domain"
  safe=$(echo "$path" | tr '/' '_' | sed 's/^_//;s/_$//'); [ -z "$safe" ] && safe="index"
  html="$domain/${safe}.html"
  mkdir -p "$domain"
  echo ">>> $domain$path"
  curl -sS -A "$UA" --max-time $TIMEOUT "$base$path" -o "$html"

  # CSS — макс 15 на страницу
  css_queue=$(grep -oiE 'href="[^"]+\.css[^"]*"' "$html" | sed 's/^href="//;s/"$//' | sort -u | head -15)
  n=$(echo "$css_queue" | grep -c . || true)
  echo "    CSS: $n"
  echo "$css_queue" | while read -r u; do
    [ -z "$u" ] && continue
    f=$(resolve_url "$base" "$u")
    r=$(url_to_local "$u"); [ -z "$r" ] && continue
    echo "$f|$domain/$r"
  done | download_batch "$base"

  # IMG — макс 15 на страницу
  img_queue=$(grep -oiE '(src|data-src|data-lazy)="[^"]+\.(jpe?g|png|svg|webp|gif)[^"]*"' "$html" \
              | sed -E 's/^(src|data-src|data-lazy)="//;s/"$//' | sort -u | head -15)
  n=$(echo "$img_queue" | grep -c . || true)
  echo "    IMG: $n"
  echo "$img_queue" | while read -r u; do
    [ -z "$u" ] && continue
    f=$(resolve_url "$base" "$u")
    r=$(url_to_local "$u"); [ -z "$r" ] && continue
    echo "$f|$domain/$r"
  done | download_batch "$base"
done

# ШРИФТЫ — отдельным проходом, макс 5 с ЛЮБОГО домена суммарно (хватит для анализа семейств)
echo ""
echo "=== 3/4 Шрифты (5 штук суммарно, не ждём больше ${TIMEOUT}s) ==="
font_q=$(find . -name "*.css" -print0 2>/dev/null | xargs -0 grep -ohiE 'url\([^)]+\.(woff2?|ttf|otf)[^)]*\)' 2>/dev/null \
         | sed -E "s/url\(['\"]?//; s/['\"]?\)$//" | sort -u | head -5)
echo "$font_q" | while read -r u; do
  [ -z "$u" ] && continue
  # шрифт обычно относительный путь, кладу в assets/_fonts/
  case "$u" in
    http*)  f="$u" ;;
    //*)    f="https:$u" ;;
    *)      f="https://autsorsing-personala.ru/${u#/}" ;;  # эвристика, не критично
  esac
  name=$(basename "$u" | sed 's/?.*//')
  mkdir -p "_fonts"
  curl -sS -A "$UA" --max-time $TIMEOUT "$f" -o "_fonts/$name" 2>/dev/null || true
done
wait

echo ""
echo "=== Статистика ==="
for d in */; do
  n_html=$(find "$d" -name "*.html" 2>/dev/null | wc -l | tr -d ' ')
  n_css=$(find "$d" -name "*.css" 2>/dev/null | wc -l | tr -d ' ')
  n_img=$(find "$d" \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.svg" -o -name "*.webp" -o -name "*.gif" \) 2>/dev/null | wc -l | tr -d ' ')
  size=$(du -sh "$d" 2>/dev/null | awk '{print $1}')
  echo "  $d → HTML:$n_html CSS:$n_css IMG:$n_img SIZE:$size"
done

echo ""
echo "=== 4/4 Push в fork ==="
cd "$TMP"
git add "Running 01 10 26/references/"
git commit -m "refs: full snapshot (HTML+CSS+IMG+fonts) via v3 script" || echo "nothing to commit"
git push origin "$BRANCH"
cd "$HOME"
rm -rf "$TMP"
echo ""
echo "=== DONE ==="
