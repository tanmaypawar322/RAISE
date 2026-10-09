import { MetadataRoute } from 'next';
import { slugifyTitle } from '../lib/slug';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
  ];

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues?limit=50`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return staticEntries;

    const data = await res.json();
    if (!data.success || !Array.isArray(data.issues)) return staticEntries;

    const issueEntries: MetadataRoute.Sitemap = data.issues.map((issue: any) => ({
      url: `${baseUrl}/issues/${issue._id}/${slugifyTitle(issue.title)}`,
      lastModified: new Date(issue.updatedAt || issue.createdAt || Date.now()),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

    return [...staticEntries, ...issueEntries];
  } catch {
    return staticEntries;
  }
}
