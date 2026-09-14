export function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(/[,/]/).map((item) => item.trim()).filter(Boolean);
  return [];
}

export function toDate(value: unknown, fallback?: string): Date {
  const candidate = value ?? fallback ?? new Date(0);
  const date = candidate instanceof Date ? candidate : new Date(String(candidate));
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
}

export function titleFromSlug(slug: string): string {
  return slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
