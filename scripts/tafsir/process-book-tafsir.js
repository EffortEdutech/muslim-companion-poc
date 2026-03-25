/**
 * scripts/tafsir/process-book-tafsir.js
 *
 * Converts a single-book tafsir JSON (QUL/Tarteel flat format) into
 * per-surah files compatible with the IQRA Digital runtime.
 *
 * Source format (what you have):
 *   {
 *     "1:1": { "text": "<rich HTML...>" },   ← full entry
 *     "1:7": "1:6",                           ← pointer: same text as 1:6
 *     ...
 *   }
 *
 * Output format (what tafseer.ts expects):
 *   content/tafsir/db/{slug}/{surahNumber}.json
 *   {
 *     "_meta": { "slug": "en-tafisr-ibn-kathir", "surah": 1, ... },
 *     "ayahs": [ { "id": 1, "text": "..." }, { "id": 2, "text": "..." }, ... ]
 *   }
 *
 * Pointer resolution:
 *   - A pointer means "this ayah is covered by the same tafseer block as the target"
 *   - Each ayah in the output gets its own entry with the resolved text
 *   - This allows the reader to look up ANY ayah directly
 *
 * Usage:
 *   node scripts/tafsir/process-book-tafsir.js
 *   node scripts/tafsir/process-book-tafsir.js --source=content/tafsir/source/en-tafisr-ibn-kathir.json
 *   node scripts/tafsir/process-book-tafsir.js --slug=en-tafisr-ibn-kathir --source=path/to/file.json
 *
 * Place source file at:
 *   content/tafsir/source/en-tafisr-ibn-kathir.json  (default path)
 */

const fs   = require('fs')
const path = require('path')

// ─── Parse args ───────────────────────────────────────────────────────────────

const args     = process.argv.slice(2)
const getArg   = (prefix) => (args.find(a => a.startsWith(prefix)) || '').replace(prefix, '') || null

const ROOT     = process.cwd()
const slug     = getArg('--slug=')     || 'en-tafisr-ibn-kathir'
const srcArg   = getArg('--source=')

// ─── Edition registry ─────────────────────────────────────────────────────────

const EDITIONS = {
  'en-tafisr-ibn-kathir':    { name: 'Tafsir Ibn Kathir', author: 'Hafiz Ibn Kathir', language: 'English', lang: 'en' },
  'en-al-jalalayn':          { name: 'Al-Jalalayn',       author: 'Al-Mahalli & Al-Suyuti', language: 'English', lang: 'en' },
  'en-tafsir-maarif-ul-quran':{ name: 'Maarif-ul-Quran', author: 'Mufti Muhammad Shafi', language: 'English', lang: 'en' },
  'ar-tafsir-ibn-kathir':    { name: 'تفسير ابن كثير',   author: 'الحافظ ابن كثير', language: 'Arabic', lang: 'ar' },
  'ar-tafsir-muyassar':      { name: 'التفسير الميسر',   author: 'مجمع الملك فهد', language: 'Arabic', lang: 'ar' },
  'ur-tafseer-ibn-e-kaseer': { name: 'تفسیر ابن کثیر',  author: 'حافظ ابن کثیر', language: 'Urdu', lang: 'ur' },
}

const edition = EDITIONS[slug]
if (!edition) {
  console.error(`✗ Unknown slug: ${slug}`)
  console.error(`  Known slugs: ${Object.keys(EDITIONS).join(', ')}`)
  process.exit(1)
}

// ─── Paths ────────────────────────────────────────────────────────────────────

const SOURCE_FILE = srcArg
  ? path.resolve(srcArg)
  : path.join(ROOT, 'content', 'tafsir', 'source', `${slug}.json`)

const OUTPUT_DIR  = path.join(ROOT, 'content', 'tafsir', 'db', slug)

// Expected verse counts per surah (standard Hafs)
const VERSE_COUNTS = [
  7,286,200,176,120,165,206,75,129,109,
  123,111,43,52,99,128,111,110,98,135,
  112,78,118,64,77,227,93,88,69,60,
  34,30,73,54,45,83,182,88,75,85,
  54,53,89,59,37,35,38,29,18,45,
  60,49,62,55,78,96,29,22,24,13,
  14,11,11,18,12,12,30,52,52,44,
  28,28,20,56,40,31,50,40,46,42,
  29,19,36,25,22,17,19,26,30,20,
  15,21,11,8,8,19,5,8,8,11,
  11,8,3,9,5,4,7,3,6,3,
  5,4,5,6,
]

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log('\n╔══════════════════════════════════════════════════╗')
console.log('║  IQRA Digital — Process Book Tafsir             ║')
console.log('╚══════════════════════════════════════════════════╝\n')

