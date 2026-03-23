/**
 * scripts/hadith/convert-local-forties.js
 *
 * Converts locally available "Forties" hadith collections to
 * the canonical ilmMate hadith format and places them in the
 * correct content/ folder structure.
 *
 * Source files (already in your project — finds them automatically):
 *   nawawi40.json       → content/hadith/db/by_book/forties/nawawi40/
 *   qudsi40.json        → content/hadith/db/by_book/forties/qudsi40/
 *   shahwaliullah40.json → content/hadith/db/by_book/forties/shahwaliullah40/
 *
 * Source format:
 *   { id, metadata: { arabic: { title, author }, english: { title, author } },
 *     hadiths: [ { id, idInBook, arabic, english: { narrator, text } } ] }
 *
 * Output format (ilmMate canonical — matches fawazahmed0 structure):
 *   { _ilmmate_meta: {...}, metadata: {...},
 *     hadiths: [ { number, arab, text, narrator, grades: [] } ] }
 *
 * Run from monorepo root:
 *   node scripts/hadith/convert-local-forties.js
 */

const fs   = require('fs')
const path = require('path')

const ROOT        = process.cwd()
const COMBO3      = path.dirname(ROOT)
const FORTIES_DIR = path.join(ROOT, 'content', 'hadith', 'db', 'by_book', 'forties')

// ─── Source file locations ────────────────────────────────────────────────────
// Searches multiple candidate paths — picks the first that exists

