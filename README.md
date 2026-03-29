# muslim-companion hotfix v10

This patch focuses only on SearchResults.

What it changes:
- saves branch state immediately on every branch toggle
- saves card state immediately on every card toggle
- flushes state again on pagehide / visibilitychange

This is aimed at the exact case where Search returns with the right query
but still looks like a fresh search layout.
