# muslim-companion hotfix v7

This hotfix makes Search revisit behave more like the main content tabs.

## Root cause of the previous failure
The app was only restoring:
- query
- source
- book

But not the exact last search URL and not the Navigation Search-tab memory.
That meant:
- page could reset
- section/result expansion key could change
- scroll restore key could change
- Search tab itself still opened bare `/search`

## What v7 changes
- Navigation Search tab now uses saved last Search URL, like Quran/Tafseer/Hadith
- SearchPersist now saves and restores the exact last search URL
- SearchPersist also updates Search tab memory via study-context
- SearchResults keeps section/result expansion state per exact search identity
- Search page includes ScrollRestore for the exact search URL

## Included files
- apps/web/lib/study-context.ts
- apps/web/components/Navigation.tsx
- apps/web/components/SearchPersist.tsx
- apps/web/components/search/SearchResults.tsx
- apps/web/app/search/page.tsx
