/**
 * compile-tafseer.js
 *
 * Reads raw tafseer JSON from Tarteel QUL and compiles into
 * per-surah files ready for the Next.js reader.
 *
 * Run from repo root:
 *   node scripts/tafseer/compile-tafseer.js
 *
 * Source files expected under content/tafseer/source/:
 *   en_ibn_kathir.json   ← Download JSON from qul.tarteel.ai/resources/tafsir/35
 *
 * Output:
 *   content/tafseer/db/compiled/ibn_kathir/001.json … 114.json
 *   content/tafseer/db/compiled/tafseer-index.json
 *
 * QUL JSON schema:
 *   {
 *     "2:3": { "text": "...", "ayah_keys": ["2:3", "2:4"] },  ← group entry
 *     "2:4": "2:3"                                              ← pointer to group
 *   }
 */

const fs   = require('fs');
const path = require('path');

const ROOT    = path.resolve(__dirname, '..', '..');
const SRC     = path.join(ROOT, 'content', 'tafseer', 'source');
const OUT     = path.join(ROOT, 'content', 'tafseer', 'db', 'compiled');

// ── Tafseer collections to compile ───────────────────────────────
const COLLECTIONS = [
  {
    id:       'ibn_kathir',
    filename: 'en_ibn_kathir.json',
    name:     'Tafsir Ibn Kathir',
    author:   'Ismail ibn Umar ibn Kathir',
    language: 'English',
    lang:     'en',
  },
];

function pad(n) { return String(n).padStart(3, '0'); }

// ── Parse ayah key "2:3" → { surah: 2, ayah: 3 } ─────────────────
function parseKey(key) {
  const [s, a] = key.split(':').map(Number);
  return { surah: s, ayah: a };
}

// ── Resolve all pointers in a raw QUL JSON ────────────────────────
// Returns a flat array of unique group entries (no duplicate text).
function resolveGroups(raw) {
  const groups = [];
  const seen   = new Set();

  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'object' && value !== null) {
      // This is a group entry — has text + ayah_keys
      if (!seen.has(key)) {
        seen.add(key);
        groups.push({
          groupKey: key,
          text:     value.text      || '',
          ayahKeys: value.ayah_keys || [key],
        });
      }
    }
    // string values are pointers — they are handled via ayah_keys in the group
  }

  return groups;
}

// ── Build per-surah entries from the resolved groups ──────────────
function buildSurahEntries(groups) {
  // Map surahNumber → array of entries
  const surahMap = new Map();

  for (const group of groups) {
    // Determine the surah from the first ayah_key
    const firstKey = group.ayahKeys[0] || group.groupKey;
    const { surah } = parseKey(firstKey);

    if (!surahMap.has(surah)) surahMap.set(surah, []);

    // fromAyah / toAyah span
    const ayahNums = group.ayahKeys
      .filter(k => parseKey(k).surah === surah)
      .map(k => parseKey(k).ayah)
      .sort((a, b) => a - b);

    const fromAyah = ayahNums[0]  ?? parseKey(group.groupKey).ayah;
    const toAyah   = ayahNums[ayahNums.length - 1] ?? fromAyah;

    surahMap.get(surah).push({
      fromAyah,
      toAyah,
      ayahKeys: group.ayahKeys,
      text:     group.text,
    });
  }

  // Sort each surah's entries by fromAyah
  for (const [, entries] of surahMap) {
    entries.sort((a, b) => a.fromAyah - b.fromAyah);
  }

  return surahMap;
}

// ── Main ──────────────────────────────────────────────────────────

console.log('\nCompiling tafseer…\n');

for (const col of COLLECTIONS) {
  const srcPath = path.join(SRC, col.filename);

  if (!fs.existsSync(srcPath)) {
    console.error(`  ✗ Missing: ${srcPath}`);
    console.error(`    Download JSON from: https://qul.tarteel.ai/resources/tafsir/35`);
    console.error(`    Save as: content/tafseer/source/en_ibn_kathir.json\n`);
    continue;
  }

  console.log(`  Loading ${col.filename}…`);
  const raw      = JSON.parse(fs.readFileSync(srcPath, 'utf-8'));
  const keys     = Object.keys(raw);
  const groups   = resolveGroups(raw);
  const surahMap = buildSurahEntries(groups);

  console.log(`  Resolved ${groups.length} tafseer entries across ${surahMap.size} surahs`);

  // Output dir for this collection
  const colOut = path.join(OUT, col.id);
  fs.mkdirSync(colOut, { recursive: true });

  const indexEntries = [];

  for (const [surahNum, entries] of surahMap) {
    const compiled = {
      surah:      surahNum,
      collection: {
        id:       col.id,
        name:     col.name,
        author:   col.author,
        language: col.language,
        lang:     col.lang,
      },
      entryCount: entries.length,
      entries,
    };

    const outPath = path.join(colOut, `${pad(surahNum)}.json`);
    fs.writeFileSync(outPath, JSON.stringify(compiled, null, 2), 'utf-8');

    indexEntries.push({ surah: surahNum, entryCount: entries.length });
  }

  // Write collection index
  const indexPath = path.join(colOut, 'index.json');
  fs.writeFileSync(
    indexPath,
    JSON.stringify({
      collection: { id: col.id, name: col.name, author: col.author, language: col.language },
      totalSurahs: surahMap.size,
      surahs: indexEntries,
    }, null, 2),
    'utf-8'
  );

  // Summary
  const totalEntries = indexEntries.reduce((t, e) => t + e.entryCount, 0);
  console.log(`  ✓ ${col.name}`);
  console.log(`    ${surahMap.size} surahs  |  ${totalEntries} entries`);
  console.log(`    → ${colOut}\n`);
}

console.log('Alhamdulillah — tafseer compilation complete.\n');
