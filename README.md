# muslim-companion-poc hotfix v2

This hotfix addresses the remaining tab-restore issue for Quran and Tafseer.

## Root cause
1. `ScrollRestore` restored old Y-scroll even when the URL had a hash like `#ayah-8` or `#entry-8`.
2. Tafseer detail page did not mount `ScrollToHash`, so saved `#entry-*` anchors had nothing to execute the jump.

## Included files
- apps/web/components/ScrollRestore.tsx
- apps/web/app/tafseer/[bookSlug]/[surahNumber]/page.tsx
