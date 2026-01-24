# Design Frameworks Page Plan

**Status:** Planning
**Date:** Jan 2026

## Overview

Add a new `/design` page showcasing UI/design component frameworks with official MCP server and/or SKILL.md integrations. Similar structure to `/skills` page with hero section, search/sort, and card grid.

---

## Data Model

### New Table: `design_frameworks`

```sql
CREATE TABLE design_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Integration types
  has_mcp BOOLEAN DEFAULT FALSE,
  has_skill BOOLEAN DEFAULT FALSE,

  -- MCP details
  mcp_package TEXT,           -- "@shadcn/mcp", "@mui/mcp"
  mcp_source TEXT,            -- "official" | "community"
  mcp_install_command TEXT,
  mcp_docs_url TEXT,

  -- SKILL details
  skill_install_command TEXT,
  skill_github_url TEXT,
  skill_source TEXT,          -- "official" | "community"

  -- Best For (key feature)
  best_for TEXT[],            -- ["React apps", "Tailwind projects", "Animations"]

  -- Framework info
  docs_url TEXT,
  github_url TEXT,
  website_url TEXT,
  logo_url TEXT,
  color TEXT,

  -- GitHub stats (synced)
  github_stars INTEGER,
  github_forks INTEGER,
  last_commit_at TIMESTAMPTZ,

  -- Metadata
  is_official BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  install_clicks INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Initial Data (14 Frameworks)

| Framework | MCP | SKILL | MCP Package | Best For |
|-----------|-----|-------|-------------|----------|
| **ShadCN UI** | ✅ Official | ✅ Community | Built-in CLI | React, Next.js, Tailwind |
| **Magic UI** | ✅ Official | ✅ Community | @magicuidesign/mcp | Animations, Effects, Tailwind |
| **Material UI** | ✅ Official | ❌ | @mui/mcp | Enterprise apps, React |
| **Chakra UI** | ✅ Official | ❌ | @chakra-ui/react-mcp | Theming, Migration, React |
| **Storybook** | ✅ Official | ❌ | @storybook/addon-mcp | Visual testing, Any framework |
| **Flowbite** | ✅ Official | ❌ | flowbite-mcp | Figma→code, Tailwind |
| **Aceternity UI** | ✅ Community | ❌ | aceternityui-mcp | Magic effects, Animations |
| **Ant Design** | ✅ Community | ❌ | @jzone-mcp/antd-mcp | Enterprise, React |
| **Radix UI** | ✅ Community | ❌ | radix-mcp-server | Primitives, Accessibility |
| **DaisyUI** | ✅ Official | ❌ | Blueprint MCP | Tailwind conversion |
| **FlyonUI** | ✅ Official | ❌ | flyonui-mcp | Tailwind AI Builder |
| **Tailwind CSS v4** | ❌ | ✅ Community | - | CSS-first config, Responsive |
| **Devup UI** | ❌ | ✅ Community | - | Zero-runtime CSS-in-JS |
| **Frontend Design** | ❌ | ✅ Official | - | Distinctive UI, Anti-AI-slop |

---

## File Structure

```
src/
├── app/design/
│   └── page.tsx                      # Route entry
│
├── components/design/
│   ├── index.ts                      # Exports
│   ├── design-content.tsx            # Main orchestrator
│   ├── design-card.tsx               # Card component
│   └── design-modal.tsx              # Detail modal
│
├── hooks/
│   └── useDesignFrameworks.ts        # Data fetching hook
│
├── lib/sync/
│   └── design-sync.ts                # Sync script
│
└── app/api/design-frameworks/
    ├── route.ts                      # GET list
    └── track-install/route.ts        # POST tracking
