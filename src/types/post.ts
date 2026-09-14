export type Post = {
  slug: string;
  title: string;
  publishedAt: Date;
  categories: string[];
  tags: string[];
  excerpt?: string;
  math: boolean;
  entry: CollectionEntry<'posts'>;
};
import type { CollectionEntry } from 'astro:content';
