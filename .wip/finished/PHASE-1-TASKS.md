# Phase 1: Data Model - Task List

**Reference:** [PHASE-1-DATA-MODEL.md](./PHASE-1-DATA-MODEL.md)

**Status:** ✅ COMPLETE (2026-01-17)

---

## Pre-Implementation

- [x] Verify Supabase project access (project ID: `yafmezgaogzlwujhqxev`)
- [x] Check current migration list to avoid naming conflicts
- [x] Backup: Note current `frameworks` table row count for verification (17 rows)

---

## Migration 1: Add Workflow Metadata to Frameworks

### Execute
- [ ] Apply migration `add_workflow_metadata_to_frameworks` via Supabase MCP

### Verify
- [ ] Confirm 4 new columns exist: `skills_count`, `mcps_count`, `methodology`, `autonomy_level`
- [ ] Confirm `skills_count` default is 0
- [ ] Confirm `mcps_count` default is 0
- [ ] Confirm `methodology` allows NULL
- [ ] Confirm `autonomy_level` allows NULL
- [ ] Confirm `methodology_check` constraint exists
- [ ] Confirm `autonomy_level_check` constraint exists

### Edge Cases
- [ ] Test: Insert framework with `methodology = 'spec-driven'` → should succeed
- [ ] Test: Insert framework with `methodology = 'invalid'` → should fail (constraint violation)
- [ ] Test: Insert framework with `autonomy_level = 'HIGH'` → should succeed
- [ ] Test: Insert framework with `autonomy_level = 'MEDIUM'` → should fail (must be 'MED')
- [ ] Test: Existing frameworks still queryable (no breaking changes)

### Rollback Plan
```sql
ALTER TABLE frameworks DROP CONSTRAINT IF EXISTS methodology_check;
ALTER TABLE frameworks DROP CONSTRAINT IF EXISTS autonomy_level_check;
ALTER TABLE frameworks DROP COLUMN IF EXISTS skills_count;
ALTER TABLE frameworks DROP COLUMN IF EXISTS mcps_count;
ALTER TABLE frameworks DROP COLUMN IF EXISTS methodology;
ALTER TABLE frameworks DROP COLUMN IF EXISTS autonomy_level;
```

---

## Migration 2: Create Standalone Skills Table

### Execute
- [ ] Apply migration `create_standalone_skills_table` via Supabase MCP

### Verify
- [ ] Confirm table `standalone_skills` exists
- [ ] Confirm all columns present: `id`, `slug`, `name`, `description`, `github_url`, `marketplace_id`, `domain`, `stars`, `install_count`, `is_branded`, `created_at`, `updated_at`
- [ ] Confirm `slug` has UNIQUE constraint
- [ ] Confirm `marketplace_id` FK references `marketplaces(id)` with ON DELETE SET NULL
- [ ] Confirm `domain_check` constraint exists
- [ ] Confirm indexes exist: `idx_standalone_skills_domain`, `idx_standalone_skills_marketplace`, `idx_standalone_skills_stars`, `idx_standalone_skills_is_branded`
- [ ] Confirm RLS enabled
- [ ] Confirm public SELECT policy exists

### Edge Cases
- [ ] Test: Insert skill with valid domain ('infra') → should succeed
- [ ] Test: Insert skill with invalid domain ('invalid') → should fail
- [ ] Test: Insert skill with NULL domain → should succeed
- [ ] Test: Insert duplicate slug → should fail (unique constraint)
- [ ] Test: Insert with non-existent `marketplace_id` → should fail (FK constraint)
- [ ] Test: Delete marketplace with linked skills → skills should have `marketplace_id = NULL`
- [ ] Test: Public read access works (unauthenticated SELECT)
- [ ] Test: Public write access blocked (unauthenticated INSERT should fail)

### Rollback Plan
```sql
DROP TABLE IF EXISTS standalone_skills;
```

---

## Migration 3: Create MCPs Table

### Execute
- [ ] Apply migration `create_mcps_table` via Supabase MCP

### Verify
- [ ] Confirm table `mcps` exists
- [ ] Confirm all columns present: `id`, `slug`, `name`, `description`, `github_url`, `domain`, `stars`, `is_official`, `created_at`, `updated_at`
- [ ] Confirm `slug` has UNIQUE constraint
- [ ] Confirm `domain_check` constraint exists
- [ ] Confirm indexes exist: `idx_mcps_domain`, `idx_mcps_stars`, `idx_mcps_is_official`
- [ ] Confirm RLS enabled
- [ ] Confirm public SELECT policy exists

### Edge Cases
- [ ] Test: Insert MCP with valid domain ('data') → should succeed
- [ ] Test: Insert MCP with invalid domain ('invalid') → should fail
- [ ] Test: Insert MCP with NULL domain → should succeed
- [ ] Test: Insert duplicate slug → should fail
- [ ] Test: `is_official` defaults to FALSE
- [ ] Test: Public read access works
- [ ] Test: Public write access blocked

### Rollback Plan
```sql
DROP TABLE IF EXISTS mcps;
```

---

## Migration 4: Create Memory Patterns Table

### Execute
- [ ] Apply migration `create_memory_patterns_table` via Supabase MCP

