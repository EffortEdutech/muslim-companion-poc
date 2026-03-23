/**
 * scripts/validate/validate-quran.js
 *
 * Validates all Quran editions in content/quran/db/
 * Checks: surah count, verse counts, empty texts, JSON integrity
 *
 * Run from monorepo root:
 *   node scripts/validate/validate-quran.js
 */

const fs   = require('fs')
const path = require('path')

const ROOT        = process.cwd()
const CONTENT_DIR = path.join(ROOT, 'content', 'quran', 'db')
const META_DIR    = path.join(ROOT, 'content', 'quran', 'meta')

// Expected verse counts per surah
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

// Editions we expect to find
const EXPECTED_EDITIONS = [
  { file: 'ara-uthmani.json',    label: 'Arabic Uthmani',        required: true  },
  { file: 'transliteration.json',label: 'Transliteration',       required: true, special: 'transliteration' },
  { file: 'eng-sahih.json',      label: 'English Sahih Intl',    required: true  },
  { file: 'eng-yusufali.json',   label: 'English Yusuf Ali',     required: true  },
  { file: 'mal-basmeih.json',    label: 'Malay Basmeih',         required: true  },
  { file: 'ind-indonesian.json', label: 'Indonesian Kemenag',    required: true  },
  { file: 'urd-maududi.json',    label: 'Urdu Maududi',          required: true  },
  { file: 'spa-montada.json',    label: 'Spanish Montada',       required: true  },
  { file: 'fra-hamidullah.json', label: 'French Hamidullah',     required: true  },
]

const META_FILES = [
  { file: 'surah_info.json', required: true  },
  { file: 'juz_info.json',   required: true  },
  { file: 'quran-data.xml',  required: false },
]

// ─── Validators ───────────────────────────────────────────────────────────────

function validateTransliteration(parsed) {
  const errors   = []
  const warnings = []

  const surahs = parsed.surahs
  if (!surahs || typeof surahs !== 'object') {
    errors.push('No surahs object found')
    return { errors, warnings }
  }

  const keys = Object.keys(surahs)
  if (keys.length !== 114) {
    errors.push(`Expected 114 surahs, found ${keys.length}`)
  }

  let total = 0
  for (const key of keys) {
    const s = surahs[key]
    total  += s.verses?.length || 0
    const surahNum = parseInt(key)
    const expected = VERSE_COUNTS[surahNum - 1]
    if (s.verses?.length !== expected) {
      errors.push(`Surah ${surahNum}: ${s.verses?.length} verses (expected ${expected})`)
    }
  }

  if (total !== 6236) errors.push(`Total: ${total} (expected 6236)`)

  return { errors, warnings, total }
}

function validateEdition(parsed, filename) {
  const errors   = []
  const warnings = []

  // Handle the Uthmani format which has outer metadata wrapper
  const surahs = parsed.surahs || parsed.chapters || parsed.data

  if (!surahs || !Array.isArray(surahs)) {
    errors.push(`No surahs array found. Top-level keys: ${Object.keys(parsed).join(', ')}`)
    return { errors, warnings, total: 0 }
  }

  if (surahs.length !== 114) {
    errors.push(`Expected 114 surahs, found ${surahs.length}`)
  }

  let total = 0
  let emptyTexts = 0

  for (const s of surahs) {
    const surahNum = s.surah || s.chapter || s.id
    const verses   = s.verses || s.ayahs || []

    total += verses.length

    const expected = VERSE_COUNTS[parseInt(surahNum) - 1]
    if (verses.length !== expected) {
      errors.push(`Surah ${surahNum}: ${verses.length} verses (expected ${expected})`)
    }

    for (const v of verses) {
      const text = v.text || v.translation || ''
      if (!text || text.trim().length === 0) emptyTexts++
    }
  }

  if (total !== 6236) errors.push(`Total: ${total} verses (expected 6236)`)
  if (emptyTexts > 0)  warnings.push(`${emptyTexts} empty verse texts`)

  return { errors, warnings, total }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('\n╔══════════════════════════════════════════════════╗')
  console.log('║  ilmMate — Validate Quran Content               ║')
  console.log('╚══════════════════════════════════════════════════╝\n')

  let totalErrors   = 0
  let totalWarnings = 0
  let missing       = 0

  // ── Check meta files ──────────────────────────────────────────────────────
  console.log('META FILES')
  console.log('─'.repeat(50))
  for (const m of META_FILES) {
    const p = path.join(META_DIR, m.file)
    if (fs.existsSync(p)) {
      const sizeMB = (fs.statSync(p).size / 1024 / 1024).toFixed(2)
      console.log(`  ✓  ${m.file.padEnd(25)} ${sizeMB} MB`)
    } else {
      const marker = m.required ? '✗' : '⚠'
      console.log(`  ${marker}  ${m.file.padEnd(25)} MISSING${m.required ? ' (REQUIRED)' : ' (optional)'}`)
      if (m.required) { totalErrors++; missing++ }
    }
  }

  // ── Check edition files ───────────────────────────────────────────────────
  console.log('\nEDITIONS')
  console.log('─'.repeat(50))

  for (const edition of EXPECTED_EDITIONS) {
    const filepath = path.join(CONTENT_DIR, edition.file)

    if (!fs.existsSync(filepath)) {
      console.log(`  ✗  ${edition.label.padEnd(30)} NOT FOUND — run download scripts first`)
      if (edition.required) { totalErrors++; missing++ }
      continue
    }

    // Parse
    let parsed
    try {
      const raw = fs.readFileSync(filepath, 'utf8')
      parsed    = JSON.parse(raw)
    } catch (e) {
      console.log(`  ✗  ${edition.label.padEnd(30)} PARSE ERROR: ${e.message}`)
      totalErrors++
      continue
    }

    // Validate
    let result
    if (edition.special === 'transliteration') {
      result = validateTransliteration(parsed)
    } else {
      result = validateEdition(parsed, edition.file)
    }

    const { errors, warnings, total } = result
    const sizeMB = (fs.statSync(filepath).size / 1024 / 1024).toFixed(2)

    if (errors.length === 0) {
      console.log(`  ✓  ${edition.label.padEnd(30)} ${String(total).padStart(5)} verses  ${sizeMB} MB`)
    } else {
      console.log(`  ✗  ${edition.label.padEnd(30)} ${errors.length} ERROR(S)`)
      errors.slice(0, 3).forEach(e => console.log(`       → ${e}`))
      if (errors.length > 3) console.log(`       → ...and ${errors.length - 3} more`)
      totalErrors += errors.length
    }

    if (warnings.length > 0) {
      warnings.slice(0, 2).forEach(w => console.log(`     ⚠  ${w}`))
      totalWarnings += warnings.length
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n══════════════════════════════════════════════════')
  if (totalErrors === 0 && missing === 0) {
    console.log('✅ QURAN VALIDATION PASSED — All editions are complete and valid.')
  } else {
    if (missing > 0) {
      console.log(`❌ ${missing} required file(s) are missing.`)
      console.log('   Run scripts first:')
      console.log('   → node scripts/quran/convert-txt-to-json.js')
      console.log('   → node scripts/quran/download-translations.js')
    }
    if (totalErrors - missing > 0) {
      console.log(`❌ ${totalErrors - missing} structural error(s) found.`)
    }
    if (totalWarnings > 0) {
      console.log(`⚠  ${totalWarnings} warning(s) — review but not blocking.`)
    }
  }
  console.log()

  process.exit(totalErrors > 0 ? 1 : 0)
}

main()
