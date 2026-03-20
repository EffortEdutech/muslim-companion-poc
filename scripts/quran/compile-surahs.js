/**
 * compile-surahs.js
 *
 * Reads all Quran source files and compiles them into:
 *   content/quran/db/compiled/001.json … 114.json
 *   content/quran/db/metadata/surah-index.json
 *   content/quran/db/metadata/juz-index.json
 *   content/quran/db/metadata/search-index.json   ← NEW
 *
 * Run from the repo root:
 *   node scripts/quran/compile-surahs.js
 *
 * Source files expected under content/quran/source/:
 *
 *   TEXT (Tanzil pipe format — surah|ayah|text):
 *     arabic/quran-uthmani.txt
 *     translations/en.sahih.txt
 *     translations/en.yusufali.txt
 *     translations/ms.basmeih.txt
 *     transliteration/en.transliteration.txt
 *
 *   JSON (metadata only — no txt equivalent):
 *     metadata/surah_info.json
 *     metadata/juz_info.json
 */

const fs   = require('fs');
const path = require('path');

const ROOT     = path.resolve(__dirname, '..', '..');
const SRC      = path.join(ROOT, 'content', 'quran', 'source');
const OUT_COMP = path.join(ROOT, 'content', 'quran', 'db', 'compiled');
const OUT_META = path.join(ROOT, 'content', 'quran', 'db', 'metadata');

// ── Tanzil pipe-format parser ─────────────────────────────────────
// Format: surah|ayah|text  (# lines = comments, blank lines ignored)
// Returns: Map<"surah:ayah", text>

function parseTxt(relPath) {
  const fullPath = path.join(SRC, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing source file: ${fullPath}`);
  }

  const lines = fs.readFileSync(fullPath, 'utf-8').split('\n');
  const map   = new Map();

  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const first  = line.indexOf('|');
    const second = line.indexOf('|', first + 1);
    if (first === -1 || second === -1) continue;

    const surah = line.slice(0, first).trim();
    const ayah  = line.slice(first + 1, second).trim();
    // Strip any HTML tags (transliteration file has <u>, <b> etc.)
    const text  = line.slice(second + 1).trim().replace(/<[^>]+>/g, '');

    if (surah && ayah && text) {
      map.set(`${surah}:${ayah}`, text);
    }
  }

  console.log(`  Loaded ${map.size} ayahs  ← ${path.basename(fullPath)}`);
  return map;
}

function readJson(relPath) {
  const fullPath = path.join(SRC, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing metadata file: ${fullPath}`);
  }
  return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
}

function pad(n) { return String(n).padStart(3, '0'); }

// ── Load ──────────────────────────────────────────────────────────

console.log('\nLoading source files…\n');

const arabicMap   = parseTxt('arabic/quran-uthmani.txt');
const sahihMap    = parseTxt('translations/en.sahih.txt');
const yusufaliMap = parseTxt('translations/en.yusufali.txt');
const basmeihMap  = parseTxt('translations/ms.basmeih.txt');
const translitMap = parseTxt('transliteration/en.transliteration.txt');

const surahInfoJson = readJson('metadata/surah_info.json');
const juzInfoJson   = readJson('metadata/juz_info.json');

const surahMeta = {};
for (const s of surahInfoJson.surahs_metadata) {
  surahMeta[s.number] = s;
}

// ── Validate ──────────────────────────────────────────────────────

const EXPECTED = 6236;
console.log('\nValidating counts…');
let warn = false;
for (const [label, map] of [
  ['Arabic (Uthmani)',     arabicMap],
  ['English (Sahih Intl)', sahihMap],
  ['English (Yusuf Ali)',  yusufaliMap],
  ['Malay (Basmeih)',      basmeihMap],
  ['Transliteration',      translitMap],
]) {
  const ok = map.size === EXPECTED;
  console.log(`  ${ok ? '✓' : '✗'} ${label}: ${map.size}${ok ? '' : ` (expected ${EXPECTED})`}`);
  if (!ok) warn = true;
}
if (warn) console.warn('\n  ⚠  Mismatch — missing ayahs will be empty strings.\n');

// ── Build surah list from Arabic map ─────────────────────────────

const surahNumbers = [...new Set(
  [...arabicMap.keys()].map(k => parseInt(k.split(':')[0], 10))
)].sort((a, b) => a - b);

// ── Compile ───────────────────────────────────────────────────────

fs.mkdirSync(OUT_COMP, { recursive: true });
fs.mkdirSync(OUT_META, { recursive: true });

