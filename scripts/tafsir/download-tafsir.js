/**
 * scripts/tafsir/download-tafsir.js
 *
 * Downloads 6 Tafseer editions from spa5k/tafsir_api
 * Each edition = 114 per-surah JSON files
 * Total: 684 files across all editions
 *
 * Editions downloaded:
 *   en-al-jalalayn           — English, concise (beginner-friendly)
 *   en-tafisr-ibn-kathir     — English, Ibn Kathir abridged
 *   en-tafsir-maarif-ul-quran — English, Maarif ul Quran
 *   ar-tafsir-muyassar       — Arabic, simplified (readable)
 *   ar-tafsir-ibn-kathir     — Arabic, Ibn Kathir full
 *   ur-tafseer-ibn-e-kaseer  — Urdu, Ibn Kathir
 *
 * Output: content/tafsir/db/{slug}/{1..114}.json
 *
 * Run from monorepo root:
 *   node scripts/tafsir/download-tafsir.js
 *
 * Options:
 *   --edition=en-al-jalalayn   download one edition only
 *   --resume                   skip already-downloaded files (default: true)
 *   --delay=150                ms between requests (default: 150)
 */

const fs    = require('fs')
const path  = require('path')
const https = require('https')

// ─── Config ───────────────────────────────────────────────────────────────────

const ROOT        = process.cwd()
const CONTENT_DIR = path.join(ROOT, 'content', 'tafsir', 'db')

const CDN_BASES = [
  'https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir',
  'https://cdn.statically.io/gh/spa5k/tafsir_api/main/tafsir',
  'https://raw.githubusercontent.com/spa5k/tafsir_api/main/tafsir'
]

const EDITIONS = [
  {
    slug:     'en-al-jalalayn',
    language: 'English',
    name:     'Al-Jalalayn',
    author:   'Jalal al-Din al-Mahalli & Jalal al-Din al-Suyuti',
    level:    'foundational',
    notes:    'Concise classical tafseer — best for beginners and the search index'
  },
  {
    slug:     'en-tafisr-ibn-kathir',
    language: 'English',
    name:     'Tafsir Ibn Kathir (abridged)',
    author:   'Hafiz Ibn Kathir',
    level:    'intermediate',
    notes:    'Abridged English edition — most widely referenced'
  },
  {
    slug:     'en-tafsir-maarif-ul-quran',
    language: 'English',
    name:     'Maarif-ul-Quran',
    author:   'Mufti Muhammad Shafi',
    level:    'intermediate',
    notes:    'Comprehensive Deobandi tafseer in English'
  },
  {
    slug:     'ar-tafsir-muyassar',
    language: 'Arabic',
    name:     'Tafsir Muyassar',
    author:   'Al-Muyassar Group of Scholars',
    level:    'intermediate',
    notes:    'Simplified Arabic tafseer — readable for intermediate Arabic learners'
  },
  {
    slug:     'ar-tafsir-ibn-kathir',
    language: 'Arabic',
    name:     'Tafsir Ibn Kathir',
    author:   'Hafiz Ibn Kathir',
    level:    'advanced',
    notes:    'Full classical Arabic Ibn Kathir — large files'
  },
  {
    slug:     'ur-tafseer-ibn-e-kaseer',
    language: 'Urdu',
    name:     'Tafsir Ibn Kathir (Urdu)',
    author:   'Hafiz Ibn Kathir',
    level:    'intermediate',
    notes:    'Urdu translation of Ibn Kathir'
  }
]

// ─── Parse CLI args ───────────────────────────────────────────────────────────

const args         = process.argv.slice(2)
const onlyEdition  = (args.find(a => a.startsWith('--edition=')) || '').replace('--edition=', '') || null
const delay        = parseInt((args.find(a => a.startsWith('--delay='))   || '').replace('--delay=',   '') || '150', 10)
const noResume     = args.includes('--no-resume')

const activeEditions = onlyEdition
  ? EDITIONS.filter(e => e.slug === onlyEdition)
  : EDITIONS

if (onlyEdition && activeEditions.length === 0) {
  console.error(`Unknown edition: ${onlyEdition}`)
  console.error(`Valid slugs: ${EDITIONS.map(e => e.slug).join(', ')}`)
  process.exit(1)
}

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

