// scripts/search/build-search-index.js
// UPDATED: Tafseer index now covers both al-Jalalayn AND Ibn Kathir.
// Fixed field name bug: al-Jalalayn uses "ayah" field, not "id".
// Ibn Kathir entries may span multiple ayahs — stored with a + az (toAyah).
// Index entry shape: { s, a, az, sn, tx, ed }

const fs   = require('fs')
const path = require('path')

const ROOT    = process.cwd()
const args    = process.argv.slice(2)
const only    = (args.find(a => a.startsWith('--only=')) || '').replace('--only=', '') || 'all'

// ─── Output paths ──────────────────────────────────────────────────────────────
const QURAN_META_DIR     = path.join(ROOT, 'content', 'quran',  'db', 'metadata')
const QURAN_INDEX_PATH   = path.join(QURAN_META_DIR, 'search-index.json')
const CROSS_REF_PATH     = path.join(QURAN_META_DIR, 'cross-ref.json')
const TAFSEER_META_DIR   = path.join(ROOT, 'content', 'tafsir', 'db', 'metadata')
const TAFSEER_INDEX_PATH = path.join(TAFSEER_META_DIR, 'index-eng.json')
const HADITH_META_DIR    = path.join(ROOT, 'content', 'hadith', 'db', 'metadata')
const HADITH_INDEX_PATH  = path.join(HADITH_META_DIR, 'hadith-search-index.json')

// ─── Source paths ──────────────────────────────────────────────────────────────
const QURAN_DB   = path.join(ROOT, 'content', 'quran',  'db')
const QURAN_META = path.join(ROOT, 'content', 'quran',  'meta')
const TAFSIR_DB  = path.join(ROOT, 'content', 'tafsir', 'db')
const HADITH_DB  = path.join(ROOT, 'content', 'hadith', 'db', 'by_book')

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

// ─── Helpers ───────────────────────────────────────────────────────────────────
function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }) }
function loadJson(p)  { if (!fs.existsSync(p)) return null; try { return JSON.parse(fs.readFileSync(p, 'utf8')) } catch { return null } }
function mb(p)        { return (fs.statSync(p).size / 1024 / 1024).toFixed(2) + ' MB' }

