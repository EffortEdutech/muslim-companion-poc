# muslim-companion-poc hotfix v3

This hotfix includes two focused fixes.

## 1) Tafseer tab restore drift
`VisibleAnchorTracker.tsx` now preserves the exact hash target on initial load until the user actually scrolls.
This prevents the saved tafseer entry from dropping backward by one ayah on each revisit.

## 2) Search page scale inconsistency
`SearchBar.tsx` now uses `fontSize: '1rem'` on the hadith collection `<select>`.
This helps avoid mobile browser zoom/scaling differences when opening the Search tab.

## Included files
- apps/web/components/VisibleAnchorTracker.tsx
- apps/web/components/SearchBar.tsx
