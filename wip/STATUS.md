# Claude Code Plugin Marketplace - Current Status

## Quick Summary

**Project**: Web UI for browsing Claude Code plugins from multiple GitHub marketplaces
**Stack**: Next.js 15 + Tailwind v4 + Shadcn + Supabase + Railway
**Progress**: Phase 5 Complete (Deployed), Phase 6 Next (Polish)
**Live URL**: https://web-production-be527.up.railway.app

---

## Completed Phases

### Phase 1: Foundation
- Next.js 15 with TypeScript, Tailwind CSS v4, App Router
- Supabase schema: `marketplaces`, `plugins`, `bookmarks`, `install_events`
- RLS policies, 6 marketplaces seeded
- GitHub OAuth auth flow

### Phase 2: Data Layer
- GitHub API wrapper for fetching marketplace contents
- Marketplace sync service with plugin type detection
- API routes: `/api/health`, `/api/sync`, `/api/plugins`, `/api/bookmarks`, `/api/analytics`

### Phase 3: UI Components
- Shadcn UI (dark theme, new-york style)
- Layout: `AmbientBackground`, `Header`, `InstallFooter`
- Plugin: `PluginCard`, `PluginGrid`, `PluginModal`
- Filters: `SearchInput`, `FilterPanel`, `ViewToggle`
- Auth: `AuthButton`

### Phase 4: Integration
- Hooks: `usePlugins`, `useMarketplaces`, `useBookmarks`, `useUrlFilters`
- Main page with tabs, search, filters, grid/list toggle
- URL-based filtering (shareable links)

---

## Phase 5: Deployment (Complete)

- ✅ Railway project: `cc-plugin-marketplace`
- ✅ Web service deployed
- ✅ Domain: https://web-production-be527.up.railway.app
- ✅ Environment variables configured
- ✅ Hourly cron job for marketplace sync (use `bun run cron:sync` or `node scripts/cron-sync.mjs`)

---

## Phase 6: Polish (Next)

1. Add production redirect URL to Supabase OAuth settings
2. Trigger initial marketplace sync
3. Test all features in production
4. Monitor logs for any issues

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main page (renders HomeContent)
│   ├── globals.css           # Dark theme CSS (oklch colors)
│   ├── layout.tsx            # Root layout
│   └── api/
│       ├── health/route.ts
│       ├── sync/route.ts
│       ├── plugins/route.ts
│       ├── bookmarks/route.ts
│       └── analytics/route.ts
├── components/
│   ├── ui/                   # Shadcn (button, input, dialog, etc.)
│   ├── layout/               # AmbientBackground, Header, InstallFooter
│   ├── plugin/               # PluginCard, PluginGrid, PluginModal
│   ├── filters/              # SearchInput, FilterPanel, ViewToggle
│   ├── auth/                 # AuthButton
│   └── home/                 # HomeContent
├── hooks/
│   ├── useAuth.ts
│   ├── usePlugins.ts
│   ├── useMarketplaces.ts
│   ├── useBookmarks.ts
│   └── useUrlFilters.ts
├── lib/
│   ├── supabase/             # client.ts, server.ts, admin.ts
│   ├── github/api.ts
│   ├── sync/marketplace-sync.ts
│   └── utils.ts
└── types/database.ts
```

---

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://yafmezgaogzlwujhqxev.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key: sb_publishable_...>
SUPABASE_SECRET_KEY=<secret key: sb_secret_...>
GITHUB_PAT=<github personal access token>
CRON_SECRET=dev-cron-secret-change-in-production
```

Note: Supabase now uses publishable keys (client-side) and secret keys (server-side).
The legacy anon/service_role JWT keys are deprecated.

---

## Supabase

- **Project**: agent-skills-marketplace
- **ID**: yafmezgaogzlwujhqxev
- **URL**: https://yafmezgaogzlwujhqxev.supabase.co

---

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Start dev server (localhost:3000)
bun run build        # Build for production
bun run lint         # Run ESLint
bun run cron:sync    # Trigger marketplace sync (uses CRON_SECRET env var)
```

### Railway Cron Configuration
In Railway dashboard, set the cron service command to:
```
node scripts/cron-sync.mjs
```
Or if using bun:
```
bun run cron:sync
```
Schedule: `0 * * * *` (hourly)

---

## Plugin Type Colors

| Type    | Color   | CSS Variable        |
|---------|---------|---------------------|
| Skill   | Cyan    | `--color-type-skill`   |
| Agent   | Violet  | `--color-type-agent`   |
| Command | Emerald | `--color-type-command` |
| Bundle  | Amber   | `--color-type-bundle`  |
| Hook    | Rose    | `--color-type-hook`    |

---

## URL Parameters

```
/?q=search           # Search query
/?type=skill         # Plugin type
/?category=Dev       # Category
/?marketplace=uuid   # Marketplace filter
/?sort=downloads     # Sort: downloads|updated|name
/?tab=featured       # Tab: discover|featured|new|bookmarks
/?view=list          # View: grid|list
```
