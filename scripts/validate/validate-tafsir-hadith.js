/**
 * scripts/validate/validate-tafsir-hadith.js
 *
 * Validates all Tafseer editions (content/tafsir/db/) and
 * all Hadith files (content/hadith/db/by_book/)
 *
 * Run from monorepo root:
 *   node scripts/validate/validate-tafsir-hadith.js
 *   node scripts/validate/validate-tafsir-hadith.js --only=tafsir
 *   node scripts/validate/validate-tafsir-hadith.js --only=hadith
 */

const fs   = require('fs')
const path = require('path')

const ROOT         = process.cwd()
const TAFSIR_DIR   = path.join(ROOT, 'content', 'tafsir', 'db')
const HADITH_BASE  = path.join(ROOT, 'content', 'hadith', 'db', 'by_book')

const args   = process.argv.slice(2)
const only   = (args.find(a => a.startsWith('--only=')) || '').replace('--only=', '') || 'all'

// Expected tafseer editions
const TAFSIR_EDITIONS = [
  { slug: 'en-al-jalalayn',            lang: 'English', required: true  },
  { slug: 'en-tafisr-ibn-kathir',       lang: 'English', required: true  },
  { slug: 'en-tafsir-maarif-ul-quran',  lang: 'English', required: false },
  { slug: 'ar-tafsir-muyassar',         lang: 'Arabic',  required: true  },
  { slug: 'ar-tafsir-ibn-kathir',       lang: 'Arabic',  required: false },
  { slug: 'ur-tafseer-ibn-e-kaseer',    lang: 'Urdu',    required: true  },
]

// Expected hadith files (Tier 1 = required for Phase 1 gate)
const HADITH_FILES = [
  { edition: 'eng-bukhari', folder: 'the_9_books/bukhari',  tier: 1 },
  { edition: 'ara-bukhari', folder: 'the_9_books/bukhari',  tier: 1 },
  { edition: 'eng-muslim',  folder: 'the_9_books/muslim',   tier: 1 },
  { edition: 'ara-muslim',  folder: 'the_9_books/muslim',   tier: 1 },
  { edition: 'eng-nawawi40',folder: 'forties/nawawi40',     tier: 2 },  // Not in fawazahmed0/hadith-api — source separately
  { edition: 'ara-nawawi40',folder: 'forties/nawawi40',     tier: 2 },  // Not in fawazahmed0/hadith-api — source separately
  { edition: 'fra-nawawi40',folder: 'forties/nawawi40',     tier: 2 },
  { edition: 'ind-nawawi40',folder: 'forties/nawawi40',     tier: 2 },
  // Tier 2
  { edition: 'eng-abudawud',folder: 'the_9_books/abudawud', tier: 2 },
  { edition: 'ara-abudawud',folder: 'the_9_books/abudawud', tier: 2 },
  { edition: 'eng-tirmidhi',folder: 'the_9_books/tirmidhi', tier: 2 },
  { edition: 'eng-ibnmajah',folder: 'the_9_books/ibnmajah', tier: 2 },
  { edition: 'urd-bukhari', folder: 'the_9_books/bukhari',  tier: 2 },
  { edition: 'fra-bukhari', folder: 'the_9_books/bukhari',  tier: 2 },
  { edition: 'ind-bukhari', folder: 'the_9_books/bukhari',  tier: 2 },
]

// ─── Tafseer Validation ───────────────────────────────────────────────────────

function validateTafsirEdition(slug) {
  const editionDir = path.join(TAFSIR_DIR, slug)

  if (!fs.existsSync(editionDir)) {
    return { exists: false, fileCount: 0, errors: [`Directory not found: ${slug}`], warnings: [] }
  }

  const files  = fs.readdirSync(editionDir).filter(f => f.endsWith('.json'))
  const errors = []
  const warnings = []

  if (files.length !== 114) {
    errors.push(`${files.length}/114 surah files found`)
  }

  // Check which surahs are missing
  const present = new Set(files.map(f => parseInt(f)))
  const missing = []
  for (let i = 1; i <= 114; i++) {
    if (!present.has(i)) missing.push(i)
  }
  if (missing.length > 0 && missing.length <= 10) {
    errors.push(`Missing surahs: ${missing.join(', ')}`)
  } else if (missing.length > 10) {
    errors.push(`Missing ${missing.length} surahs`)
  }

  // Validate a sample of files (1, 36, 114)
  const sampleSurahs = [1, 36, 114].filter(n => present.has(n))
  let totalEmptyAyahs = 0

  for (const surahNum of sampleSurahs) {
    const filepath = path.join(editionDir, `${surahNum}.json`)
    try {
      const parsed = JSON.parse(fs.readFileSync(filepath, 'utf8'))
      const ayahs  = parsed.ayahs || []
      const empty  = ayahs.filter(a => !a.text || a.text.trim().length === 0).length
      totalEmptyAyahs += empty
    } catch (e) {
      errors.push(`Surah ${surahNum}: parse error — ${e.message}`)
    }
  }

  if (totalEmptyAyahs > 0) {
    warnings.push(`${totalEmptyAyahs} empty ayahs in sampled surahs (may be expected)`)
  }

  return { exists: true, fileCount: files.length, errors, warnings }
}

// ─── Hadith Validation ────────────────────────────────────────────────────────

