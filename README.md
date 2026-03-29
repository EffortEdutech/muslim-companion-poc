# muslim-companion hotfix v8

This fixes the reason v7 still behaved like a fresh search.

## Root cause
The search UI state was being restored and persisted in the same mount cycle.
That allowed the default state to overwrite the saved state before restoration finished.

## What v8 changes
- SearchResults now restores with `useLayoutEffect` before paint
- SearchResults only persists AFTER restoration is complete
- Search tab / exact search URL memory from v7 remains
- ScrollRestore remains on the exact search URL

## Included files
- apps/web/components/search/SearchResults.tsx

Optional but recommended if you had not already applied v7:
- keep v7's Navigation/SearchPersist/study-context/search page changes too
