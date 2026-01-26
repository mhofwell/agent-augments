# Framework Enrichments

Curated content for framework detail pages. These override auto-extracted data from GitHub READMEs.

## When to create an enrichment

- Framework has 1k+ stars but thin/marketing-heavy description
- Auto-extracted features/use_cases are null or poor quality
- Install command is wrong or outdated
- Homepage points to Discord instead of docs

## What to include

| Field | Source | Notes |
|-------|--------|-------|
| `description` | Your words | 1-2 sentences, neutral, factual |
| `install_command` | Their README | Verify it works |
| `features` | Their README | 5-8 curated bullets |
| `use_cases` | Your assessment | What is it actually good for? |
| `homepage` | Their docs | Prefer docs over Discord/Twitter |

## How to apply

```bash
# Via Supabase CLI (if configured)
bun run supabase:sql scripts/enrichments/claude-flow.sql

# Or paste into Supabase SQL Editor
# Dashboard > SQL Editor > New Query > Paste > Run
```

## Maintenance

Re-review when:
- Stars increase by 50%+ since last review
- Major version released (v2 -> v3)
- User reports outdated info

Add a comment at the top of each file with last review date:
```sql
-- Last reviewed: 2026-01-25 (v3alpha, 12.9k stars)
```