console.log(`Slug:   ${slug}`)
console.log(`Name:   ${edition.name}`)
console.log(`Source: ${SOURCE_FILE}`)
console.log(`Output: ${OUTPUT_DIR}\n`)

if (!fs.existsSync(SOURCE_FILE)) {
  console.error(`✗ Source file not found: ${SOURCE_FILE}`)
  console.error(`\n  Place the book JSON at that path and re-run.`)
  console.error(`  Or specify a custom path: --source=path/to/file.json`)
  process.exit(1)
}

// ─── Load and validate source ─────────────────────────────────────────────────

console.log('Loading source file...')
let raw
try {
  raw = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'))
} catch (e) {
  console.error(`✗ Failed to parse JSON: ${e.message}`)
  process.exit(1)
}

const allKeys   = Object.keys(raw)
const fullCount = allKeys.filter(k => typeof raw[k] === 'object').length
const ptrCount  = allKeys.filter(k => typeof raw[k] === 'string').length

console.log(`✓ Loaded ${allKeys.length} entries (${fullCount} full, ${ptrCount} pointers)\n`)

// ─── Resolve pointers ────────────────────────────────────────────────────────
// A string value is a pointer to another key whose text should be used.
// Pointers may chain (though uncommon) — resolve recursively up to depth 5.

function resolveText(key, depth = 0) {
  if (depth > 5) return ''
  const val = raw[key]
  if (!val) return ''
  if (typeof val === 'object') return (val.text || '').trim()
  if (typeof val === 'string') return resolveText(val, depth + 1)
  return ''
}

// ─── Group by surah and write per-surah files ─────────────────────────────────

fs.mkdirSync(OUTPUT_DIR, { recursive: true })

let totalAyahs   = 0
let totalEmpty   = 0
let totalMissing = 0
const surahStats = []

for (let surah = 1; surah <= 114; surah++) {
  const expectedCount = VERSE_COUNTS[surah - 1]
  const ayahs         = []
  let   emptyCount    = 0
  let   missingCount  = 0

  for (let ayah = 1; ayah <= expectedCount; ayah++) {
    const key  = `${surah}:${ayah}`
    const text = resolveText(key)

    if (!text) {
      // Some editions have gaps — include empty entry so id sequence stays intact
      ayahs.push({ id: ayah, text: '' })
      emptyCount++
      missingCount++
    } else {
      ayahs.push({ id: ayah, text })
    }
  }

  const nonEmpty = ayahs.filter(a => a.text).length

  const output = {
    _meta: {
      slug,
      surah,
      edition: edition.name,
      author:  edition.author,
      lang:    edition.lang,
      language: edition.language,
      generatedAt: new Date().toISOString(),
    },
    ayahs,
  }

  const outPath = path.join(OUTPUT_DIR, `${surah}.json`)
  fs.writeFileSync(outPath, JSON.stringify(output), 'utf8')

  totalAyahs   += nonEmpty
  totalEmpty   += emptyCount
  surahStats.push({ surah, total: expectedCount, hasText: nonEmpty, empty: emptyCount })

  if (surah % 20 === 0 || surah === 114) {
    const pct = Math.round((surah / 114) * 100)
    const bar = '█'.repeat(Math.round(pct / 5)) + '░'.repeat(20 - Math.round(pct / 5))
    process.stdout.write(`\r  [${bar}] ${pct}% (${surah}/114)  `)
  }
}

process.stdout.write('\n')

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════')
console.log('SUMMARY')
console.log('══════════════════════════════════════════════════')
console.log(`✓ ${edition.name}`)
console.log(`  114 surah files written to: ${OUTPUT_DIR}`)
console.log(`  ${totalAyahs.toLocaleString()} ayahs with tafseer text`)
if (totalEmpty > 0) {
  console.log(`  ${totalEmpty} empty ayahs (gaps in source — normal for some editions)`)
}

// Show any surahs with significant gaps
const gapSurahs = surahStats.filter(s => s.empty > s.total * 0.5)
if (gapSurahs.length > 0) {
  console.log(`\n  Surahs with >50% empty ayahs:`)
  gapSurahs.forEach(s => console.log(`    Surah ${s.surah}: ${s.hasText}/${s.total} ayahs have text`))
}

console.log('\nAlhamdulillah — tafsir processing complete.')
console.log(`\nNext step: restart your dev server to load the new files.\n`)
