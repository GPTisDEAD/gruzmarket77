#!/usr/bin/env node
// split-corpus.mjs — нарезает corpus.md в Astro content collections.
// Запуск из корня рабочей репы: node scripts/split-corpus.mjs
// Идемпотентен: перезаписывает services/, cases/, audiences/, prices.json, faq.json.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const CORPUS = join(ROOT, 'Running 01 10 26', 'corpus.md');
const OUT = join(ROOT, 'site', 'src', 'content');

const src = readFileSync(CORPUS, 'utf8');
const lines = src.split('\n');

// ---------- справочники ----------
const SERVICE_SLUGS = {
  'демонтаж': 'demontazh',
  'уборка после ремонта': 'uborka-posle-remonta',
  'клининг офисов': 'klining-ofisov',
  'влажная уборка': 'vlazhnaya-uborka',
  'мытьё окон': 'mytyo-okon', 'мытье окон': 'mytyo-okon',
  'уборка территорий': 'uborka-territoriy',
  'грузчики': 'gruzchiki', 'хелперы': 'gruzchiki',
  'отделочные': 'otdelochnye-raboty',
  'электрика': 'elektrika-santekhnika', 'электрики': 'elektrika-santekhnika', 'сантехника': 'elektrika-santekhnika',
  'монолит': 'monolit-styazhka', 'стяжка': 'monolit-styazhka',
  'отделка под ключ': 'otdelka-pod-klyuch',
  'дом под ключ': 'dom-pod-klyuch',
  'облицовка': 'oblitsovka',
  'ландшафт': 'landshaft',
  'клининг': 'klining-ofisov'
};

const GROUPS = {
  demontazh: 'stroitelnye', 'otdelochnye-raboty': 'stroitelnye',
  'elektrika-santekhnika': 'stroitelnye', 'monolit-styazhka': 'stroitelnye',
  'otdelka-pod-klyuch': 'stroitelnye', 'dom-pod-klyuch': 'stroitelnye',
  oblitsovka: 'stroitelnye', landshaft: 'stroitelnye',
  'uborka-posle-remonta': 'klining', 'klining-ofisov': 'klining',
  'vlazhnaya-uborka': 'klining', 'mytyo-okon': 'klining', 'uborka-territoriy': 'klining',
  gruzchiki: 'lyudi-na-smenu'
};

const CASE_TAGS = {
  'demontazh-kvartiry-78': 'Демонтаж',
  'uborka-ofisa-240': 'Клининг',
  'helpery-vystavka': 'Мероприятия',
  'sanuzel-kuhnya': 'Ремонт',
  'abonent-klining-120': 'Абонентское обслуживание'
};
const CASE_SERVICES = {
  'demontazh-kvartiry-78': ['demontazh'],
  'uborka-ofisa-240': ['uborka-posle-remonta'],
  'helpery-vystavka': ['gruzchiki'],
  'sanuzel-kuhnya': ['otdelka-pod-klyuch', 'elektrika-santekhnika'],
  'abonent-klining-120': ['klining-ofisov']
};

function resolveServiceSlugs(text) {
  const out = [];
  for (const part of text.split('·')) {
    const t = part.toLowerCase();
    for (const [key, slug] of Object.entries(SERVICE_SLUGS)) {
      if (t.includes(key) && !out.includes(slug)) { out.push(slug); break; }
    }
  }
  return out;
}

function resolveCaseRef(text) {
  const t = text.toLowerCase();
  if (t.includes('78')) return 'demontazh-kvartiry-78';
  if (t.includes('240')) return 'uborka-ofisa-240';
  if (t.includes('выставк') || t.includes('хелпер')) return 'helpery-vystavka';
  if (t.includes('санузел')) return 'sanuzel-kuhnya';
  if (t.includes('120') || t.includes('абонент')) return 'abonent-klining-120';
  return undefined;
}