const surahIndex  = [];
const searchIndex = [];   // flat array — one entry per ayah
let   totalAyahs  = 0;

console.log(`\nCompiling ${surahNumbers.length} surahs…`);

for (const n of surahNumbers) {
  const meta = surahMeta[n] || {};

  const ayahNums = [...arabicMap.keys()]
    .filter(k => parseInt(k.split(':')[0], 10) === n)
    .map(k => parseInt(k.split(':')[1], 10))
    .sort((a, b) => a - b);

  const ayahs = ayahNums.map(a => {
    const key = `${n}:${a}`;
    return {
      ayah:            a,
      arabic:          arabicMap.get(key)   || '',
      transliteration: translitMap.get(key) || '',
      translations: {
        en_sahih:    sahihMap.get(key)    || '',
        en_yusufali: yusufaliMap.get(key) || '',
        ms_basmeih:  basmeihMap.get(key)  || '',
      },
    };
  });

  const compiled = {
    surah: n,
    metadata: {
      nameArabic:      meta.name_arabic         || '',
      nameEnglish:     meta.name_english         || '',
      nameTranslit:    meta.name_transliterated  || '',
      meaning:         meta.meaning              || '',
      revelation:      meta.revelation?.place    || '',
      revelationOrder: meta.revelation?.order    || null,
      period:          meta.revelation?.period   || '',
      ayahCount:       ayahs.length,
      wordCount:       meta.structure?.word_count   || null,
      letterCount:     meta.structure?.letter_count || null,
      juz:             meta.structure?.juz          || null,
      pageStart:       meta.structure?.page_start   || null,
      themes:          meta.themes                  || [],
      otherNames:      meta.other_names             || [],
      significance:    meta.significance            || '',
    },
    ayahs,
  };

  fs.writeFileSync(
    path.join(OUT_COMP, `${pad(n)}.json`),
    JSON.stringify(compiled, null, 2),
    'utf-8'
  );

  totalAyahs += ayahs.length;

  // Surah browse index entry
  surahIndex.push({
    surah:        n,
    nameArabic:   compiled.metadata.nameArabic,
    nameEnglish:  compiled.metadata.nameEnglish,
    nameTranslit: compiled.metadata.nameTranslit,
    meaning:      compiled.metadata.meaning,
    revelation:   compiled.metadata.revelation,
    ayahCount:    compiled.metadata.ayahCount,
    juz:          compiled.metadata.juz,
    pageStart:    compiled.metadata.pageStart,
  });

  // Search index — short keys keep file size tight (~4 MB uncompressed)
  // s = surah, a = ayah, ar = arabic, sa = sahih, yu = yusufali, ms = basmeih
  // surah name stored once per surah entry — used for display in results
  for (const ayah of ayahs) {
    searchIndex.push({
      s:  n,
      a:  ayah.ayah,
      sn: compiled.metadata.nameEnglish,  // surah name (English)
      ar: ayah.arabic,
      sa: ayah.translations.en_sahih,
      yu: ayah.translations.en_yusufali,
      ms: ayah.translations.ms_basmeih,
    });
  }

  if (n === 1 || n % 20 === 0 || n === 114) {
    console.log(`  [${pad(n)}/114] ${compiled.metadata.nameEnglish || `Surah ${n}`} — ${ayahs.length} ayahs`);
  }
}

// ── Write index files ─────────────────────────────────────────────

fs.writeFileSync(
  path.join(OUT_META, 'surah-index.json'),
  JSON.stringify({ metadata: { totalSurahs: surahNumbers.length, totalAyahs }, surahs: surahIndex }, null, 2),
  'utf-8'
);

fs.writeFileSync(
  path.join(OUT_META, 'juz-index.json'),
  JSON.stringify(juzInfoJson, null, 2),
  'utf-8'
);

// Search index written as compact JSON (no pretty-print — size matters)
fs.writeFileSync(
  path.join(OUT_META, 'search-index.json'),
  JSON.stringify(searchIndex),
  'utf-8'
);

const searchSize = fs.statSync(path.join(OUT_META, 'search-index.json')).size;
const searchMB   = (searchSize / 1024 / 1024).toFixed(2);

console.log(`\n✓  ${surahNumbers.length} surahs  |  ${totalAyahs} ayahs compiled`);
console.log(`✓  surah-index.json   →  ${OUT_META}`);
console.log(`✓  juz-index.json     →  ${OUT_META}`);
console.log(`✓  search-index.json  →  ${OUT_META}  (${searchMB} MB)`);
console.log('\nAlhamdulillah — done.\n');
