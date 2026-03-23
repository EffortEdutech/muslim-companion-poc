# Phase 1 — Content Foundation
## ilmMate / Effort Studio

**Bismillah.**

This document is the complete guide to running Phase 1.  
Follow the steps in order. Each step is safe to re-run.

---

## What Phase 1 Does

By the end of Phase 1 you will have:

- ✅ Clean content folder structure in your repo
- ✅ Quran Arabic (Uthmani) — already in repo, moved to correct location
- ✅ Quran in 7 languages: Arabic, English (×2), Malay, Indonesian, Urdu, Spanish, French
- ✅ Transliteration + surah metadata + juz data — organised
- ✅ Tafseer in 6 editions: English (×3), Arabic (×2), Urdu
- ✅ Hadith Tier 1: Bukhari + Muslim + Nawawi 40 in Arabic + English + French + Indonesian
- ✅ Hadith Tier 2: Abu Dawud, Tirmidhi, Ibn Majah, Nasai + secondary languages
- ✅ All content validated and manifests written
- ✅ Ready for Phase 2 (Search Engine)

---

## Before You Start

**Prerequisites:**
- Node.js 18+ installed
- You are in the repo root: `C:\Users\user\Documents\00 Combo3\muslim-companion-poc`
- Internet connection (for downloading translations, tafseer, hadith)
- ~500 MB free disk space for full content

**Check Node version:**
```bash
node --version
# Should be v18 or higher
```

---

## Step 0 — Copy Scripts Into Your Repo

Copy all delivered script files into the correct locations in your repo:

```
From this delivery:                    → Into your repo:
─────────────────────────────────────────────────────────────────
scripts/quran/convert-txt-to-json.js   → scripts/quran/convert-txt-to-json.js
scripts/quran/download-translations.js → scripts/quran/download-translations.js
scripts/tafsir/download-tafsir.js      → scripts/tafsir/download-tafsir.js
scripts/hadith/download-hadith.js      → scripts/hadith/download-hadith.js
scripts/validate/validate-quran.js     → scripts/validate/validate-quran.js
scripts/validate/validate-tafsir-hadith.js → scripts/validate/validate-tafsir-hadith.js
scripts/phase1-run-all.js              → scripts/phase1-run-all.js

content/quran/MANIFEST.md              → content/quran/MANIFEST.md
content/quran/selected-editions.json   → content/quran/selected-editions.json
content/tafsir/MANIFEST.md             → content/tafsir/MANIFEST.md
content/tafsir/GAPS.md                 → content/tafsir/GAPS.md
content/hadith/MANIFEST.md             → content/hadith/MANIFEST.md
```

Create any missing folders first:
```powershell
New-Item -ItemType Directory -Force scripts\quran
New-Item -ItemType Directory -Force scripts\tafsir
New-Item -ItemType Directory -Force scripts\hadith
New-Item -ItemType Directory -Force scripts\validate
New-Item -ItemType Directory -Force content\quran
New-Item -ItemType Directory -Force content\tafsir
New-Item -ItemType Directory -Force content\hadith
```

---

## Step 1 — Add Scripts to package.json

Open `package.json` at the repo root.  
Add these entries to the `"scripts"` section:

```json
"scripts": {
  "dev":              "pnpm --dir apps/web dev",
  "build":            "pnpm --dir apps/web build",

  "phase1":           "node scripts/phase1-run-all.js",
  "phase1:step":      "node scripts/phase1-run-all.js --step=",

  "convert:quran":    "node scripts/quran/convert-txt-to-json.js",
  "download:quran":   "node scripts/quran/download-translations.js",
  "download:tafsir":  "node scripts/tafsir/download-tafsir.js",
  "download:hadith":  "node scripts/hadith/download-hadith.js",

  "validate:quran":   "node scripts/validate/validate-quran.js",
  "validate:content": "node scripts/validate/validate-tafsir-hadith.js",
  "validate:all":     "node scripts/validate/validate-quran.js && node scripts/validate/validate-tafsir-hadith.js"
}
```

---

## Option A — Run Everything at Once (Recommended)

```bash
node scripts/phase1-run-all.js
```

This runs all 8 steps in sequence.  
The tafseer download (~684 files) takes around **15–20 minutes**.  
Everything is resumable — safe to interrupt and re-run.

**What it does:**
1. Creates the full content folder structure
2. Moves existing files (Uthmani, transliteration, metadata) to correct locations
3. Converts `en_sahih.txt` and `en_yusufali.txt` to JSON
4. Downloads 5 Quran translations (Malay, Indonesian, Urdu, Spanish, French)
5. Downloads 6 Tafseer editions (684 files total)
6. Downloads Hadith Tier 1 (Bukhari + Muslim + Nawawi40, Arabic + English)
7. Validates all Quran content
8. Validates Tafseer + Hadith

---

## Option B — Run Steps One at a Time

If you prefer to control each step manually:

### Step 1 — Create folder structure + organise existing files
```bash
node scripts/phase1-run-all.js --step=1
node scripts/phase1-run-all.js --step=2
```

