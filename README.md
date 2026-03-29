# muslim-companion hotfix v12

This targets the inconsistent Search last-viewed restore.

## Likely root cause
After returning to Search, `SearchPersist` could overwrite the previously
saved anchored URL with a plain no-hash search URL.
That would make:
- first revisit sometimes correct
- second revisit often wrong
- behavior feel inconsistent

## What v12 changes
- SearchPersist preserves the previously saved anchored URL for the same
  exact search identity instead of overwriting it with a plain URL
- SearchVisibleAnchorTracker now flushes the current visible anchor on
  pagehide / visibilitychange for more reliable saving before leaving

## Included files
- apps/web/components/SearchPersist.tsx
- apps/web/components/SearchVisibleAnchorTracker.tsx

Apply on top of your working Search fixes.
