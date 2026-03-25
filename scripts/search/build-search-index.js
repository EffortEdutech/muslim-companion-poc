/**
 * scripts/search/build-search-index.js
 *
 * Builds all search indices for ilmMate Phase 2:
 *
 *   1. Quran index    → content/quran/db/metadata/search-index.json
 *      7 languages, 6,236 entries. Restores the path the app depends on.
 *
 *   2. Tafseer index  → content/tafsir/db/metadata/index-eng.json
 *      Al-Jalalayn English snippets, ~6,000 entries.
 *
 *   3. Hadith index   → content/hadith/db/metadata/hadith-search-index.json
 *      All 17 collections flattened, English + Arabic, compact keys.
 *      Replaces 17 individual file reads per search with one index load.
 *
 *   4. Cross-reference → content/quran/db/metadata/cross-ref.json
 *      Maps Quran ayah references (e.g. "2:255") to hadith that mention them.
 *      Powers "Related Hadith" on search result cards.
 *
 * Run from monorepo root:
 *   node scripts/search/build-search-index.js
 *   node scripts/search/build-search-index.js --only=quran
 *   node scripts/search/build-search-index.js --only=tafseer
 *   node scripts/search/build-search-index.js --only=hadith
 *   node scripts/search/build-search-index.js --only=crossref
 */

const fs   = require('fs')
const path = require('path')

const ROOT    = process.cwd()
const args    = process.argv.slice(2)
const only    = (args.find(a => a.startsWith('--only=')) || '').replace('--only=', '') || 'all'

// ─── Output paths ──────────────────────────────────────────────────────────────

const QURAN_META_DIR      = path.join(ROOT, 'content', 'quran',  'db', 'metadata')
const QURAN_INDEX_PATH    = path.join(QURAN_META_DIR, 'search-index.json')
const CROSS_REF_PATH      = path.join(QURAN_META_DIR, 'cross-ref.json')
const TAFSEER_META_DIR    = path.join(ROOT, 'content', 'tafsir', 'db', 'metadata')
const TAFSEER_INDEX_PATH  = path.join(TAFSEER_META_DIR, 'index-eng.json')
const HADITH_META_DIR     = path.join(ROOT, 'content', 'hadith', 'db', 'metadata')
const HADITH_INDEX_PATH   = path.join(HADITH_META_DIR, 'hadith-search-index.json')

// ─── Source paths ──────────────────────────────────────────────────────────────

const QURAN_DB     = path.join(ROOT, 'content', 'quran',  'db')
const QURAN_META   = path.join(ROOT, 'content', 'quran',  'meta')
const TAFSIR_DB    = path.join(ROOT, 'content', 'tafsir', 'db')
const HADITH_DB    = path.join(ROOT, 'content', 'hadith', 'db', 'by_book')

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
  5,4,5,6
]

// All 17 collections in load order (must match collections.ts slugs/filenames)
const HADITH_COLLECTIONS = [
  { slug: 'bukhari',            group: 'the_9_books', file: 'bukhari.json',            short: 'Bukhari'    },
  { slug: 'muslim',             group: 'the_9_books', file: 'muslim.json',             short: 'Muslim'     },
  { slug: 'abudawud',           group: 'the_9_books', file: 'abudawud.json',           short: 'Abu Dawud'  },
  { slug: 'tirmidhi',           group: 'the_9_books', file: 'tirmidhi.json',           short: 'Tirmidhi'   },
  { slug: 'nasai',              group: 'the_9_books', file: 'nasai.json',              short: "Nasa'i"     },
  { slug: 'ibnmajah',           group: 'the_9_books', file: 'ibnmajah.json',           short: 'Ibn Majah'  },
  { slug: 'ahmed',              group: 'the_9_books', file: 'ahmed.json',              short: 'Ahmad'      },
  { slug: 'malik',              group: 'the_9_books', file: 'malik.json',              short: 'Malik'      },
  { slug: 'darimi',             group: 'the_9_books', file: 'darimi.json',             short: 'Darimi'     },
  { slug: 'riyad_assalihin',    group: 'other_books', file: 'riyad_assalihin.json',    short: 'Riyad'      },
  { slug: 'bulugh_almaram',     group: 'other_books', file: 'bulugh_almaram.json',     short: 'Bulugh'     },
  { slug: 'mishkat_almasabih',  group: 'other_books', file: 'mishkat_almasabih.json',  short: 'Mishkat'    },
  { slug: 'aladab_almufrad',    group: 'other_books', file: 'aladab_almufrad.json',    short: 'Al-Adab'    },
  { slug: 'shamail_muhammadiyah',group:'other_books', file: 'shamail_muhammadiyah.json',short:'Shamail'    },
  { slug: 'nawawi40',           group: 'forties',     file: 'nawawi40.json',           short: 'Nawawi 40'  },
  { slug: 'qudsi40',            group: 'forties',     file: 'qudsi40.json',            short: 'Qudsi 40'   },
  { slug: 'shahwaliullah40',    group: 'forties',     file: 'shahwaliullah40.json',    short: 'Waliullah 40'},
]

