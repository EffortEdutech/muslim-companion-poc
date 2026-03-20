# apps/web

IQRA Digital — Hadith Library PWA built with **Next.js 14 App Router**.

## Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Google Fonts: Amiri (Arabic), Cormorant Garamond (headings), Lora (body)
- Zero external search dependency — all search runs server-side from local JSON

## Prerequisites
- Node.js 18+
- pnpm 10+
- Hadith JSON files imported into `content/hadith/db/` (run import script first)

## Development

From the **repo root**:
```bash
pnpm dev
```

Or directly from this folder:
```bash
cd apps/web
pnpm dev
```

App runs at: http://localhost:3000

## Content path resolution
The app resolves hadith JSON files at:
```
../../content/hadith/db/   (relative to apps/web/)
```
This means the monorepo root must contain the `content/` folder with files imported.

## Routes
| Route | Description |
|-------|-------------|
| `/` | Collection browser — all 17 collections grouped |
| `/hadith/[bookSlug]` | Book view with chapter sidebar + hadith list |
| `/hadith/[bookSlug]/chapter/[chapterId]` | Single chapter view |
| `/search` | Full-text search with collection filter |
| `/api/search` | JSON search API endpoint |

## Search
- Server-side only — no external service required
- Searches: Arabic text, English translation, narrator, chapter/book reference
- Scored ranking: exact phrase > all terms > partial match
- Minimum query: 2 characters
- Paginated: 20 results per page

## Build
```bash
pnpm build
pnpm start
```

## Deployment
Static-export or standard Next.js deployment.
Recommended: Vercel (free tier), or any Node.js host.
