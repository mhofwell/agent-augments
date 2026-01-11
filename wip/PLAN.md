# Claude Code Plugin Marketplace - Implementation Plan

## Overview
A centralized web UI for browsing, searching, and installing Claude Code plugins from multiple GitHub-hosted marketplaces.

**Stack**: Next.js 15 (App Router) + Supabase + Railway
**Supabase Project**: `agent-skills-marketplace` (already exists)

---

## MVP Scope

| Included | Excluded (Future) |
|----------|-------------------|
| Browse/search/filter plugins | Plugin submissions |
| Plugin detail modal + install commands | Ratings/reviews |
| Auth for bookmarks only (anon can browse) | Advanced analytics |
| Hourly data sync from GitHub | Multiple themes |
| Dark-mode responsive UI | |

---

## Architecture

```
Railway (Next.js)
├── App Router (SSR/RSC)
├── API Routes (/api/plugins, /api/bookmarks, /api/sync)
└── Cron (hourly sync)
        │
        ▼
Supabase (Postgres + Auth)
├── marketplaces (seed list)
├── plugins (cached from GitHub)
├── bookmarks (user-specific, requires auth)
└── install_events (analytics)
        │
        ▼
GitHub API (with PAT for 5000 req/hr)
├── anthropics/claude-code
├── ananddtyagi/cc-marketplace
├── obra/superpowers-marketplace
├── feed-mob/claude-code-marketplace
├── claudebase/marketplace
└── EveryInc/every-marketplace
```

---

## Project Structure

```
cc-plugin-marketplace/
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout + providers
│   │   ├── page.tsx             # Home (plugin grid)
│   │   ├── globals.css          # Tailwind + dark mode
│   │   └── api/
│   │       ├── plugins/route.ts # GET with filters
│   │       ├── bookmarks/route.ts # CRUD (auth required)
│   │       └── sync/route.ts    # POST (cron endpoint)
│   ├── components/
│   │   ├── layout/              # Header, Footer, Sidebar
│   │   ├── plugins/             # PluginCard, PluginGrid, PluginModal
│   │   ├── filters/             # SearchInput, FilterPanel, ViewToggle
│   │   └── auth/                # AuthButton, AuthModal
│   ├── lib/
│   │   ├── supabase/            # client.ts, server.ts, admin.ts
│   │   ├── github/api.ts        # GitHub API wrapper
│   │   └── sync/marketplace-sync.ts # Core sync logic
│   ├── hooks/                   # usePlugins, useBookmarks, useAuth
│   └── types/                   # TypeScript definitions
├── supabase/migrations/         # SQL migrations
├── railway.json
└── .env.local.example
```

---

## Database Schema

### marketplaces
```sql
create table public.marketplaces (
  id uuid primary key default gen_random_uuid(),
  github_owner text not null,
  github_repo text not null,
  name text,
  description text,
  owner_name text,
  owner_email text,
  owner_url text,
  is_active boolean default true,
  last_synced_at timestamptz,
  sync_error text,
  plugin_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint unique_github_repo unique (github_owner, github_repo)
);

create index idx_marketplaces_active on public.marketplaces (is_active) where is_active = true;
create index idx_marketplaces_github on public.marketplaces (github_owner, github_repo);
```

### plugins
```sql
create type public.plugin_type as enum ('skill', 'agent', 'command', 'bundle', 'hook', 'unknown');

create table public.plugins (
  id uuid primary key default gen_random_uuid(),
  marketplace_id uuid not null references public.marketplaces(id) on delete cascade,

  -- Core fields from marketplace.json
  name text not null,
  description text,
  version text,
  source text,
  category text,

  -- Author info
  author_name text,
  author_email text,
  author_url text,

  -- Computed/derived fields
  plugin_type plugin_type default 'unknown',
  tags text[] default '{}',
  homepage text,

  -- Plugin content indicators
  has_skills boolean default false,
  has_agents boolean default false,
  has_commands boolean default false,
  has_hooks boolean default false,
  has_mcp_servers boolean default false,

  -- Stats
  install_count integer default 0,

  -- Timestamps
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint unique_plugin_per_marketplace unique (marketplace_id, name)
);

create index idx_plugins_marketplace on public.plugins (marketplace_id);
create index idx_plugins_type on public.plugins (plugin_type);
create index idx_plugins_category on public.plugins (category);
create index idx_plugins_name_search on public.plugins using gin (to_tsvector('english', name || ' ' || coalesce(description, '')));
create index idx_plugins_created on public.plugins (created_at desc);
create index idx_plugins_tags on public.plugins using gin (tags);
```

