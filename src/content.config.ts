import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const weeks = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/weeks' }),
  schema: z.object({
    title: z.string(),
    week: z.string(),          // e.g. "2026-W34"
    date: z.coerce.date(),     // reporting date
    summary: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

export const collections = { weeks };
