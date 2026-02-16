# Framework Enrichment V2: Structured + Prose Data Model

**Status:** IMPLEMENTED
**Priority:** High
**Supersedes:** FRAMEWORK-ENRICHMENT.md

---

## Overview

Refactor framework data collection into two distinct categories:

1. **Structured Data** - Deterministic, scrapeable, verifiable
2. **Prose Data** - LLM-synthesized summaries requiring intelligent analysis

### Fields to REMOVE
- `features[]` - Currently regex-scraped bullets, low quality
- `use_cases[]` - Currently regex-scraped bullets, low quality
- `best_for` - Redundant with use_cases

### Fields to ADD/MODIFY
- `description` - Change from GitHub metadata to LLM-synthesized summary
- `how_it_works` - NEW: LLM-synthesized workflow explanation

---

## Data Model

### Structured Data (Deterministic)

| Field | Source | Type | Notes |
|-------|--------|------|-------|
| `name` | GitHub API | string | Repo name |
| `slug` | Derived | string | URL-safe identifier |
| `github_url` | GitHub API | string | Repository URL |
| `homepage` | GitHub API | string | Website URL |
| `stars` | GitHub API | int | Star count |
| `contributors_count` | GitHub API | int | Via pagination trick |
| `last_commit_at` | GitHub API | timestamp | `pushed_at` field |
| `open_issues_count` | GitHub API | int | Open issues |
| `install_command` | README extraction | string | Install pattern match |
| `install_tool` | README extraction | enum | npx/bash/bun/npm/plugin |
| `has_claude_md` | File check | boolean | CLAUDE.md exists |
| `has_agents_md` | File check | boolean | AGENTS.md exists |
| `has_cursorrules` | File check | boolean | .cursorrules exists |
| `has_windsurfrules` | File check | boolean | .windsurfrules exists |
| `is_claude_plugin` | File check | boolean | .claude/plugin.json exists |
| `skills_count` | File count | int | **/*.SKILL.md count |
| `mcps_count` | Config parse | int | MCP servers in config |
| `subagents_count` | File count | int | .claude/agents/*.md count |
| `methodology` | README heuristic | enum | spec-driven/test-first/iterative/agentic-mesh |
| `autonomy_level` | README heuristic | enum | HIGH/MED/LOW |

### Prose Data (LLM-Synthesized)

| Field | Source | Type | Notes |
|-------|--------|------|-------|
| `description` | LLM analysis | string | 1-2 sentence summary |
| `how_it_works` | LLM analysis | string | Workflow steps explanation |
| `prose_enriched_at` | System | timestamp | Last LLM enrichment time |
| `prose_enrichment_error` | System | string | Last error message (null = success) |

---

## Phase 1: Database Migration

### Migration 1: Remove Deprecated Fields

```sql
-- Migration: remove_deprecated_enrichment_fields
-- Removes features, use_cases arrays that are being replaced with LLM prose

-- First, backup data to a temp table (safety)
CREATE TABLE IF NOT EXISTS _framework_enrichment_backup AS
SELECT id, features, use_cases FROM frameworks
WHERE features IS NOT NULL OR use_cases IS NOT NULL;

-- Drop the columns
ALTER TABLE frameworks DROP COLUMN IF EXISTS features;
ALTER TABLE frameworks DROP COLUMN IF EXISTS use_cases;

-- Note: Keep backup table for 30 days, then drop manually
COMMENT ON TABLE _framework_enrichment_backup IS 'Backup of features/use_cases before V2 migration. Safe to drop after 2026-03-01';
```

### Migration 2: Add Prose Enrichment Fields

```sql
-- Migration: add_prose_enrichment_fields

-- Modify description to be LLM-generated (no schema change, just usage change)
COMMENT ON COLUMN frameworks.description IS 'LLM-synthesized summary of the framework (1-2 sentences)';

-- Add workflow explanation field
ALTER TABLE frameworks ADD COLUMN IF NOT EXISTS how_it_works TEXT;
COMMENT ON COLUMN frameworks.how_it_works IS 'LLM-synthesized explanation of the framework workflow/process';

-- Add enrichment tracking
ALTER TABLE frameworks ADD COLUMN IF NOT EXISTS prose_enriched_at TIMESTAMPTZ;
ALTER TABLE frameworks ADD COLUMN IF NOT EXISTS prose_enrichment_error TEXT;

COMMENT ON COLUMN frameworks.prose_enriched_at IS 'Timestamp of last successful prose enrichment';
COMMENT ON COLUMN frameworks.prose_enrichment_error IS 'Error message from last prose enrichment attempt (null = success)';

-- Index for finding frameworks needing enrichment
CREATE INDEX IF NOT EXISTS idx_frameworks_prose_enrichment
ON frameworks(prose_enriched_at NULLS FIRST)
WHERE prose_enriched_at IS NULL OR prose_enrichment_error IS NOT NULL;
```

### Migration 3: Update Completeness Scoring View (Optional)

```sql
-- Migration: update_completeness_scoring
-- Create a view for completeness calculation (optional, can stay in code)

-- No DB changes needed - completeness scoring stays in TypeScript
-- Just document the new scoring weights
```

---

## Phase 2: Sync Script Refactor

### File: `src/lib/sync/framework-sync.ts`

#### 2.1 Remove Functions

```typescript
// DELETE these functions:
- extractFeaturesFromReadme()
- extractUseCasesFromReadme()
```

#### 2.2 Add LLM Enrichment Function

```typescript
interface ProseEnrichmentResult {
  description: string;
  how_it_works: string;
}

interface ProseEnrichmentError {
  error: string;
  timestamp: Date;
}

type ProseEnrichmentOutcome =
  | { success: true; data: ProseEnrichmentResult }
  | { success: false; error: ProseEnrichmentError };

async function enrichFrameworkProse(
  readme: string,
  repoName: string,
  githubDescription: string | null
): Promise<ProseEnrichmentOutcome> {
  // See Section 2.3 for implementation
}
```

#### 2.3 LLM Integration Strategy

**Option A: Anthropic API Direct (Recommended)**
```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const PROSE_ENRICHMENT_PROMPT = `You are analyzing a GitHub repository for an AI coding framework/methodology.

Based on the README content below, provide:
1. A concise description (1-2 sentences, max 200 chars) summarizing what this framework does
2. A "how it works" explanation (2-4 sentences, max 500 chars) describing the workflow/process

README:
---
{README_CONTENT}
---

Respond in JSON format:
{
  "description": "...",
  "how_it_works": "..."
}

Rules:
- Be factual, not promotional
- Focus on what makes this framework unique
- For "how_it_works", describe the actual steps/flow a developer follows
- If the README lacks sufficient detail, provide a reasonable summary based on available info
- Never say "This framework..." - start with action verbs or the framework's core concept`;

async function enrichFrameworkProse(
  readme: string,
  repoName: string,
  githubDescription: string | null
): Promise<ProseEnrichmentOutcome> {
  try {
    // Truncate README to avoid token limits (first 8000 chars)
    const truncatedReadme = readme.slice(0, 8000);

    const message = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022", // Fast, cheap, good enough
      max_tokens: 500,
      messages: [{
        role: "user",
        content: PROSE_ENRICHMENT_PROMPT.replace("{README_CONTENT}", truncatedReadme)
      }]
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as ProseEnrichmentResult;

    // Validate required fields
    if (!parsed.description || !parsed.how_it_works) {
      throw new Error("Missing required fields in response");
    }

    // Enforce length limits
    return {
      success: true,
      data: {
        description: parsed.description.slice(0, 500),
        how_it_works: parsed.how_it_works.slice(0, 1000)
      }
    };
  } catch (error) {
    return {
      success: false,
      error: {
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date()
      }
    };
  }
}
```

**Option B: Firecrawl Agent (Alternative)**
Use the existing MCP Firecrawl integration if Anthropic API is not available.

#### 2.4 Update Main Sync Loop

```typescript
async function enrichSingleFramework(
  framework: Framework,
  readme: string
): Promise<Partial<Framework>> {
  // 1. Structured data (unchanged)
  const structuredData = {
    // ... existing GitHub stats, file checks, etc.
  };

  // 2. Check if prose enrichment needed
  const needsProseEnrichment =
    !framework.prose_enriched_at ||
    framework.prose_enrichment_error ||
    (framework.prose_enriched_at < sevenDaysAgo); // Re-enrich weekly

  if (!needsProseEnrichment) {
    return structuredData;
  }

  // 3. Prose enrichment with rate limiting
  await rateLimiter.acquire(); // Max 10 req/min

  const proseResult = await enrichFrameworkProse(
    readme,
    framework.name,
    framework.description
  );

  if (proseResult.success) {
    return {
      ...structuredData,
      description: proseResult.data.description,
      how_it_works: proseResult.data.how_it_works,
      prose_enriched_at: new Date().toISOString(),
      prose_enrichment_error: null
    };
  } else {
    // Log error but don't fail the sync
    console.error(`Prose enrichment failed for ${framework.name}:`, proseResult.error);
    return {
      ...structuredData,
      prose_enrichment_error: proseResult.error.error
      // Keep existing description/how_it_works if available
    };
  }
}
```

---

## Phase 3: Update Completeness Scoring

### File: `src/lib/framework-completeness.ts`

```typescript
// OLD weights (to remove)
// features: 5 points
// use_cases: 4 points

// NEW weights
export const COMPLETENESS_WEIGHTS = {
  // Core (45 points)
  name: 8,
  slug: 4,
  description: 12,  // Increased from 10
  install_command: 8,
  github_url: 6,
  stars: 4,
  how_it_works: 3,  // NEW

  // GitHub Stats (20 points)
  contributors_count: 8,
  last_commit_at: 6,
  open_issues_count: 6,

  // Components (25 points)
  has_skills: 8,
  has_mcps: 6,
  has_subagents: 6,
  has_claude_md: 5,

  // Enrichment (10 points) - reduced from 15
  methodology: 5,
  autonomy_level: 5
};

// Remove features/use_cases from scoring entirely
```

---

## Phase 4: Update UI Components

### Files to Modify

| File | Change |
|------|--------|
| `src/components/framework/shared/FrameworkOverview.tsx` | Remove features/use_cases display, add how_it_works |
| `src/components/framework/shared/FeaturesList.tsx` | DELETE or repurpose |
| `src/app/frameworks/[slug]/page.tsx` | Update to use new fields |

### New Component: HowItWorks

```typescript
// src/components/framework/shared/HowItWorks.tsx
interface HowItWorksProps {
  content: string | null;
}

export function HowItWorks({ content }: HowItWorksProps) {
  if (!content) return null;

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground">How it works</h3>
      <p className="text-sm leading-relaxed">{content}</p>
    </section>
  );
}
```

---

## Phase 5: Search Updates

### File: `src/lib/search-utils.ts`

```typescript
// OLD (remove)
featuresText: item.features?.join(" ") ?? "",
useCasesText: item.use_cases?.join(" ") ?? "",

// NEW
howItWorksText: item.how_it_works ?? "",
```

### File: `src/lib/fuse-config.ts`

```typescript
// Update search keys
{ name: "howItWorksText", weight: 0.5 }, // Replace features/use_cases
```

---

## Error Handling & Edge Cases

### E1: LLM API Unavailable

**Scenario:** Anthropic API is down or rate limited
**Handling:**
- Set `prose_enrichment_error` with message
- Keep existing description (GitHub fallback)
- Set `how_it_works` to null
- Log warning, continue sync
- Retry on next sync run

### E2: README Too Short/Missing

**Scenario:** README is <100 chars or missing
**Handling:**
- Use GitHub description as `description`
- Set `how_it_works` to null
- Set `prose_enrichment_error` to "README too short for analysis"
- Mark as incomplete in scoring

### E3: LLM Returns Invalid JSON

**Scenario:** Response doesn't parse as JSON
**Handling:**
- Retry once with stricter prompt
- On second failure, set error and continue
- Log the raw response for debugging

### E4: Partial Response

**Scenario:** LLM returns description but not how_it_works
**Handling:**
- Accept partial data
- Set missing field to null
- Don't set error (partial success)

### E5: Rate Limiting

**Scenario:** Hit Anthropic rate limits
**Handling:**
- Implement exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Max 3 retries per framework
- Continue to next framework on persistent failure
- Track failures for batch retry later

### E6: Migration Rollback

**Scenario:** Need to restore features/use_cases
**Handling:**
- Backup table `_framework_enrichment_backup` contains original data
- Restore query:
  ```sql
  ALTER TABLE frameworks ADD COLUMN features TEXT[];
  ALTER TABLE frameworks ADD COLUMN use_cases TEXT[];
  UPDATE frameworks f SET
    features = b.features,
    use_cases = b.use_cases
  FROM _framework_enrichment_backup b
  WHERE f.id = b.id;
  ```

---

## Environment Variables

```bash
# Required for prose enrichment
ANTHROPIC_API_KEY=sk-ant-...

# Optional: disable prose enrichment (structured only)
SKIP_PROSE_ENRICHMENT=true
```

---

## Implementation Order

### Step 1: Migrations (Database)
1. Apply Migration 1 (remove deprecated fields)
2. Apply Migration 2 (add prose fields)
3. Regenerate TypeScript types

### Step 2: Sync Script Updates
1. Add `@anthropic-ai/sdk` dependency
2. Implement `enrichFrameworkProse()` function
3. Update main sync loop
4. Remove deprecated extraction functions
5. Test with single framework

### Step 3: Completeness Scoring
1. Update weights in `framework-completeness.ts`
2. Remove features/use_cases from scoring

### Step 4: UI Updates
1. Update FrameworkOverview component
2. Delete/archive FeaturesList component
3. Add HowItWorks component
4. Update framework detail page

### Step 5: Search Updates
1. Update search normalization
2. Update Fuse.js config

### Step 6: Verification
1. Run full sync
2. Verify enrichment on 3+ frameworks
3. Check UI displays correctly
4. Run build + lint

---

## Verification Queries

```sql
-- Check prose enrichment status
SELECT
  name,
  CASE WHEN prose_enriched_at IS NOT NULL THEN 'enriched' ELSE 'pending' END as status,
  prose_enrichment_error,
  LENGTH(description) as desc_len,
  LENGTH(how_it_works) as how_len
FROM frameworks
ORDER BY prose_enriched_at DESC NULLS LAST;

-- Count enrichment states
SELECT
  COUNT(*) FILTER (WHERE prose_enriched_at IS NOT NULL AND prose_enrichment_error IS NULL) as success,
  COUNT(*) FILTER (WHERE prose_enrichment_error IS NOT NULL) as failed,
  COUNT(*) FILTER (WHERE prose_enriched_at IS NULL) as pending
FROM frameworks;

-- Verify backup exists
SELECT COUNT(*) FROM _framework_enrichment_backup;
```

---

## Rollback Plan

If issues arise post-deployment:

1. **Revert UI** - Can deploy previous UI version immediately
2. **Restore columns** - Run restore query from E6
3. **Disable LLM enrichment** - Set `SKIP_PROSE_ENRICHMENT=true`
4. **Re-sync** - Run sync with old extraction logic (requires code revert)

---

## Success Criteria

- [x] Migrations applied successfully
- [x] `features` and `use_cases` columns removed
- [x] `how_it_works` and tracking columns added
- [x] LLM enrichment working for curated frameworks
- [x] Error handling tested for all edge cases
- [x] UI displays new fields correctly
- [x] Search works with new fields
- [x] `bun run build` succeeds
- [x] `bun run lint` succeeds
- [x] Backup table exists with original data
