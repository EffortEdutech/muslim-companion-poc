# content/quran/

## Source files — place before running compile script

All text files are Tanzil pipe format: `surah|ayah|text`

```
content/quran/source/
├── arabic/
│   └── quran-uthmani.txt           ← quran-uthmani.txt  (from Tanzil)
├── translations/
│   ├── en.sahih.txt                ← en.sahih.txt        (from Tanzil)
│   ├── en.yusufali.txt             ← en.yusufali.txt     (from Tanzil)
│   └── ms.basmeih.txt              ← ms.basmeih.txt      (from Tanzil / uploaded)
├── transliteration/
│   └── en.transliteration.txt      ← en.transliteration.txt (from Tanzil)
└── metadata/
    ├── surah_info.json             ← surah_info.json     (from project)
    └── juz_info.json               ← juz_info.json       (from project)
```

## Compile (run once from repo root)

```bash
node scripts/quran/compile-surahs.js
```

Output:
- `content/quran/db/compiled/001.json` … `114.json`
- `content/quran/db/metadata/surah-index.json`
- `content/quran/db/metadata/juz-index.json`

## Archive (keep, do not use for compilation)

```
content/quran/archive/
├── quran-data.js        ← broken encoding
├── quran-data.xml       ← not needed
├── english_sahih.json   ← replaced by en.sahih.txt
├── quran-uthmani.json   ← replaced by quran-uthmani.txt
├── quran-transliteration.json ← replaced by en.transliteration.txt
└── ...other partial/duplicate files
```
