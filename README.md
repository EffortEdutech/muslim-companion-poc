# muslim-companion hotfix v13

This patch does two things:

1. Fixes the Vercel build error:
- `ReadingProgress.tsx` now only accepts reader sections:
  `quran | tafseer | hadith`

2. Replaces inconsistent Search hash-anchor restore with a simpler,
   more reliable exact-scroll restore:
- SearchPersist saves the exact Search URL without hash
- SearchScrollRestore restores the last saved scrollY after Search UI is restored
- Search page no longer uses SearchVisibleAnchorTracker

This is intended to be more stable than the previous hash-based Search last-viewed logic.
