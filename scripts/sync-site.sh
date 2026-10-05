#!/bin/bash
# sync-site.sh — синхронизирует /site/ рабочей репы → корень ciriycpro/gruzmarket77 и пушит.
# Идемпотентен: запускать можно сколько угодно раз, пушит только если есть изменения.
set -e

WORK_RAW="https://github.com/GPTisDEAD/ciriycpro-online.git"
WORK_BRANCH="claude/vibrant-lovelace-m8u2cd"
PROD="https://github.com/ciriycpro/gruzmarket77.git"
TMP="$HOME/.gm-sync"

echo "=== 1/5 gh → ciriycpro, снимаю insteadOf (защитно) ==="
gh auth switch -u ciriycpro 2>/dev/null || true
git config --global --unset-all url.git@github.com:.insteadof 2>/dev/null || true

echo ""
echo "=== 2/5 Клонирую обе репы ==="
rm -rf "$TMP"
mkdir -p "$TMP"
git clone --depth 1 -b "$WORK_BRANCH" "$WORK_RAW" "$TMP/work"
git clone "$PROD" "$TMP/prod"

echo ""
echo "=== 3/5 Синхронизирую site/ → корень prod ==="
cd "$TMP/prod"
# identity
git config user.name  >/dev/null 2>&1 || git config user.name  "Artem Yakshin"
git config user.email >/dev/null 2>&1 || git config user.email "inbox@ciriyc.ru"
# пустая репа → init
git rev-parse HEAD >/dev/null 2>&1 || git commit --allow-empty -m "init"
git branch -M main
# rsync: всё из site/ в корень, удаляя устаревшее, не трогая .git
rsync -a --delete --exclude='.git' "$TMP/work/site/" "$TMP/prod/"

echo ""
echo "=== 4/5 Коммит (если есть изменения) ==="
git add -A
if git diff --cached --quiet; then
  echo "    Изменений нет — пушить нечего."
  cd "$HOME"; rm -rf "$TMP"
  echo "=== DONE (no changes) ==="
  exit 0
fi
SUMMARY=$(cd "$TMP/work" && git log -1 --pretty=%s)
git commit -m "sync: $SUMMARY"

echo ""
echo "=== 5/5 Пушу строго токеном gh/ciriycpro ==="
git -c credential.helper= -c credential.helper='!gh auth git-credential' push -u origin main

cd "$HOME"
rm -rf "$TMP"
echo ""
echo "=== DONE — https://github.com/ciriycpro/gruzmarket77 ==="
