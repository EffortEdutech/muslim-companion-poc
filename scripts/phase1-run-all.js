/**
 * scripts/phase1-run-all.js  (FIXED v2)
 *
 * Master runner for Phase 1 — Content Foundation
 * Fixed to find source files from their actual locations on this machine.
 *
 * Run from monorepo root:
 *   node scripts/phase1-run-all.js             — full run
 *   node scripts/phase1-run-all.js --from=3    — resume from step 3
 *   node scripts/phase1-run-all.js --validate  — validation only
 */

const { execSync } = require('child_process')
const fs           = require('fs')
const path         = require('path')

const ROOT    = process.cwd()
// Parent folder: C:\Users\user\Documents\00 Combo3
const COMBO3  = path.dirname(ROOT)

// ─── Parse CLI args ───────────────────────────────────────────────────────────

const args         = process.argv.slice(2)
const onlyStep     = parseInt((args.find(a => a.startsWith('--step=')) || '').replace('--step=', '')) || null
const fromStep     = parseInt((args.find(a => a.startsWith('--from=')) || '').replace('--from=', '')) || 1
const validateOnly = args.includes('--validate')

// ─── Folder structure to create ───────────────────────────────────────────────

const FOLDERS = [
  'content/quran/db',
  'content/quran/meta',
  'content/tafsir/db',
  'content/hadith/db/by_book/the_9_books/bukhari',
  'content/hadith/db/by_book/the_9_books/muslim',
  'content/hadith/db/by_book/the_9_books/abudawud',
  'content/hadith/db/by_book/the_9_books/tirmidhi',
  'content/hadith/db/by_book/the_9_books/nasai',
  'content/hadith/db/by_book/the_9_books/ibnmajah',
  'content/hadith/db/by_book/the_9_books/malik',
  'content/hadith/db/by_book/the_9_books/ahmad',
  'content/hadith/db/by_book/the_9_books/darimi',
  'content/hadith/db/by_book/other_books',
  'content/hadith/db/by_book/forties/nawawi40',
  'content/hadith/db/by_chapter/the_9_books',
  'docs',
  'scripts/quran',
  'scripts/tafsir',
  'scripts/hadith',
  'scripts/validate',
  'scripts/search',
]

// ─── Smart file finder ────────────────────────────────────────────────────────
// Searches multiple candidate locations in priority order.
// Returns the first path that exists, or null.

function findFile(filename, extraCandidates = []) {
  const candidates = [
    // Already in repo — canonical target locations first
    path.join(ROOT, 'content', 'quran', 'db',       filename),
    path.join(ROOT, 'content', 'quran', 'meta',     filename),
    path.join(ROOT, 'content', 'quran', 'source',   filename),
    path.join(ROOT, 'content', 'quran', 'source', 'metadata', filename),
    // Repo root
    path.join(ROOT, filename),
    // Outside repo — known locations from machine scan
    path.join(COMBO3, '01 Quran', 'quran source',             filename),
    path.join(COMBO3, '01 Quran', 'quran source', 'from Tanzil', filename),
    path.join(COMBO3, '01 Quran', 'surahs',                   filename),
    path.join(COMBO3, '01 Quran', 'metadata',                 filename),
    path.join(COMBO3, '01 Quran',                             filename),
    // Extra candidates passed in
    ...extraCandidates,
  ]

  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return null
}

// ─── Files to copy into content structure ────────────────────────────────────

const MOVE_MAP = [
  {
    filename: 'quran-uthmani.json',
    dest:     'content/quran/db/ara-uthmani.json',
    required: true,
  },
  {
    filename: 'quran-transliteration.json',
    dest:     'content/quran/db/transliteration.json',
    required: true,
  },
  {
    filename: 'surah_info.json',
    dest:     'content/quran/meta/surah_info.json',
    required: true,
  },
  {
    filename: 'juz_info.json',
    dest:     'content/quran/meta/juz_info.json',
    required: true,
  },
  {
    filename: 'quran-data.xml',
    dest:     'content/quran/meta/quran-data.xml',
    required: false,
  },
]

// ─── TXT source files ─────────────────────────────────────────────────────────
// These are the pipe-delimited translation files that need to be converted.
// Add more candidate paths here if needed.

