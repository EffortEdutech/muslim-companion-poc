/**
 * scripts/quran/convert-txt-to-json.js  (FIXED v3)
 *
 * Converts Tanzil.net pipe-delimited .txt files (surah|ayah|text)
 * into the canonical ilmMate JSON format.
 *
 * Source files confirmed on this machine:
 *   content/quran/source/translations/en.sahih.txt
 *   content/quran/source/translations/en.yusufali.txt
 *
 * Run from monorepo root:
 *   node scripts/quran/convert-txt-to-json.js
 */

const fs   = require('fs')
const path = require('path')

const ROOT   = process.cwd()
const COMBO3 = path.dirname(ROOT)

const CONTENT_DIR = path.join(ROOT, 'content', 'quran', 'db')

// ─── Where to look for .txt files ────────────────────────────────────────────
// NOTE: Files use dots not underscores: en.sahih.txt not en_sahih.txt

function findTxtFile(filename) {
  const candidates = [
    // Inside repo — confirmed location
    path.join(ROOT, 'content', 'quran', 'source', 'translations', filename),
    // Other repo locations
    path.join(ROOT, 'content', 'quran', 'db',     filename),
    path.join(ROOT, 'content', 'quran', 'source', filename),
    path.join(ROOT, filename),
    // Outside repo
    path.join(COMBO3, '01 Quran', 'quran source', 'from Tanzil', filename),
    path.join(COMBO3, '01 Quran', 'quran source', filename),
    path.join(COMBO3, '01 Quran', 'translations', filename),
    path.join(COMBO3, '01 Quran', filename),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return null
}

// ─── Config ───────────────────────────────────────────────────────────────────

const CONVERSIONS = [
  {
    input:  'en.sahih.txt',
    output: 'eng-sahih.json',
    metadata: {
      edition:    'eng-sahih',
      language:   'English',
      translator: 'Saheeh International',
      direction:  'ltr',
      source:     'tanzil.net',
    }
  },
  {
    input:  'en.yusufali.txt',
    output: 'eng-yusufali.json',
    metadata: {
      edition:    'eng-yusufali',
      language:   'English',
      translator: 'Abdullah Yusuf Ali',
      direction:  'ltr',
      source:     'tanzil.net',
    }
  }
]

// ─── Expected verse counts ────────────────────────────────────────────────────

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

// ─── Parser ───────────────────────────────────────────────────────────────────

function parseTxt(filepath) {
  const raw    = fs.readFileSync(filepath, 'utf8')
  const lines  = raw.split('\n')
  const surahs = []
  let current  = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const parts = trimmed.split('|')
    if (parts.length < 3) continue

    const surahNum = parseInt(parts[0], 10)
    const verseNum = parseInt(parts[1], 10)
    const text     = parts.slice(2).join('|').trim()

    if (isNaN(surahNum) || isNaN(verseNum)) continue

    if (!current || current.surah !== surahNum) {
      current = {
        surah:        surahNum,
        total_verses: VERSE_COUNTS[surahNum - 1],
        verses:       []
      }
      surahs.push(current)
    }
    current.verses.push({ verse: verseNum, text })
  }

  return surahs
}

function validate(surahs) {
  const errors = []
  let total    = 0

  if (surahs.length !== 114) errors.push(`Expected 114 surahs, got ${surahs.length}`)

  for (const s of surahs) {
    total += s.verses.length
    const expected = VERSE_COUNTS[s.surah - 1]
    if (s.verses.length !== expected) {
      errors.push(`Surah ${s.surah}: ${s.verses.length} verses (expected ${expected})`)
    }
  }

  if (total !== 6236) errors.push(`Total: ${total} verses (expected 6236)`)
  return { errors, total }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('\n╔══════════════════════════════════════════════╗')
  console.log('║  ilmMate — Convert TXT Translations to JSON ║')
  console.log('╚══════════════════════════════════════════════╝\n')

  if (!fs.existsSync(CONTENT_DIR)) fs.mkdirSync(CONTENT_DIR, { recursive: true })

  let allPassed = true

  for (const conv of CONVERSIONS) {
    console.log(`\n▶  Processing: ${conv.input}`)

    const outputPath = path.join(CONTENT_DIR, conv.output)

    if (fs.existsSync(outputPath)) {
      const sizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)
      console.log(`  ⏭  ${conv.output} already exists (${sizeMB} MB) — skipping`)
      continue
    }

    const inputPath = findTxtFile(conv.input)

    if (!inputPath) {
      console.error(`  ✗ Cannot find ${conv.input}`)
      console.error(`\n  Expected location inside repo:`)
      console.error(`    ${path.join(ROOT, 'content', 'quran', 'source', 'translations', conv.input)}`)
      console.error(`\n  Copy the file there, then re-run.`)
      allPassed = false
      continue
    }

    const relPath = inputPath.replace(ROOT, '.').replace(COMBO3, '..')
    console.log(`  Found: ${relPath}`)

    const surahs = parseTxt(inputPath)
    const { errors, total } = validate(surahs)
    console.log(`  Parsed: ${surahs.length} surahs, ${total} verses`)

    if (errors.length > 0) {
      errors.forEach(e => console.error(`  ✗ ${e}`))
      allPassed = false
      continue
    }

    const output = {
      metadata: {
        ...conv.metadata,
        total_surahs:  114,
        total_verses:  6236,
        converted_at:  new Date().toISOString()
      },
      surahs
    }

    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8')
    const sizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)
    console.log(`  ✓ Written: ${conv.output} (${sizeMB} MB)`)
  }

  console.log('')
  if (allPassed) {
    console.log('✅ All conversions complete.')
    process.exit(0)
  } else {
    console.log('❌ Some conversions failed — see errors above.')
    process.exit(1)
  }
}

main()