### bookmarks
```sql
create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plugin_id uuid not null references public.plugins(id) on delete cascade,
  created_at timestamptz default now(),

  constraint unique_user_plugin_bookmark unique (user_id, plugin_id)
);

create index idx_bookmarks_user on public.bookmarks (user_id);
create index idx_bookmarks_plugin on public.bookmarks (plugin_id);
```

### install_events (analytics)
```sql
create table public.install_events (
  id uuid primary key default gen_random_uuid(),
  plugin_id uuid not null references public.plugins(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  command_type text not null,
  created_at timestamptz default now()
);

create index idx_install_events_plugin on public.install_events (plugin_id);
create index idx_install_events_created on public.install_events (created_at desc);
```

### RLS Policies
```sql
-- Enable RLS
alter table public.marketplaces enable row level security;
alter table public.plugins enable row level security;
alter table public.bookmarks enable row level security;
alter table public.install_events enable row level security;

-- Marketplaces: Public read
create policy "Marketplaces are viewable by everyone"
  on public.marketplaces for select
  to anon, authenticated
  using (is_active = true);

-- Plugins: Public read
create policy "Plugins are viewable by everyone"
  on public.plugins for select
  to anon, authenticated
  using (true);

-- Bookmarks: Users can only see/manage their own
create policy "Users can view own bookmarks"
  on public.bookmarks for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create own bookmarks"
  on public.bookmarks for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own bookmarks"
  on public.bookmarks for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- Install events: Anyone can insert
create policy "Anyone can log install events"
  on public.install_events for insert
  to anon, authenticated
  with check (true);
```

### Seed Data
```sql
insert into public.marketplaces (github_owner, github_repo, name, is_active) values
  ('anthropics', 'claude-code', 'Anthropic Official', true),
  ('ananddtyagi', 'cc-marketplace', 'CC Marketplace', true),
  ('feed-mob', 'claude-code-marketplace', 'FeedMob', true),
  ('obra', 'superpowers-marketplace', 'Superpowers', true),
  ('claudebase', 'marketplace', 'Claudebase', true),
  ('EveryInc', 'every-marketplace', 'Every Inc', true);
```

---

## Key API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/plugins` | GET | No | List/search plugins with filters |
| `/api/plugins/[id]` | GET | No | Plugin details |
| `/api/bookmarks` | GET/POST/DELETE | Yes | User bookmarks |
| `/api/sync` | POST | Cron secret | Trigger marketplace sync |
| `/api/analytics` | POST | No | Track install copies |

### GET /api/plugins Query Parameters
- `search`: text search
- `type`: skill | agent | command | bundle | hook
- `category`: development | productivity | security | etc.
- `marketplace`: marketplace_id
- `sort`: newest | name | installs
- `tab`: discover | featured | new
- `page`, `limit`: pagination

---

## UI Components

### Design System
- **Dark mode first** with zinc/slate palette
- **Type colors**: cyan=skills, violet=agents, emerald=commands, amber=bundles, rose=hooks
- **Glassmorphism** header with backdrop blur
- **Shadcn UI** primitives (Button, Card, Dialog, Input, Select, Tabs, Badge)

### Component Hierarchy
```
App Layout
├── Header (glassmorphism)
│   ├── Logo
│   ├── SearchInput
│   ├── ViewToggle (grid/list)
│   └── AuthButton
├── NavigationTabs
│   └── [Discover, Featured, New, Bookmarks*]
├── Main Content
│   ├── FilterPanel (sidebar/drawer)
│   │   ├── CategorySelect
│   │   ├── TypeSelect
│   │   ├── MarketplaceSelect
│   │   └── SortSelect
│   └── PluginGrid
│       └── PluginCard[]
│           ├── TypeChip
│           ├── Stats
│           └── BookmarkButton
├── PluginModal (dialog)
│   ├── Header (name, type, author)
│   ├── Description
│   ├── InstallCommand (marketplace add)
│   ├── InstallCommand (plugin install)
│   └── Actions (GitHub link, bookmark)
└── Footer (sticky)
    └── Quick-start command
```

