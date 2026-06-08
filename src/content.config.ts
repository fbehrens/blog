import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/posts' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    description: z.string(),
    image: image().optional(),
    draft: z.boolean().default(false),
  }),
});

// Teach sessions vendored from /c/teach by `scripts/publish-teach.ts`.
// Each landing is generated as src/content/teach/<session>/index.md.
// Lessons are served bare from public/teach/<session>/ — see ADR 0002.
const teach = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/teach' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()),
    description: z.string(),
    session: z.string(),
    lessons: z.array(z.object({
      title: z.string(),
      href: z.string(),
    })).default([]),
  }),
});

export const collections = { posts, teach };
