#!/bin/bash
# fetch-refs-full.sh — выкачивает HTML + CSS + картинки с 3 референсов
# Работает на Catalina без wget/brew/node — только curl + bash
# Запускать: curl -sSL <raw-url> | bash

set -u

FORK_URL="https://github.com/ciriycpro/ciriycpro-online.git"
BRANCH="claude/vibrant-lovelace-m8u2cd"
TMP="$HOME/gm-tmp"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15"

PAGES=(
  "autpersonal.ru|/"
  "autsorsing-personala.ru|/"
  "autsorsing-personala.ru|/nashi-ceny/"
  "gruzchikimoscow.ru|/"
  "gruzchikimoscow.ru|/korporativnym-klientam/"
  "gruzchikimoscow.ru|/uslugi-i-tseny/"
)

resolve_url() {
  local base="$1" url="$2"
  case "$url" in
    http://*|https://*) echo "$url" ;;
    //*)                echo "https:$url" ;;
    /*)                 echo "${base}${url}" ;;
    *)                  echo "${base}/${url}" ;;
  esac
}

url_to_local() {
  local url="$1"
  echo "$url" | sed -E 's|^https?://[^/]+||; s|\?.*$||; s|^/+||'
}

download() {
  local full_url="$1" local_file="$2"
  mkdir -p "$(dirname "$local_file")"
  curl -sSL -A "$UA" --max-time 30 --max-filesize 5242880 \
       "$full_url" -o "$local_file" 2>/dev/null || true
}

echo "=== 1/5 Клонирование fork ==="
rm -rf "$TMP"
git clone -b "$BRANCH" "$FORK_URL" "$TMP"
cd "$TMP/Running 01 10 26/references"

echo ""
echo "=== 2/5 HTML + CSS + картинки ==="
for pair in "${PAGES[@]}"; do
  domain="${pair%%|*}"
  path="${pair##*|}"
  base="https://$domain"
  safe=$(echo "$path" | tr '/' '_' | sed 's/^_//;s/_$//')
  [ -z "$safe" ] && safe="index"
  html="$domain/${safe}.html"
  mkdir -p "$domain"

  echo ""
  echo ">>> $domain$path"
  curl -sSL -A "$UA" --max-time 30 "$base$path" -o "$html"

  # CSS
  css_urls=$(grep -oiE 'href="[^"]+\.css[^"]*"' "$html" | sed 's/^href="//;s/"$//' | sort -u)
  n_css=$(echo "$css_urls" | grep -c . || true)
  echo "    CSS: $n_css"
  echo "$css_urls" | while read -r u; do
    [ -z "$u" ] && continue
    full=$(resolve_url "$base" "$u")
    rel=$(url_to_local "$u")
    [ -z "$rel" ] && continue
    download "$full" "$domain/$rel"
  done

  # Картинки — ограничиваю 20 на страницу чтобы не вытащить тонну
  img_urls=$(grep -oiE '(src|data-src|data-lazy)="[^"]+\.(jpe?g|png|svg|webp|gif)[^"]*"' "$html" \
             | sed -E 's/^(src|data-src|data-lazy)="//;s/"$//' | sort -u | head -20)
  n_img=$(echo "$img_urls" | grep -c . || true)
  echo "    IMG: $n_img"
  echo "$img_urls" | while read -r u; do
    [ -z "$u" ] && continue
    full=$(resolve_url "$base" "$u")
    rel=$(url_to_local "$u")
    [ -z "$rel" ] && continue
    download "$full" "$domain/$rel"
  done

  # Шрифты из CSS — вытащу ссылки на woff/woff2 из скачанных CSS
  echo "    FONTS: сканирую CSS..."
  find "$domain" -name "*.css" -exec grep -oiE 'url\([^)]+\.(woff2?|ttf|otf|eot)[^)]*\)' {} \; 2>/dev/null \
    | sed -E "s/url\(['\"]?//; s/['\"]?\)$//" | sort -u | head -30 | while read -r u; do
    [ -z "$u" ] && continue
    full=$(resolve_url "$base" "$u")
    rel=$(url_to_local "$u")
    [ -z "$rel" ] && continue
    download "$full" "$domain/$rel"
  done
done

echo ""
echo "=== 3/5 Статистика ==="
for d in */; do
  n_html=$(find "$d" -name "*.html" | wc -l | tr -d ' ')
  n_css=$(find "$d" -name "*.css" | wc -l | tr -d ' ')
  n_img=$(find "$d" \( -name "*.jpg" -o -name "*.jpeg" -o -name "*.png" -o -name "*.svg" -o -name "*.webp" -o -name "*.gif" \) | wc -l | tr -d ' ')
  n_font=$(find "$d" \( -name "*.woff" -o -name "*.woff2" -o -name "*.ttf" -o -name "*.otf" \) | wc -l | tr -d ' ')
  size=$(du -sh "$d" | awk '{print $1}')
  echo "  $d → HTML:$n_html  CSS:$n_css  IMG:$n_img  FONTS:$n_font  SIZE:$size"
done

echo ""
echo "=== 4/5 Коммит в fork ==="
cd "$TMP"
git add "Running 01 10 26/references/"
git commit -m "refs: add CSS, images, fonts for 3 reference sites" || echo "nothing to commit"

echo ""
echo "=== 5/5 Push в fork ==="
git push origin "$BRANCH"

cd "$HOME"
rm -rf "$TMP"
echo ""
echo "=== DONE ==="
echo "Пушнул в ciriycpro/ciriycpro-online (fork). Напиши ассистенту 'готово' — он подхватит и перельёт в основную репу."
