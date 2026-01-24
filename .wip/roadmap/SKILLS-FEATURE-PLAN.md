# Skills Feature Plan

**Status:** ✅ Phase 1-6 Complete
**Date:** Jan 2026
**Completed:** Jan 18, 2026

### Recent Updates (Phase 6)
- Added Anthropic publisher (44.5k★, 17 skills)
- Added Railway publisher (42★, 12 skills)
- Publisher logo assets for all three publishers
- Search/filter functionality for publishers and skills
- Install click tracking API (`/api/skill-publishers/track-install`)
- Mobile responsive improvements throughout

### Phase 6 Files Changed
- `src/lib/sync/publisher-sync.ts` - Added Anthropic and Railway publishers
- `src/components/skills/publisher-card.tsx` - Added logos, install tracking
- `src/components/skills/skill-card.tsx` - Added install tracking
- `src/components/skills/skills-content.tsx` - Added search, logos, tracking, mobile responsive
- `src/app/api/skill-publishers/track-install/route.ts` - New tracking API
- `public/railway-dark.svg` - New Railway logo asset

---

## Overview

Add a curated Skills section to Agent Augments, featuring official skill publishers (Vercel, Railway, etc.) with rich metadata and a polished UX.

Skills follow the [Agent Skills](https://agentskills.io/) format - a universal standard supported by Claude Code, Cursor, VS Code, Codex, and others.

---

## Data Model

### Publishers Table

```sql
create table skill_publishers (
  id uuid primary key default gen_random_uuid(),
  name text not null,                    -- "Vercel"
  slug text unique not null,             -- "vercel"
  github_org text not null,              -- "vercel-labs"
  github_repo text not null,             -- "agent-skills"
  logo_url text,
  description text,
  website_url text,
  is_official boolean default false,     -- true for Vercel, Railway, Anthropic

  -- GitHub stats (refreshed periodically)
  github_stars integer default 0,
  github_forks integer default 0,
  github_watchers integer default 0,
  contributor_count integer default 0,
  last_commit_at timestamptz,

  -- Tracking
  install_clicks integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### Skills Table

```sql
create table skills (
  id uuid primary key default gen_random_uuid(),
  publisher_id uuid references skill_publishers(id) on delete cascade,

  -- From SKILL.md frontmatter
  name text not null,                    -- "react-best-practices"
  slug text not null,                    -- URL-safe version
  description text not null,             -- From frontmatter description field
  version text,                          -- "1.0.0"
  license text,                          -- "MIT"
  compatibility text,                    -- "Designed for Claude Code"

  -- From SKILL.md metadata
  author text,                           -- metadata.author

  -- Parsed from SKILL.md body
  rule_count integer,                    -- 45
  category_count integer,                -- 8
  categories jsonb default '[]',         -- ["Eliminating Waterfalls", ...]
  trigger_phrases jsonb default '[]',    -- ["Review my React code", ...]
  features jsonb default '[]',           -- Key features list

  -- Tracking
  install_clicks integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(publisher_id, slug)
);
```

### Agent Compatibility

Skills are universal by spec, but we track which agents support the SKILL.md format:

- Claude Code ✓
- Cursor ✓
- VS Code ✓
- Codex ✓
- Windsurf ✓ (no subagent support)
- Goose ✓
- Gemini CLI ✓

This is static data - all skills work with all compatible agents.

---

## Data Sources

### Official Publishers (Synced)

| Publisher | Repo | Stars | Skills |
|-----------|------|-------|--------|
| Vercel | `vercel-labs/agent-skills` | 12.4k | vercel-deploy, vercel-react-best-practices, web-design-guidelines |
| Anthropic | `anthropics/skills` | 44.5k | algorithmic-art, brand-guidelines, canvas-design, doc-coauthoring, docx, frontend-design, internal-comms, mcp-builder, pdf, pptx, skill-creator, slack-gif-creator, theme-factory, web-artifacts-builder, webapp-testing, xlsx, template-skill |
| Railway | `railwayapp/railway-skills` | 42 | database, deploy, deployment, domain, environment, metrics, new, projects, railway-docs, service, status, templates |

### Data Extraction Pipeline

1. **GitHub API** - Fetch repo metadata (stars, forks, contributors, last commit)
2. **Raw file fetch** - Get SKILL.md files from each skill directory
3. **YAML parsing** - Extract frontmatter fields
4. **Body parsing** - Extract categories, rule counts, trigger phrases
5. **Store in Supabase** - Upsert publisher and skills data

### Refresh Strategy

- **On-demand**: Admin triggers sync for specific publisher
- **Scheduled**: Weekly cron job refreshes all publishers
- **GitHub stats**: Cached for 24 hours

---

## UX Design

### Publisher Card (Homepage/Browse)

```
┌─────────────────────────────────────────────────────┐
│  ┌──────┐                                           │
│  │ LOGO │  VERCEL                     ★ 12.4k      │
│  └──────┘  Official Skills Publisher               │
│                                                     │
│  Performance optimization guidelines from           │
│  Vercel Engineering                                 │
│                                                     │
│  ┌──────────────────┐ ┌──────────────────┐         │
│  │ react-best-      │ │ web-design-      │         │
│  │ practices        │ │ guidelines       │  +1     │
│  └──────────────────┘ └──────────────────┘         │
│                                                     │
│  [View Publisher]                                   │
└─────────────────────────────────────────────────────┘
```

**Card shows:**
- Publisher logo + name
- Official badge (if applicable)
- GitHub stars
- Short description
- Skill chips (first 2-3 + overflow count)
- CTA to full page

### Publisher Full Page

```
┌─────────────────────────────────────────────────────────────────────┐
│  ┌──────┐                                                           │
│  │ LOGO │  VERCEL                                    [★ 12.4k]     │
│  └──────┘  Official Skills Publisher                 [Install ▼]   │
│            vercel-labs/agent-skills                                 │
│                                                                     │
│  "Performance optimization guidelines from Vercel Engineering"      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SKILLS                                                             │
│                                                                     │
│  ┌─────────────────────────┐  ┌─────────────────────────┐          │
│  │ react-best-practices    │  │ web-design-guidelines   │          │
│  │                         │  │                         │          │
│  │ 45 rules · 8 categories │  │ 100+ rules · 11 cats    │          │
│  │ CRITICAL → LOW priority │  │ A11y, Forms, Perf...    │          │
│  │                         │  │                         │          │
│  │ [View] [Install]        │  │ [View] [Install]        │          │
│  └─────────────────────────┘  └─────────────────────────┘          │
│                                                                     │
│  ┌─────────────────────────┐                                       │
│  │ vercel-deploy-claimable │                                       │
│  │                         │                                       │
│  │ Deploy to Vercel        │                                       │
│  │ 40+ framework support   │                                       │
│  │                         │                                       │
│  │ [View] [Install]        │                                       │
│  └─────────────────────────┘                                       │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  COMPATIBILITY                                                      │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐       │
│  │ Claude Code│ │  Cursor    │ │  VS Code   │ │   Codex    │       │
│  │     ✓      │ │     ✓      │ │     ✓      │ │     ✓      │       │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘       │
├─────────────────────────────────────────────────────────────────────┤
│  INSTALLATION                                                       │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │  npx add-skill vercel-labs/agent-skills                  [⎘]  │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  Or install individual skills:                                      │
│  npx add-skill vercel-labs/agent-skills/react-best-practices       │
├─────────────────────────────────────────────────────────────────────┤
│  ACTIVITY                                                           │
│                                                                     │
│  Contributors: [av][av][av] +8 more                                │
│  Last updated: 3 days ago                                           │
│  Languages: ████████░░░ JS 56%  ████░░░░░░ TS 25%                  │
├─────────────────────────────────────────────────────────────────────┤
│  LINKS                                                              │
│  [GitHub]  [Report Issue]  [Docs]                                  │
└─────────────────────────────────────────────────────────────────────┘
```

### Individual Skill Detail (Modal or Expandable)

```
┌─────────────────────────────────────────────────────────────────────┐
│  react-best-practices                              v1.0.0 · MIT    │
│  by Vercel                                                          │
├─────────────────────────────────────────────────────────────────────┤
│  DESCRIPTION                                                        │
│  React and Next.js performance optimization guidelines from         │
│  Vercel Engineering. Contains 45 rules across 8 categories.         │
├─────────────────────────────────────────────────────────────────────┤
│  WHEN TO USE                                                        │
│  • Writing new React components or Next.js pages                    │
│  • Implementing data fetching (client or server-side)               │
│  • Reviewing code for performance issues                            │
│  • Optimizing bundle size or load times                             │
├─────────────────────────────────────────────────────────────────────┤
│  CATEGORIES                                                         │
│                                                                     │
│  ▓▓▓▓▓▓▓▓ Eliminating Waterfalls    CRITICAL   5 rules             │
│  ▓▓▓▓▓▓▓▓ Bundle Size Optimization  CRITICAL   5 rules             │
│  ▓▓▓▓▓▓░░ Server-Side Performance   HIGH       5 rules             │
│  ▓▓▓▓░░░░ Client-Side Fetching      MEDIUM     2 rules             │
│  ▓▓▓░░░░░ Re-render Optimization    MEDIUM     7 rules             │
│  ▓▓▓░░░░░ Rendering Performance     MEDIUM     7 rules             │
│  ▓▓░░░░░░ JavaScript Performance    LOW        12 rules            │
│  ▓░░░░░░░ Advanced Patterns         LOW        2 rules             │
├─────────────────────────────────────────────────────────────────────┤
│  EXAMPLE RULES                                                      │
│                                                                     │
│  async-parallel: Use Promise.all() for independent operations       │
│  bundle-barrel-imports: Import directly, avoid barrel files         │
│  server-cache-react: Use React.cache() for per-request dedup        │
├─────────────────────────────────────────────────────────────────────┤
│  [Install This Skill]    [View on GitHub]    [View Full SKILL.md]  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Tasks

### Phase 1: Database & Data Pipeline ✅

- [x] Create `skill_publishers` table migration
- [x] Create `publisher_skills` table migration
- [x] Build skill sync script (`src/lib/sync/publisher-sync.ts`)
  - GitHub API integration for repo stats
  - SKILL.md fetching and parsing
  - Upsert logic for publishers and skills
- [x] Seed Vercel as first publisher (12.4k stars, 3 skills)
- [x] Add to cron sync job

### Phase 2: API & Hooks ✅

- [x] API route: `GET /api/skill-publishers`
- [x] API route: `GET /api/skill-publishers/[slug]`
- [x] Hook: `useSkillPublishers()`

### Phase 3: UI Components ✅

- [x] `<PublisherCard />` - for homepage/browse grid
- [x] `<SkillCard />` - individual skill within publisher
- [x] `<PublisherDetail />` - inline publisher detail view
- [x] Agent compatibility icons (Claude, OpenAI, Cursor, Windsurf)
- [x] Install command with copy button

### Phase 4: Routes & Integration ✅

- [x] Route: `/skills` - skills browse page with hero section
- [x] Publisher detail view (inline, not separate route)
- [x] Add Skills to site navigation

### Phase 5: Polish & UX ✅

- [x] Unified `SiteHeader` across all pages
- [x] augs.dev logo in nav
- [x] Hero section matching Frameworks page style
- [x] Featured publisher card with gradient border
- [x] Loading states and skeletons
- [x] Footer with Agent Skills spec link
- [x] Consistent dark theme (bg-black, zinc colors)

### Phase 6: Publishers, Search & Tracking ✅

- [x] Add Anthropic publisher (44.5k★, 17 skills)
- [x] Add Railway publisher (42★, 12 skills)
- [x] Publisher logo assets (Vercel, Anthropic, Railway)
- [x] Search/filter publishers and skills
- [x] Install click tracking API
- [x] Mobile responsive improvements

### Future Enhancements

- [ ] More publishers (Notion, Supabase, etc.)
- [ ] Skill detail modal with full SKILL.md content
- [ ] Sort publishers by stars/skills count
- [ ] Filter by skill type (document, development, etc.)
- [ ] Analytics dashboard for install metrics

---

## SKILL.md Spec Reference

### Frontmatter Fields

| Field | Required | Max Length | Description |
|-------|----------|------------|-------------|
| `name` | Yes | 64 chars | Lowercase, hyphens only |
| `description` | Yes | 1024 chars | What it does + when to use |
| `license` | No | - | License name or file reference |
| `compatibility` | No | 500 chars | Environment requirements |
| `metadata` | No | - | Key-value pairs (author, version, etc.) |
| `allowed-tools` | No | - | Pre-approved tools (experimental) |

### Example SKILL.md

```yaml
---
name: vercel-react-best-practices
description: React and Next.js performance optimization guidelines from Vercel Engineering. This skill should be used when writing, reviewing, or refactoring React/Next.js code.
license: MIT
metadata:
  author: vercel
  version: "1.0.0"
---

# Vercel React Best Practices

[Instructions for the agent...]
```

---

## Agent Install Locations

### SKILL.md Locations

| Agent | Location |
|-------|----------|
| Claude Code | `.claude/skills/` or `~/.claude/skills/` |
| Cursor | `.cursor/skills/` or `~/.cursor/skills/` |
| Windsurf | `.windsurf/skills/` or `~/.codeium/windsurf/skills/` |
| Codex | Project directory discovery |

### MCP Config Locations

| Agent | Location |
|-------|----------|
| Claude Code | `~/.claude/mcp.json` or `.claude/mcp.json` |
| Cursor | `.cursor/mcp.json` or `~/.cursor/mcp.json` |
| Windsurf | `~/.codeium/windsurf/mcp_config.json` |
| Codex | `~/.codex/config.toml` under `[mcp_servers]` |

---

## Links

- Agent Skills Spec: https://agentskills.io/specification
- Vercel Skills: https://github.com/vercel-labs/agent-skills
- Anthropic Skills: https://github.com/anthropics/skills
- Railway Skills: https://github.com/railwayapp/railway-skills
