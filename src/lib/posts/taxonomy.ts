import type { Post } from '../../types/post';
import { normalizeSlug } from '../../utils/slug';

export type CategoryNode = {
  label: string;
  slug: string;
  posts: Post[];
  children: CategoryNode[];
};

function createNode(label: string): CategoryNode {
  return { label, slug: normalizeSlug(label), posts: [], children: [] };
}

function findOrCreate(nodes: CategoryNode[], label: string): CategoryNode {
  return nodes.find((node) => node.label === label) ?? (() => { const node = createNode(label); nodes.push(node); return node; })();
}

function addPost(nodes: CategoryNode[], categories: string[], post: Post): void {
  const [label, ...rest] = categories;
  if (!label) return;
  const node = findOrCreate(nodes, label);
  node.posts.push(post);
  addPost(node.children, rest, post);
}

function oldestFirst(posts: Post[]): Post[] {
  return posts.sort((a, b) => a.publishedAt.getTime() - b.publishedAt.getTime());
}

function sortTree(nodes: CategoryNode[]): CategoryNode[] {
  nodes.forEach((node) => { oldestFirst(node.posts); sortTree(node.children); });
  return nodes;
}

export function buildCategoryTree(posts: Post[]): CategoryNode[] {
  const roots: CategoryNode[] = [];
  posts.forEach((post) => addPost(roots, post.categories, post));
  return sortTree(roots);
}

export function findCategoryBySegments(nodes: CategoryNode[], segments: string[]): CategoryNode | undefined {
  let siblings = nodes;
  let node: CategoryNode | undefined;
  for (const segment of segments) {
    node = siblings.find((item) => item.slug === segment);
    if (!node) return undefined;
    siblings = node.children;
  }
  return node;
}

export function buildTagIndex(posts: Post[]): Map<string, Post[]> {
  const index = new Map<string, Post[]>();
  posts.forEach((post) => post.tags.forEach((tag) => index.set(tag, [...(index.get(tag) ?? []), post])));
  return index;
}
