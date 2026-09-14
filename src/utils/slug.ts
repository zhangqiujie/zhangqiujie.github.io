export function normalizeSlug(value: string): string {
  return value.trim().toLowerCase().replace(/\.(md|mdx|markdown)$/i, '').replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-').replace(/^-+|-+$/g, '');
}

export function parseJekyllFilename(filename: string) {
  const name = filename.replace(/\.(md|mdx|markdown)$/i, '');
  const match = name.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
  return { date: match?.[1], slug: normalizeSlug(match?.[2] ?? name) };
}
