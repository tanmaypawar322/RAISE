import type { MetadataRoute } from 'next';
import { supportedLanguages } from '../../content/i18n';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_MARKETING_URL || 'http://localhost:3001';

  const subpaths = [
    '',
    '/how-it-works',
    '/for-citizens',
    '/for-offices',
    '/privacy-and-safety',
    '/faq',
    '/about',
    '/contact',
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const sub of subpaths) {
    for (const lang of supportedLanguages) {
      const url = `${baseUrl}/${lang}${sub}`;
      entries.push({
        url,
        lastModified: new Date(),
        changeFrequency: sub === '' ? 'daily' : 'weekly',
        priority: sub === '' ? 1.0 : 0.8,
        alternates: {
          languages: {
            en: `${baseUrl}/en${sub}`,
            mr: `${baseUrl}/mr${sub}`,
            hi: `${baseUrl}/hi${sub}`,
          },
        },
      });
    }
  }

  return entries;
}