function validateHadithFile(edition, folder) {
  const filepath = path.join(HADITH_BASE, folder, `${edition}.json`)

  if (!fs.existsSync(filepath)) {
    return { exists: false, errors: ['File not found'], warnings: [], count: 0, sizeMB: 0 }
  }

  const sizeMB = (fs.statSync(filepath).size / 1024 / 1024).toFixed(2)
  const errors   = []
  const warnings = []

  let parsed, count = 0
  try {
    parsed = JSON.parse(fs.readFileSync(filepath, 'utf8'))
  } catch (e) {
    return { exists: true, errors: [`Parse error: ${e.message}`], warnings: [], count: 0, sizeMB }
  }

  // Find hadiths array (may be under different keys)
  const hadiths = parsed.hadiths || parsed.hadith || parsed.data || []

  if (!Array.isArray(hadiths)) {
    errors.push(`hadiths is not an array. Keys: ${Object.keys(parsed).slice(0, 8).join(', ')}`)
    return { exists: true, errors, warnings, count: 0, sizeMB }
  }

  count = hadiths.length
  if (count === 0) errors.push('No hadiths found in file')

  // Sample validation
  const sample = hadiths.slice(0, 3)
  for (const h of sample) {
    const hasText = h.text || h.translation || h.content || h.arab
    if (!hasText) warnings.push(`Hadith ${h.number || '?'}: no text fields found`)
  }

  return { exists: true, errors, warnings, count, sizeMB }
}

// ─── Reporters ────────────────────────────────────────────────────────────────

function reportTafsir() {
  console.log('\n╔══════════════════════════════════════════════════╗')
  console.log('║  TAFSEER VALIDATION                             ║')
  console.log('╚══════════════════════════════════════════════════╝\n')

  let totalErrors = 0, totalMissing = 0

  for (const ed of TAFSIR_EDITIONS) {
    const result = validateTafsirEdition(ed.slug)
    const req    = ed.required ? '[req]' : '[opt]'
    const label  = `${ed.slug} (${ed.lang})`

    if (!result.exists) {
      const marker = ed.required ? '✗' : '⚠'
      console.log(`  ${marker}  ${req} ${label}`)
      console.log(`       Not downloaded yet`)
      if (ed.required) totalMissing++
      continue
    }

    if (result.errors.length === 0) {
      const dirSize = getDirSizeMB(path.join(TAFSIR_DIR, ed.slug))
      console.log(`  ✓  ${req} ${label.padEnd(40)} ${result.fileCount}/114 files  ${dirSize} MB`)
    } else {
      console.log(`  ✗  ${req} ${label}`)
      result.errors.forEach(e => console.log(`       → ${e}`))
      totalErrors += result.errors.length
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach(w => console.log(`     ⚠  ${w}`))
    }
  }

  console.log('\n' + '─'.repeat(50))
  if (totalErrors === 0 && totalMissing === 0) {
    console.log('✅ Tafseer validation passed.')
  } else {
    if (totalMissing > 0) console.log(`❌ ${totalMissing} required edition(s) not yet downloaded.`)
    if (totalErrors > 0)  console.log(`❌ ${totalErrors} structural error(s).`)
  }

  return totalErrors + totalMissing
}

function reportHadith() {
  console.log('\n╔══════════════════════════════════════════════════╗')
  console.log('║  HADITH VALIDATION                              ║')
  console.log('╚══════════════════════════════════════════════════╝\n')

  let totalErrors = 0, tier1Missing = 0

  for (const h of HADITH_FILES) {
    const result = validateHadithFile(h.edition, h.folder)
    const tier   = `[T${h.tier}]`

    if (!result.exists) {
      const marker = h.tier === 1 ? '✗' : '⚠'
      console.log(`  ${marker}  ${tier} ${h.edition.padEnd(22)} Not downloaded yet`)
      if (h.tier === 1) tier1Missing++
      continue
    }

    if (result.errors.length === 0) {
      console.log(`  ✓  ${tier} ${h.edition.padEnd(22)} ${String(result.count).padStart(6)} hadiths  ${result.sizeMB} MB`)
    } else {
      console.log(`  ✗  ${tier} ${h.edition}`)
      result.errors.forEach(e => console.log(`       → ${e}`))
      totalErrors += result.errors.length
    }

    if (result.warnings.length > 0) {
      result.warnings.forEach(w => console.log(`     ⚠  ${w}`))
    }
  }

  console.log('\n' + '─'.repeat(50))
  if (totalErrors === 0 && tier1Missing === 0) {
    console.log('✅ Hadith validation passed (all Tier 1 complete).')
  } else {
    if (tier1Missing > 0) console.log(`❌ ${tier1Missing} Tier 1 hadith file(s) missing — these are required.`)
    if (totalErrors > 0)  console.log(`❌ ${totalErrors} error(s) in existing files.`)
  }

  return totalErrors + tier1Missing
}

function getDirSizeMB(dir) {
  if (!fs.existsSync(dir)) return '0'
  let size = 0
  for (const f of fs.readdirSync(dir)) {
    try { size += fs.statSync(path.join(dir, f)).size } catch {}
  }
  return (size / 1024 / 1024).toFixed(1)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  let totalIssues = 0

  if (only === 'all' || only === 'tafsir')  totalIssues += reportTafsir()
  if (only === 'all' || only === 'hadith')  totalIssues += reportHadith()

  console.log('\n══════════════════════════════════════════════════')
  if (totalIssues === 0) {
    console.log('✅ ALL VALIDATIONS PASSED — Phase 1 gate check ready.')
  } else {
    console.log(`❌ ${totalIssues} issue(s) found — resolve before proceeding to Phase 2.`)
  }
  console.log()

  process.exit(totalIssues > 0 ? 1 : 0)
}

main()
