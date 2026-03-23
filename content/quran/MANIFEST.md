# content/quran — Manifest

Last updated: March 2026

---

## What lives here

```
content/quran/
├── db/                        ← Translation files (one JSON per edition)
│   ├── ara-uthmani.json       ← Arabic Uthmani (source)
│   ├── transliteration.json   ← Latin script transliteration
│   ├── eng-sahih.json         ← English — Saheeh International
│   ├── eng-yusufali.json      ← English — Yusuf Ali
│   ├── urd-jalandhry.json     ← Urdu — Jalandhry
│   ├── mal-basmeih.json       ← Malay — Basmeih
│   ├── ind-indonesian.json    ← Indonesian — Kemenag
│   ├── spa-montada.json       ← Spanish — Montada
│   └── fra-hamidullah.json    ← French — Hamidullah
├── meta/
│   ├── surah_info.json        ← Surah names, revelation, themes, structure
│   ├── juz_info.json          ← Juz boundary data
│   └── quran-data.xml         ← Tanzil structural XML
├── MANIFEST.md                ← This file
└── selected-editions.json     ← Machine-readable edition registry
```

---

## Edition Registry

| Key | Language | Translator / Source | Direction | Tier | Downloaded |
|---|---|---|---|---|---|
| `ara-uthmani` | Arabic | Uthmani Script (King Fahd Complex) | RTL | 1 | Pre-existing |
| `transliteration` | Latin | Tanzil.net | LTR | 1 | Pre-existing |
| `eng-sahih` | English | Saheeh International | LTR | 1 | Converted from .txt |
| `eng-yusufali` | English | Abdullah Yusuf Ali | LTR | 1 | Converted from .txt |
| `urd-jalandhry` | Urdu | Fateh Muhammad Jalandhry | RTL | 1 | fawazahmed0/quran-api |
| `mal-basmeih` | Malay | Abdullah Muhammad Basmeih (JAKIM) | LTR | 1 | fawazahmed0/quran-api |
| `ind-indonesian` | Indonesian | Kementerian Agama RI | LTR | 1 | fawazahmed0/quran-api |
| `spa-montada` | Spanish | Centro Cultural Islámico Madrid | LTR | 1 | fawazahmed0/quran-api |
| `fra-hamidullah` | French | Dr. Muhammad Hamidullah | LTR | 1 | fawazahmed0/quran-api |

---

## JSON Format (canonical for all editions)

```json
{
  "metadata": {
    "edition":      "eng-sahih",
    "language":     "English",
    "translator":   "Saheeh International",
    "direction":    "ltr",
    "source":       "tanzil.net",
    "total_surahs": 114,
    "total_verses": 6236
  },
  "surahs": [
    {
      "surah":        1,
      "total_verses": 7,
      "verses": [
        { "verse": 1, "text": "In the name of Allah..." }
      ]
    }
  ]
}
```

Note: `transliteration.json` uses `"transliteration"` instead of `"text"` in the verse object,
and uses a keyed-object format for surahs (`"surahs": { "1": { ... } }`).

---

## Sources & Attribution

- Arabic Uthmani: King Fahd Complex for the Printing of the Holy Quran
  Verified by Al-Azhar University, ISNA, Islamic Society of Malaysia
- Translations (Sahih, Yusuf Ali): Originally sourced from Tanzil.net
- Translations (Malay, Indonesian, Urdu, Spanish, French): fawazahmed0/quran-api
  GitHub: https://github.com/fawazahmed0/quran-api (Unlicense)

---

## Content Governance

- All editions are verified public sources
- No AI-generated translation
- No editorial modification of source texts
- Translators and organisations credited in metadata
- See `docs/content-governance.md` for full policy

---

## Gaps (not yet available)

None for Quran translations — all 7 target languages are covered.

---

## Validation

Run: `node scripts/validate/validate-quran.js`

Expected: 114 surahs × 6,236 total verses per edition (except transliteration which matches).
