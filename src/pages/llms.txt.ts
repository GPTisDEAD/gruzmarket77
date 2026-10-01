import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import company from '../content/company.json';

export const GET: APIRoute = async () => {
  const services = (await getCollection('services')).sort((a, b) => a.data.order - b.data.order);
  const cases = await getCollection('cases');
  const audiences = (await getCollection('audiences')).sort((a, b) => a.data.order - b.data.order);

  const serviceLines = services.map((s) =>
    `- [${s.data.title}](https://${company.domain}/uslugi/${s.id}/): ${s.data.answer}`
  ).join('\n');

  const caseLines = cases.map((c) =>
    `- [${c.data.title}](https://${company.domain}/kejsy/${c.id}/): ${c.data.tag}. Срок ${c.data.duration}, команда ${c.data.crew}, итог ${c.data.total.split('(')[0].trim()}.`
  ).join('\n');

  const audLines = audiences.map((a) =>
    `- [${a.data.title}](https://${company.domain}/${a.id}/): ${a.data.promise}`
  ).join('\n');

  const body = `# ГрузМаркет77 — рабочие, мастера и бригады на объекты Москвы

> Аутстаффинг рабочих и мастеров под задачи ремонта, клининга, монтажа и грузчиков в Москве и МО. Бригада на объекте за 24–48 часов. Договор с ИП, безнал, оплата по факту, замена мастера по претензии бесплатно.

## О компании

- Название: ${company.name} (бренд ${company.brand})
- ИНН: ${company.inn} · ОГРНИП: ${company.ogrnip}
- Зона работы: ${company.area}
- ${company.hours_requests}
- ${company.hours_dispatch}
- Телефон: ${company.phone}
- WhatsApp: https://wa.me/${company.whatsapp}
- Email: ${company.email}
- Сайт: https://${company.domain}

## Услуги

${serviceLines}

## Аудитории

${audLines}

## Кейсы

${caseLines}

## Ключевые страницы

- [Главная](https://${company.domain}/): hero, аудитории, услуги, как работаем, кейсы, цены, FAQ, заявка.
- [Прайс](https://${company.domain}/tseny/): сводный прайс по 14 услугам, цены «от» по Москве.
- [Как мы работаем](https://${company.domain}/kak-my-rabotaem/): 5 шагов, документы, ответственность.
- [Мастера](https://${company.domain}/mastera/): 40 человек в базе, отбор, бригадир, замена по претензии.
- [Вопрос-ответ](https://${company.domain}/vopros-otvet/): 18 коротких ответов, FAQPage schema.
- [Контакты](https://${company.domain}/kontakty/): телефон, WhatsApp, email, реквизиты.

## Optional

- [Плоские markdown-версии страниц](https://${company.domain}/uslugi/demontazh.md): каждой странице услуги соответствует .md-зеркало без вёрстки — для цитирования LLM.
- [Политика конфиденциальности](https://${company.domain}/politika/)
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
