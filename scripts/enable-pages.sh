#!/bin/bash
# enable-pages.sh — делает ВСЁ для превью сайта одной командой, без браузера:
# 1) синкает свежий код в ciriycpro/gruzmarket77 (встроенный sync)
# 2) включает GitHub Pages (source = GitHub Actions) через gh api
# 3) запускает деплой-workflow и ждёт результат
# 4) печатает ссылку на живой сайт
set -e

REPO="ciriycpro/gruzmarket77"
WORK_RAW="https://github.com/GPTisDEAD/ciriycpro-online.git"
WORK_BRANCH="claude/vibrant-lovelace-m8u2cd"
TMP="$HOME/.gm-sync"

echo "=== 1/6 gh → ciriycpro ==="
gh auth switch -u ciriycpro 2>/dev/null || true
git config --global --unset-all url.git@github.com:.insteadof 2>/dev/null || true

echo ""
echo "=== 2/6 Синк кода в прод ==="
rm -rf "$TMP"; mkdir -p "$TMP"
git clone -q --depth 1 -b "$WORK_BRANCH" "$WORK_RAW" "$TMP/work"
git clone -q "https://github.com/$REPO.git" "$TMP/prod"
cd "$TMP/prod"
git config user.name  >/dev/null 2>&1 || git config user.name  "Artem Yakshin"
git config user.email >/dev/null 2>&1 || git config user.email "inbox@ciriyc.ru"
rsync -a --delete --exclude='.git' "$TMP/work/site/" "$TMP/prod/"
git add -A
if git diff --cached --quiet; then
  echo "    Код уже актуален."
else
  SUMMARY=$(cd "$TMP/work" && git log -1 --pretty=%s)
  git commit -q -m "sync: $SUMMARY"
  git -c credential.helper= -c credential.helper='!gh auth git-credential' push -q origin main
  echo "    Запушено."
fi
cd "$HOME"; rm -rf "$TMP"

echo ""
echo "=== 3/6 Включаю GitHub Pages (source = Actions) ==="
if gh api -X POST "repos/$REPO/pages" -f build_type=workflow >/dev/null 2>&1; then
  echo "    Pages включены."
else
  gh api -X PUT "repos/$REPO/pages" -f build_type=workflow >/dev/null 2>&1 \
    && echo "    Pages уже были включены — переключил на Actions." \
    || echo "    Pages уже включены."
fi

echo ""
echo "=== 4/6 Запускаю деплой ==="
gh api -X POST "repos/$REPO/actions/workflows/deploy.yml/dispatches" -f ref=main >/dev/null 2>&1 \
  && echo "    Workflow запущен." \
  || echo "    Workflow стартует сам от push — ок."

echo ""
echo "=== 5/6 Жду результат (до 4 минут) ==="
sleep 15
for i in $(seq 1 22); do
  LINE=$(gh run list -R "$REPO" --limit 1 2>/dev/null | head -1 || true)
  STATUS=$(echo "$LINE" | awk -F'\t' '{print $1" "$2}' 2>/dev/null)
  echo "    [$i] $STATUS"
  if echo "$LINE" | grep -q "completed.*success"; then break; fi
  if echo "$LINE" | grep -q "completed.*failure"; then
    echo ""
    echo "    ДЕПЛОЙ УПАЛ. Лог: https://github.com/$REPO/actions"
    exit 1
  fi
  sleep 10
done

echo ""
echo "=== 6/6 ГОТОВО ==="
echo ""
echo "  Сайт: https://ciriycpro.github.io/gruzmarket77/"
echo ""
echo "  (если 404 — подожди минуту и обнови; первый деплой Pages тупит)"
