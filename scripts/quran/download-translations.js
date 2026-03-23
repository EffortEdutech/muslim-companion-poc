/**
 * scripts/quran/download-translations.js  (FIXED v3)
 *
 * Downloads 5 missing Quran translations.
 *
 * Strategy per language:
 *   Malay      — fawazahmed0/quran-api, chapter-by-chapter (slug: msa-abdullahmuhamma)
 *   Indonesian — risan/quran-json npm package via jsDelivr (lang code: id)
 *   Urdu       — risan/quran-json npm package via jsDelivr (lang code: ur)
 *   Spanish    — risan/quran-json npm package via jsDelivr (lang code: es)
 *   French     — risan/quran-json npm package via jsDelivr (lang code: fr)
 *
 * Why two sources?
 *   - Full single-file downloads from fawazahmed0/quran-api exceed jsDelivr CDN limits (403)
 *   - risan/quran-json is an npm package — served reliably through npm CDN, no size limits
 *   - Chapter-by-chapter for Malay avoids the size limit entirely
 *
 * Output: content/quran/db/{edition}.json
 * Format: matches canonical ilmMate format (same as ara-uthmani.json)
 *
 * Run from monorepo root:
 *   node scripts/quran/download-translations.js
 *   node scripts/quran/download-translations.js --only=mal
 */

const fs    = require('fs')
const path  = require('path')
const https = require('https')

const ROOT        = process.cwd()
const CONTENT_DIR = path.join(ROOT, 'content', 'quran', 'db')

// ─── Parse args ───────────────────────────────────────────────────────────────

const args     = process.argv.slice(2)
const onlyLang = (args.find(a => a.startsWith('--only=')) || '').replace('--only=', '') || null
const noResume = args.includes('--no-resume')

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

// ─── Edition definitions ──────────────────────────────────────────────────────

const EDITIONS = [
  // ── Malay: fawazahmed0/quran-api chapter-by-chapter ─────────────────────
  // slug: msa-abdullahmuhamma = "msa" (Malay) + Abdullah Muhammad (Basmeih)
  {
    key:        'mal',
    output:     'mal-basmeih.json',
    language:   'Malay',
    translator: 'Abdullah Muhammad Basmeih',
    direction:  'ltr',
    source:     'fawazahmed0/quran-api',
    method:     'fawazahmed0-chapters',
    slug:       'msa-abdullahmuhamma',
    notes:      'Official Malaysian JAKIM translation. Uses msa- language prefix in API.'
  },
  // ── Indonesian: risan/quran-json via npm CDN ─────────────────────────────
  {
    key:        'ind',
    output:     'ind-indonesian.json',
    language:   'Indonesian',
    translator: 'Indonesian Islamic Affairs Ministry (Kemenag)',
    direction:  'ltr',
    source:     'risan/quran-json (tanzil.net)',
    method:     'risan-npm',
    lang_code:  'id',
    notes:      'Official Indonesian government translation.'
  },
  // ── Urdu: risan/quran-json via npm CDN ──────────────────────────────────
  {
    key:        'urd',
    output:     'urd-maududi.json',
    language:   'Urdu',
    translator: "Abul A'la Maududi",
    direction:  'rtl',
    source:     'risan/quran-json (tanzil.net)',
    method:     'risan-npm',
    lang_code:  'ur',
    notes:      'Maududi translation — widely used. Note: different translator from Jalandhry.'
  },
  // ── Spanish: risan/quran-json via npm CDN ───────────────────────────────
  {
    key:        'spa',
    output:     'spa-montada.json',
    language:   'Spanish',
    translator: 'Muhammad Isa Garcia',
    direction:  'ltr',
    source:     'risan/quran-json',
    method:     'risan-npm',
    lang_code:  'es',
    notes:      'Spanish translation.'
  },
  // ── French: risan/quran-json via npm CDN ────────────────────────────────
  {
    key:        'fra',
    output:     'fra-hamidullah.json',
    language:   'French',
    translator: 'Muhammad Hamidullah',
    direction:  'ltr',
    source:     'risan/quran-json (tanzil.net)',
    method:     'risan-npm',
    lang_code:  'fr',
    notes:      'Hamidullah translation — most respected French Quran translation.'
  },
]

