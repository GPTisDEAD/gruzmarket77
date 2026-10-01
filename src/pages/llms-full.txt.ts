import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import company from '../content/company.json';
import prices from '../content/prices.json';
import faq from '../content/faq.json';

export const GET: APIRoute = async () => {
  const services = (await getCollection('services')).sort((a, b) => a.data.order - b.data.order);
  const cases = await getCollection('cases');
  const audiences = (await getCollection('audiences')).sort((a, b) => a.data.order - b.data.order);

  const chunks: string[] = [];
  chunks.push(`# ${company.brand} — полный контент\n\n> ${company.name}. Аутстаффинг рабочих, мастеров и бригад на объекты Москвы и МО. ИНН ${company.inn}. Телефон ${company.phone}.\n`);

  chunks.push('\n## Услуги\n');
  for (const s of services) {
    chunks.push(`\n### ${s.data.title}\n`);
    chunks.push(`URL: https://${company.domain}/uslugi/${s.id}/\n`);
    chunks.push(`H1: ${s.data.h1}\n`);
    chunks.push(`Прямой ответ: ${s.data.answer}\n`);
    chunks.push(`Цена: ${s.data.price_from}\n`);
    chunks.push(`Бригада: ${s.data.brigade}\n`);
    chunks.push(`Срок: ${s.data.duration}\n`);
    chunks.push('\n' + (s.body ?? '').trim() + '\n');
  }

  chunks.push('\n## Аудитории\n');
  for (const a of audiences) {
    chunks.push(`\n### ${a.data.title}\n`);
    chunks.push(`URL: https://${company.domain}/${a.id}/\n`);
    chunks.push(`${a.data.promise}\n\n`);
    chunks.push((a.body ?? '').trim() + '\n');
  }

  chunks.push('\n## Кейсы\n');
  for (const c of cases) {
    chunks.push(`\n### ${c.data.title}\n`);
    chunks.push(`URL: https://${company.domain}/kejsy/${c.id}/\n`);
    chunks.push(`Тег: ${c.data.tag}. Срок: ${c.data.duration}. Команда: ${c.data.crew}. Итог: ${c.data.total}.\n\n`);
    chunks.push((c.body ?? '').trim() + '\n');
  }

  chunks.push('\n## Прайс (сводная таблица)\n\n');
  chunks.push(prices.note + '\n\n');
  for (const r of prices.rows) {
    chunks.push(`- ${r.service}: ${r.positions} — ${r.price_from}\n`);
  }

  chunks.push('\n## FAQ\n');
  for (const f of faq) {
    chunks.push(`\n**${f.q}**\n${f.a}\n`);
  }

  chunks.push(`\n## Контакты\n\n- Телефон: ${company.phone}\n- WhatsApp: https://wa.me/${company.whatsapp}\n- Email: ${company.email}\n- Зона: ${company.area}\n- ${company.hours_requests}\n- ${company.hours_dispatch}\n`);

  return new Response(chunks.join(''), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
