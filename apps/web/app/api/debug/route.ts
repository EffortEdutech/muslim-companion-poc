// apps/web/app/api/debug/route.ts
// Temporary debug route — shows exactly what Vercel sees at runtime.
// Visit /api/debug after deployment to diagnose content path issues.
// REMOVE THIS FILE after debugging is complete.

import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';

function check(label: string, p: string): object {
  const exists = fs.existsSync(p);
  let extra = '';
  if (exists) {
    try {
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        const files = fs.readdirSync(p);
        extra = `${files.length} items: [${files.slice(0, 5).join(', ')}${files.length > 5 ? '...' : ''}]`;
      } else {
        extra = `${(stat.size / 1024).toFixed(1)} KB`;
      }
    } catch (e: any) {
      extra = `error: ${e.message}`;
    }
  }
  return { label, path: p, exists, detail: extra };
}

export async function GET() {
  const cwd      = process.cwd();
  const repoRoot = process.env.REPO_ROOT || path.join(cwd, '..', '..');

  const resolvedRoot = path.resolve(repoRoot);
  const contentDir   = path.join(resolvedRoot, 'content');

  const checks = [
    check('cwd',                    cwd),
    check('REPO_ROOT env',          process.env.REPO_ROOT ?? '(not set)'),
    check('resolvedRoot',           resolvedRoot),
    check('content/',               contentDir),
    check('content/quran/',         path.join(contentDir, 'quran')),
    check('content/quran/db/compiled/', path.join(contentDir, 'quran', 'db', 'compiled')),
    check('content/quran/db/metadata/', path.join(contentDir, 'quran', 'db', 'metadata')),
    check('search-index.json',      path.join(contentDir, 'quran', 'db', 'metadata', 'search-index.json')),
    check('content/hadith/',        path.join(contentDir, 'hadith')),
    check('hadith/db/by_book/',     path.join(contentDir, 'hadith', 'db', 'by_book')),
    check('hadith/db/metadata/',    path.join(contentDir, 'hadith', 'db', 'metadata')),
    check('hadith-search-index.json', path.join(contentDir, 'hadith', 'db', 'metadata', 'hadith-search-index.json')),
    check('content/tafsir/',        path.join(contentDir, 'tafsir')),
    check('tafsir/db/',             path.join(contentDir, 'tafsir', 'db')),
    check('tafsir/db/en-tafisr-ibn-kathir/', path.join(contentDir, 'tafsir', 'db', 'en-tafisr-ibn-kathir')),
    check('tafsir/db/en-al-jalalayn/',       path.join(contentDir, 'tafsir', 'db', 'en-al-jalalayn')),
    check('tafsir/db/metadata/',    path.join(contentDir, 'tafsir', 'db', 'metadata')),
    check('tafsir index-eng.json',  path.join(contentDir, 'tafsir', 'db', 'metadata', 'index-eng.json')),

    // Also check directly inside apps/web in case cp worked
    check('apps/web/content/ (cp target)', path.join(cwd, 'content')),
    check('apps/web/content/tafsir/',      path.join(cwd, 'content', 'tafsir')),
    check('apps/web/content/hadith/',      path.join(cwd, 'content', 'hadith')),
  ];

  // List root of cwd so we can see what's there
  let cwdListing: string[] = [];
  try { cwdListing = fs.readdirSync(cwd); } catch {}

  let rootListing: string[] = [];
  try { rootListing = fs.readdirSync(resolvedRoot); } catch {}

  return NextResponse.json({
    env: {
      REPO_ROOT:   process.env.REPO_ROOT,
      NODE_ENV:    process.env.NODE_ENV,
      VERCEL:      process.env.VERCEL,
      VERCEL_ENV:  process.env.VERCEL_ENV,
    },
    cwd,
    cwdListing,
    resolvedRoot,
    rootListing,
    checks,
  }, { status: 200 });
}