function findFile(filename) {
  const candidates = [
    // CONFIRMED location in this repo — by_book/forties/ root
    path.join(ROOT, 'content', 'hadith', 'db', 'by_book', 'forties', filename),
    // Other repo content locations
    path.join(ROOT, 'content', 'hadith', 'source',  filename),
    path.join(ROOT, 'content', 'hadith', 'db',       filename),
    path.join(ROOT, 'content', 'hadith',              filename),
    // Repo root
    path.join(ROOT, filename),
    // Outside repo — common locations
    path.join(COMBO3, '02 Tafseer', 'Mockup', 'data', 'tafseer', filename),
    path.join(COMBO3, '02 Tafseer', 'Mockup', 'data',             filename),
    path.join(COMBO3, '03 Hadith',                                  filename),
    path.join(COMBO3, '03 Hadith', 'forties',                       filename),
    path.join(COMBO3, '03 Hadith', 'data',                          filename),
    path.join(COMBO3,                                                filename),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return null
}

// ─── Conversion config ────────────────────────────────────────────────────────

const COLLECTIONS = [
  {
    sourceFile:  'nawawi40.json',
    outputFolder: 'nawawi40',
    outputFile:   'eng-nawawi40.json',  // English (only lang in source)
    arabicOutput: 'ara-nawawi40.json',  // Arabic text extracted separately
    bookKey:     'nawawi40',
    notes:       'Converted from local JSON — original source includes Arabic + English'
  },
  {
    sourceFile:  'qudsi40.json',
    outputFolder: 'qudsi40',
    outputFile:   'eng-qudsi40.json',
    arabicOutput: 'ara-qudsi40.json',
    bookKey:     'qudsi40',
    notes:       'Converted from local JSON — 40 Hadith Qudsi'
  },
  {
    sourceFile:  'shahwaliullah40.json',
    outputFolder: 'shahwaliullah40',
    outputFile:   'eng-shahwaliullah40.json',
    arabicOutput: 'ara-shahwaliullah40.json',
    bookKey:     'shahwaliullah40',
    notes:       'Converted from local JSON — 40 Hadith of Shah Waliullah Dehlawi'
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function buildText(narrator, text) {
  // Combine narrator + text into one readable hadith text
  // Trim excessive whitespace/newlines
  const n = (narrator || '').trim()
  const t = (text || '').trim()
  if (n && t) return `${n}\n\n${t}`
  return t || n || ''
}

// ─── Convert one collection ───────────────────────────────────────────────────

function convertCollection(config) {
  console.log(`\n▶  ${config.sourceFile}`)

  // Find source
  const srcPath = findFile(config.sourceFile)
  if (!srcPath) {
    console.error(`  ✗ Cannot find ${config.sourceFile}`)
    console.error('  Searched repo root, content/hadith/, and common locations outside repo.')
    console.error(`  Copy ${config.sourceFile} to your repo root or content/hadith/ and re-run.`)
    return false
  }
  console.log(`  Found: ${srcPath.replace(ROOT, '.').replace(COMBO3, '..')}`)

  // Parse
  let source
  try {
    source = JSON.parse(fs.readFileSync(srcPath, 'utf8'))
  } catch (e) {
    console.error(`  ✗ Parse error: ${e.message}`)
    return false
  }

  if (!source.hadiths || !Array.isArray(source.hadiths)) {
    console.error(`  ✗ No hadiths array found. Keys: ${Object.keys(source).join(', ')}`)
    return false
  }

  const totalHadiths = source.hadiths.length
  const meta         = source.metadata || {}
  const arabicMeta   = meta.arabic || {}
  const englishMeta  = meta.english || {}

  console.log(`  Hadiths: ${totalHadiths}`)
  console.log(`  Title:   ${englishMeta.title || 'Unknown'}`)

  const outputDir = path.join(FORTIES_DIR, config.outputFolder)
  ensureDir(outputDir)

  // ── English output ────────────────────────────────────────────────────────
  const engHadiths = source.hadiths.map(h => ({
    number:   h.idInBook || h.id,
    arab:     (h.arabic || '').trim(),
    narrator: ((h.english || {}).narrator || '').trim(),
    text:     buildText(
      (h.english || {}).narrator,
      (h.english || {}).text
    ),
    grades:   h.grades || []
  }))

  const engOutput = {
    _ilmmate_meta: {
      edition:        `eng-${config.bookKey}`,
      lang:           'eng',
      book:           config.bookKey,
      tier:           1,
      source:         'local JSON — converted by convert-local-forties.js',
      notes:          config.notes,
      converted_at:   new Date().toISOString()
    },
    metadata: {
      name:         englishMeta.title  || config.bookKey,
      arabic_name:  arabicMeta.title   || '',
      author:       englishMeta.author || '',
      arabic_author: arabicMeta.author || '',
      total:        totalHadiths
    },
    hadiths: engHadiths
  }

  const engPath = path.join(outputDir, config.outputFile)
  fs.writeFileSync(engPath, JSON.stringify(engOutput, null, 2), 'utf8')
  const engSizeKB = (fs.statSync(engPath).size / 1024).toFixed(0)
  console.log(`  ✓ English: ${config.outputFile} (${engSizeKB} KB)`)

  // ── Arabic output ─────────────────────────────────────────────────────────
  const araHadiths = source.hadiths.map(h => ({
    number: h.idInBook || h.id,
    arab:   (h.arabic || '').trim(),
    text:   (h.arabic || '').trim(),   // Arabic-only file: text = arabic text
    grades: h.grades || []
  }))

  const araOutput = {
    _ilmmate_meta: {
      edition:      `ara-${config.bookKey}`,
      lang:         'ara',
      book:         config.bookKey,
      tier:         1,
      source:       'local JSON — converted by convert-local-forties.js',
      notes:        config.notes,
      converted_at: new Date().toISOString()
    },
    metadata: {
      name:         arabicMeta.title  || config.bookKey,
      arabic_name:  arabicMeta.title  || '',
      author:       arabicMeta.author || '',
      total:        totalHadiths
    },
    hadiths: araHadiths
  }

  const araPath = path.join(outputDir, config.arabicOutput)
  fs.writeFileSync(araPath, JSON.stringify(araOutput, null, 2), 'utf8')
  const araSizeKB = (fs.statSync(araPath).size / 1024).toFixed(0)
  console.log(`  ✓ Arabic: ${config.arabicOutput} (${araSizeKB} KB)`)

  return true
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗')
  console.log('║  ilmMate — Convert Local Forties Hadith Collections ║')
  console.log('╚══════════════════════════════════════════════════════╝')
  console.log(`\n  Output base: ${path.relative(ROOT, FORTIES_DIR)}\n`)

  ensureDir(FORTIES_DIR)

  const results = { success: [], failed: [] }

  for (const config of COLLECTIONS) {
    const ok = convertCollection(config)
    if (ok) results.success.push(config.bookKey)
    else     results.failed.push(config.bookKey)
  }

  console.log('\n══════════════════════════════════════════════════════')
  if (results.success.length) {
    console.log(`✓ Converted (${results.success.length}): ${results.success.join(', ')}`)
  }
  if (results.failed.length) {
    console.log(`✗ Failed   (${results.failed.length}): ${results.failed.join(', ')}`)
    console.log('\n  For each failed collection, copy the source JSON file to')
    console.log('  your repo root or content/hadith/ then re-run.')
    process.exit(1)
  } else {
    console.log('\n✅ All forties collections converted successfully.')
    console.log('\n  Files written to:')
    results.success.forEach(k => {
      console.log(`    content/hadith/db/by_book/forties/${k}/`)
    })
    process.exit(0)
  }
}

main()
