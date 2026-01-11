# Claude Code Plugin Marketplace

Web UI for browsing Claude Code plugins from multiple GitHub marketplaces.

## Stack
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4 + Shadcn UI (new-york, dark theme)
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Railway
- **Package Manager**: Bun

## Current Status
Phase 4 complete (Integration). Ready for Phase 5 (Deployment).

Read `wip/STATUS.md` for detailed status and next steps.

## Quick Start
```bash
bun install
bun run dev
```

## Key Directories
- `src/app/` - Next.js pages and API routes
- `src/components/` - React components (layout, plugin, filters, auth, home)
- `src/hooks/` - Data fetching hooks (usePlugins, useMarketplaces, useBookmarks, useUrlFilters)
- `src/lib/` - Utilities (supabase clients, github api, sync service)
- `wip/` - Work in progress docs and status

## Supabase
- Project ID: `yafmezgaogzlwujhqxev`
- Tables: `marketplaces`, `plugins`, `bookmarks`, `install_events`

## Design
- Dark mode only (oklch color system)
- Plugin type colors: skill=cyan, agent=violet, command=emerald, bundle=amber, hook=rose
- Glassmorphism header, ambient gradient background