const TXT_CANDIDATES = {
  'en.sahih.txt': [
    path.join(ROOT,   'content', 'quran', 'source', 'translations', 'en.sahih.txt'),
    path.join(COMBO3, '01 Quran', 'quran source', 'from Tanzil', 'en.sahih.txt'),
    path.join(COMBO3, '01 Quran', 'quran source', 'en.sahih.txt'),
    path.join(COMBO3, '01 Quran', 'en.sahih.txt'),
  ],
  'en.yusufali.txt': [
    path.join(ROOT,   'content', 'quran', 'source', 'translations', 'en.yusufali.txt'),
    path.join(COMBO3, '01 Quran', 'quran source', 'from Tanzil', 'en.yusufali.txt'),
    path.join(COMBO3, '01 Quran', 'quran source', 'en.yusufali.txt'),
    path.join(COMBO3, '01 Quran', 'en.yusufali.txt'),
  ],
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  const full = path.join(ROOT, dir)
  if (!fs.existsSync(full)) {
    fs.mkdirSync(full, { recursive: true })
    return true
  }
  return false
}

function run(label, command, options = {}) {
  console.log(`\n  Running: ${command}`)
  try {
    execSync(command, { cwd: ROOT, stdio: 'inherit', ...options })
    return true
  } catch (e) {
    if (options.allowFail) {
      console.warn(`  ⚠  Command exited with error (allowed)`)
      return false
    }
    throw e
  }
}

function header(step, title) {
  console.log('\n')
  console.log('╔' + '═'.repeat(58) + '╗')
  console.log(`║  STEP ${step}: ${title.padEnd(51)}║`)
  console.log('╚' + '═'.repeat(58) + '╝')
}

function shouldRun(n) {
  if (validateOnly) return n >= 7
  if (onlyStep)     return n === onlyStep
  return n >= fromStep
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function step1_createStructure() {
  header(1, 'Create Content Folder Structure')
  let created = 0
  for (const folder of FOLDERS) {
    if (ensureDir(folder)) {
      console.log(`  + ${folder}`)
      created++
    }
  }
  console.log(created === 0
    ? '  All folders already exist.'
    : `\n  ✓ Created ${created} folder(s)`)
}

function step2_moveFiles() {
  header(2, 'Organise Existing Files into Content Structure')

  let moved = 0, skipped = 0, missing = 0

  for (const m of MOVE_MAP) {
    const dest     = path.join(ROOT, m.dest)
    const destDir  = path.dirname(dest)

    // Already at destination — skip
    if (fs.existsSync(dest)) {
      const sizeMB = (fs.statSync(dest).size / 1024 / 1024).toFixed(2)
      console.log(`  ⏭  ${m.dest} — already in place (${sizeMB} MB)`)
      skipped++
      continue
    }

    // Find the source
    const src = findFile(m.filename)

    if (!src) {
      const marker = m.required ? '✗' : '⚠'
      console.log(`  ${marker}  ${m.filename} — NOT FOUND`)
      if (m.required) {
        console.log(`     Searched in:`)
        console.log(`       ${ROOT}`)
        console.log(`       ${path.join(ROOT, 'content', 'quran', 'source')}`)
        console.log(`       ${path.join(COMBO3, '01 Quran', 'quran source')}`)
        console.log(`     Fix: copy the file to ${m.dest} manually, then re-run.`)
      }
      missing += m.required ? 1 : 0
      continue
    }

    // Ensure destination directory exists
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })

    // Copy
    fs.copyFileSync(src, dest)
    const sizeMB = (fs.statSync(dest).size / 1024 / 1024).toFixed(2)
    const relSrc = src.replace(COMBO3, '..').replace(ROOT, '.')
    console.log(`  ✓  ${m.filename.padEnd(35)} → ${m.dest} (${sizeMB} MB)`)
    console.log(`     from: ${relSrc}`)
    moved++
  }

  console.log(`\n  Moved: ${moved}  |  Already in place: ${skipped}  |  Not found: ${missing}`)

  if (missing > 0) {
    console.log('\n  ─────────────────────────────────────────────────')
    console.log('  ACTION REQUIRED: Copy missing files manually.')
    console.log('  Then re-run: node scripts/phase1-run-all.js --from=2')
    throw new Error(`${missing} required source file(s) not found`)
  }
}

