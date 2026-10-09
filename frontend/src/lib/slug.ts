/**
 * Generates an SEO-friendly URL slug from an issue title.
 * Supports English transliteration and cleans special characters.
 */
export function slugifyTitle(title: string): string {
  if (!title) return 'civic-issue';

  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '') // Keep unicode letters & numbers (Marathi, Hindi, English)
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70);

  return slug || 'civic-issue';
}
