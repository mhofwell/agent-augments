# Agent Augments - Current Status

## Quick Summary

**Project**: Web UI for browsing AI coding agent augments from community marketplaces
**Stack**: Next.js 15 + Tailwind v4 + Shadcn + Supabase + Railway
**Live URL**: https://web-production-be527.up.railway.app

---

## Current Work

**Phase 6: UX Redesign** - Complete

Implementing the UX audit plan from `.wip/UX_AUDIT_PLAN.md`.

**Completed:**
- Phase 1: Rebranding & Navigation
- Phase 2: Framework "Works with" Badges
- Phase 3: Plugin Card & Install UX
- Phase 4: Search & Filter Polish
- Phase 5: Multi-Agent Architecture Prep

**Next:**
- User profiles / public bookmark lists
- Plugin install analytics dashboard

---

## What's Next

- User profiles / public bookmark lists
- Plugin install analytics dashboard
- Add support for Cursor, Windsurf, and Codex plugins
- VS Code extension for browsing/installing augments

---

## Completed Milestones

### UX Redesign - Phase 5: Multi-Agent Architecture Prep

Prepared the architecture for supporting multiple AI coding agents (Claude Code, Cursor, Windsurf, Codex).

**What was built:**
- Added `agent` column to plugins table (default: 'claude-code')
- Added agent filter to plugins API route
- Added `AgentId` type and `agent` parameter to usePlugins hook
- Added `agent` URL parameter to useUrlFilters hook
- Created agent selector dropdown in the plugins filter area
- Other agents (Cursor, Windsurf, Codex) appear disabled until supported

**Files changed:**
- Migration: Added `agent` column to plugins table
- `src/types/database.ts` - Added agent field to Plugin types
- `src/app/api/plugins/route.ts` - Added agent filter parameter
- `src/hooks/usePlugins.ts` - Added AgentId type and agent parameter
- `src/hooks/useUrlFilters.ts` - Added agent URL parameter support
- `src/components/home/home-content.tsx` - Added agent selector dropdown

### UX Redesign - Phase 4: Search & Filter Polish

Added unified search with command palette-style experience.

**What was built:**
- Unified search in header searches both plugins and frameworks
- Grouped results: Frameworks section + Plugins section with type badges
- Keyboard navigation: ↑↓ to navigate, Enter to select, Esc to close
- Recent searches stored in localStorage (up to 5)
- Keyboard hints shown in dropdown
- URL filter states already working via useUrlFilters hook

**Files changed:**
- `src/components/search/unified-search.tsx` - New unified search component
- `src/components/search/index.ts` - Export for search component
- `src/components/layout/header.tsx` - Integrated unified search

### UX Redesign - Phase 3: Plugin Card & Install UX

Redesigned plugin cards with improved UX and comprehensive install experience.

**What was built:**
- Plugin cards now have type badge in top-left (primary identifier)
- Agent badge (Claude) shown in top-right on cards and modal
- Install command with copy button directly on each card
- Toast notifications when copying commands (sonner)
- Scope options in modal: User (recommended), Project, Local
- "First time?" expandable help guide with step-by-step instructions
- Collapsible component for help section

**Files changed:**
- `src/app/layout.tsx` - Added Toaster component
- `src/components/ui/sonner.tsx` - New toast component
- `src/components/ui/collapsible.tsx` - New collapsible component
- `src/components/plugin/plugin-card.tsx` - Redesigned with type badge top-left, agent badge, install command
- `src/components/plugin/plugin-modal.tsx` - Added scope options, help guide, toast notifications

### UX Redesign - Phase 1 & 2

Major navigation and branding overhaul based on UX audit.

**Phase 1: Rebranding & Navigation**
- Rebranded: "Plugin Hub for Claude Code" → "Agent Augments"
- Restructured nav: Primary tabs are now `Plugins | Frameworks`
- Removed: Discover, Featured, New from nav (merged into sort options)
- Sort options: Popular, New (7 days), Recently Updated, Name A-Z
- Moved Bookmarks to icon with badge in header
- Added plugin type quick filters below search (All, Skills, Agents, Commands, Hooks, Bundles)

**Phase 2: Framework "Works with" Badges**
- Created `src/lib/agents.ts` - Agent configuration (Claude Code, Cursor, Windsurf, Codex)
- Framework cards now show "Works with: Claude · Cursor · Windsurf · Codex"
- Framework modal has styled "Works With" section with colored badges
- Architecture ready for per-framework agent compatibility in the future

**Files changed:**
- `src/hooks/usePlugins.ts` - New TabOption and SortOption types
- `src/hooks/useUrlFilters.ts` - Updated defaults
- `src/app/api/plugins/route.ts` - Sort-based filtering (removed tab logic)
- `src/components/layout/header.tsx` - Rebranded, new nav structure
- `src/components/filters/filter-panel.tsx` - New sort options
- `src/components/filters/type-quick-filter.tsx` - New component
- `src/components/home/home-content.tsx` - Updated for new tabs
- `src/components/framework/framework-card.tsx` - Added "Works with" row
- `src/components/framework/framework-modal.tsx` - Added "Works With" section
- `src/lib/agents.ts` - New agent configuration

