# Framework Data Enrichment System

Populate all framework cards with the fields from the preview page design: features, use_cases, contributors, last_commit, skills, mcps, subagents.

## Overview

**Goal**: Enrich framework data at sync time so the detail page displays complete information.

**Data to add**:
- GitHub stats: `contributors_count`, `last_commit_at`, `open_issues_count`
- README extraction: `features[]`, `use_cases[]`
- Component details: skills, mcps, subagents with name/slug/description

---

## Phase 1: Database Schema

### 1.1 Add columns to `frameworks` table

```sql
ALTER TABLE frameworks ADD COLUMN IF NOT EXISTS
  features TEXT[],
  use_cases TEXT[],
  last_commit_at TIMESTAMPTZ,
  contributors_count INT,
  open_issues_count INT;
```

### 1.2 Create junction tables for component details

```sql
CREATE TABLE IF NOT EXISTS framework_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  UNIQUE(framework_id, slug)
);

CREATE TABLE IF NOT EXISTS framework_mcps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  UNIQUE(framework_id, slug)
);

CREATE TABLE IF NOT EXISTS framework_subagents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  file_path TEXT,
  UNIQUE(framework_id, slug)
);
```

### 1.3 Update TypeScript types

**File**: `src/types/database.ts`
- Add table definitions for framework_skills, framework_mcps, framework_subagents
- Add new columns to Framework type
- Create `FrameworkWithComponents` extended type

---

## Phase 2: Enhance Sync Script

**File**: `src/lib/sync/framework-sync.ts`

### 2.1 Add GitHub stats fetching

```typescript
async function fetchRepoStats(owner: string, repo: string) {
  // Returns: { pushed_at, open_issues_count }
}

async function fetchContributorCount(owner: string, repo: string) {
  // Use Link header pagination trick (already in publisher-sync.ts)
}
```

### 2.2 Add README extraction

```typescript
function extractFromReadme(readme: string) {
  // Pattern-based extraction for:
  // - features (from ## Features section)
  // - use_cases (from ## Best For section)
  return { features: string[], useCases: string[] }
}
```

### 2.3 Add component detail extraction

```typescript
async function extractSkillDetails(owner: string, repo: string): Promise<SkillInfo[]>
async function extractMcpDetails(owner: string, repo: string): Promise<McpInfo[]>
async function extractSubagentDetails(owner: string, repo: string): Promise<SubagentInfo[]>
```

### 2.4 Update main sync loop

1. Fetch repo stats + contributors in parallel with existing calls
2. Extract README content
3. Insert framework with new columns
4. Insert component details to junction tables

---

## Phase 3: Update API

**File**: `src/app/api/frameworks/[slug]/route.ts`

Join relations in query:
```typescript
const { data } = await supabase
  .from("frameworks")
  .select(`
    *,
    skills:framework_skills(id, name, slug, description),
    mcps:framework_mcps(id, name, slug, description),
    subagents:framework_subagents(id, name, slug, description)
  `)
  .eq("slug", slug)
  .single();
```

---

## Phase 4: Update Framework Page UI

**File**: `src/app/frameworks/[slug]/page.tsx`

Add sections:
1. **Community stats** - stars, contributors, last updated
2. **Features** - bullet list from `features[]`
3. **Best For** - badges from `use_cases[]`
4. **What's Included** - collapsible lists for skills, mcps, subagents

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/database.ts` | Add new table types + extended Framework type |
| `src/lib/sync/framework-sync.ts` | Add extraction functions, update sync loop |
| `src/app/api/frameworks/[slug]/route.ts` | Join component relations |
| `src/app/frameworks/[slug]/page.tsx` | Add new UI sections |

---

## Verification

1. Apply migrations to Supabase
2. Run `bun run cron:sync` to populate data
3. Check database for populated fields
4. Visit `/frameworks/{slug}` to verify UI displays new data
5. Run `bun run build` to ensure no type errors
