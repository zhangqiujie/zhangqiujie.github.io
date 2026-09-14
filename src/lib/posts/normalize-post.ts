import type { CollectionEntry } from 'astro:content';
import type { Post } from '../../types/post';
import { toDate, titleFromSlug, toStringArray } from '../../utils/metadata';
import { parseJekyllFilename } from '../../utils/slug';

type PostEntry = CollectionEntry<'posts'>;

export function normalizePost(entry: PostEntry): Post {
  const filename = entry.id.split('/').pop() ?? entry.id;
  const filenameData = parseJekyllFilename(filename);
  const data = entry.data;
  return {
    slug: filenameData.slug,
    title: data.title ?? titleFromSlug(filenameData.slug),
    publishedAt: toDate(data.date, filenameData.date),
    categories: toStringArray(data.categories),
    tags: toStringArray(data.tags),
    excerpt: data.excerpt ?? data.description ?? undefined,
    math: data.math === true,
    entry,
  };
}
