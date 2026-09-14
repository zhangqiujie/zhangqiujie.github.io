import { getCollection, type CollectionEntry } from 'astro:content';
import { normalizePost } from './normalize-post';

function isPublished(entry: CollectionEntry<'posts'>): boolean {
  return entry.data.draft !== true;
}

function newestFirst<T extends { publishedAt: Date }>(posts: T[]): T[] {
  return posts.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

export async function getPosts() {
  const entries = await getCollection('posts', isPublished);
  return newestFirst(entries.map(normalizePost));
}

export async function getPostBySlug(slug: string) {
  const posts = await getPosts();
  return posts.find((post) => post.slug === slug);
}
