# muslim-companion-poc hotfix v6

This hotfix gives Search page the same revisit behavior idea:
- restore the last search query as before
- also restore which branch/section was left expanded
- also restore which result card(s) were left expanded
- also restore scroll position for the exact search URL in the current session

## Included files
- apps/web/components/search/SearchResults.tsx
- apps/web/app/search/page.tsx

## Notes
UI state is keyed by:
- query
- source tab
- book filter
- page number

So each search result page can remember its own expanded summary state independently.