```

---

## Component Design

### DesignCard

```
┌─────────────────────────────────────────────────────┐
│  ┌──────┐                                           │
│  │ LOGO │  ShadCN UI              [MCP] [SKILL]    │
│  └──────┘  ✓ Official                    ★ 45.2k   │
│                                                     │
│  Beautifully designed components built with         │
│  Radix UI and Tailwind CSS                         │
│                                                     │
│  Best for: React · Next.js · Tailwind              │
│                                                     │
│  npx shadcn@latest init                       [⎘]  │
└─────────────────────────────────────────────────────┘
```

**Badge Colors:**
- MCP badge: `violet` (matches agent type)
- SKILL badge: `cyan` (matches skill type)
- Official badge: `yellow` checkmark

### DesignModal

Sections:
1. Header - Logo, name, badges, stars
2. Description - Full text
3. **Best For** - Tags showing ideal use cases
4. **Integrations** - MCP and SKILL details with install commands
5. Links - Docs, GitHub, Website
6. Agent Compatibility - All agents (universal support)

### Hero Section

- Featured framework: ShadCN UI (most popular, has both MCP + SKILL)
- Two-column layout matching /skills hero
- Agent compatibility logos
- Primary install command with copy

### Filters

- Search: Name, description, best_for
- Sort: Stars, Name (A-Z), Recently Updated
- Filter: All, MCP Only, SKILL Only, Both

---

## Implementation Tasks

### Phase 1: Database & Types
- [ ] Create `design_frameworks` table via Supabase migration
- [ ] Add `DesignFramework` type to `src/types/database.ts`
- [ ] Regenerate Supabase types if needed

### Phase 2: Sync Script
- [ ] Create `src/lib/sync/design-sync.ts`
- [ ] Define `KNOWN_DESIGN_FRAMEWORKS` array (14 frameworks)
- [ ] Implement GitHub stats fetching (stars, forks, last_commit)
- [ ] Add to `scripts/cron-sync.ts`

### Phase 3: API Routes
- [ ] Create `src/app/api/design-frameworks/route.ts` (GET)
- [ ] Create `src/app/api/design-frameworks/track-install/route.ts` (POST)

### Phase 4: Hook
- [ ] Create `src/hooks/useDesignFrameworks.ts`
- [ ] Support sort, filter params
- [ ] Return { frameworks, isLoading, error, total, refetch }

### Phase 5: Components
- [ ] Create `src/components/design/design-card.tsx`
- [ ] Create `src/components/design/design-modal.tsx`
- [ ] Create `src/components/design/design-content.tsx`
- [ ] Create `src/components/design/index.ts`

### Phase 6: Page & Navigation
- [ ] Create `src/app/design/page.tsx`
- [ ] Add "Design" link to `src/components/layout/site-header.tsx`

### Phase 7: Polish
- [ ] Add logo assets to `public/` for each framework
- [ ] Test search, sort, filter functionality
- [ ] Mobile responsive verification
- [ ] Install click tracking verification

---

## Key Files to Modify

| File | Change |
|------|--------|
| `src/types/database.ts` | Add DesignFramework type |
| `src/components/layout/site-header.tsx` | Add Design nav link |
| `scripts/cron-sync.ts` | Add design sync call |

## Pattern References

| Pattern | Reference File |
|---------|----------------|
| Page structure | `src/app/skills/page.tsx` |
| Content orchestrator | `src/components/skills/skills-content.tsx` |
| Card component | `src/components/skills/publisher-card.tsx` |
| Modal component | `src/components/skills/skill-modal.tsx` |
| Hook pattern | `src/hooks/useSkillPublishers.ts` |
| API route | `src/app/api/skill-publishers/route.ts` |
| Sync script | `src/lib/sync/publisher-sync.ts` |

---

## Verification

1. **Database**: Run `SELECT * FROM design_frameworks` after sync
2. **API**: Test `GET /api/design-frameworks?sort=stars`
3. **UI**: Navigate to `/design`, verify:
   - Hero section displays ShadCN UI
   - All 14 frameworks render in grid
   - Search filters correctly
   - Sort changes order
   - Cards show MCP/SKILL badges correctly
   - Modal opens with full details
   - Install commands copy to clipboard
4. **Tracking**: Verify install clicks increment in database
5. **Navigation**: Design link appears in header, highlights when active
