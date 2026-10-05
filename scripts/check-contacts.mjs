#!/usr/bin/env node
// check-contacts.mjs — проверяет собранный dist/ на мёртвые контакты и заглушки.
// Запуск: cd site && npm run build && node ../scripts/check-contacts.mjs

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'site', 'dist');
const company = JSON.parse(readFileSync(join(process.cwd(), 'site', 'src', 'content', 'company.json'), 'utf8'));

const VALID = {
  tel: `tel:${company.phone_tel}`,
  wa: `https://wa.me/${company.whatsapp}`,
  mail: `mailto:${company.email}`
};

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) yield* walk(p);
    else if (p.endsWith('.html')) yield p;
  }
}

const problems = [];
let filesChecked = 0;
const stats = { tel: 0, wa: 0, mail: 0, tg: 0 };

for (const file of walk(DIST)) {
  filesChecked++;
  const html = readFileSync(file, 'utf8');
  const rel = file.replace(DIST, '');

  // Мёртвые якоря в кликабельных элементах
  for (const m of html.matchAll(/<a\s[^>]*href="(#|javascript:void|)"[^>]*>(.{0,60}?)<\/a>/gs)) {
    problems.push(`${rel}: ПУСТОЙ href="${m[1]}" у ссылки "${m[2].replace(/<[^>]+>/g, '').trim().slice(0, 40)}"`);
  }

  // tel: — только валидный номер
  for (const m of html.matchAll(/href="(tel:[^"]*)"/g)) {
    stats.tel++;
    if (m[1] !== VALID.tel) problems.push(`${rel}: НЕВЕРНЫЙ tel "${m[1]}" (ожидался ${VALID.tel})`);
  }

  // wa.me — только валидный
  for (const m of html.matchAll(/href="(https:\/\/wa\.me\/[^"]*)"/g)) {
    stats.wa++;
    if (!m[1].startsWith(VALID.wa)) problems.push(`${rel}: НЕВЕРНЫЙ whatsapp "${m[1]}"`);
  }

  // mailto
  for (const m of html.matchAll(/href="(mailto:[^"]*)"/g)) {
    stats.mail++;
    if (m[1] !== VALID.mail) problems.push(`${rel}: НЕВЕРНЫЙ mailto "${m[1]}"`);
  }

  // t.me с пустым ником
  for (const m of html.matchAll(/href="(https:\/\/t\.me\/?)"/g)) {
    stats.tg++;
    problems.push(`${rel}: ПУСТОЙ telegram "${m[1]}"`);
  }

  // Слова-маркеры заглушек в видимом тексте
  const visible = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  for (const word of ['TODO', 'ЗАГЛУШКА', 'placeholder-text', 'XXX-', 'в разработке']) {
    if (visible.includes(word)) problems.push(`${rel}: найден маркер заглушки «${word}»`);
  }

  // Телефон в видимом тексте — должен быть ровно наш.
  // placeholder-атрибуты — не контакты, вырезаем перед проверкой.
  const visibleNoPh = visible.replace(/placeholder="[^"]*"/g, '');
  for (const m of visibleNoPh.matchAll(/\+7[\s(]*\d{3}[\s)]*\d{3}[-\s]*\d{2}[-\s]*\d{2}/g)) {
    const norm = m[0].replace(/[\s()-]/g, '');
    if (norm !== company.phone_tel) problems.push(`${rel}: ЧУЖОЙ номер в тексте "${m[0]}"`);
  }
}

console.log(`Проверено HTML: ${filesChecked}`);
console.log(`Ссылок: tel=${stats.tel}, whatsapp=${stats.wa}, mailto=${stats.mail}`);
if (problems.length === 0) {
  console.log('\n✓ ВСЕ КОНТАКТЫ РАБОЧИЕ, заглушек не найдено.');
} else {
  console.log(`\n✗ ПРОБЛЕМ: ${problems.length}`);
  for (const p of problems) console.log('  - ' + p);
  process.exit(1);
}
