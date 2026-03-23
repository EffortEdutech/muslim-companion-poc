/**
 * scripts/hadith/download-hadith.js
 *
 * Downloads Hadith collections from fawazahmed0/hadith-api
 * Saves to content/hadith/db/by_book/ following existing structure
 *
 * Tier 1 (always bundled):  Bukhari, Muslim, Nawawi40 — Arabic + English
 * Tier 2 (cache-on-demand): Abu Dawud, Tirmidhi, Ibn Majah + secondary languages
 *
 * Run from monorepo root:
 *   node scripts/hadith/download-hadith.js             — all Tier 1 + Tier 2
 *   node scripts/hadith/download-hadith.js --tier=1    — Tier 1 only (fastest)
 *   node scripts/hadith/download-hadith.js --tier=2    — Tier 2 only
 */

const fs    = require('fs')
const path  = require('path')
const https = require('https')

// ─── Config ───────────────────────────────────────────────────────────────────

const ROOT        = process.cwd()
const HADITH_BASE = path.join(ROOT, 'content', 'hadith', 'db', 'by_book')

const CDN_BASES = [
  'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions',
  'https://raw.githubusercontent.com/fawazahmed0/hadith-api/1/editions'
]

// Known approximate hadith counts for sanity checks
const EXPECTED_COUNTS = {
  bukhari:  7563,
  muslim:   7470,
  abudawud: 5274,
  tirmidhi: 3956,
  nasai:    5761,
  ibnmajah: 4341,
  nawawi40: 42
}

// Download manifest
// tier: 1 = always bundle, 2 = cache on demand
const DOWNLOADS = [
  // ─── TIER 1 — Core, always offline ───────────────────────────────────────
  { lang: 'eng', book: 'bukhari',  folder: 'the_9_books/bukhari',  tier: 1, notes: 'English Bukhari — primary' },
  { lang: 'ara', book: 'bukhari',  folder: 'the_9_books/bukhari',  tier: 1, notes: 'Arabic Bukhari' },
  { lang: 'eng', book: 'muslim',   folder: 'the_9_books/muslim',   tier: 1, notes: 'English Muslim' },
  { lang: 'ara', book: 'muslim',   folder: 'the_9_books/muslim',   tier: 1, notes: 'Arabic Muslim' },
  { lang: 'eng', book: 'nawawi40', folder: 'forties/nawawi40',     tier: 1, notes: 'Nawawi 40 English — small, bundle all languages' },
  { lang: 'ara', book: 'nawawi40', folder: 'forties/nawawi40',     tier: 1, notes: 'Nawawi 40 Arabic' },
  { lang: 'fra', book: 'nawawi40', folder: 'forties/nawawi40',     tier: 1, notes: 'Nawawi 40 French' },
  { lang: 'ind', book: 'nawawi40', folder: 'forties/nawawi40',     tier: 1, notes: 'Nawawi 40 Indonesian' },

  // ─── TIER 2 — Remaining 4 of the 9 books (Arabic + English) ─────────────
  { lang: 'eng', book: 'abudawud', folder: 'the_9_books/abudawud', tier: 2, notes: 'Abu Dawud English' },
  { lang: 'ara', book: 'abudawud', folder: 'the_9_books/abudawud', tier: 2, notes: 'Abu Dawud Arabic' },
  { lang: 'eng', book: 'tirmidhi', folder: 'the_9_books/tirmidhi', tier: 2, notes: 'Tirmidhi English' },
  { lang: 'ara', book: 'tirmidhi', folder: 'the_9_books/tirmidhi', tier: 2, notes: 'Tirmidhi Arabic' },
  { lang: 'eng', book: 'ibnmajah', folder: 'the_9_books/ibnmajah', tier: 2, notes: 'Ibn Majah English' },
  { lang: 'ara', book: 'ibnmajah', folder: 'the_9_books/ibnmajah', tier: 2, notes: 'Ibn Majah Arabic' },
  { lang: 'eng', book: 'nasai',    folder: 'the_9_books/nasai',    tier: 2, notes: 'Nasai English' },
  { lang: 'ara', book: 'nasai',    folder: 'the_9_books/nasai',    tier: 2, notes: 'Nasai Arabic' },

  // ─── TIER 2 — Secondary languages for core books ─────────────────────────
  { lang: 'urd', book: 'bukhari',  folder: 'the_9_books/bukhari',  tier: 2, notes: 'Urdu Bukhari' },
  { lang: 'urd', book: 'muslim',   folder: 'the_9_books/muslim',   tier: 2, notes: 'Urdu Muslim' },
  { lang: 'fra', book: 'bukhari',  folder: 'the_9_books/bukhari',  tier: 2, notes: 'French Bukhari' },
  { lang: 'ind', book: 'bukhari',  folder: 'the_9_books/bukhari',  tier: 2, notes: 'Indonesian Bukhari' },
  { lang: 'ind', book: 'muslim',   folder: 'the_9_books/muslim',   tier: 2, notes: 'Indonesian Muslim' },
  { lang: 'ben', book: 'bukhari',  folder: 'the_9_books/bukhari',  tier: 2, notes: 'Bengali Bukhari' },
  { lang: 'tam', book: 'bukhari',  folder: 'the_9_books/bukhari',  tier: 2, notes: 'Tamil Bukhari' },
]

// ─── Parse CLI args ───────────────────────────────────────────────────────────

const args     = process.argv.slice(2)
const tierArg  = (args.find(a => a.startsWith('--tier=')) || '').replace('--tier=', '')
const noResume = args.includes('--no-resume')

