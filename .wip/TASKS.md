# Frameworks Feature - Task Breakdown

## Progress Overview

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Database | Complete | 4/4 |
| Phase 2: Types | Complete | 2/2 |
| Phase 3: Hook | Complete | 2/2 |
| Phase 4: Components | Complete | 4/4 |
| Phase 5: Integration | Complete | 4/4 |
| Phase 6: Verification | Complete | 3/3 |

---

## Phase 1: Database

**Goal**: Create frameworks and plugin_frameworks tables in Supabase

### 1.1 Create frameworks table
- [ ] Apply migration via Supabase MCP: `mcp__supabase__apply_migration`
- [ ] Create `frameworks` table with all columns (slug, name, description, install_command, install_tool, prerequisites, homepage, github_url, color, is_active, sort_order)
- [ ] Add indexes on slug and is_active

### 1.2 Create plugin_frameworks join table
- [ ] Create `plugin_frameworks` table with plugin_id and framework_id foreign keys
- [ ] Add unique constraint on (plugin_id, framework_id)

### 1.3 Enable RLS
- [ ] Enable RLS on frameworks table
- [ ] Enable RLS on plugin_frameworks table
- [ ] Create public read policies for both tables

### 1.4 Seed framework data
- [ ] Insert BMAD (npx bmad-method@alpha install)
- [ ] Insert GSD (npx get-shit-done-cc)
- [ ] Insert Specify (uv tool install specify-cli)
- [ ] Insert MoAI (curl install script)

**Verification**: `mcp__supabase__list_tables` shows both new tables

---

## Phase 2: Types

**Goal**: Add TypeScript types for new tables

### 2.1 Update database.ts
- [ ] Add `frameworks` table type to Database interface (Row, Insert, Update)
- [ ] Add `plugin_frameworks` table type to Database interface
- [ ] Add `Framework` type alias export
- [ ] Add `PluginFramework` type alias export

### 2.2 Generate types (optional)
- [ ] Run `mcp__supabase__generate_typescript_types` to verify types match schema

**Verification**: `bun run build` passes with no type errors

---

## Phase 3: Hook

**Goal**: Create useFrameworks hook for data fetching

### 3.1 Create useFrameworks.ts
- [ ] Create `src/hooks/useFrameworks.ts`
- [ ] Implement fetch from supabase with is_active filter
- [ ] Return { frameworks, isLoading, error } pattern
- [ ] Order by sort_order ascending

### 3.2 Export hook
- [ ] Add export to `src/hooks/index.ts`

**Verification**: Hook can be imported and returns data

---

## Phase 4: Components

**Goal**: Build framework UI components

### 4.1 Create framework-card.tsx
- [ ] Create `src/components/framework/framework-card.tsx`
- [ ] Display name, description (2 lines), prerequisites badges
- [ ] Add install command code block with copy button
- [ ] Add left border with framework color
- [ ] Add tool badge (npx/uv/curl) with distinct colors
- [ ] Add external link button for homepage

### 4.2 Create framework-grid.tsx
- [ ] Create `src/components/framework/framework-grid.tsx`
- [ ] 2-column responsive grid (sm:grid-cols-2)
- [ ] Loading skeleton state
- [ ] Empty state message
- [ ] onClick handler for card selection

### 4.3 Create framework-modal.tsx
- [ ] Create `src/components/framework/framework-modal.tsx`
- [ ] Full description display
- [ ] Prerequisites section with icons
- [ ] Install command with copy button
- [ ] Documentation link button
- [ ] GitHub repository link button

### 4.4 Create index.ts
- [ ] Create `src/components/framework/index.ts`
- [ ] Export FrameworkCard, FrameworkGrid, FrameworkModal

**Verification**: Components render in isolation without errors

---

## Phase 5: Integration

**Goal**: Wire up frameworks to main page

### 5.1 Update header.tsx
- [ ] Add "frameworks" to Tab type union
- [ ] Add { value: "frameworks", label: "Frameworks" } to tabs array
- [ ] Position between "new" and "bookmarks"

### 5.2 Update useUrlFilters.ts
- [ ] Add "frameworks" to TabOption type

### 5.3 Update home-content.tsx
- [ ] Import useFrameworks hook
- [ ] Import framework components
- [ ] Add selectedFramework state
- [ ] Add hero section for frameworks tab ("Development Frameworks")
- [ ] Add FrameworkGrid render when tab === "frameworks"
- [ ] Add FrameworkModal with open/close handlers
- [ ] Hide search/filters on frameworks tab

### 5.4 Test navigation
- [ ] Click Frameworks tab shows frameworks grid
- [ ] Click card opens modal
- [ ] Copy command works
- [ ] External links work

**Verification**: Full flow works end-to-end

---

## Phase 6: Verification

**Goal**: Ensure feature is complete and deployable

### 6.1 Build check
- [ ] `bun run build` passes
- [ ] `bun run lint` passes
- [ ] No console errors in dev

### 6.2 Functionality check
- [ ] All 4 frameworks display correctly
- [ ] Modal shows full details
- [ ] Copy button copies to clipboard
- [ ] Links open in new tabs
- [ ] Mobile responsive

### 6.3 Deploy
- [ ] Push to main branch
- [ ] Verify Railway deployment succeeds
- [ ] Test on production URL

---

## Current Focus

**Status**: COMPLETE - All phases finished

---

## Quick Reference

### Files to Create
- `src/hooks/useFrameworks.ts`
- `src/components/framework/framework-card.tsx`
- `src/components/framework/framework-grid.tsx`
- `src/components/framework/framework-modal.tsx`
- `src/components/framework/index.ts`

### Files to Modify
- `src/types/database.ts`
- `src/hooks/index.ts`
- `src/hooks/useUrlFilters.ts`
- `src/components/layout/header.tsx`
- `src/components/home/home-content.tsx`
