#!/bin/bash
# apply-site-patch.sh — клонирует ciriycpro/gruzmarket77, применяет патч каркаса в КОРЕНЬ, пушит.
# Закрывает все известные грабли: протухший токен GPTisDEAD, insteadOf-подмена HTTPS→SSH,
# пустая репа без ветки, default branch master, кэш паролей в keychain.
set -e

echo "=== 1/6 gh → ciriycpro ==="
gh auth switch -u ciriycpro 2>/dev/null || true

echo ""
echo "=== 2/6 Снимаю подмену HTTPS→SSH (если мой прошлый скрипт её поставил) ==="
git config --global --unset-all url.git@github.com:.insteadof 2>/dev/null || true

echo ""
echo "=== 3/6 Клонирую gruzmarket77 (public, auth не нужен) ==="
cd ~
rm -rf gruzmarket77
git clone https://github.com/ciriycpro/gruzmarket77.git
cd gruzmarket77

echo ""
echo "=== 4/6 Готовлю ветку main и git identity ==="
git config user.name  >/dev/null 2>&1 || git config user.name  "Artem Yakshin"
git config user.email >/dev/null 2>&1 || git config user.email "inbox@ciriyc.ru"
# пустая репа → нет HEAD → создаю стартовый коммит и ветку main
git rev-parse HEAD >/dev/null 2>&1 || git commit --allow-empty -m "init"
git branch -M main

echo ""
echo "=== 5/6 Применяю патч (файлы лягут в КОРЕНЬ репы) ==="
curl -sSL "https://raw.githubusercontent.com/GPTisDEAD/ciriycpro-online/claude/vibrant-lovelace-m8u2cd/patches/0001-site-scaffold.patch" | git am -p2

echo ""
echo "=== 6/6 Пушу строго токеном gh/ciriycpro (минуя keychain) ==="
git -c credential.helper= -c credential.helper='!gh auth git-credential' push -u origin main

echo ""
echo "=== DONE — https://github.com/ciriycpro/gruzmarket77 ==="