// Strip HTML tags for plain-text snippet
function stripHtml(html) {
  return (html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function snippet(text, maxLen = 350) {
  const plain = stripHtml(text)
  return plain.length > maxLen ? plain.slice(0, maxLen - 1) + '…' : plain
}

function loadSurahNames() {
  // Try both possible locations
  const paths = [
    path.join(QURAN_META, 'surah_info.json'),
    path.join(QURAN_DB, 'metadata', 'surah-index.json'),
  ]
  for (const p of paths) {
    const data = loadJson(p)
    if (!data) continue
    const map = new Map()
    // surah_info.json format
    for (const s of (data.surahs_metadata || data.surahs || [])) {
      const num = s.number || s.surah || s.id
      const en  = s.name_english || s.nameEnglish || s.name_transliterated || `Surah ${num}`
      if (num) map.set(num, en)
    }
    if (map.size > 0) return map
  }
  return new Map()
}

// ─── 1. Build Quran Index (unchanged) ─────────────────────────────────────────
function buildQuranIndex() {
  console.log('\n▶  Quran search index')
  ensureDir(QURAN_META_DIR)

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

  const surahNames = loadSurahNames()
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

  const index = []
  for (let s = 1; s <= 114; s++) {
    const sn = surahNames.get(s) || `Surah ${s}`
    for (let a = 1; a <= VERSE_COUNTS[s - 1]; a++) {
      const k = `${s}:${a}`
      const entry = {
        s, a, sn,
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
  return index
}

// ─── 2. Build Tafseer Index (FIXED) ───────────────────────────────────────────
//
// Indexes TWO editions:
//   A) en-al-jalalayn — field is "ayah" (not "id"!) — one entry per ayah
//   B) en-tafisr-ibn-kathir — field is "id" — may cover multiple ayahs
//
// Index entry: { s, a, az, sn, tx, ed }
//   s  = surah number
//   a  = fromAyah
//   az = toAyah (same as a for single-ayah entries)
//   sn = surah name (English)
//   tx = plain-text snippet ≤ 350 chars
//   ed = 'jalalayn' | 'ibn_kathir'

function buildTafseerIndex() {
  console.log('\n▶  Tafseer search index  (en-al-jalalayn + en-tafisr-ibn-kathir)')
  ensureDir(TAFSEER_META_DIR)

  const surahNames = loadSurahNames()
  const index = []

  // ── Edition A: al-Jalalayn ────────────────────────────────────────────────
  const jalDir = path.join(TAFSIR_DB, 'en-al-jalalayn')
  if (fs.existsSync(jalDir)) {
    let jalCount = 0
    for (let s = 1; s <= 114; s++) {
      const data = loadJson(path.join(jalDir, `${s}.json`))
      if (!data) continue
      const sn = surahNames.get(s) || `Surah ${s}`
      for (const ayah of (data.ayahs || [])) {
        const raw = (ayah.text || '').trim()
        if (!raw) continue

        // ✓ FIX: al-Jalalayn uses "ayah" field — NOT "id", "verse", or "number"
        const ayahNum = parseInt(ayah.ayah ?? ayah.id ?? ayah.verse ?? ayah.number, 10)
        if (isNaN(ayahNum) || ayahNum < 1) continue

        index.push({
          s,
          a:   ayahNum,
          az:  ayahNum,  // single-ayah entry
          sn,
          tx:  snippet(raw),
          ed:  'jalalayn',
        })
        jalCount++
      }
    }
    console.log(`   ✓ al-Jalalayn        ${jalCount.toLocaleString()} entries`)
  } else {
    console.log('   ✗ al-Jalalayn not found — skipping')
  }

  // ── Edition B: Ibn Kathir ─────────────────────────────────────────────────
  const ikDir = path.join(TAFSIR_DB, 'en-tafisr-ibn-kathir')
  if (fs.existsSync(ikDir)) {
    let ikCount = 0
    let skipped = 0

    for (let s = 1; s <= 114; s++) {
      const data = loadJson(path.join(ikDir, `${s}.json`))
      if (!data) continue
      const sn = surahNames.get(s) || `Surah ${s}`
      const ayahs = data.ayahs || []

      // Ibn Kathir format: { "id": N, "text": "<HTML>" }
      // "id" = the first ayah of the entry (fromAyah)
      // We compute toAyah as the ayah before the next entry's id
      for (let i = 0; i < ayahs.length; i++) {
        const ayah = ayahs[i]
        const raw  = (ayah.text || '').trim()
        if (!raw) { skipped++; continue }

        // ✓ Ibn Kathir uses "id" field
        const fromAyah = parseInt(ayah.id ?? ayah.ayah ?? ayah.verse, 10)
        if (isNaN(fromAyah) || fromAyah < 1) { skipped++; continue }

        // toAyah = next entry's id - 1, or same as fromAyah if last entry
        const nextAyah = ayahs[i + 1]
        const nextId   = nextAyah
          ? parseInt(nextAyah.id ?? nextAyah.ayah ?? nextAyah.verse, 10)
          : fromAyah
        const toAyah   = (!isNaN(nextId) && nextId > fromAyah)
          ? nextId - 1
          : fromAyah

        // Strip HTML — Ibn Kathir text is rich HTML with Arabic, hadith refs etc.
        const plain = snippet(raw, 350)
        if (!plain) { skipped++; continue }

        index.push({
          s,
          a:   fromAyah,
          az:  toAyah,
          sn,
          tx:  plain,
          ed:  'ibn_kathir',
        })
        ikCount++
      }
    }
    console.log(`   ✓ Ibn Kathir         ${ikCount.toLocaleString()} entries  (${skipped} empty skipped)`)
  } else {
    console.log('   ✗ Ibn Kathir not found — skipping')
  }

  fs.writeFileSync(TAFSEER_INDEX_PATH, JSON.stringify(index), 'utf8')
  console.log(`   ✓ Total              ${index.length.toLocaleString()} entries  ${mb(TAFSEER_INDEX_PATH)}`)
  return index
}

// ─── 3. Build Hadith Index (unchanged) ────────────────────────────────────────
function buildHadithIndex() {
  console.log('\n▶  Hadith search index  (all 17 collections)')
  ensureDir(HADITH_META_DIR)

  const HADITH_COLLECTIONS = [
    { slug: 'bukhari',           group: 'the_9_books', file: 'bukhari.json',           short: 'Bukhari'     },
    { slug: 'muslim',            group: 'the_9_books', file: 'muslim.json',            short: 'Muslim'      },
    { slug: 'abudawud',          group: 'the_9_books', file: 'abudawud.json',          short: 'Abu Dawud'   },
    { slug: 'tirmidhi',          group: 'the_9_books', file: 'tirmidhi.json',          short: 'Tirmidhi'    },
    { slug: 'nasai',             group: 'the_9_books', file: 'nasai.json',             short: "Nasa'i"      },
    { slug: 'ibnmajah',          group: 'the_9_books', file: 'ibnmajah.json',          short: 'Ibn Majah'   },
    { slug: 'ahmed',             group: 'the_9_books', file: 'ahmed.json',             short: 'Ahmad'       },
    { slug: 'malik',             group: 'the_9_books', file: 'malik.json',             short: 'Malik'       },
    { slug: 'darimi',            group: 'the_9_books', file: 'darimi.json',            short: 'Darimi'      },
    { slug: 'riyad_assalihin',   group: 'other_books', file: 'riyad_assalihin.json',   short: 'Riyad'       },
    { slug: 'bulugh_almaram',    group: 'other_books', file: 'bulugh_almaram.json',    short: 'Bulugh'      },
    { slug: 'mishkat_almasabih', group: 'other_books', file: 'mishkat_almasabih.json', short: 'Mishkat'     },
    { slug: 'aladab_almufrad',   group: 'other_books', file: 'aladab_almufrad.json',   short: 'Al-Adab'     },
    { slug: 'shamail_muhammadiyah',group:'other_books',file: 'shamail_muhammadiyah.json',short:'Shamail'    },
    { slug: 'nawawi40',          group: 'forties',     file: 'nawawi40.json',          short: 'Nawawi 40'   },
    { slug: 'qudsi40',           group: 'forties',     file: 'qudsi40.json',           short: 'Qudsi 40'    },
    { slug: 'shahwaliullah40',   group: 'forties',     file: 'shahwaliullah40.json',   short: 'Waliullah 40'},
  ]

  const index = []
  let globalId = 0

  for (const col of HADITH_COLLECTIONS) {
    const filePath = path.join(HADITH_DB, col.group, col.file)
    const book = loadJson(filePath)
    if (!book) { console.log(`   ⏭  ${col.short.padEnd(15)} not found`); continue }

    const hadiths = book.hadiths || []
    if (!hadiths.length) { console.log(`   ⚠  ${col.short.padEnd(15)} 0 hadiths`); continue }

    const chapterMap = new Map((book.chapters || []).map(c => [c.id, c.english || '']))
    let added = 0

    for (const h of hadiths) {
      const en = (h.english?.text || '').trim()
      const na = (h.english?.narrator || '').trim()
      const ar = (h.arabic || '').trim()
      if (!en && !ar) continue

      index.push({
        _id: globalId++,
        ib:  h.idInBook,
        bs:  col.slug,
        bsh: col.short,
        ct:  chapterMap.get(h.chapterId) || '',
        ar,
        en,
        na,
      })
      added++
    }
    console.log(`   ✓ ${col.short.padEnd(15)} ${added.toLocaleString()} hadiths`)
  }

  fs.writeFileSync(HADITH_INDEX_PATH, JSON.stringify(index), 'utf8')
  console.log(`   ✓ Total: ${index.length.toLocaleString()} entries  ${mb(HADITH_INDEX_PATH)}`)
  return index
}

// ─── 4. Build Cross-Reference (unchanged) ─────────────────────────────────────
function buildCrossReference(hadithIndex) {
  console.log('\n▶  Cross-reference  (Quran ayah ↔ Hadith)')

  let index = hadithIndex
  if (!index) {
    const raw = loadJson(HADITH_INDEX_PATH)
    if (!raw) { console.log('   ✗ No hadith index — skipping'); return }
    index = raw
  }

  const crossRef = {}
  const validRefs = new Set()
  for (let s = 1; s <= 114; s++)
    for (let a = 1; a <= VERSE_COUNTS[s - 1]; a++)
      validRefs.add(`${s}:${a}`)

  function addRef(key, h) {
    if (!crossRef[key]) crossRef[key] = []
    if (crossRef[key].some(r => r.bs === h.bs && r.ib === h.ib)) return
    crossRef[key].push({ bs: h.bs, ib: h.ib, bsh: h.bsh })
  }

  const REF_REGEX  = /\b(\d{1,3}):(\d{1,3})\b/g
  const KEYWORD_MAP = {
    'Al-Fatihah': '1:1', 'Ayat al-Kursi': '2:255', 'Throne Verse': '2:255',
    'Al-Ikhlas': '112:1', 'Al-Falaq': '113:1', 'An-Nas': '114:1',
  }

  let refCount = 0
  for (const h of index) {
    const text = `${h.en} ${h.na}`
    REF_REGEX.lastIndex = 0
    let match
    while ((match = REF_REGEX.exec(text)) !== null) {
      const s = parseInt(match[1]), a = parseInt(match[2])
      if (s >= 1 && s <= 114 && a >= 1) {
        const key = `${s}:${a}`
        if (validRefs.has(key)) { addRef(key, h); refCount++ }
      }
    }
    for (const [keyword, ayahRef] of Object.entries(KEYWORD_MAP)) {
      if (text.includes(keyword)) { addRef(ayahRef, h); refCount++ }
    }
  }

  const BOOK_PRIORITY = ['bukhari','muslim','abudawud','tirmidhi','nasai',
                         'ibnmajah','ahmed','malik','darimi','riyad_assalihin','bulugh_almaram']
  for (const key of Object.keys(crossRef)) {
    crossRef[key].sort((a, b) => {
      const pa = BOOK_PRIORITY.indexOf(a.bs), pb = BOOK_PRIORITY.indexOf(b.bs)
      return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb)
    })
  }

  fs.writeFileSync(CROSS_REF_PATH, JSON.stringify(crossRef), 'utf8')
  console.log(`   ✓ ${Object.keys(crossRef).length.toLocaleString()} ayahs mapped  ${refCount.toLocaleString()} references  ${mb(CROSS_REF_PATH)}`)
  return crossRef
}

// ─── Main ──────────────────────────────────────────────────────────────────────
function main() {
  console.log('\n╔══════════════════════════════════════════════════╗')
  console.log('║  IQRA Digital — Build Search Indices            ║')
  console.log('╚══════════════════════════════════════════════════╝')
  console.log(`  Mode: ${only}\n`)

  const t = Date.now()
  let hadithIndex = null

  if (only === 'all' || only === 'quran')   buildQuranIndex()
  if (only === 'all' || only === 'tafseer') buildTafseerIndex()
  if (only === 'all' || only === 'hadith')  hadithIndex = buildHadithIndex()
  if (only === 'all' || only === 'crossref') buildCrossReference(hadithIndex)

  console.log(`\n══════════════════════════════════════════════════`)
  console.log(`Alhamdulillah — all indices built in ${((Date.now() - t)/1000).toFixed(1)}s`)
}

main()
