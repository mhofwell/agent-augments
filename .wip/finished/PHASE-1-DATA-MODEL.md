# Phase 1: Data Model Implementation

**Status:** ✅ COMPLETE (2026-01-17)
**Priority:** Critical (foundation for Phases 2-5)
**Estimated Changes:** 4 migrations, 1 file regeneration

---

## Summary

Add new taxonomy columns and tables to support the TAXONOMY-REDESIGN spec.

| Change | Type |
|--------|------|
| Add `skills_count`, `mcps_count`, `methodology`, `autonomy_level` to `frameworks` | ALTER TABLE |
| Create `standalone_skills` table | CREATE TABLE |
| Create `mcps` table | CREATE TABLE |
| Create `memory_patterns` table | CREATE TABLE |

---

## Migration 1: Add Workflow Metadata to Frameworks

```sql
-- Migration: add_workflow_metadata_to_frameworks

ALTER TABLE frameworks ADD COLUMN IF NOT EXISTS skills_count INTEGER DEFAULT 0;
ALTER TABLE frameworks ADD COLUMN IF NOT EXISTS mcps_count INTEGER DEFAULT 0;
ALTER TABLE frameworks ADD COLUMN IF NOT EXISTS methodology TEXT;
ALTER TABLE frameworks ADD COLUMN IF NOT EXISTS autonomy_level TEXT;

COMMENT ON COLUMN frameworks.skills_count IS 'Number of SKILL.md files detected in the repo';
COMMENT ON COLUMN frameworks.mcps_count IS 'Number of MCP server configurations detected';
COMMENT ON COLUMN frameworks.methodology IS 'Development methodology: spec-driven, iterative, test-first, agentic-mesh';
COMMENT ON COLUMN frameworks.autonomy_level IS 'Autonomy level: HIGH, MED, LOW';

ALTER TABLE frameworks ADD CONSTRAINT methodology_check
  CHECK (methodology IS NULL OR methodology IN ('spec-driven', 'iterative', 'test-first', 'agentic-mesh'));

ALTER TABLE frameworks ADD CONSTRAINT autonomy_level_check
  CHECK (autonomy_level IS NULL OR autonomy_level IN ('HIGH', 'MED', 'LOW'));
```

---

## Migration 2: Create Standalone Skills Table

```sql
-- Migration: create_standalone_skills_table
-- For SKILL.md repos (separate from plugin sub-component skills which use the existing skills table)

CREATE TABLE standalone_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  github_url TEXT,
  marketplace_id UUID REFERENCES marketplaces(id) ON DELETE SET NULL,
  domain TEXT,
  stars INTEGER DEFAULT 0,
  install_count INTEGER DEFAULT 0,
  is_branded BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE standalone_skills IS 'Standalone SKILL.md repositories (not plugin sub-components)';
COMMENT ON COLUMN standalone_skills.domain IS 'Skill domain: infra, git, testing, db, design, docs';
COMMENT ON COLUMN standalone_skills.is_branded IS 'Whether this is a branded skill (Railway, Vercel, etc.)';

ALTER TABLE standalone_skills ADD CONSTRAINT standalone_skills_domain_check
  CHECK (domain IS NULL OR domain IN ('infra', 'git', 'testing', 'db', 'design', 'docs', 'other'));

CREATE INDEX idx_standalone_skills_domain ON standalone_skills(domain);
CREATE INDEX idx_standalone_skills_marketplace ON standalone_skills(marketplace_id);
CREATE INDEX idx_standalone_skills_stars ON standalone_skills(stars DESC);
CREATE INDEX idx_standalone_skills_is_branded ON standalone_skills(is_branded) WHERE is_branded = TRUE;

ALTER TABLE standalone_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to standalone_skills"
  ON standalone_skills FOR SELECT
  TO public
  USING (true);
```

---

## Migration 3: Create MCPs Table

