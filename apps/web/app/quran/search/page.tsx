// apps/web/app/quran/search/page.tsx
// Priority 5: Redirects to the unified /search page with ?src=quran pre-selected.
// The /search page now handles all Quran searching with a richer unified experience.

import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function QuranSearchRedirectPage({ searchParams }: PageProps) {
  const { q = '', page } = await searchParams;

  const params = new URLSearchParams({ src: 'quran' });
  if (q.trim()) params.set('q', q.trim());
  if (page && page !== '1') params.set('page', page);

  redirect(`/search?${params.toString()}`);
}