const activeDownloads = tierArg
  ? DOWNLOADS.filter(d => String(d.tier) === tierArg)
  : DOWNLOADS

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`))
      }
      const chunks = []
      res.on('data',  c  => chunks.push(c))
      res.on('end',   () => resolve(Buffer.concat(chunks).toString('utf8')))
      res.on('error', reject)
    }).on('error', reject)
  })
}

async function fetchEdition(lang, book) {
  const editionKey = `${lang}-${book}`
  const errors     = []

  for (const base of CDN_BASES) {
    // Try .min.json first (smaller)
    const urls = [
      `${base}/${editionKey}.min.json`,
      `${base}/${editionKey}.json`
    ]
    for (const url of urls) {
      try {
        console.log(`    Trying ${url.split('/')[2]}...`)
        const data = await fetchUrl(url)
        return { data, url }
      } catch (e) {
        errors.push(`${url.split('/')[2]}: ${e.message}`)
      }
    }
  }

  throw new Error(`All CDNs failed: ${errors.join(' | ')}`)
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateHadith(parsed, book) {
  const errors   = []
  const warnings = []

  if (!parsed || typeof parsed !== 'object') {
    errors.push('Response is not a valid JSON object')
    return { errors, warnings }
  }

  const hadiths = parsed.hadiths || parsed.hadith || parsed.data
  if (!hadiths || !Array.isArray(hadiths)) {
    errors.push(`Cannot find hadiths array. Keys: ${Object.keys(parsed).join(', ')}`)
    return { errors, warnings }
  }

  if (hadiths.length === 0) {
    errors.push('Hadiths array is empty')
    return { errors, warnings }
  }

  // Sanity check count
  const expected = EXPECTED_COUNTS[book]
  if (expected) {
    const ratio = hadiths.length / expected
    if (ratio < 0.9 || ratio > 1.1) {
      warnings.push(`Hadith count ${hadiths.length} is far from expected ~${expected}`)
    }
  }

  // Check a sample of hadiths
  const sample = hadiths.slice(0, 5)
  for (const h of sample) {
    if (!h.text && !h.translation && !h.content) {
      warnings.push(`Hadith ${h.number || '?'}: no text field found`)
    }
  }

  return { errors, warnings }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗')
  console.log('║  ilmMate — Download Hadith Collections          ║')
  console.log('╚══════════════════════════════════════════════════╝')
  console.log(`\nDownloads planned: ${activeDownloads.length}`)
  console.log(`Tier filter:       ${tierArg || 'all (1 + 2)'}`)
  console.log(`Resume:            ${!noResume}`)
  console.log(`Output:            content/hadith/db/by_book/\n`)
  console.log('Note: Hadith files are large (Bukhari ~4MB). This may take a few minutes.\n')

  const results = { success: [], skipped: [], failed: [] }

  for (const dl of activeDownloads) {
    const editionKey = `${dl.lang}-${dl.book}`
    const folderPath = path.join(HADITH_BASE, dl.folder)
    const filename   = `${editionKey}.json`
    const filePath   = path.join(folderPath, filename)

    process.stdout.write(`\n▶  ${editionKey.padEnd(20)} [Tier ${dl.tier}]  `)

    ensureDir(folderPath)

    // Skip if already downloaded
    if (!noResume && fs.existsSync(filePath)) {
      const sizeMB = (fs.statSync(filePath).size / 1024 / 1024).toFixed(2)
      console.log(`⏭  Already exists (${sizeMB} MB) — skipping`)
      results.skipped.push(editionKey)
      continue
    }

    try {
      const { data, url } = await fetchEdition(dl.lang, dl.book)
      const sizeKB = (data.length / 1024).toFixed(0)
      process.stdout.write(`Downloaded ${sizeKB} KB  `)

      // Parse and validate
      const parsed = JSON.parse(data)
      const { errors, warnings } = validateHadith(parsed, dl.book)

      if (warnings.length) warnings.forEach(w => console.warn(`\n  ⚠  ${w}`))

      if (errors.length) {
        errors.forEach(e => console.error(`\n  ✗ ${e}`))
        results.failed.push(editionKey)
        continue
      }

      // Inject download metadata
      const enriched = {
        _ilmmate_meta: {
          edition:       editionKey,
          lang:          dl.lang,
          book:          dl.book,
          tier:          dl.tier,
          source:        'fawazahmed0/hadith-api (github.com)',
          notes:         dl.notes,
          downloaded_at: new Date().toISOString()
        },
        ...parsed
      }

      fs.writeFileSync(filePath, JSON.stringify(enriched, null, 2), 'utf8')
      const sizeMB = (fs.statSync(filePath).size / 1024 / 1024).toFixed(2)
      const hadithCount = (parsed.hadiths || parsed.hadith || []).length
      console.log(`✓  Saved (${sizeMB} MB, ${hadithCount.toLocaleString()} hadiths)`)
      results.success.push(editionKey)

      // Rate limit — be respectful
      await sleep(500)

    } catch (e) {
      console.error(`✗  FAILED: ${e.message}`)
      results.failed.push(editionKey)
    }
  }

  // Summary
  console.log('\n══════════════════════════════════════════════════')
  console.log('SUMMARY')
  console.log('══════════════════════════════════════════════════')
  console.log(`✓ Success: ${results.success.length}`)
  if (results.success.length) console.log(`  ${results.success.join('\n  ')}`)
  if (results.skipped.length) console.log(`\n⏭ Skipped (already exist): ${results.skipped.length}`)
  if (results.failed.length)  {
    console.log(`\n✗ Failed: ${results.failed.length}`)
    console.log(`  ${results.failed.join('\n  ')}`)
    console.log('\nRe-run to retry failed downloads. Already-downloaded files are skipped.')
    process.exit(1)
  } else {
    console.log('\n✅ All hadith downloads complete.')
    process.exit(0)
  }
}

main().catch(e => {
  console.error('\nFatal error:', e)
  process.exit(1)
})
