export function parseComparisonSlugs(value: string | null): string[] {
  return [...new Set((value ?? '').split(',').filter((slug) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)))].slice(0, 4);
}

export function toggleComparisonSlug(current: string[], slug: string): string[] {
  if (current.includes(slug)) return current.filter((item) => item !== slug);
  if (current.length >= 4) throw new Error('You can compare up to four properties.');
  return [...current, slug];
}
