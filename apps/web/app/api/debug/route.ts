// apps/web/app/api/debug/route.ts
import { NextResponse } from 'next/server';
import path from 'path';
import fs   from 'fs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cwd      = process.cwd();
  const repoRoot = path.resolve(process.env.REPO_ROOT ?? path.join(cwd, '..', '..'));
  const content  = path.join(repoRoot, 'content');

  function ls(dir: string) {
    try {
      if (!fs.existsSync(dir)) return `NOT FOUND`;
      const items = fs.readdirSync(dir);
      return `${items.length} items: [${items.slice(0, 8).join(', ')}${items.length > 8 ? '...' : ''}]`;
    } catch (e: any) { return `ERROR: ${e.message}`; }
  }

  function count(dir: string) {
    try {
      if (!fs.existsSync(dir)) return 0;
      return fs.readdirSync(dir).filter((f: string) => f.endsWith('.json')).length;
    } catch { return 0; }
  }

  return NextResponse.json({
    env: {
      REPO_ROOT: process.env.REPO_ROOT ?? '(not set)',
      NODE_ENV:  process.env.NODE_ENV,
      VERCEL:    process.env.VERCEL ?? '(not set)',
    },
    paths: { cwd, repoRoot, content, contentExists: fs.existsSync(content) },
    cwd_listing:     ls(cwd),
    content_listing: ls(content),
    quran: {
      compiled:    count(path.join(content, 'quran', 'db', 'compiled')),
      searchIndex: fs.existsSync(path.join(content, 'quran', 'db', 'metadata', 'search-index.json')),
    },
    hadith: {
      bukhari:     count(path.join(content, 'hadith', 'db', 'by_book', 'the_9_books', 'bukhari')),
      searchIndex: fs.existsSync(path.join(content, 'hadith', 'db', 'metadata', 'hadith-search-index.json')),
    },
    tafsir: {
      ibn_kathir: count(path.join(content, 'tafsir', 'db', 'en-tafisr-ibn-kathir')),
      jalalayn:   count(path.join(content, 'tafsir', 'db', 'en-al-jalalayn')),
      index_eng:  fs.existsSync(path.join(content, 'tafsir', 'db', 'metadata', 'index-eng.json')),
    },
  }, { status: 200 });
}