// ─── Helpers ───────────────────────────────────────────────────────────────────

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }) }

function loadJson(p) {
  if (!fs.existsSync(p)) return null
  try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch { return null }
}

function mb(p) { return (fs.statSync(p).size / 1024 / 1024).toFixed(2) + ' MB' }

function loadEditionMap(filename) {
  const data = loadJson(path.join(QURAN_DB, filename))
  if (!data) return new Map()
  const map = new Map()
  for (const s of (data.surahs || [])) {
    const sn = s.surah || s.chapter || s.id
    for (const v of (s.verses || [])) {
      map.set(`${sn}:${v.verse || v.id}`, (v.text || v.translation || '').trim())
    }
  }
  return map
}

function loadSurahNames() {
  const data = loadJson(path.join(QURAN_META, 'surah_info.json'))
  if (!data) return new Map()
  const map = new Map()
  for (const s of (data.surahs_metadata || data.surahs || [])) {
    const num = s.number || s.id
    map.set(num, {
      en:  s.name_english    || s.name_transliterated || `Surah ${num}`,
      tr:  s.name_transliterated || '',
      ar:  s.name_arabic     || '',
    })
  }
  return map
}

// ─── 1. Build Quran Index ──────────────────────────────────────────────────────

function buildQuranIndex() {
  console.log('\n▶  Quran search index')
  ensureDir(QURAN_META_DIR)

  const eds = {
    ar: loadEditionMap('ara-uthmani.json'),
    sa: loadEditionMap('eng-sahih.json'),
    yu: loadEditionMap('eng-yusufali.json'),
    ms: loadEditionMap('mal-basmeih.json'),
    id: loadEditionMap('ind-indonesian.json'),
    ur: loadEditionMap('urd-maududi.json'),
    fr: loadEditionMap('fra-hamidullah.json'),
    es: loadEditionMap('spa-montada.json'),
  }

  const surahNames = loadSurahNames()
  const index = []

  for (let s = 1; s <= 114; s++) {
    const sn = (surahNames.get(s) || {}).en || `Surah ${s}`
    for (let a = 1; a <= VERSE_COUNTS[s - 1]; a++) {
      const k = `${s}:${a}`
      const entry = { s, a, sn,
        ar: eds.ar.get(k) || '', sa: eds.sa.get(k) || '',
        yu: eds.yu.get(k) || '', ms: eds.ms.get(k) || '',
        id: eds.id.get(k) || '', ur: eds.ur.get(k) || '',
        fr: eds.fr.get(k) || '', es: eds.es.get(k) || '',
      }
      if (entry.sa || entry.ar) index.push(entry)
    }
  }

  fs.writeFileSync(QURAN_INDEX_PATH, JSON.stringify(index), 'utf8')
  console.log(`   ✓ ${index.length.toLocaleString()} entries  ${mb(QURAN_INDEX_PATH)}`)
  // Note: surah-index.json is owned by compile-surahs.js — do not write here
  return index
}

// ─── 2. Build Tafseer Index ────────────────────────────────────────────────────