```sql
-- Migration: create_mcps_table

CREATE TABLE mcps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  github_url TEXT,
  domain TEXT,
  stars INTEGER DEFAULT 0,
  is_official BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE mcps IS 'Model Context Protocol (MCP) servers';
COMMENT ON COLUMN mcps.domain IS 'MCP domain: data, browser, design, external';
COMMENT ON COLUMN mcps.is_official IS 'Whether this is an official Anthropic MCP';

ALTER TABLE mcps ADD CONSTRAINT mcps_domain_check
  CHECK (domain IS NULL OR domain IN ('data', 'browser', 'design', 'external', 'other'));

CREATE INDEX idx_mcps_domain ON mcps(domain);
CREATE INDEX idx_mcps_stars ON mcps(stars DESC);
CREATE INDEX idx_mcps_is_official ON mcps(is_official) WHERE is_official = TRUE;

ALTER TABLE mcps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to mcps"
  ON mcps FOR SELECT
  TO public
  USING (true);
```

---

## Migration 4: Create Memory Patterns Table

```sql
-- Migration: create_memory_patterns_table

CREATE TABLE memory_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  github_url TEXT,
  pattern_type TEXT,
  stars INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE memory_patterns IS 'Memory patterns: AGENTS.md templates, Beads, context templates';
COMMENT ON COLUMN memory_patterns.pattern_type IS 'Pattern type: beads, progress-md, context-template';

ALTER TABLE memory_patterns ADD CONSTRAINT memory_patterns_type_check
  CHECK (pattern_type IS NULL OR pattern_type IN ('beads', 'progress-md', 'context-template', 'other'));

CREATE INDEX idx_memory_patterns_type ON memory_patterns(pattern_type);
CREATE INDEX idx_memory_patterns_stars ON memory_patterns(stars DESC);

ALTER TABLE memory_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to memory_patterns"
  ON memory_patterns FOR SELECT
  TO public
  USING (true);
```

---

## Implementation Steps

### Step 1: Apply Migrations

Apply each migration via Supabase MCP in sequence:

```
mcp__supabase__apply_migration(project_id: "yafmezgaogzlwujhqxev", name: "add_workflow_metadata_to_frameworks", query: ...)
mcp__supabase__apply_migration(project_id: "yafmezgaogzlwujhqxev", name: "create_standalone_skills_table", query: ...)
mcp__supabase__apply_migration(project_id: "yafmezgaogzlwujhqxev", name: "create_mcps_table", query: ...)
mcp__supabase__apply_migration(project_id: "yafmezgaogzlwujhqxev", name: "create_memory_patterns_table", query: ...)
```

### Step 2: Regenerate TypeScript Types

```
mcp__supabase__generate_typescript_types(project_id: "yafmezgaogzlwujhqxev")
```

Overwrite `src/types/database.ts` with the output.

Add helper type aliases at the bottom:
```typescript
export type StandaloneSkill = Tables<"standalone_skills">
export type MCP = Tables<"mcps">
export type MemoryPattern = Tables<"memory_patterns">
```

### Step 3: Verify Build

```bash
bun run build
bun run lint
```

---

## Verification Queries

```sql
-- Check frameworks columns added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'frameworks'
  AND column_name IN ('skills_count', 'mcps_count', 'methodology', 'autonomy_level');

-- Check new tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('standalone_skills', 'mcps', 'memory_patterns');

-- Check RLS enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('standalone_skills', 'mcps', 'memory_patterns');
```

---

## Design Decisions

| Decision | Rationale |
|----------|-----------|
| **New `standalone_skills` table** (not extending existing `skills`) | Existing `skills` table has `plugin_id` FK for plugin sub-components. Standalone SKILL.md repos have different relationships (github_url, marketplace_id, domain, stars). Cleaner separation. |
| **Don't rename `frameworks` to `workflows` yet** | Add new fields first for incremental, safer migration. Rename can happen in a later phase. |
| **Check constraints on methodology/autonomy** | Enforce valid values at DB level to prevent data inconsistency. |
| **Partial indexes on boolean flags** | `WHERE is_branded = TRUE` and `WHERE is_official = TRUE` for efficient filtering. |

---

## Files Affected

| File | Change |
|------|--------|
| `src/types/database.ts` | Regenerate after migrations (auto-generated from Supabase) |

---

## Success Criteria

- [x] All 4 migrations applied successfully
- [x] TypeScript types regenerated
- [x] `bun run build` succeeds
- [x] `bun run lint` succeeds
- [x] Verification queries return expected results

---

## Next Phase

After Phase 1 completes, proceed to **Phase 2: Sync Updates** (see TAXONOMY-REDESIGN.md):
- Update `framework-sync.ts` to populate new columns
- Create `skill-sync.ts` and `mcp-sync.ts`
