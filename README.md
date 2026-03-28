# muslim-companion-poc hotfix v4

This hotfix addresses two remaining issues.

## 1) Tafseer revisit mismatch
Problem:
- Saved pointer/highlight could remain on ayah 7
- But the viewport visually showed ayah 8 at the top

Cause:
- Tafseer entries are tall blocks
- The old tracker used a generic focus-line heuristic, which could keep selecting the previous block

Fix:
- `VisibleAnchorTracker.tsx` now supports `mode="top-heading"`
- Tafseer page uses that mode, so it saves the first actually visible tafseer heading below the sticky nav

## 2) Search page horizontal overflow
Problem:
- Bottom mobile nav looked inconsistent only on Search
- Bookmark tab could disappear until the whole page was scrolled sideways

Cause:
- Search tabs used `width: fit-content` with no overflow containment
- That could widen the page on mobile

Fix:
- `UnifiedSearchTabs.tsx` now scrolls internally instead of widening the page
- `app/search/page.tsx` now constrains horizontal overflow and matches other pages more closely

## Included files
- apps/web/components/VisibleAnchorTracker.tsx
- apps/web/app/tafseer/[bookSlug]/[surahNumber]/page.tsx
- apps/web/components/UnifiedSearchTabs.tsx
- apps/web/app/search/page.tsx