function step3_convertTxt() {
  header(3, 'Convert .txt Translations to JSON')

  // Check for txt files before running — give helpful error if missing
  const missing = []
  for (const [filename, extras] of Object.entries(TXT_CANDIDATES)) {
    const found = findFile(filename, extras)
    if (!found) missing.push(filename)
    else console.log(`  Found ${filename} at: ${found.replace(COMBO3, '..').replace(ROOT, '.')}`)
  }

  if (missing.length > 0) {
    console.error(`\n  ✗ Cannot find: ${missing.join(', ')}`)
    console.error('  These are the pipe-delimited Quran translation files from Tanzil.')
    console.error(`  Please copy them to the repo root or to content/quran/db/`)
    console.error('  Then re-run: node scripts/phase1-run-all.js --from=3')
    throw new Error(`Missing txt source files: ${missing.join(', ')}`)
  }

  run('convert-txt', 'node scripts/quran/convert-txt-to-json.js')
}

function step4_downloadQuranTranslations() {
  header(4, 'Download Quran Translations (5 languages)')
  console.log('  Downloading: Malay, Indonesian, Urdu, Spanish, French')
  console.log('  ~1–2 MB each — completes in 1–2 minutes\n')
  run('download-quran', 'node scripts/quran/download-translations.js')
}

function step5_downloadTafsir() {
  header(5, 'Download Tafseer Editions (6 editions × 114 surahs = 684 files)')
  console.log('  Estimated time: ~17 minutes at 150ms delay')
  console.log('  Fully resumable — safe to interrupt and re-run\n')
  run('download-tafsir', 'node scripts/tafsir/download-tafsir.js')
}

function step6_downloadHadith() {
  header(6, 'Download Hadith — Tier 1 (Bukhari, Muslim, Nawawi40)')
  console.log('  Files are large (~4 MB each). Takes ~5 minutes.\n')
  run('download-hadith', 'node scripts/hadith/download-hadith.js --tier=1')
}

function step7_validateQuran() {
  header(7, 'Validate Quran Content')
  run('validate-quran', 'node scripts/validate/validate-quran.js', { allowFail: true })
}

function step8_validateTafsirHadith() {
  header(8, 'Validate Tafseer + Hadith Content')
  run('validate-all', 'node scripts/validate/validate-tafsir-hadith.js', { allowFail: true })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('\n╔══════════════════════════════════════════════════════════╗')
  console.log('║  ilmMate — Phase 1: Content Foundation (v2)             ║')
  console.log('║  Bismillah                                               ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log(`\n  Repo root:    ${ROOT}`)
  console.log(`  Parent folder: ${COMBO3}\n`)

  const startTime = Date.now()

  try {
    if (shouldRun(1)) step1_createStructure()
    if (shouldRun(2)) step2_moveFiles()
    if (shouldRun(3)) step3_convertTxt()
    if (shouldRun(4)) step4_downloadQuranTranslations()
    if (shouldRun(5)) step5_downloadTafsir()
    if (shouldRun(6)) step6_downloadHadith()
    if (shouldRun(7)) step7_validateQuran()
    if (shouldRun(8)) step8_validateTafsirHadith()

  } catch (e) {
    console.error('\n\n❌ Phase 1 stopped:')
    console.error(`   ${e.message}`)
    console.error('\n   Fix the issue above, then re-run with --from=N')
    console.error('   Example: node scripts/phase1-run-all.js --from=2')
    process.exit(1)
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000)
  const mins    = Math.floor(elapsed / 60)
  const secs    = elapsed % 60

  console.log('\n\n╔══════════════════════════════════════════════════════════╗')
  console.log(`║  Phase 1 complete in ${String(mins + 'm ' + secs + 's').padEnd(39)}║`)
  console.log('║  Run: node scripts/validate/validate-quran.js           ║')
  console.log('║       node scripts/validate/validate-tafsir-hadith.js   ║')
  console.log('╚══════════════════════════════════════════════════════════╝\n')
}

main()
