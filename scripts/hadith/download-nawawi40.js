/**
 * scripts/hadith/download-nawawi40.js
 *
 * Downloads the 40 Hadith of Imam Nawawi from fawazahmed0/hadith-api
 * using the per-hadith endpoint (full collection file does not exist).
 *
 * Fetches hadith 1-42 individually per language, assembles into one file.
 *
 * Languages: English, Arabic, French, Indonesian
 *
 * Output:
 *   content/hadith/db/by_book/forties/nawawi40/eng-nawawi40.json
 *   content/hadith/db/by_book/forties/nawawi40/ara-nawawi40.json
 *   content/hadith/db/by_book/forties/nawawi40/fra-nawawi40.json
 *   content/hadith/db/by_book/forties/nawawi40/ind-nawawi40.json
 *
 * Run from monorepo root:
 *   node scripts/hadith/download-nawawi40.js
 */

const fs    = require('fs')
const path  = require('path')
const https = require('https')

const ROOT       = process.cwd()
const OUTPUT_DIR = path.join(ROOT, 'content', 'hadith', 'db', 'by_book', 'forties', 'nawawi40')

// ─── Languages to download ────────────────────────────────────────────────────

const LANGS = [
  { code: 'eng', label: 'English',    dir: 'ltr' },
  { code: 'ara', label: 'Arabic',     dir: 'rtl' },
  { code: 'fra', label: 'French',     dir: 'ltr' },
  { code: 'ind', label: 'Indonesian', dir: 'ltr' },
]

// Total hadiths in Nawawi 40 (actually 42 with the supplement)
const TOTAL = 42

// ─── CDN bases (per-hadith endpoint) ─────────────────────────────────────────

const CDN_BASES = [
  'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions',
  'https://rawcdn.githack.com/fawazahmed0/hadith-api/1/editions',
]

// ─── HTTP ─────────────────────────────────────────────────────────────────────

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
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

async function fetchHadith(langCode, hadithNo) {
  const editionKey = `${langCode}-nawawi40`
  const errors = []

  for (const base of CDN_BASES) {
    const urls = [
      `${base}/${editionKey}/${hadithNo}.min.json`,
      `${base}/${editionKey}/${hadithNo}.json`,
    ]
    for (const url of urls) {
      try {
        const data = await fetchUrl(url)
        return JSON.parse(data)
      } catch (e) {
        errors.push(`${url.split('/')[2]}: ${e.message}`)
      }
    }
  }
  throw new Error(`All CDNs failed for ${editionKey}/${hadithNo}: ${errors.slice(0, 2).join(' | ')}`)
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function downloadLang(lang) {
  const outputFile = path.join(OUTPUT_DIR, `${lang.code}-nawawi40.json`)

  if (fs.existsSync(outputFile)) {
    const sizeMB = (fs.statSync(outputFile).size / 1024).toFixed(0)
    console.log(`  ⏭  ${lang.code}-nawawi40.json already exists (${sizeMB} KB) — skipping`)
    return true
  }

  console.log(`\n  Downloading ${lang.label} (${lang.code})...`)

  const hadiths = []
  let failed = 0

  for (let n = 1; n <= TOTAL; n++) {
    try {
      const data = await fetchHadith(lang.code, n)

      // Per-hadith response shape:
      // { "hadiths": [ { "id": 1, "text": "...", "grades": [...] } ], "metadata": {...} }
      const hadithEntry = (data.hadiths || [])[0] || data
      hadiths.push({
        number: n,
        arab:   hadithEntry.arab || hadithEntry.arabic || '',
        text:   hadithEntry.text || hadithEntry.translation || hadithEntry.content || '',
        grades: hadithEntry.grades || []
      })

      process.stdout.write(`\r    Progress: ${n}/${TOTAL}  `)
      await sleep(100)

    } catch (e) {
      console.error(`\n    ✗ Hadith ${n} failed: ${e.message}`)
      failed++
      // Insert placeholder so numbering stays intact
      hadiths.push({ number: n, arab: '', text: '', grades: [], error: true })
    }
  }

  process.stdout.write('\n')

  if (failed > 5) {
    console.error(`  ✗ Too many failures (${failed}/${TOTAL}) — aborting ${lang.code}`)
    return false
  }

  // Build output file
  const output = {
    _ilmmate_meta: {
      edition:       `${lang.code}-nawawi40`,
      lang:          lang.code,
      book:          'nawawi40',
      tier:          1,
      source:        'fawazahmed0/hadith-api (per-hadith endpoint)',
      downloaded_at: new Date().toISOString()
    },
    metadata: {
      name: '40 Hadith of Imam Nawawi',
      arabic_name: 'الأربعون النووية',
      author: 'Imam Yahya ibn Sharaf al-Nawawi',
      total: hadiths.filter(h => !h.error).length
    },
    hadiths
  }

  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2), 'utf8')
  const sizeKB = (fs.statSync(outputFile).size / 1024).toFixed(0)
  console.log(`  ✓ ${lang.code}-nawawi40.json (${sizeKB} KB, ${hadiths.filter(h => !h.error).length} hadiths)`)
  return true
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗')
  console.log('║  ilmMate — Download Nawawi 40 Hadith            ║')
  console.log('╚══════════════════════════════════════════════════╝')
  console.log(`\n  Output: ${path.relative(ROOT, OUTPUT_DIR)}`)
  console.log(`  Method: per-hadith endpoint (1–${TOTAL} × 4 languages)\n`)

  ensureDir(OUTPUT_DIR)

  const results = { success: [], failed: [] }

  for (const lang of LANGS) {
    const ok = await downloadLang(lang)
    if (ok) results.success.push(lang.code)
    else     results.failed.push(lang.code)
  }

  console.log('\n══════════════════════════════════════════════════')
  if (results.success.length) console.log(`✓ Success: ${results.success.join(', ')}`)
  if (results.failed.length)  {
    console.log(`✗ Failed:  ${results.failed.join(', ')}`)
    process.exit(1)
  } else {
    console.log('\n✅ Nawawi 40 downloaded successfully in all 4 languages.')
    process.exit(0)
  }
}

main().catch(e => {
  console.error('\nFatal error:', e)
  process.exit(1)
})
