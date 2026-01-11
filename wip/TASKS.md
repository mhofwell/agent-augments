# Claude Code Plugin Marketplace - Task Breakdown

## Progress Overview

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation | Complete | 12/12 |
| Phase 2: Data Layer | Complete | 10/10 |
| Phase 3: UI Components | Not Started | 0/14 |
| Phase 4: Integration | Not Started | 0/8 |
| Phase 5: Deployment | Not Started | 0/6 |

---

## Phase 1: Foundation

**Goal**: Initialize Next.js project, set up Supabase schema, configure auth

### 1.1 Project Initialization
- [x] Create Next.js 15 project with TypeScript, Tailwind, App Router
- [x] Configure `tailwind.config.ts` for dark mode and custom colors
- [x] Update `globals.css` with dark theme base styles
- [x] Create `.env.local.example` with required variables

### 1.2 Supabase Schema
- [x] Apply migration: Create `marketplaces` table
- [x] Apply migration: Create `plugins` table with `plugin_type` enum
- [x] Apply migration: Create `bookmarks` table
- [x] Apply migration: Create `install_events` table
- [x] Apply migration: Enable RLS and create policies
- [x] Seed initial marketplace data (6 repos)

### 1.3 Supabase Client Setup
- [x] Install `@supabase/supabase-js` and `@supabase/ssr`
- [x] Create `src/lib/supabase/client.ts` (browser client)
- [x] Create `src/lib/supabase/server.ts` (server client with cookies)
- [x] Create `src/lib/supabase/admin.ts` (service role client)
- [x] Create `src/middleware.ts` (session refresh)
- [x] Create `src/types/database.ts` TypeScript types

### 1.4 Auth Setup
- [ ] Configure GitHub OAuth in Supabase dashboard (manual - user action)
- [x] Create `src/app/auth/callback/route.ts`
- [x] Create `src/hooks/useAuth.ts`

**Verification**:
- [x] `bun run build` completes without errors
- [x] Supabase tables visible in dashboard (6 marketplaces seeded)
- [x] Can query marketplaces table from app

---

## Phase 2: Data Layer

**Goal**: Build GitHub sync service and API routes

### 2.1 GitHub API Wrapper
- [x] Create `src/lib/github/api.ts` with PAT auth
- [x] Implement `fetchMarketplaceJson(owner, repo)` function
- [x] Add error handling for rate limits and 404s

### 2.2 Sync Service
- [x] Create `src/lib/sync/marketplace-sync.ts`
- [x] Implement `detectPluginType(plugin)` function
- [x] Implement `syncMarketplace(marketplace)` function
- [x] Implement `syncAllMarketplaces()` function
- [x] Add logging and error tracking

### 2.3 API Routes
- [x] Create `src/app/api/health/route.ts` (health check)
- [x] Create `src/app/api/sync/route.ts` (POST with cron auth)
- [x] Create `src/app/api/plugins/route.ts` (GET with filters)
- [x] Create `src/app/api/bookmarks/route.ts` (CRUD, auth required)
- [x] Create `src/app/api/analytics/route.ts` (POST install event)

**Verification**:
- [x] `GET /api/health` returns healthy status
- [x] `GET /api/plugins` returns plugin list (empty until sync)
- [ ] `POST /api/sync` populates plugins (requires SUPABASE_SERVICE_ROLE_KEY)

**Note**: To run sync, add `SUPABASE_SERVICE_ROLE_KEY` and `GITHUB_PAT` to `.env.local`

---

## Phase 3: UI Components

**Goal**: Build all React components for the marketplace UI

### 3.1 Shadcn Setup
- [ ] Initialize Shadcn with dark theme
- [ ] Add components: Button, Card, Dialog, Input, Select, Tabs, Badge, Skeleton

### 3.2 Type System
- [ ] Create `src/types/plugin.ts`
- [ ] Create `src/types/marketplace.ts`
- [ ] Create `src/lib/utils/colors.ts` (type color mapping)
- [ ] Create `src/lib/utils/install-commands.ts`

### 3.3 Layout Components
- [ ] Create `src/components/layout/Header.tsx` (glassmorphism)
- [ ] Create `src/components/layout/Footer.tsx` (sticky quick-start)
- [ ] Create `src/components/layout/AmbientBackground.tsx`
- [ ] Update `src/app/layout.tsx` with providers and layout

### 3.4 Plugin Components
- [ ] Create `src/components/plugins/PluginTypeChip.tsx`
- [ ] Create `src/components/plugins/PluginCard.tsx`
- [ ] Create `src/components/plugins/PluginGrid.tsx`
- [ ] Create `src/components/plugins/PluginModal.tsx`
- [ ] Create `src/components/plugins/InstallCommand.tsx`

### 3.5 Filter Components
- [ ] Create `src/components/filters/SearchInput.tsx`
- [ ] Create `src/components/filters/FilterPanel.tsx`
- [ ] Create `src/components/filters/ViewToggle.tsx`
- [ ] Create `src/components/tabs/NavigationTabs.tsx`

### 3.6 Auth Components
- [ ] Create `src/components/auth/AuthButton.tsx`
- [ ] Create `src/components/auth/AuthModal.tsx` (optional)

**Verification**:
- [ ] Components render without errors
- [ ] Type colors display correctly
- [ ] Modal opens/closes properly

---

## Phase 4: Integration

**Goal**: Connect components to API and polish UX

### 4.1 Data Fetching
- [ ] Create `src/hooks/usePlugins.ts` with SWR or fetch
- [ ] Create `src/hooks/useBookmarks.ts`
- [ ] Add loading and error states

### 4.2 Main Page
- [ ] Build `src/app/page.tsx` with all components
- [ ] Implement tab switching (Discover, Featured, New, Bookmarks)
- [ ] Implement search with debounce
- [ ] Implement filter state management
- [ ] Implement bookmark toggle (with auth check)

### 4.3 Polish
- [ ] Add loading skeletons
- [ ] Add empty states
- [ ] Add error boundaries
- [ ] Mobile responsive testing
- [ ] Animation polish

**Verification**:
- [ ] Full flow works: search, filter, view details, bookmark
- [ ] Auth flow works: login, bookmark persists
- [ ] Mobile layout works

---

## Phase 5: Deployment

**Goal**: Deploy to Railway with cron sync

### 5.1 Railway Setup
- [ ] Create `railway.json` configuration
- [ ] Create Railway project
- [ ] Add environment variables
- [ ] Deploy initial version

### 5.2 Cron Setup
- [ ] Configure hourly sync cron job
- [ ] Test sync endpoint from Railway

### 5.3 Final Verification
- [ ] App accessible via Railway URL
- [ ] Auth works in production
- [ ] Sync runs successfully
- [ ] All features functional

---

## Current Focus

**Phase**: 3 - UI Components
**Task**: Shadcn Setup

---

## Notes

- Update this file after completing each task
- Run `bun run dev` and `bun run build` after each phase
- Commit working code at end of each phase
