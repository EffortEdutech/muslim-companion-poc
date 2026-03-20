import { NextRequest, NextResponse } from 'next/server';
import searchQuran from '@/app/quran/search/search-logic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q')?.trim() || '';
  const page  = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  const result = searchQuran(query, page);

  return NextResponse.json(result);
}
