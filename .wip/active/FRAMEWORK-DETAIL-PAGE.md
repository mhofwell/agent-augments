# Framework Detail Page

**Status:** Planning
**Created:** Jan 20, 2026

---

## Goal

Create a full-page view for frameworks that helps users understand what a framework offers and whether it's right for their agent development workflow.

---

## Current State

**Route:** None (frameworks only shown in modal at `/`)
**Data available:**
- `name`, `slug`, `description`
- `install_command`, `install_tool`
- `github_url`, `homepage`
- `stars`
- `methodology` (agentic-mesh, spec-driven, test-first, iterative) - sparse
- `autonomy_level` (HIGH, MED, LOW) - sparse
- `subagents_count`, `skills_count`, `mcps_count`
- `has_claude_md`, `has_agents_md`, `has_cursorrules`, `has_windsurfrules`
- `is_claude_plugin`
- `prerequisites[]`
- Related plugins via `plugin_frameworks` junction (mostly empty)

**What's missing for a great UX:**
1. No detailed workflow explanation
2. No use case / "best for" guidance
3. No feature list
4. No getting started steps beyond install command
5. No example projects
6. No README content (would need to fetch from GitHub)

---

## User Needs Analysis

### Who is the user?
A developer evaluating frameworks for their AI-assisted coding workflow. They want to understand:

1. **What does this framework do?** (Philosophy, methodology)
2. **What's included?** (Skills, MCPs, subagents, config files)
3. **Will it work for me?** (Agent compatibility, prerequisites)
4. **How do I get started?** (Installation, setup)
5. **Is it trustworthy/maintained?** (Stars, activity, community)

### Key Questions to Answer

| Question | Current Data | Gap |
|----------|--------------|-----|
| What's the workflow philosophy? | `methodology`, `autonomy_level` | Sparse, needs enrichment |
| What capabilities does it include? | `skills_count`, `mcps_count`, `subagents_count` | Counts only, no details |
| Which agents does it support? | `has_*` boolean flags | Good, can derive compatibility |
| How do I install it? | `install_command`, `prerequisites` | Good |
| Is it maintained? | `stars` | Missing: last_updated, contributors |

---

## Data Strategy

### Option A: Enrich at Sync Time (Recommended)
Fetch additional data during `framework-sync.ts`:
- README content (store summary or key sections)
- Last commit date
- Open issues count
- Contributors count

**Pros:** Fast page loads, no API calls at render
**Cons:** Stale data between syncs, larger DB

### Option B: Fetch on Demand
Fetch README/activity from GitHub when user views page.

**Pros:** Always fresh
**Cons:** Slow, rate limits, poor UX

### Option C: Hybrid
Store basics at sync, fetch README on-demand with caching.

**Recommendation:** Start with **Option A** - enrich sync to capture what we need.

---

## Schema Additions

```sql
ALTER TABLE frameworks ADD COLUMN IF NOT EXISTS
  readme_summary TEXT,           -- First 500 chars or extracted summary
  features TEXT[],               -- Key features extracted from README
  use_cases TEXT[],              -- "Best for" list
  getting_started TEXT,          -- Setup steps beyond install
  last_commit_at TIMESTAMPTZ,    -- GitHub last commit
  contributors_count INT,        -- GitHub contributors
  open_issues_count INT;         -- GitHub open issues
```

---

## Page Structure

### Route
`/frameworks/[slug]`

### Sections

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Frameworks                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Icon]  Framework Name                         ★ 12.5k         │
│          Short tagline / description                            │
│          [Claude Code] [Cursor] [Windsurf]  ← agent badges      │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  npx install-framework                              [⎘]  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Docs]  [GitHub]  [Report Issue]                               │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  OVERVIEW                                                       │
│  ─────────                                                      │
│  Full description / README summary                              │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WORKFLOW                                                       │
│  ─────────                                                      │
│  [Methodology badge]  [Autonomy level badge]                    │
│                                                                 │
│  This framework follows a {methodology} approach with           │
│  {autonomy_level} autonomy...                                   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  WHAT'S INCLUDED                                                │
│  ───────────────                                                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ Skills  │  │  MCPs   │  │Subagents│  │ Configs │            │
│  │    3    │  │    2    │  │    5    │  │    2    │            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
│                                                                 │
│  Config files provided:                                         │
│  ✓ CLAUDE.md  ✓ .cursorrules  ✗ .windsurfrules                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  FEATURES (if available)                                        │
│  ─────────                                                      │
│  • Feature 1                                                    │
│  • Feature 2                                                    │
│  • Feature 3                                                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  GETTING STARTED                                                │
│  ───────────────                                                │
│  Prerequisites: Node.js 18+, Claude Code                        │
│                                                                 │
│  1. Run the install command above                               │
│  2. Follow the setup prompts                                    │
│  3. Start your agent                                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  COMMUNITY                                                      │
│  ─────────                                                      │
│  ★ 12.5k stars  ·  42 contributors  ·  Updated 3 days ago      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Basic Page (use existing data)
- [ ] Create `/frameworks/[slug]/page.tsx` route
- [ ] Create `FrameworkDetailPage` component
- [ ] Hero section with name, description, install command
- [ ] Agent compatibility badges
- [ ] "What's Included" section with counts
- [ ] Config files checklist
- [ ] Links (GitHub, Docs)
- [ ] Back navigation

### Phase 2: Enrich Data (sync improvements)
- [ ] Add new columns to schema
- [ ] Update `framework-sync.ts` to extract:
  - README summary
  - Features list (parse from README)
  - Last commit date
  - Contributors count
- [ ] Backfill existing frameworks

### Phase 3: Enhanced UX
- [ ] Workflow section with methodology explainer
- [ ] Features section
- [ ] Community stats section
- [ ] Related frameworks / "Similar to"
- [ ] Bookmark functionality

---

## Questions to Resolve

1. **Should we fetch README on-demand or store it?**
   - Recommend: Store summary at sync time

2. **How to handle sparse methodology/autonomy data?**
   - Option A: Hide section if null
   - Option B: Show "Unknown" with link to contribute
   - Recommend: Option A for now

3. **Should the page be SSR or client-side?**
   - Recommend: SSR for SEO and fast initial load

4. **Mobile layout?**
   - Stack all sections vertically
   - Sticky install command at bottom?

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/app/frameworks/[slug]/page.tsx` | Create - SSR page |
| `src/components/framework/framework-detail.tsx` | Create - main component |
| `src/components/framework/framework-hero.tsx` | Create - hero section |
| `src/components/framework/framework-stats.tsx` | Create - stats cards |
| `src/lib/sync/framework-sync.ts` | Modify - add data extraction |
| `src/types/database.ts` | Modify - add new columns |

---

## Success Criteria

- [ ] User can navigate to `/frameworks/[slug]`
- [ ] Page loads fast (< 1s with SSR)
- [ ] All existing data is displayed meaningfully
- [ ] Agent compatibility is clear
- [ ] Install command is prominent and copyable
- [ ] Mobile responsive
- [ ] `bun run build` passes
- [ ] `bun run lint` passes
