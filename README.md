# muslim-companion-poc hotfix v5

This hotfix targets the remaining tafseer mismatch:

- side pointer / yellow highlight says ayah 6
- but the first actually visible entry on screen is ayah 7

## Cause
`TafseerReader.tsx` still used an old IntersectionObserver heuristic for the active highlight.
That logic could keep the previous tall block active even after the next tafseer heading had become the first visible one.

## Fix
The split-mode scroll spy now selects:
1. the first tafseer entry whose heading is actually visible below the sticky bars
2. otherwise the entry crossing that top boundary
3. otherwise the first entry

This aligns the active highlight with what the user actually sees.
