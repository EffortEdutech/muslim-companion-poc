# content/hadith — Manifest

Last updated: March 2026

---

## Structure

```
content/hadith/db/by_book/
├── the_9_books/
│   ├── bukhari/
│   │   ├── eng-bukhari.json     ← Tier 1
│   │   ├── ara-bukhari.json     ← Tier 1
│   │   ├── urd-bukhari.json     ← Tier 2
│   │   ├── fra-bukhari.json     ← Tier 2
│   │   └── ind-bukhari.json     ← Tier 2
│   ├── muslim/
│   │   ├── eng-muslim.json      ← Tier 1
│   │   ├── ara-muslim.json      ← Tier 1
│   │   └── ind-muslim.json      ← Tier 2
│   ├── abudawud/
│   │   ├── eng-abudawud.json    ← Tier 2
│   │   └── ara-abudawud.json    ← Tier 2
│   ├── tirmidhi/
│   │   ├── eng-tirmidhi.json    ← Tier 2
│   │   └── ara-tirmidhi.json    ← Tier 2
│   ├── ibnmajah/
│   │   ├── eng-ibnmajah.json    ← Tier 2
│   │   └── ara-ibnmajah.json    ← Tier 2
│   ├── nasai/
│   │   ├── eng-nasai.json       ← Tier 2
│   │   └── ara-nasai.json       ← Tier 2
│   ├── malik/       ← future
│   ├── ahmad/       ← future
│   └── darimi/      ← future
└── forties/
    └── nawawi40/
        ├── eng-nawawi40.json    ← Tier 1
        ├── ara-nawawi40.json    ← Tier 1
        ├── fra-nawawi40.json    ← Tier 1
        └── ind-nawawi40.json    ← Tier 1
```

---

## Edition Registry

| Edition | Book | Language | Tier | Hadiths (approx) | Source |
|---|---|---|---|---|---|
| `eng-bukhari` | Sahih Bukhari | English | 1 | 7,563 | fawazahmed0/hadith-api |
| `ara-bukhari` | Sahih Bukhari | Arabic | 1 | 7,563 | fawazahmed0/hadith-api |
| `eng-muslim` | Sahih Muslim | English | 1 | 7,470 | fawazahmed0/hadith-api |
| `ara-muslim` | Sahih Muslim | Arabic | 1 | 7,470 | fawazahmed0/hadith-api |
| `eng-nawawi40` | 40 Hadith Nawawi | English | 1 | 42 | fawazahmed0/hadith-api |
| `ara-nawawi40` | 40 Hadith Nawawi | Arabic | 1 | 42 | fawazahmed0/hadith-api |
| `fra-nawawi40` | 40 Hadith Nawawi | French | 1 | 42 | fawazahmed0/hadith-api |
| `ind-nawawi40` | 40 Hadith Nawawi | Indonesian | 1 | 42 | fawazahmed0/hadith-api |
| `urd-bukhari` | Sahih Bukhari | Urdu | 2 | 7,563 | fawazahmed0/hadith-api |
| `fra-bukhari` | Sahih Bukhari | French | 2 | 7,563 | fawazahmed0/hadith-api |
| `ind-bukhari` | Sahih Bukhari | Indonesian | 2 | 7,563 | fawazahmed0/hadith-api |
| `eng-abudawud` | Sunan Abu Dawud | English | 2 | 5,274 | fawazahmed0/hadith-api |
| `ara-abudawud` | Sunan Abu Dawud | Arabic | 2 | 5,274 | fawazahmed0/hadith-api |
| `eng-tirmidhi` | Jami' Tirmidhi | English | 2 | 3,956 | fawazahmed0/hadith-api |
| `ara-tirmidhi` | Jami' Tirmidhi | Arabic | 2 | 3,956 | fawazahmed0/hadith-api |
| `eng-ibnmajah` | Sunan Ibn Majah | English | 2 | 4,341 | fawazahmed0/hadith-api |
| `ara-ibnmajah` | Sunan Ibn Majah | Arabic | 2 | 4,341 | fawazahmed0/hadith-api |
| `eng-nasai` | Sunan an-Nasa'i | English | 2 | 5,761 | fawazahmed0/hadith-api |
| `ara-nasai` | Sunan an-Nasa'i | Arabic | 2 | 5,761 | fawazahmed0/hadith-api |

---

## Tier Meaning

- **Tier 1:** Bundled with app — pre-cached in Service Worker — available offline immediately
- **Tier 2:** Downloaded on first access — cached for future offline use

---

## File Format

```json
{
  "_ilmmate_meta": {
    "edition":       "eng-bukhari",
    "lang":          "eng",
    "book":          "bukhari",
    "tier":          1,
    "source":        "fawazahmed0/hadith-api",
    "downloaded_at": "2026-03-22T..."
  },
  "metadata": {
    "name": "Sahih al Bukhari",
    "section": { "1": "Revelation" }
  },
  "hadiths": [
    {
      "number": 1,
      "arab":   "حَدَّثَنَا...",
      "text":   "Narrated 'Umar bin Al-Khattab..."
    }
  ]
}
```

---

## Language Gaps

| Language | Status |
|---|---|
| Malay | No free API source. Research: JAKIM, Sunnah.com |
| Spanish | No free API source. Research: required |

---

## Source Attribution

All editions from fawazahmed0/hadith-api:
https://github.com/fawazahmed0/hadith-api (Unlicense — public domain)

---

## Validation

Run: `node scripts/validate/validate-tafsir-hadith.js --only=hadith`
