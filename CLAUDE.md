# Agent Augments

Web UI for browsing AI coding agent augments from community marketplaces.

## Stack
Next.js 15 (App Router) · Tailwind v4 · Shadcn (new-york) · Supabase · Railway · Bun

## Commands
```bash
bun install        # Install deps
bun dev            # Dev server :3000
bun run build      # Build (verify before PR)
bun run lint       # Lint (verify before PR)
bun run cron:sync  # Sync marketplaces + discover frameworks (weekly)
```

## Status
Phase 5 complete (deployed). See `.wip/STATUS.md` for details and next steps.

## Supabase
- Project ID: `yafmezgaogzlwujhqxev`
- Tables: `marketplaces`, `plugins`, `bookmarks`, `install_events`, `frameworks`, `plugin_frameworks`
- Use `createClient()` from `@/lib/supabase/client` (browser) or `@/lib/supabase/server` (RSC/routes)

## Patterns
- Follow component patterns in `src/components/plugin/plugin-card.tsx`
- Hooks return `{ data, loading, error }` - see `src/hooks/usePlugins.ts`
- API routes use `createClient` from server, return `NextResponse.json()`

## Design Rules
- Dark mode only (oklch color system in `globals.css`)
- Plugin type colors are semantic - don't change: skill=cyan, agent=violet, command=emerald, bundle=amber, hook=rose
- Use existing Shadcn components from `src/components/ui/` before adding new ones
