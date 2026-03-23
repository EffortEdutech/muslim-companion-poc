# content/tafsir — Language Gaps

Last updated: March 2026

This file documents Tafseer languages that are NOT currently available
in any free public API and require separate sourcing.

---

## Why This Matters

ilmMate targets 7 languages: English, Arabic, Urdu, Malay, Indonesian, Spanish, French.
Tafseer is only available for English, Arabic, and Urdu via free APIs.
The remaining 4 are documented here as research items.

---

## Gap 1 — Malay Tafseer

**Status:** Not available in any free public API  
**Priority:** HIGH — Large Malay-speaking Muslim population (Malaysia, Brunei, Singapore)

**Possible sources to research:**
- JAKIM (Jabatan Kemajuan Islam Malaysia): https://www.islam.gov.my
- E-Quran Malaysia: https://equran.my
- IKIM (Institut Kefahaman Islam Malaysia): https://ikim.gov.my
- Tafsir Pimpinan ar-Rahman (official Malaysian tafsir) — inquire about digital rights

**Action required:**
- Contact JAKIM digital unit for API or dataset access
- Check if Tafsir Pimpinan ar-Rahman has a JSON dataset available
- If no API — explore scraping with permission or requesting a data partnership

---

## Gap 2 — Indonesian Tafseer

**Status:** Not available in any free public API  
**Priority:** HIGH — World's largest Muslim-majority country

**Possible sources to research:**
- Kemenag (Kementerian Agama RI): https://quran.kemenag.go.id
  → They have an official Quran web app. May have Tafsir Kemenag dataset.
- Lajnah Pentashihan Mushaf Al-Qur'an (LPMQ): https://lpmq.kemenag.go.id
- Tafsir Al-Mishbah (M. Quraish Shihab) — check for digital licensing

**Action required:**
- Check Kemenag API documentation for tafseer endpoints
- Contact LPMQ for digital Tafsir Kemenag dataset
- If available, download and normalise to match ilmMate format

---

## Gap 3 — Spanish Tafseer

**Status:** No known complete free source  
**Priority:** MEDIUM

**Possible sources to research:**
- Centro Cultural Islámico de Madrid: https://www.ccim.es
- Liga Musulmana Mundial (Rabita) has Spanish publications
- tafsir.app (community project — check language coverage)

**Notes:**
- Spanish Quran translation is available (spa-montada)
- No free API-accessible Spanish tafseer exists as of March 2026
- This is a genuine gap — may require content partnership

---

## Gap 4 — French Tafseer

**Status:** No known complete free source  
**Priority:** MEDIUM — Significant francophone Muslim community (France, Morocco, Algeria)

**Possible sources to research:**
- Grande Mosquée de Paris: https://www.mosqueedeparis.net
- Institut Européen des Sciences Humaines (IESH)
- tariqa.org / islamweb.net/fr — partial tafseer content

**Notes:**
- French Quran translation available (fra-hamidullah)
- French Nawawi 40 hadith available
- Tafseer in French is the largest remaining content gap

---

## When These Gaps Are Resolved

When a source is found:
1. Download and store in `content/tafsir/db/{lang-slug}/`
2. Follow same 114-file structure: `{surahNo}.json`
3. Match the standard ayahs array format
4. Add to `content/quran/selected-editions.json`
5. Update this GAPS.md — remove the entry
6. Add to the search index build script

---

## Impact on Current Launch

These gaps do NOT block the Phase 1 gate or the Phase 8 launch.

The app handles missing tafseer gracefully:
- Shows "Tafseer not yet available in [language]"
- Offers to show the English tafseer as fallback
- Search results note the language availability

The search index for Malay, Indonesian, Spanish, and French will contain
Quran translation text but not tafseer text until these gaps are filled.
