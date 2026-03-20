# Hadith Content

This folder stores the hadith dataset used by the application.

## Layout
- `db/by_book/`   : one JSON file per collection
- `db/by_chapter/`: one folder per collection, containing chapter JSON files

## Groups
- `the_9_books`
- `other_books`
- `forties`

## Notes
Keep source JSON untouched.
Any normalization or indexing should happen in `scripts/`, not by editing the source files directly.
