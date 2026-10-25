import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const services = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    h1: z.string(),
    price_from: z.string(),
    brigade: z.string(),
    duration: z.string(),
    answer: z.string(), // AEO-абзац: прямой ответ с цифрами
    group: z.enum(['stroitelnye', 'klining', 'lyudi-na-smenu']),
    related: z.array(z.string()).default([]),
    case_ref: z.string().optional(),
    order: z.number().default(100)
  })
});

const cases = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cases' }),
  schema: z.object({
    title: z.string(),
    tag: z.string(),
    area: z.string().optional(),
    duration: z.string(),
    crew: z.string(),
    total: z.string(),
    service_refs: z.array(z.string()).default([])
  })
});

const audiences = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/audiences' }),
  schema: z.object({
    title: z.string(),
    promise: z.string(),
    services: z.array(z.string()).default([]),
    order: z.number().default(100)
  })
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    draft: z.boolean().default(true)
  })
});

const cities = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/cities' }),
  schema: z.object({
    name: z.string(),            // Именительный: "Химки"
    name_v: z.string(),          // Предложный с "в": "в Химках"
    name_iz: z.string(),         // Родительный с "из": "из Химок"
    slug: z.string(),
    population: z.number(),      // Население (для весов и статей)
    distance_mkad: z.number(),   // км от МКАД до центра города
    transfer_price: z.number(),  // ₽ доплата за выезд (0 если входит в тариф)
    transfer_text: z.string(),   // "без доплаты" / "+500 ₽ к тарифу"
    metro_near: z.string(),      // ближайшие станции метро / МЦД / МЦК
    districts: z.array(z.string()).default([]), // Районы города
    response_time: z.string(),   // "в течение часа после заявки"
    popular_services: z.array(z.string()).default([]), // slug'и услуг
    case_sample: z.string().optional(), // Пример выполненной работы
    order: z.number().default(100) // Порядок в списке (меньше — выше)
  })
});

export const collections = { services, cases, audiences, blog, cities };