async function fetchSurahTafsir(slug, surahNo) {
  const filename = `${surahNo}.json`
  const errors   = []

  for (const base of CDN_BASES) {
    const url = `${base}/${slug}/${filename}`
    try {
      const data = await fetchUrl(url)
      return { data, url }
    } catch (e) {
      errors.push(`${base.split('/')[2]}: ${e.message}`)
    }
  }

  throw new Error(`All CDNs failed for ${slug}/${surahNo}: ${errors.join(' | ')}`)
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function formatProgress(current, total) {
  const pct  = Math.round((current / total) * 100)
  const bar  = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5))
  return `[${bar}] ${pct}% (${current}/${total})`
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function downloadEdition(edition) {
  const editionDir = path.join(CONTENT_DIR, edition.slug)
  ensureDir(editionDir)

  const stats = { downloaded: 0, skipped: 0, empty: 0, failed: 0, failedSurahs: [] }

  console.log(`\n▶  ${edition.slug} (${edition.language} — ${edition.name})`)

  for (let surah = 1; surah <= 114; surah++) {
    const filePath = path.join(editionDir, `${surah}.json`)

    // Resume: skip if already downloaded
    if (!noResume && fs.existsSync(filePath)) {
      stats.skipped++
      continue
    }

    try {
      const { data } = await fetchSurahTafsir(edition.slug, surah)

      // Validate JSON is parseable
      const parsed = JSON.parse(data)

      // Check for empty ayahs (some editions have gaps — this is expected)
      const ayahs = parsed.ayahs || []
      const emptyCount = ayahs.filter(a => !a.text || a.text.trim().length === 0).length
      if (emptyCount > 0) {
        stats.empty++
        // Still save the file — empty ayahs are documented, not errors
      }

      // Save with edition metadata injected at top
      const enriched = {
        _meta: {
          slug:    edition.slug,
          surah,
          edition: edition.name,
          author:  edition.author,
          lang:    edition.language
        },
        ...parsed
      }

      fs.writeFileSync(filePath, JSON.stringify(enriched, null, 2), 'utf8')
      stats.downloaded++

      // Progress every 10 surahs
      if (surah % 10 === 0 || surah === 114) {
        process.stdout.write(`\r  ${formatProgress(surah, 114)}  `)
      }

      await sleep(delay)

    } catch (e) {
      stats.failed++
      stats.failedSurahs.push(surah)
      // Don't stop — continue to next surah
    }
  }

  process.stdout.write('\n')

  // Print edition summary
  console.log(`  Downloaded: ${stats.downloaded}  |  Skipped: ${stats.skipped}  |  Empty ayahs: ${stats.empty}  |  Failed: ${stats.failed}`)
  if (stats.failedSurahs.length > 0) {
    console.warn(`  Failed surahs: ${stats.failedSurahs.join(', ')}`)
    console.warn(`  Re-run with --edition=${edition.slug} --no-resume to retry failed surahs only`)
  }

  return stats
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════╗')
  console.log('║  ilmMate — Download Tafseer Editions            ║')
  console.log('╚══════════════════════════════════════════════════╝')
  console.log(`\nEditions to download: ${activeEditions.length}`)
  console.log(`Total files:          ${activeEditions.length * 114}`)
  console.log(`Delay between calls:  ${delay}ms`)
  console.log(`Resume (skip existing): ${!noResume}`)
  console.log(`Output: ${path.relative(ROOT, CONTENT_DIR)}\n`)

  const estimate = Math.round((activeEditions.length * 114 * delay) / 1000 / 60)
  console.log(`Estimated time: ~${estimate} minutes (${delay}ms delay × ${activeEditions.length * 114} files)\n`)

  ensureDir(CONTENT_DIR)

  const allStats = {}
  let totalFailed = 0

  for (const edition of activeEditions) {
    const stats = await downloadEdition(edition)
    allStats[edition.slug] = stats
    totalFailed += stats.failed
  }

  // Final summary
  console.log('\n══════════════════════════════════════════════════')
  console.log('FINAL SUMMARY')
  console.log('══════════════════════════════════════════════════')
  for (const [slug, s] of Object.entries(allStats)) {
    const status = s.failed === 0 ? '✓' : '⚠'
    console.log(`${status} ${slug}: ${s.downloaded} downloaded, ${s.skipped} skipped, ${s.failed} failed`)
  }

  if (totalFailed > 0) {
    console.log(`\n⚠  ${totalFailed} files failed. Run again — the script will skip already-downloaded files.`)
    process.exit(1)
  } else {
    console.log('\n✅ All tafseer editions downloaded successfully.')
    process.exit(0)
  }
}

main().catch(e => {
  console.error('\nFatal error:', e)
  process.exit(1)
})
