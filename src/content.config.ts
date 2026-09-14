import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx,markdown}' }),
  schema: z.object({
    // Jekyll YAML treats `key:` with no value as null; accept it as missing.
    layout: z.string().nullish(),
    title: z.string().nullish(),
    date: z.union([z.date(), z.string(), z.number()]).nullish(),
    categories: z.union([z.string(), z.array(z.string())]).nullish(),
    tags: z.union([z.string(), z.array(z.string())]).nullish(),
    excerpt: z.string().nullish(),
    description: z.string().nullish(),
    draft: z.boolean().nullish(),
  }).passthrough(),
});

export const collections = { posts };