### Type Color Mapping
```typescript
const typeColors = {
  skill: { bg: 'bg-cyan-500/20', border: 'border-cyan-500/50', text: 'text-cyan-400' },
  agent: { bg: 'bg-violet-500/20', border: 'border-violet-500/50', text: 'text-violet-400' },
  command: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400' },
  bundle: { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400' },
  hook: { bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-400' },
  unknown: { bg: 'bg-gray-500/20', border: 'border-gray-500/50', text: 'text-gray-400' },
};
```

---

## Data Sync Service

### Sync Flow
```
Railway Cron (hourly)
        │
        ▼
POST /api/sync (with CRON_SECRET)
        │
        ▼
For each active marketplace:
  1. Fetch .claude-plugin/marketplace.json from GitHub API
  2. Parse plugins array
  3. Detect plugin type from content (skills, agents, commands, etc.)
  4. Upsert plugins to Supabase
  5. Update marketplace.last_synced_at and plugin_count
```

### Plugin Type Detection
```typescript
function detectPluginType(plugin: RawPlugin): PluginType {
  if (plugin.skills?.length) return 'skill';
  if (plugin.agents?.length) return 'agent';
  if (plugin.commands?.length) return 'command';
  if (plugin.hooks?.length) return 'hook';

  const desc = (plugin.description || '').toLowerCase();
  if (desc.includes('skill')) return 'skill';
  if (desc.includes('agent')) return 'agent';
  if (desc.includes('command')) return 'command';
  if (desc.includes('bundle') || desc.includes('kit')) return 'bundle';

  return 'unknown';
}
```

---

## Implementation Phases

### Phase 1: Foundation
1. Initialize Next.js project with TypeScript, Tailwind, App Router
2. Install Shadcn UI components
3. Run Supabase migrations (apply schema above)
4. Seed marketplace data
5. Set up Supabase clients (browser, server, admin)
6. Implement auth flow (GitHub OAuth)

### Phase 2: Data Layer
7. Build GitHub API wrapper with PAT
8. Implement marketplace sync service
9. Create /api/sync endpoint with cron auth
10. Build /api/plugins with filtering/pagination
11. Build /api/bookmarks CRUD
12. Trigger initial sync to populate data

### Phase 3: UI Components
13. Layout components (Header, Footer)
14. Plugin components (Card, Grid, Modal)
15. Filter components (Search, Filters, Tabs)
16. Auth components (Button, Modal)
17. Install command with copy-to-clipboard

### Phase 4: Integration
18. Wire up data fetching hooks (usePlugins, useBookmarks)
19. Connect components to API
20. Implement tab filtering (featured = high install count, new = recent)
21. Polish animations and mobile responsiveness

### Phase 5: Deployment
22. Configure Railway project
23. Add environment variables
24. Set up hourly cron sync
25. Test all flows
26. Launch

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# GitHub
GITHUB_PAT=

# Cron
CRON_SECRET=

# App
NEXT_PUBLIC_APP_URL=
```

---

## Railway Configuration

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 300
  }
}
```

### Cron Setup
Configure in Railway dashboard:
- Schedule: `0 * * * *` (hourly)
- Command: `curl -X POST -H "Authorization: Bearer $CRON_SECRET" $RAILWAY_PUBLIC_DOMAIN/api/sync`

---

## Verification Plan

1. **Database**: Run `mcp__supabase__list_tables` to verify schema applied
2. **Sync**: Trigger `/api/sync` and verify plugins table populated
3. **API**: Test `GET /api/plugins?type=skill&category=development`
4. **Auth**: Login with GitHub, verify session persists
5. **Bookmarks**: Add/remove bookmark, verify in database
6. **UI**: Manual testing of all flows on desktop/mobile
7. **Deploy**: Verify Railway deployment health check passes
8. **Cron**: Check sync runs successfully after 1 hour

---

## Files to Create (Priority Order)

1. Project scaffold: `package.json`, `next.config.ts`, `tailwind.config.ts`
2. Supabase migrations: `supabase/migrations/001_schema.sql`
3. Supabase clients: `src/lib/supabase/{client,server,admin}.ts`
4. Types: `src/types/{plugin,marketplace,database}.ts`
5. Sync service: `src/lib/sync/marketplace-sync.ts`
6. GitHub wrapper: `src/lib/github/api.ts`
7. API routes: `src/app/api/{plugins,bookmarks,sync}/route.ts`
8. UI components: `src/components/**/*.tsx`
9. Main page: `src/app/page.tsx`
10. Deployment: `railway.json`, `.env.local.example`
