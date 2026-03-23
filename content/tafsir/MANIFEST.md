# content/tafsir — Manifest

Last updated: March 2026

---

## Structure

```
content/tafsir/
├── db/
│   ├── en-al-jalalayn/          ← 114 files: 1.json ... 114.json
│   ├── en-tafisr-ibn-kathir/    ← 114 files
│   ├── en-tafsir-maarif-ul-quran/ ← 114 files
│   ├── ar-tafsir-muyassar/      ← 114 files
│   ├── ar-tafsir-ibn-kathir/    ← 114 files
│   └── ur-tafseer-ibn-e-kaseer/ ← 114 files
├── MANIFEST.md                  ← This file
├── GAPS.md                      ← Languages not yet available
└── selected-editions.json       ← In content/quran/selected-editions.json
```

---

## Edition Registry

| Slug | Language | Author | Level | Tier | Search Index | Source |
|---|---|---|---|---|---|---|
| `en-al-jalalayn` | English | Jalalayn | Foundational | 1 | ✓ | spa5k/tafsir_api |
| `en-tafisr-ibn-kathir` | English | Ibn Kathir | Intermediate | 1 | ✓ | spa5k/tafsir_api |
| `en-tafsir-maarif-ul-quran` | English | Mufti Shafi | Intermediate | 2 | — | spa5k/tafsir_api |
| `ar-tafsir-muyassar` | Arabic | Scholars Group | Intermediate | 1 | ✓ | spa5k/tafsir_api |
| `ar-tafsir-ibn-kathir` | Arabic | Ibn Kathir | Advanced | 2 | — | spa5k/tafsir_api |
| `ur-tafseer-ibn-e-kaseer` | Urdu | Ibn Kathir | Intermediate | 1 | ✓ | spa5k/tafsir_api |

---

## File Format (per surah)

```json
{
  "_meta": {
    "slug":    "en-al-jalalayn",
    "surah":   1,
    "edition": "Al-Jalalayn",
    "author":  "Jalal al-Din al-Mahalli & Jalal al-Din al-Suyuti",
    "lang":    "English"
  },
  "ayahs": [
    { "id": 1, "text": "Tafseer text for ayah 1..." },
    { "id": 2, "text": "..." }
  ]
}
```

Note: Some editions have empty `text` fields for certain ayahs. This is expected —
the source API marks these as gaps. The app handles these gracefully.

---

## Gaps

See `GAPS.md` for missing languages.

---

## Source Attribution

All editions sourced from spa5k/tafsir_api:
https://github.com/spa5k/tafsir_api (MIT License)
Original data from quran.com and altafsir.com.

---

## Validation

Run: `node scripts/validate/validate-tafsir-hadith.js --only=tafsir`
