# SOURCE_STRUCTURE

## Canonical Structure
```text
content/hadith/db/
├─ by_book/
│  ├─ the_9_books/
│  ├─ other_books/
│  └─ forties/
└─ by_chapter/
   ├─ the_9_books/
   ├─ other_books/
   └─ forties/
```

## Important Observations
- Some chapter files are zero-padded (`01.json`) and some are not (`1.json`)
- Some collections include `introduction.json`
- Some collections include special chapter names such as `all.json`, `8b.json`, or `31.json`
- Preserve original filenames during import
- Any normalization map should be added separately in `scripts/`
