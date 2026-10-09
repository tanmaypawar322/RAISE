import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import IssueDetailClient from './IssueDetailClient';
import { slugifyTitle } from '../../../../lib/slug';

interface PageProps {
  params: Promise<{
    id: string;
    slug: string;
  }>;
}

async function fetchIssue(id: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/issues/${id}`,
      {
        next: { revalidate: 60 },
      }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchIssue(id);

  if (!data || !data.success || !data.issue) {
    return {
      title: 'Civic Grievance | RAISE Platform',
      description: 'Independent civic grievance platform for Indian municipalities.',
      robots: { index: false, follow: false },
    };
  }

  const issue = data.issue;
  const title = `${issue.title} | RAISE`;
  const description =
    issue.description?.slice(0, 155) ||
    'View civic grievance details, status timeline and official resolution proof on RAISE.';
  const ward = issue.location?.ward || 'Pimpri-Chinchwad';
  const category = issue.category || 'civic';
  const raiseCount = issue.raiseCount || 1;

  const ogUrl = `/api/og?title=${encodeURIComponent(issue.title)}&ward=${encodeURIComponent(
    ward
  )}&category=${encodeURIComponent(category)}&raises=${raiseCount}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: [
        {
          url: ogUrl,
          width: 1200,
          height: 630,
          alt: issue.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogUrl],
    },
  };
}

async function IssueDetailContent({ params }: PageProps) {
  const { id, slug } = await params;
  const data = await fetchIssue(id);

  if (!data || !data.success || !data.issue) {
    return <IssueDetailClient initialIssue={null} />;
  }

  return (
    <IssueDetailClient
      initialIssue={data.issue}
      isMerged={data.isMerged}
      mergedIntoId={data.mergedIntoId}
    />
  );
}

export default function IssueDetailPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="animate-pulse text-slate-400 font-semibold text-sm">
            Loading Grievance Dossier...
          </div>
        </div>
      }
    >
      <IssueDetailContent {...props} />
    </Suspense>
  );
}
