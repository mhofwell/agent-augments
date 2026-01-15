# Add Frameworks Feature

Add development frameworks (BMAD, GSD, Specify, MoAI) as a separate top-level section with install commands and plugin-framework tagging.

## Summary

- **New "Frameworks" tab** in navigation (between New and Bookmarks)
- **New `frameworks` table** in Supabase (separate from plugins)
- **Install command display** with copy button (no automation)
- **Plugin-framework relationships** via join table for filtering

---

## Database Schema

### frameworks table

```sql
CREATE TABLE frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  install_command TEXT NOT NULL,
  install_tool TEXT,                    -- 'npx', 'uv', 'curl'
  prerequisites TEXT[],                 -- ['Node.js 20+']
  homepage TEXT,
  github_url TEXT,
  color TEXT,                           -- Brand color (hex)
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE plugin_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plugin_id UUID REFERENCES plugins(id) ON DELETE CASCADE,
  framework_id UUID REFERENCES frameworks(id) ON DELETE CASCADE,
  UNIQUE(plugin_id, framework_id)
);

-- RLS policies (public read)
ALTER TABLE frameworks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON frameworks FOR SELECT USING (true);
ALTER TABLE plugin_frameworks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON plugin_frameworks FOR SELECT USING (true);
```

### Seed Data

| Slug | Name | Install Command | Tool | Prerequisites | Color |
|------|------|-----------------|------|---------------|-------|
| bmad | BMAD Method | `npx bmad-method@alpha install` | npx | Node.js 20+ | #3b82f6 |
| gsd | GSD | `npx get-shit-done-cc` | npx | Node.js 18+ | #10b981 |
| specify | Specify | `uv tool install specify-cli` | uv | Python 3.11+, uv | #8b5cf6 |
| moai | MoAI | `curl -LsSf https://modu-ai.github.io/moai-adk/install.sh \| sh` | curl | Unix shell | #f59e0b |

---

## TypeScript Types

**File: `src/types/database.ts`**

Add to Tables interface:
- `frameworks` table type (Row, Insert, Update)
- `plugin_frameworks` table type
- Export `Framework` and `PluginFramework` type aliases

---

## Hook

**File: `src/hooks/useFrameworks.ts`** (new)

```typescript
export function useFrameworks() {
  // Fetch from supabase.from("frameworks").select("*").eq("is_active", true)
  // Return { frameworks, isLoading, error }
}
```

---

## Components

**Directory: `src/components/framework/`** (new)

| Component | Purpose |
|-----------|---------|
| `framework-card.tsx` | Card with name, description, prerequisites, copy command button |
| `framework-grid.tsx` | 2-column grid of framework cards |
| `framework-modal.tsx` | Expanded detail view with full description, links, command |
| `index.ts` | Barrel exports |

**Design:**
- Left border color from `framework.color`
- Tool badge (npx/uv/curl) with distinct colors
- Prerequisites as outline badges
- Monospace code block for install command
- Copy button with check animation

---

## Navigation & Page Integration

**File: `src/components/layout/header.tsx`**

```typescript
type Tab = "discover" | "featured" | "new" | "frameworks" | "bookmarks";

const tabs = [
  { value: "discover", label: "Discover" },
  { value: "featured", label: "Featured" },
  { value: "new", label: "New" },
  { value: "frameworks", label: "Frameworks" },  // NEW
  { value: "bookmarks", label: "Bookmarks" },
];
```

**File: `src/components/home/home-content.tsx`**

- Import `useFrameworks` and framework components
- State for `selectedFramework`
- Conditional render for `tab === "frameworks"`
- Hide search/filters when on frameworks tab

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/database.ts` | Add Framework, PluginFramework types |
| `src/hooks/useFrameworks.ts` | New file |
| `src/hooks/index.ts` | Export useFrameworks |
| `src/hooks/useUrlFilters.ts` | Add "frameworks" to TabOption |
| `src/components/framework/*` | New directory (4 files) |
| `src/components/layout/header.tsx` | Add frameworks tab |
| `src/components/home/home-content.tsx` | Add frameworks tab content |

---

## Verification

1. **Database**: Run migration via Supabase dashboard or MCP
2. **Dev server**: `bun dev` - navigate to Frameworks tab
3. **Functionality**:
   - All 4 frameworks display in grid
   - Click opens modal with full details
   - Copy button copies command to clipboard
   - Links open in new tab
4. **Build**: `bun run build` passes
5. **Lint**: `bun run lint` passes

---

## Out of Scope (Future)

- Admin UI for managing frameworks
- Plugin-framework filtering in discover tab
- Framework-specific plugin collections
- Sync frameworks from external source
