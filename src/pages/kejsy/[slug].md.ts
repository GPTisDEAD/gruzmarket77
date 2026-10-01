import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import company from '../../content/company.json';

export async function getStaticPaths() {
  const items = await getCollection('cases');
  return items.map((c) => ({ params: { slug: c.id }, props: { c } }));
}

export const GET: APIRoute = async ({ props }) => {
  const { c } = props as { c: any };
  const url = `https://${company.domain}/kejsy/${c.id}/`;
  const body = `# ${c.data.title}

URL: ${url}
Тег: ${c.data.tag}
Срок: ${c.data.duration}
Команда: ${c.data.crew}
Итог: ${c.data.total}

${(c.body ?? '').trim()}

---

Оставить заявку: https://${company.domain}/zayavka/
Телефон: ${company.phone}
`;
  return new Response(body, {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
  });
};
