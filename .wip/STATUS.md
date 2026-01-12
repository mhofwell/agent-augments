# Agent Augments - Current Status

## Quick Summary

**Project**: Web UI for browsing AI coding agent augments from community marketplaces
**Stack**: Next.js 15 + Tailwind v4 + Shadcn + Supabase + Railway
**Live URL**: https://web-production-be527.up.railway.app

---

## Current Work

No active work. Ready for next feature.

---

## What's Next

- Plugin-to-framework linking (use `plugin_frameworks` junction table)
- Framework filtering/search on Frameworks tab
- Star count display on framework cards
- Auto-update star counts from GitHub

---

## Completed Milestones

### Framework Discovery

Added automated GitHub scanning for Claude Code frameworks.

**What was built**:
- `framework-sync.ts` - searches GitHub for frameworks with 200+ stars
- Auto-extracts install commands from READMEs (npx, curl, git clone)
- Added 3 new frameworks: CCPlugins, Claude Conductor, Claude Modular
- Updated cron job to weekly schedule (`0 0 * * 0` - Sundays midnight UTC)

### Frameworks Feature

Added development frameworks (BMAD, GSD, Specify, MoAI) as a new "Frameworks" tab.

**What was built**:
- `frameworks` and `plugin_frameworks` tables in Supabase with RLS
- Seeded 4 frameworks: BMAD, GSD, Specify, MoAI
- TypeScript types for Framework and PluginFramework
- `useFrameworks` hook for data fetching
- Framework components: FrameworkCard, FrameworkGrid, FrameworkModal
- Integrated "Frameworks" tab in navigation between "New" and "Bookmarks"
- Copy-to-clipboard functionality for install commands

### MVP Launch (Phases 1-5)

- **Phase 1: Foundation** - Next.js 15, Supabase schema, GitHub OAuth
- **Phase 2: Data Layer** - GitHub API sync, API routes
- **Phase 3: UI Components** - Shadcn UI, plugin cards/grid/modal
- **Phase 4: Integration** - Hooks, URL-based filtering, tabs
- **Phase 5: Deployment** - Railway, hourly cron sync

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main page
│   ├── globals.css           # Dark theme (oklch)
│   └── api/                  # health, plugins, bookmarks, analytics
├── components/
│   ├── ui/                   # Shadcn primitives
│   ├── layout/               # Header, AmbientBackground, InstallFooter
│   ├── plugin/               # PluginCard, PluginGrid, PluginModal
│   ├── framework/            # FrameworkCard, FrameworkGrid, FrameworkModal
│   ├── filters/              # SearchInput, FilterPanel, ViewToggle
│   ├── auth/                 # AuthButton
│   └── home/                 # HomeContent
├── hooks/                    # usePlugins, useMarketplaces, useBookmarks, useUrlFilters, useFrameworks
├── lib/
│   ├── supabase/             # client, server, admin
│   ├── github/api.ts
│   └── sync/
│       ├── marketplace-sync.ts
│       └── framework-sync.ts
└── types/database.ts
```

---

## Supabase

- **Project ID**: `yafmezgaogzlwujhqxev`
- **Tables**: `marketplaces`, `plugins`, `bookmarks`, `install_events`, `frameworks`, `plugin_frameworks`

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
- Framework colors: Per-framework brand colors (blue, emerald, violet, amber)