### Framework Filtering/Search

Added search and tool filtering to the Frameworks tab.

**What was built**:
- Search input on Frameworks tab filters by name/description
- Tool dropdown filters by install method (npx, bash, curl, etc.)
- Dynamic stats show filtered count vs total
- Empty state messages update based on active filters

### Plugin-to-Framework Linking

Connected plugins to frameworks with bidirectional navigation and filtering.

**What was built**:
- `usePluginFrameworks` hook for fetching plugin/framework relationships
- Auto-detection during sync: scans plugin names/descriptions for framework mentions
- PluginModal: "Works with" section showing linked frameworks (clickable)
- FrameworkModal: "Compatible Plugins" section showing linked plugins (clickable)
- Framework filter in FilterPanel: filter plugins by compatible framework
- API route updated to support framework filtering via `plugin_frameworks` table

### Framework Bookmarks & Stars

Added ability to favorite frameworks and display GitHub star counts.

**What was built**:
- `framework_bookmarks` table with RLS policies
- `/api/framework-bookmarks` API route (GET/POST/DELETE)
- `useFrameworkBookmarks` hook
- Star counts on framework cards and modal (e.g., "29.3k")
- Bookmark button on cards (shows on hover) and modal ("Save" button)
- Framework sync now stores and updates star counts weekly
- Tool color badges: npx=emerald, npm=red, bun=orange, bash=cyan, curl=amber

### Framework Discovery

Added automated GitHub scanning for Claude Code frameworks.

**What was built**:
- `framework-sync.ts` - searches GitHub for frameworks with 200+ stars
- Auto-extracts install commands from READMEs (npx, curl, git clone)
- Added 3 new frameworks: CCPlugins (2.6k★), Claude Conductor (273★), Claude Modular (268★)
- Updated cron job to weekly schedule (`0 0 * * 0` - Sundays midnight UTC)

### Frameworks Feature

Added development frameworks as a new "Frameworks" tab.

**What was built**:
- `frameworks` and `plugin_frameworks` tables in Supabase with RLS
- Seeded frameworks: BMAD (29.3k★), GSD, Specify, MoAI
- TypeScript types for Framework, PluginFramework, FrameworkBookmark
- `useFrameworks` hook for data fetching
- Framework components: FrameworkCard, FrameworkGrid, FrameworkModal
- Copy-to-clipboard functionality for install commands

### MVP Launch (Phases 1-5)

- **Phase 1: Foundation** - Next.js 15, Supabase schema, GitHub OAuth
- **Phase 2: Data Layer** - GitHub API sync, API routes
- **Phase 3: UI Components** - Shadcn UI, plugin cards/grid/modal
- **Phase 4: Integration** - Hooks, URL-based filtering, tabs
- **Phase 5: Deployment** - Railway, weekly cron sync

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main page
│   ├── globals.css           # Dark theme (oklch)
│   └── api/                  # health, plugins, bookmarks, framework-bookmarks, analytics
├── components/
│   ├── ui/                   # Shadcn primitives
│   ├── layout/               # Header, AmbientBackground, InstallFooter
│   ├── plugin/               # PluginCard, PluginGrid, PluginModal, plugin-utils
│   ├── framework/            # FrameworkCard, FrameworkGrid, FrameworkModal, framework-utils
│   ├── filters/              # SearchInput, FilterPanel, ViewToggle, TypeQuickFilter
│   ├── auth/                 # AuthButton
│   └── home/                 # HomeContent
├── hooks/                    # usePlugins, useMarketplaces, useBookmarks, useFrameworkBookmarks, useUrlFilters, useFrameworks, usePluginFrameworks
├── lib/
│   ├── supabase/             # client, server, admin
│   ├── github/api.ts
│   ├── agents.ts             # AI coding agent configuration
│   └── sync/
│       ├── marketplace-sync.ts
│       └── framework-sync.ts
└── types/database.ts
```

---

## Supabase

- **Project ID**: `yafmezgaogzlwujhqxev`
- **Tables**: `marketplaces`, `plugins`, `bookmarks`, `install_events`, `frameworks`, `plugin_frameworks`, `framework_bookmarks`

---

## Commands

```bash
bun install        # Install deps
bun dev            # Dev server :3000
bun run build      # Build (verify before PR)
bun run lint       # Lint (verify before PR)
bun run cron:sync  # Sync marketplaces + discover frameworks (weekly on Railway)
```

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://yafmezgaogzlwujhqxev.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
SUPABASE_SECRET_KEY=<secret key>
GITHUB_PAT=<github personal access token>
```

---

## Design System

- Dark mode only (oklch color system)
- Plugin type colors: skill=cyan, agent=violet, command=emerald, bundle=amber, hook=rose
- Framework tool colors: npx=emerald, npm=red, bun=orange, bash=cyan, curl=amber, uv=violet
- Framework brand colors: Per-framework custom colors
- Agent colors: Claude Code=amber, Cursor=violet, Windsurf=cyan, Codex=emerald