### Step 2 — Convert existing .txt translations to JSON
```bash
node scripts/quran/convert-txt-to-json.js
```

Expected output:
```
✓ Written: eng-sahih.json (2.14 MB)
✓ Written: eng-yusufali.json (2.21 MB)
✅ All conversions complete.
```

### Step 3 — Download 5 missing Quran translations
```bash
node scripts/quran/download-translations.js
```

Downloads: Malay, Indonesian, Urdu, Spanish, French (~1–2 MB each)  
Takes ~2–3 minutes. Already-downloaded files are skipped.

Expected output:
```
▶  mal-basmeih (Malay)
  ✓ Saved: mal-basmeih.json (1.87 MB)
▶  ind-indonesian (Indonesian)
  ✓ Saved: ind-indonesian.json (1.91 MB)
... (etc)
✅ All translations complete.
```

### Step 4 — Download Tafseer editions
```bash
node scripts/tafsir/download-tafsir.js
```

Downloads 6 editions × 114 surahs = **684 files**.  
Takes ~17 minutes at default 150ms delay.  
**Safe to interrupt** — re-run and it resumes from where it stopped.

To download one edition at a time:
```bash
node scripts/tafsir/download-tafsir.js --edition=en-al-jalalayn
node scripts/tafsir/download-tafsir.js --edition=en-tafisr-ibn-kathir
node scripts/tafsir/download-tafsir.js --edition=ar-tafsir-muyassar
node scripts/tafsir/download-tafsir.js --edition=ur-tafseer-ibn-e-kaseer
node scripts/tafsir/download-tafsir.js --edition=en-tafsir-maarif-ul-quran
node scripts/tafsir/download-tafsir.js --edition=ar-tafsir-ibn-kathir
```

Expected output per edition:
```
▶  en-al-jalalayn (English — Al-Jalalayn)
  [████████████████████] 100% (114/114)
  Downloaded: 114  |  Skipped: 0  |  Empty ayahs: 3  |  Failed: 0
```

### Step 5 — Download Hadith Tier 1
```bash
node scripts/hadith/download-hadith.js --tier=1
```

Downloads: Bukhari (Arabic + English), Muslim (Arabic + English), Nawawi 40 (4 languages)  
Files are large (~4 MB each). Takes ~5 minutes.

```bash
# To also download Tier 2 (remaining books + secondary languages):
node scripts/hadith/download-hadith.js --tier=2
```

### Step 6 — Validate everything
```bash
node scripts/validate/validate-quran.js
node scripts/validate/validate-tafsir-hadith.js
```

---

## Expected Final Folder Sizes

After Phase 1 is complete:

| Folder | Size | Files |
|---|---|---|
| `content/quran/db/` | ~20 MB | 9 JSON files |
| `content/quran/meta/` | ~3 MB | 3 files |
| `content/tafsir/db/` | ~250–400 MB | 684 JSON files |
| `content/hadith/db/` (Tier 1) | ~50 MB | 8 JSON files |
| `content/hadith/db/` (Tier 1+2) | ~200 MB | ~20 JSON files |

---

## Troubleshooting

### "Cannot find module" error
You are not in the repo root. Run:
```bash
cd C:\Users\user\Documents\00 Combo3\muslim-companion-poc
```

### Download fails for one file
Re-run the same script — it skips already-downloaded files.  
The scripts have 2-CDN fallback built in.

### Tafseer download stops at a specific surah
Some editions have gaps at specific surahs — this is normal.  
The failed count will be shown in the summary.  
Re-run with `--edition={slug}` to retry just that edition.

### Validation shows wrong verse counts
This may be a normalisation issue in the downloaded file.  
Check the specific edition file and report — I will update the normalisation script.

### Very slow download
Increase the delay between requests only if CDN is throttling:
```bash
node scripts/tafsir/download-tafsir.js --delay=300
```

---

## Phase 1 Gate Check

Run this when you think everything is done:

```bash
node scripts/validate/validate-quran.js
node scripts/validate/validate-tafsir-hadith.js
```

Both must exit with `✅ ALL VALIDATIONS PASSED`.

Then confirm manually:
- [ ] `content/quran/db/` has 9 files
- [ ] `content/tafsir/db/` has 6 subfolders, each with 114 files
- [ ] `content/hadith/db/by_book/` has Bukhari, Muslim, Nawawi40 folders with files
- [ ] No script exited with errors

When all pass → **Phase 1 is complete. Ready for Phase 2.**

---

## What's Next (Phase 2)

Phase 2 builds the Search Engine — ilmMate's core strength.

It uses all the content downloaded in Phase 1 to build:
- Pre-compiled search indices (one per language)
- A cross-reference map linking Quran ayahs to related Hadith
- A Next.js API route that serves search results
- An upgraded `/search` page with Tafseer tab + result drawer

**In shaa Allah — Phase 2 brief will be delivered after Phase 1 gate passes.**

---

*Phase 1 — Content Foundation*  
*ilmMate / Effort Studio / Darya Malak*  
*Bismillah*
