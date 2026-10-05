#!/bin/bash
# fix-github-auth.sh — одна команда, навсегда закрывает проблемы с git+github
# После запуска: push из любой клонированной репы без паролей, токенов и sudo.
set -e

echo "=== 1/7 Чищу протухший токен GPTisDEAD (если есть) ==="
gh auth logout -h github.com -u GPTisDEAD 2>/dev/null || true

echo ""
echo "=== 2/7 Переключаюсь на ciriycpro (рабочий аккаунт) ==="
gh auth switch -u ciriycpro

echo ""
echo "=== 3/7 Проверяю/создаю SSH-ключ ==="
if [ -f ~/.ssh/id_ed25519_gh ]; then
  echo "    Ключ уже есть: ~/.ssh/id_ed25519_gh"
else
  ssh-keygen -t ed25519 -C "iakshin77@gmail.com" -f ~/.ssh/id_ed25519_gh -N ""
  echo "    Ключ создан"
fi

echo ""
echo "=== 4/7 Заливаю публичный ключ на GitHub (через API, без браузера) ==="
TITLE="mac-$(date +%Y%m%d-%H%M)"
if gh ssh-key add ~/.ssh/id_ed25519_gh.pub --title "$TITLE" 2>/dev/null; then
  echo "    Ключ залит как '$TITLE'"
else
  echo "    Ключ уже залит (ну и ладно)"
fi

echo ""
echo "=== 5/7 Запускаю ssh-agent, добавляю ключ ==="
eval "$(ssh-agent -s)" >/dev/null
ssh-add ~/.ssh/id_ed25519_gh 2>/dev/null || ssh-add ~/.ssh/id_ed25519_gh

echo ""
echo "=== 6/7 Глобальная подмена HTTPS → SSH для всех git push ==="
git config --global url."git@github.com:".insteadOf "https://github.com/"
echo "    Теперь любая 'https://github.com/*' автоматически = SSH"

echo ""
echo "=== 7/7 Тест ==="
# Добавляем github.com в known_hosts без подтверждения, если ещё нет
ssh-keyscan -t ed25519 github.com >> ~/.ssh/known_hosts 2>/dev/null
RESULT=$(ssh -o BatchMode=yes -T git@github.com 2>&1 || true)
echo "    $RESULT"

if echo "$RESULT" | grep -q "successfully authenticated"; then
  echo ""
  echo "=== DONE — SSH-auth работает ==="
  echo ""
  echo "Теперь push из любой репы работает без паролей:"
  echo "  cd ~/любая-репа && git push"
  echo ""
  echo "Старые клоны с https:// origin — тоже работают (глобальный insteadOf)."
else
  echo ""
  echo "=== ОШИБКА — SSH не прошёл ==="
  echo "Проверь вручную: ssh -T git@github.com"
  exit 1
fi
