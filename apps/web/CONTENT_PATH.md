# ⚠️ Content Path Notice

The web app reads hadith JSON from:

```
content/hadith/db/by_book/
content/hadith/db/by_chapter/
```

These paths are resolved relative to the **monorepo root**, not `apps/web`.

When running `pnpm dev` from the repo root, `process.cwd()` inside Next.js
resolves to `apps/web/`. The app compensates with `../../content/...`.

## Verification

If the homepage shows "Not yet imported" for all collections, run:

```bash
node -e "
const path = require('path');
const fs = require('fs');
const base = path.join(process.cwd(), '..', '..', 'content', 'hadith', 'db');
console.log('Looking at:', base);
console.log('Exists:', fs.existsSync(base));
"
```

Run this from `apps/web/` to confirm the path resolves correctly.