const activeEditions = onlyLang
  ? EDITIONS.filter(e => e.key === onlyLang)
  : EDITIONS

// ─── HTTP ─────────────────────────────────────────────────────────────────────

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchUrl(res.headers.location).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      const chunks = []
      res.on('data',  c  => chunks.push(c))
      res.on('end',   () => resolve(Buffer.concat(chunks).toString('utf8')))
      res.on('error', reject)
    }).on('error', reject)
  })
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

// ─── Method: risan/quran-json npm ────────────────────────────────────────────
// Downloads 114 chapter files from the npm CDN

const RISAN_BASE = 'https://cdn.jsdelivr.net/npm/quran-json@3.1.2/dist/chapters'

async function downloadRisan(edition) {
  console.log(`  Source: risan/quran-json (npm CDN) — lang: ${edition.lang_code}`)

  const surahs = []

  for (let surahNo = 1; surahNo <= 114; surahNo++) {
    const url = `${RISAN_BASE}/${edition.lang_code}/${surahNo}.json`

    try {
      const data   = await fetchUrl(url)
      const parsed = JSON.parse(data)

      // risan/quran-json chapter format:
      // { "id": 1, "name": "Al-Fatihah", "transliteration": "...", "verses": [
      //   { "id": 1, "text": "...", "transliteration": "..." }
      // ]}
      const verses = (parsed.verses || []).map(v => ({
        verse: v.id,
        text:  (v.text || v.translation || '').trim()
      }))

      surahs.push({
        surah:        surahNo,
        total_verses: VERSE_COUNTS[surahNo - 1],
        verses
      })

      if (surahNo % 20 === 0 || surahNo === 114) {
        process.stdout.write(`\r  Progress: ${surahNo}/114 surahs downloaded  `)
      }

      await sleep(80)

    } catch (e) {
      throw new Error(`Failed at surah ${surahNo}: ${e.message}\n  URL: ${url}`)
    }
  }

  process.stdout.write('\n')
  return surahs
}

// ─── Method: fawazahmed0 chapter-by-chapter ───────────────────────────────────

const FAWAZ_BASES = [
  'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions',
  'https://rawcdn.githack.com/fawazahmed0/quran-api/1/editions',
]

