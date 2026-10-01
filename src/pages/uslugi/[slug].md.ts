import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import company from '../../content/company.json';

export async function getStaticPaths() {
  const items = await getCollection('services');
  return items.map((s) => ({ params: { slug: s.id }, props: { s } }));
}

export const GET: APIRoute = async ({ props }) => {
  const { s } = props as { s: any };
  const url = `https://${company.domain}/uslugi/${s.id}/`;
  const body = `# ${s.data.title}

URL: ${url}
H1: ${s.data.h1}

${s.data.answer}

- Цена: ${s.data.price_from}
- Бригада: ${s.data.brigade}
- Срок: ${s.data.duration}

${(s.body ?? '').trim()}

---

Оставить заявку: https://${company.domain}/zayavka/
Телефон: ${company.phone}
WhatsApp: https://wa.me/${company.whatsapp}
Email: ${company.email}
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
  });
};
