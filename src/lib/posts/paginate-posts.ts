export function paginatePosts<T>(items: T[], page: number, size = 8) {
  const totalPages = Math.max(1, Math.ceil(items.length / size));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * size;
  return { items: items.slice(start, start + size), currentPage, totalPages };
}