function yamlStr(s) {
  return `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function sectionBetween(startRe, endRe) {
  const i = lines.findIndex((l) => startRe.test(l));
  if (i < 0) return null;
  let j = lines.length;
  for (let k = i + 1; k < lines.length; k++) {
    if (endRe.test(lines[k])) { j = k; break; }
  }
  return lines.slice(i, j);
}

function field(block, name) {
  // "**Имя:** значение..." — значение может продолжаться на следующих строках до пустой+**
  const re = new RegExp(`^\\*\\*${name}:?\\*\\*:?\\s*(.*)$`);
  for (let i = 0; i < block.length; i++) {
    const m = block[i].match(re);
    if (m) {
      let val = m[1];
      let j = i + 1;
      while (j < block.length && block[j].trim() !== '' && !/^\*\*/.test(block[j].trim()) && !/^[-|]/.test(block[j].trim())) {
        val += ' ' + block[j].trim();
        j++;
      }
      return val.trim();
    }
  }
  return '';
}

function subsection(block, name, stopNames) {
  // возвращает строки от "**Имя:**" (не включая) до следующего "**Стоп:**"
  const startRe = new RegExp(`^\\*\\*${name}:?\\*\\*`);
  const i = block.findIndex((l) => startRe.test(l));
  if (i < 0) return [];
  const stopRe = new RegExp(`^\\*\\*(${stopNames.join('|')}):?\\*\\*`);
  let j = block.length;
  for (let k = i + 1; k < block.length; k++) {
    if (stopRe.test(block[k])) { j = k; break; }
  }
  return block.slice(i + 1, j);
}

mkdirSync(join(OUT, 'services'), { recursive: true });
mkdirSync(join(OUT, 'cases'), { recursive: true });
mkdirSync(join(OUT, 'audiences'), { recursive: true });

// ---------- services §6.1–6.14 ----------
const svcHeads = [];
lines.forEach((l, i) => {
  const m = l.match(/^6\.(\d+)\.\s+(.+?)\s+—\s+\/uslugi\/([a-z-]+)\/\s*$/);
  if (m) svcHeads.push({ idx: i, n: Number(m[1]), title: m[2], slug: m[3] });
});

let svcCount = 0;
for (let s = 0; s < svcHeads.length; s++) {
  const { idx, n, title, slug } = svcHeads[s];
  const end = s + 1 < svcHeads.length ? svcHeads[s + 1].idx : lines.findIndex((l, i) => i > idx && /^7\\?\./.test(l));
  const block = lines.slice(idx + 1, end > 0 ? end : undefined);

  const h1 = field(block, 'H1');
  const priceMatch = h1.match(/от\s[\d\s]+₽[^\s]*/);
  const price_from = priceMatch ? priceMatch[0].replace(/\s+/g, ' ').trim() : 'по запросу';
  const brigadeFull = field(block, 'Бригада и сроки');
  const [brigade, ...durParts] = brigadeFull.split(';');
  const duration = durParts.join(';').trim() || brigadeFull;
  const related = resolveServiceSlugs(field(block, 'Связанные услуги')).filter((r) => r !== slug);
  const caseRef = resolveCaseRef(field(block, 'Кейс'));
  const answer = `${h1.replace(/\s+/g, ' ').trim()}. Бригада ${brigade.trim()}. ${duration}. Выезд 24–48 часов, Москва и МО.`;

  const whatIn = subsection(block, 'Что входит', ['Кому подходит', 'Цены', 'Бригада и сроки']).join('\n').trim();
  const whoFor = field(block, 'Кому подходит');
  const prices = subsection(block, 'Цены', ['Бригада и сроки', 'Связанные услуги', 'Кейс']).join('\n').trim();
  const faqLines = subsection(block, 'FAQ страницы', ['$^']).join('\n').trim();

  const fm = [
    '---',
    `title: ${yamlStr(title)}`,
    `h1: ${yamlStr(h1)}`,
    `price_from: ${yamlStr(price_from)}`,
    `brigade: ${yamlStr(brigade.trim())}`,
    `duration: ${yamlStr(duration)}`,
    `answer: ${yamlStr(answer)}`,
    `group: ${GROUPS[slug]}`,
    `related: [${related.map((r) => `"${r}"`).join(', ')}]`,
    caseRef ? `case_ref: "${caseRef}"` : null,
    `order: ${n}`,
    '---'
  ].filter(Boolean).join('\n');

  const body = [
    '## Что входит', '', whatIn, '',
    '## Кому подходит', '', whoFor, '',
    '## Цены', '', prices, '',
    '## FAQ', '', faqLines
  ].join('\n');

  writeFileSync(join(OUT, 'services', `${slug}.md`), fm + '\n\n' + body + '\n');
  svcCount++;
}

// ---------- audiences §5.1–5.4 ----------
const audHeads = [];
lines.forEach((l, i) => {
  const m = l.match(/^5\.(\d)\.\s+(.+?)\s+—\s+\/([a-z-]+)\/\s*$/);
  if (m) audHeads.push({ idx: i, n: Number(m[1]), title: m[2].replace(/^Для\s/, ''), slug: m[3] });
});

let audCount = 0;
for (let a = 0; a < audHeads.length; a++) {
  const { idx, n, title, slug } = audHeads[a];
  const end = a + 1 < audHeads.length ? audHeads[a + 1].idx : lines.findIndex((l, i) => i > idx && /^6\\?\./.test(l));
  const block = lines.slice(idx + 1, end > 0 ? end : undefined);

  const promise = field(block, 'H1');
  const services = resolveServiceSlugs(field(block, 'Услуги'));

  const fm = [
    '---',
    `title: ${yamlStr(title)}`,
    `promise: ${yamlStr(promise)}`,
    `services: [${services.map((r) => `"${r}"`).join(', ')}]`,
    `order: ${n}`,
    '---'
  ].join('\n');

  const body = block.join('\n').trim();
  writeFileSync(join(OUT, 'audiences', `${slug}.md`), fm + '\n\n' + body + '\n');
  audCount++;
}

// ---------- cases §8.1–8.5 ----------
const caseHeads = [];
lines.forEach((l, i) => {
  const m = l.match(/^8\.(\d)\.\s+(.+?)(?:\s+—|\s*$)/);
  if (m && /^8\.\d\./.test(l)) caseHeads.push({ idx: i, n: Number(m[1]) });
});

let caseCount = 0;
for (let c = 0; c < caseHeads.length; c++) {
  const { idx, n } = caseHeads[c];
  const end = c + 1 < caseHeads.length ? caseHeads[c + 1].idx : lines.findIndex((l, i) => i > idx && /^9\\?\./.test(l));
  // заголовок может переноситься на следующую строку (слаг на 2-й строке)
  let head = lines[idx];
  let bodyStart = idx + 1;
  if (!/\/kejsy\//.test(head) && /\/kejsy\//.test(lines[idx + 1] ?? '')) {
    head += ' ' + lines[idx + 1].trim();
    bodyStart = idx + 2;
  }
  const hm = head.match(/^8\.\d\.\s+(.+?)\s+—\s+\/kejsy\/([a-z0-9-]+)\/\s*$/);
  if (!hm) continue;
  const title = hm[1];
  const slug = hm[2];
  const block = lines.slice(bodyStart, end > 0 ? end : undefined);

  const crew = field(block, 'Команда');
  const duration = field(block, 'Срок');
  const total = field(block, 'Стоимость');
  const areaM = title.match(/(\d+)\s*м²/);

  const fm = [
    '---',
    `title: ${yamlStr(title)}`,
    `tag: ${yamlStr(CASE_TAGS[slug] ?? 'Кейс')}`,
    areaM ? `area: "${areaM[1]} м²"` : null,
    `duration: ${yamlStr(duration)}`,
    `crew: ${yamlStr(crew)}`,
    `total: ${yamlStr(total)}`,
    `service_refs: [${(CASE_SERVICES[slug] ?? []).map((r) => `"${r}"`).join(', ')}]`,
    '---'
  ].filter(Boolean).join('\n');

  writeFileSync(join(OUT, 'cases', `${slug}.md`), fm + '\n\n' + block.join('\n').trim() + '\n');
  caseCount++;
}

// ---------- prices.json §7 ----------
const priceRows = [];
const sec7 = sectionBetween(/^7\\?\.\s+Сводный прайс/, /^8\\?\.\s/);
if (sec7) {
  for (const l of sec7) {
    const m = l.match(/^\|\s*(?!\*\*Услуга)([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/);
    if (m && !/^[-\s|]+$/.test(l) && !m[1].includes('**')) {
      priceRows.push({ service: m[1].trim(), positions: m[2].trim(), price_from: m[3].trim() });
    }
  }
}
writeFileSync(join(OUT, 'prices.json'), JSON.stringify({
  note: 'Все цены — «от», по Москве, без материалов. Точная цена — после уточнения объёма. B2B регулярным — фиксированные ставки на квартал.',
  rows: priceRows
}, null, 2) + '\n');

// ---------- faq.json §11 ----------
const faq = [];
const sec11 = sectionBetween(/^11\\?\.\s+Вопрос-ответ/, /^12\\?\.\s/);
if (sec11) {
  let q = null, a = [];
  for (const l of sec11.slice(1)) {
    const qm = l.match(/^\*\*(.+\?)\*\*\s*$/);
    if (qm) {
      if (q) faq.push({ q, a: a.join(' ').replace(/\s+/g, ' ').trim() });
      q = qm[1]; a = [];
    } else if (q && l.trim()) {
      a.push(l.trim());
    }
  }
  if (q) faq.push({ q, a: a.join(' ').replace(/\s+/g, ' ').trim() });
}
writeFileSync(join(OUT, 'faq.json'), JSON.stringify(faq, null, 2) + '\n');

console.log(`services: ${svcCount}/14, audiences: ${audCount}/4, cases: ${caseCount}/5, prices rows: ${priceRows.length}, faq: ${faq.length}`);
