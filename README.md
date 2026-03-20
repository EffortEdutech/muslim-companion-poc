# muslim-companion-poc

Structured Islamic learning monorepo for the PWA proof of concept.

## Purpose
This repository keeps **application code and content together** so one commit and one deployment always reflect the same state.

## Scope
Phase 0 focuses on:
- Hadith content import and organization
- PWA application setup
- Search and browsing proof of concept
- Future-ready structure for Quran and Tafsir

## Repository Structure
```text
apps/web/                # PWA app
content/hadith/          # Hadith assets, manifests, notices
docs/                    # Product and governance documents
scripts/                 # Import, validation, indexing helpers
```

## First Steps
1. Create a new GitHub repository named `muslim-companion-poc`
2. Extract this scaffold into the repo root
3. Copy your hadith dataset into:
   - `content/hadith/db/by_book/...`
   - `content/hadith/db/by_chapter/...`
4. Commit and push

## Suggested Commands
```bash
git init
git add .
git commit -m "Initial monorepo scaffold"
git branch -M main
git remote add origin https://github.com/EffortEdutech/muslim-companion-poc.git
git push -u origin main
```