### Verify
- [ ] Confirm table `memory_patterns` exists
- [ ] Confirm all columns present: `id`, `slug`, `name`, `description`, `github_url`, `pattern_type`, `stars`, `created_at`, `updated_at`
- [ ] Confirm `slug` has UNIQUE constraint
- [ ] Confirm `pattern_type_check` constraint exists
- [ ] Confirm indexes exist: `idx_memory_patterns_type`, `idx_memory_patterns_stars`
- [ ] Confirm RLS enabled
- [ ] Confirm public SELECT policy exists

### Edge Cases
- [ ] Test: Insert pattern with valid type ('beads') → should succeed
- [ ] Test: Insert pattern with invalid type ('invalid') → should fail
- [ ] Test: Insert pattern with NULL type → should succeed
- [ ] Test: Insert duplicate slug → should fail
- [ ] Test: Public read access works
- [ ] Test: Public write access blocked

### Rollback Plan
```sql
DROP TABLE IF EXISTS memory_patterns;
```

---

## TypeScript Types Regeneration

### Execute
- [ ] Generate types via `mcp__supabase__generate_typescript_types`
- [ ] Backup current `src/types/database.ts`
- [ ] Overwrite `src/types/database.ts` with generated output
- [ ] Add helper type aliases at bottom of file:
  ```typescript
  export type StandaloneSkill = Tables<"standalone_skills">
  export type MCP = Tables<"mcps">
  export type MemoryPattern = Tables<"memory_patterns">
  ```

### Verify
- [ ] `Framework` type includes `skills_count?: number`
- [ ] `Framework` type includes `mcps_count?: number`
- [ ] `Framework` type includes `methodology?: string`
- [ ] `Framework` type includes `autonomy_level?: string`
- [ ] `StandaloneSkill` type exists and is exported
- [ ] `MCP` type exists and is exported
- [ ] `MemoryPattern` type exists and is exported
- [ ] No TypeScript errors in `database.ts`

### Edge Cases
- [ ] Existing code using `Framework` type still compiles (new fields are optional)
- [ ] No import errors in files that use database types

---

## Build Verification

### Execute
- [ ] Run `bun run build`
- [ ] Run `bun run lint`

### Verify
- [ ] Build succeeds with exit code 0
- [ ] No TypeScript compilation errors
- [ ] No ESLint errors
- [ ] No new warnings introduced

### Edge Cases
- [ ] Check `src/lib/sync/framework-sync.ts` compiles (uses Framework type)
- [ ] Check `src/hooks/useFrameworks.ts` compiles (uses Framework type)
- [ ] Check `src/components/framework/*` components compile

---

## Integration Verification

### Database Queries
- [ ] Run: `SELECT COUNT(*) FROM frameworks` → should match pre-migration count
- [ ] Run: `SELECT skills_count, mcps_count FROM frameworks LIMIT 1` → should return 0, 0
- [ ] Run: `SELECT * FROM standalone_skills` → should return empty (0 rows)
- [ ] Run: `SELECT * FROM mcps` → should return empty (0 rows)
- [ ] Run: `SELECT * FROM memory_patterns` → should return empty (0 rows)

### Application
- [ ] Dev server starts (`bun dev`)
- [ ] Homepage loads without errors
- [ ] `/browse` page loads without errors
- [ ] Framework cards render correctly
- [ ] No console errors in browser

---

## Error Handling Scenarios

### Migration Failures
- [ ] If migration fails partway: Use rollback SQL to clean up
- [ ] If constraint already exists: Migration uses `ADD CONSTRAINT` (will fail if exists - need to check first)
- [ ] If table already exists: Migration uses `CREATE TABLE` (will fail - consider `IF NOT EXISTS`)

### Type Generation Failures
- [ ] If Supabase MCP times out: Retry or use dashboard
- [ ] If generated types are malformed: Restore from backup

### Build Failures
- [ ] If type errors: Check that new fields are optional (nullable)
- [ ] If import errors: Verify export statements in database.ts

---

## Post-Implementation

- [ ] Update `.wip/roadmap/TAXONOMY-REDESIGN.md` to mark Phase 1 complete
- [ ] Document any deviations from plan
- [ ] Note any issues encountered for future phases
- [ ] Clean up backup files

---

## Summary Checklist

| Task | Status |
|------|--------|
| Migration 1: Frameworks columns | ✅ |
| Migration 2: standalone_skills table | ✅ |
| Migration 3: mcps table | ✅ |
| Migration 4: memory_patterns table | ✅ |
| TypeScript types regenerated | ✅ |
| Build passes | ✅ |
| Lint passes | ✅ (warnings only) |
| Integration verified | ✅ |

## Completion Notes

- All 4 migrations applied successfully (total: 15 migrations in DB)
- Fixed type issues in `src/app/api/plugins/route.ts` and `src/hooks/usePluginFrameworks.ts` for nullable FK fields
- Fixed lint errors in `src/components/home/home-content.tsx` (unescaped entities)
- New type aliases added: `StandaloneSkill`, `MCP`, `MemoryPattern`

---

## Next Steps

After all tasks complete:
1. Start new context
2. Reference this file for Phase 2: Sync Updates
3. Key files to modify in Phase 2:
   - `src/lib/sync/framework-sync.ts` - populate new columns
   - Create `src/lib/sync/skill-sync.ts`
   - Create `src/lib/sync/mcp-sync.ts`