async function downloadFawazChapters(edition) {
  console.log(`  Source: fawazahmed0/quran-api — slug: ${edition.slug}`)

  const surahs = []

  for (let surahNo = 1; surahNo <= 114; surahNo++) {
    let fetched = false

    for (const base of FAWAZ_BASES) {
      const urls = [
        `${base}/${edition.slug}/${surahNo}.min.json`,
        `${base}/${edition.slug}/${surahNo}.json`,
      ]
      for (const url of urls) {
        try {
          const data   = await fetchUrl(url)
          const parsed = JSON.parse(data)

          // fawazahmed0 chapter format — multiple variants exist:
          // Format A (most editions): { "chapter": N, "verses": [ { "id": N, "text": "..." } ] }
          // Format B (some editions): { "chapter": N, "1": "verse text", "2": "..." }
          // Format C: { "chapter": N, "verses": { "1": "text", "2": "text" } }
          let verses = []

          if (Array.isArray(parsed.chapter) && parsed.chapter.length > 0) {
            // Format D — verses inside parsed.chapter array (e.g. msa-abdullahmuhamma)
            // Each item: { "chapter": N, "verse": N, "text": "..." }
            verses = parsed.chapter.map(v => ({
              verse: parseInt(v.verse || v.id || v.number),
              text:  (v.text || v.translation || '').trim()
            }))
          } else if (Array.isArray(parsed.verses) && parsed.verses.length > 0) {
            // Format A — standard verses array
            verses = parsed.verses.map(v => ({
              verse: parseInt(v.id || v.verse || v.number),
              text:  (v.text || v.translation || v.content || '').trim()
            }))
          } else if (parsed.verses && typeof parsed.verses === 'object') {
            // Format C — verses as keyed object
            verses = Object.entries(parsed.verses).map(([k, v]) => ({
              verse: parseInt(k),
              text:  (typeof v === 'string' ? v : (v.text || '')).trim()
            }))
          } else {
            // Format B — numeric keys at top level (skip non-verse keys)
            const numericKeys = Object.keys(parsed).filter(k => !isNaN(parseInt(k)))
            verses = numericKeys.map(k => ({
              verse: parseInt(k),
              text:  (typeof parsed[k] === 'string' ? parsed[k] : (parsed[k]?.text || '')).trim()
            }))
          }

          // Sort by verse number
          verses.sort((a, b) => a.verse - b.verse)



          surahs.push({
            surah:        surahNo,
            total_verses: VERSE_COUNTS[surahNo - 1],
            verses
          })

          fetched = true
          break
        } catch (e) {
          // Try next URL
        }
      }
      if (fetched) break
    }

    if (!fetched) {
      throw new Error(`All CDNs failed for surah ${surahNo} of ${edition.slug}`)
    }

    if (surahNo % 20 === 0 || surahNo === 114) {
      process.stdout.write(`\r  Progress: ${surahNo}/114 surahs downloaded  `)
    }

    await sleep(120)
  }

  process.stdout.write('\n')
  return surahs
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(surahs, editionKey) {
  const errors = []
  let   total  = 0

  if (surahs.length !== 114) {
    errors.push(`Expected 114 surahs, got ${surahs.length}`)
    return { errors, total }
  }

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

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗')
  console.log('║  ilmMate — Download Quran Translations v3       ║')
  console.log('╚══════════════════════════════════════════════════╝\n')

  ensureDir(CONTENT_DIR)
  console.log(`Output: ${path.relative(ROOT, CONTENT_DIR)}\n`)

  const results = { success: [], failed: [] }

  for (const edition of activeEditions) {
    console.log(`\n▶  ${edition.language} (${edition.translator})`)
    console.log(`   Output: ${edition.output}`)

    const outputPath = path.join(CONTENT_DIR, edition.output)

    // Skip if already done
    if (!noResume && fs.existsSync(outputPath)) {
      const sizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)
      console.log(`  ⏭  Already exists (${sizeMB} MB) — skipping. Delete to re-download.`)
      results.success.push(edition.key)
      continue
    }

    try {
      let surahs

      if (edition.method === 'risan-npm') {
        surahs = await downloadRisan(edition)
      } else if (edition.method === 'fawazahmed0-chapters') {
        surahs = await downloadFawazChapters(edition)
      } else {
        throw new Error(`Unknown method: ${edition.method}`)
      }

      // Validate
      const { errors, total } = validate(surahs, edition.output)
      console.log(`  Parsed: 114 surahs, ${total} verses`)

      if (errors.length > 0) {
        // Show first 5 errors only
        errors.slice(0, 5).forEach(e => console.error(`  ✗ ${e}`))
        if (errors.length > 5) console.error(`  ... and ${errors.length - 5} more`)
        results.failed.push(edition.key)
        continue
      }

      // Build output
      const output = {
        metadata: {
          edition:       edition.output.replace('.json', ''),
          language:      edition.language,
          translator:    edition.translator,
          direction:     edition.direction,
          source:        edition.source,
          notes:         edition.notes,
          total_surahs:  114,
          total_verses:  6236,
          downloaded_at: new Date().toISOString()
        },
        surahs
      }

      fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8')
      const sizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)
      console.log(`  ✓ Written: ${edition.output} (${sizeMB} MB)`)
      results.success.push(edition.key)

    } catch (e) {
      console.error(`  ✗ FAILED: ${e.message}`)
      results.failed.push(edition.key)
    }
  }

  // Summary
  console.log('\n══════════════════════════════════════════════════')
  console.log('SUMMARY')
  console.log('══════════════════════════════════════════════════')
  if (results.success.length) {
    console.log(`✓ Success (${results.success.length}): ${results.success.join(', ')}`)
  }
  if (results.failed.length) {
    console.log(`✗ Failed  (${results.failed.length}): ${results.failed.join(', ')}`)
    console.log('\nTo retry a specific language:')
    results.failed.forEach(k => console.log(`  node scripts/quran/download-translations.js --only=${k}`))
    process.exit(1)
  } else {
    console.log('\n✅ All translations downloaded successfully.')
    process.exit(0)
  }
}

main().catch(e => {
  console.error('\nFatal error:', e)
  process.exit(1)
})