function buildTafseerIndex() {
  console.log('\n▶  Tafseer search index  (en-al-jalalayn)')
  ensureDir(TAFSEER_META_DIR)

  const surahNames = loadSurahNames()
  const edDir = path.join(TAFSIR_DB, 'en-al-jalalayn')
  if (!fs.existsSync(edDir)) {
    console.log('   ✗ en-al-jalalayn not downloaded — skipping')
    return
  }

  const index = []
  for (let s = 1; s <= 114; s++) {
    const data = loadJson(path.join(edDir, `${s}.json`))
    if (!data) continue
    const sn = (surahNames.get(s) || {}).en || `Surah ${s}`
    for (const ayah of (data.ayahs || [])) {
      const raw = (ayah.text || '').trim()
      if (!raw) continue
      index.push({
        s: parseInt(s),
        a: parseInt(ayah.id || ayah.verse || ayah.number),
        sn,
        tx: raw.length > 350 ? raw.substring(0, 347) + '...' : raw,
      })
    }
  }

  fs.writeFileSync(TAFSEER_INDEX_PATH, JSON.stringify(index), 'utf8')
  console.log(`   ✓ ${index.length.toLocaleString()} entries  ${mb(TAFSEER_INDEX_PATH)}`)
  return index
}

// ─── 3. Build Hadith Index ─────────────────────────────────────────────────────

function buildHadithIndex() {
  console.log('\n▶  Hadith search index  (all 17 collections)')
  ensureDir(HADITH_META_DIR)

  const index = []
  let globalId = 0

  for (const col of HADITH_COLLECTIONS) {
    const filePath = path.join(HADITH_DB, col.group, col.file)
    const book = loadJson(filePath)

    if (!book) {
      console.log(`   ⏭  ${col.short.padEnd(15)} not found — skipping`)
      continue
    }

    const hadiths = book.hadiths || []
    if (!hadiths.length) {
      console.log(`   ⚠  ${col.short.padEnd(15)} 0 hadiths`)
      continue
    }

    // Build chapter lookup
    const chapterMap = new Map((book.chapters || []).map(c => [c.id, c.english || '']))

    let added = 0
    for (const h of hadiths) {
      const en = (h.english?.text || '').trim()
      const na = (h.english?.narrator || '').trim()
      const ar = (h.arabic || '').trim()

      // Skip empty entries (some collections have header-only rows)
      if (!en && !ar) continue

      index.push({
        _id: globalId++,     // global sequential id
        ib:  h.idInBook,     // id within book (for display)
        bs:  col.slug,       // book slug (for linking)
        bsh: col.short,      // short book name (for display)
        ct:  chapterMap.get(h.chapterId) || '',  // chapter title
        ar,                  // arabic text (full — for Arabic search)
        en,                  // english text (full — for text search)
        na,                  // narrator (for narrator search)
      })
      added++
    }

    console.log(`   ✓ ${col.short.padEnd(15)} ${added.toLocaleString()} hadiths`)
  }

  fs.writeFileSync(HADITH_INDEX_PATH, JSON.stringify(index), 'utf8')
  console.log(`   ✓ Total: ${index.length.toLocaleString()} entries  ${mb(HADITH_INDEX_PATH)}`)
  return index
}

// ─── 4. Build Cross-Reference ─────────────────────────────────────────────────
//
// Scans all hadith English text for Quran verse references.
// Detects patterns like "2:255", "chapter 2 verse 255", surah name mentions.
// Output: { "2:255": [{ bs, ib, bsh }], ... }

