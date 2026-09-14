import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import rewriteAssetPaths from './scripts/remark-rewrite-assets.mjs';

const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isProjectPage = repository && !repository.endsWith('.github.io');
const base = process.env.BASE_PATH ?? (isProjectPage ? `/${repository}` : '/');

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://YOUR_GITHUB_USERNAME.github.io',
  base,
  integrations: [mdx()],
  markdown: { remarkPlugins: [[rewriteAssetPaths, { base }]] },
});
