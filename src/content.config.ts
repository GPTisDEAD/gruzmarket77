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

export const collections = { services, cases, audiences, blog };