function buildCrossReference(hadithIndex) {
  console.log('\n▶  Cross-reference  (Quran ayah ↔ Hadith)')

  if (!hadithIndex || hadithIndex.length === 0) {
    // Load hadith index if not passed in
    const loaded = loadJson(HADITH_INDEX_PATH)
    if (!loaded) {
      console.log('   ✗ Hadith index not found — run with --only=hadith first')
      return
    }
    hadithIndex = loaded
  }

  // Load valid surah numbers for validation
  const validRefs = new Set()
  for (let s = 1; s <= 114; s++) {
    for (let a = 1; a <= VERSE_COUNTS[s - 1]; a++) {
      validRefs.add(`${s}:${a}`)
    }
  }

  // Known important Quran references by keyword → ayah
  // These are reliable anchors that appear in hadith by name
  const KEYWORD_MAP = {
    'ayat al-kursi':      '2:255',
    'ayatul kursi':       '2:255',
    'verse of the throne':'2:255',
    'al-fatiha':          '1:1',
    'opening chapter':    '1:1',
    'umm al-quran':       '1:1',
    'al ikhlas':          '112:1',
    'surah ikhlas':       '112:1',
    'verse of light':     '24:35',
    'ayah of light':      '24:35',
    'last two verses of al-baqarah': '2:285',
    'amana al-rasulu':    '2:285',
    'throne verse':       '2:255',
  }

  // Regex to detect "N:N" verse reference patterns in English text
  // Only match patterns where surah (1-114) and ayah look plausible
  const REF_REGEX = /\b(\d{1,3}):(\d{1,3})\b/g

  const crossRef = {}

  function addRef(key, hadith) {
    if (!validRefs.has(key)) return
    if (!crossRef[key]) crossRef[key] = []
    // Avoid duplicates
    const exists = crossRef[key].some(r => r.bs === hadith.bs && r.ib === hadith.ib)
    if (!exists && crossRef[key].length < 10) {  // cap at 10 per ayah
      crossRef[key].push({ bs: hadith.bs, ib: hadith.ib, bsh: hadith.bsh })
    }
  }

  let refCount = 0

  for (const h of hadithIndex) {
    const text = (h.en + ' ' + h.na).toLowerCase()

    // Pattern: explicit "N:N" reference
    REF_REGEX.lastIndex = 0
    let match
    while ((match = REF_REGEX.exec(h.en + ' ' + h.na)) !== null) {
      const s = parseInt(match[1])
      const a = parseInt(match[2])
      if (s >= 1 && s <= 114 && a >= 1) {
        const key = `${s}:${a}`
        if (validRefs.has(key)) {
          addRef(key, h)
          refCount++
        }
      }
    }

    // Pattern: known keyword references
    for (const [keyword, ayahRef] of Object.entries(KEYWORD_MAP)) {
      if (text.includes(keyword)) {
        addRef(ayahRef, h)
        refCount++
      }
    }
  }

  // Sort each ayah's hadith list by book importance (9 books first)
  const BOOK_PRIORITY = ['bukhari','muslim','abudawud','tirmidhi','nasai',
                         'ibnmajah','ahmed','malik','darimi',
                         'riyad_assalihin','bulugh_almaram']
  for (const key of Object.keys(crossRef)) {
    crossRef[key].sort((a, b) => {
      const pa = BOOK_PRIORITY.indexOf(a.bs)
      const pb = BOOK_PRIORITY.indexOf(b.bs)
      return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb)
    })
  }

  const totalAyahs = Object.keys(crossRef).length

  fs.writeFileSync(CROSS_REF_PATH, JSON.stringify(crossRef), 'utf8')
  console.log(`   ✓ ${totalAyahs.toLocaleString()} ayahs mapped  ${refCount.toLocaleString()} references  ${mb(CROSS_REF_PATH)}`)
  return crossRef
}

// ─── Main ──────────────────────────────────────────────────────────────────────

function main() {
  console.log('\n╔══════════════════════════════════════════════════╗')
  console.log('║  ilmMate — Build Search Indices (Phase 2)       ║')
  console.log('╚══════════════════════════════════════════════════╝')
  console.log(`\n  Mode: ${only}`)

  const t = Date.now()
  let hadithIndex = null

  if (only === 'all' || only === 'quran')   buildQuranIndex()
  if (only === 'all' || only === 'tafseer') buildTafseerIndex()
  if (only === 'all' || only === 'hadith')  hadithIndex = buildHadithIndex()
  if (only === 'all' || only === 'crossref') buildCrossReference(hadithIndex)

  const elapsed = ((Date.now() - t) / 1000).toFixed(1)

  console.log(`\n══════════════════════════════════════════════════`)
  console.log(`✅  All indices built in ${elapsed}s`)
  console.log(`
  content/quran/db/metadata/search-index.json    ← Quran (7 languages)
  content/tafsir/db/metadata/index-eng.json      ← Tafseer (Al-Jalalayn)
  content/hadith/db/metadata/hadith-search-index.json ← All 17 collections
  content/quran/db/metadata/cross-ref.json       ← Quran ↔ Hadith cross-ref
  `)
}

main()
