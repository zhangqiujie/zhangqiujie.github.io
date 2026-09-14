import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const postsDirectory = resolve('src/content/posts');
const assetsDirectory = resolve('public/assets');

async function countPosts() {
  const files = await readdir(postsDirectory);
  return files.filter((file) => /\.(md|mdx|markdown)$/i.test(file)).length;
}

function ensureDirectory(path, label) {
  if (!existsSync(path)) throw new Error(`${label} is missing: ${path}`);
}

ensureDirectory(postsDirectory, 'Committed posts directory');
ensureDirectory(assetsDirectory, 'Committed assets directory');

const postCount = await countPosts();
if (postCount === 0) throw new Error(`No posts found in ${postsDirectory}`);

console.log(`Using ${postCount} committed posts and local assets.`);
