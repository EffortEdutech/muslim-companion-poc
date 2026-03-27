# muslim-companion-poc patch pack

Included files:
- apps/web/lib/study-context.ts
- apps/web/components/ReadingProgress.tsx
- apps/web/components/StudyFootstep.tsx
- apps/web/components/VisibleAnchorTracker.tsx
- apps/web/app/quran/page.tsx
- apps/web/app/tafseer/page.tsx
- apps/web/app/hadith/page.tsx
- apps/web/app/quran/[surahNumber]/page.tsx
- apps/web/app/tafseer/[bookSlug]/[surahNumber]/page.tsx
- apps/web/app/hadith/[bookSlug]/page.tsx

Purpose:
1. Fix stale breadcrumb after returning to section home.
2. Persist last exact reading anchor for Quran, Tafseer, and Hadith.
