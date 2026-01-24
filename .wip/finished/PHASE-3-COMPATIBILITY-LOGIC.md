# Phase 3: Compatibility Logic Implementation

**Status:** ✅ COMPLETE
**Priority:** Medium (required for accurate UI display)
**Depends on:** Phase 2 (Sync Updates) ✅ COMPLETE

---

## Summary

Refactor the compatibility logic to work across all item types (Frameworks/Workflows, Skills, MCPs) with a unified approach based on the taxonomy redesign.

---

## Current State

The existing `getCompatibleAgents()` in `src/lib/agents.ts` checks:
1. `is_claude_plugin` → Claude Code only
2. `subagents_count > 0` → Exclude Windsurf
3. Agent-specific config files → Filter by detected configs

**Used in:**
- `src/components/framework/framework-card.tsx:20`
- `src/components/framework/framework-modal.tsx:59`
- `src/components/home/frameworks-home.tsx:91`

---

## Target State

A unified compatibility system that:
1. Works for Frameworks, StandaloneSkills, and MCPs
2. Simplifies the core rule: **subagents = no Windsurf**
3. Skills and MCPs are universally compatible (all 4 agents)
4. Maintains Claude-only plugin detection for legacy compatibility

---

## Task Breakdown

### 3.1 Create Type-Agnostic Compatibility Interface

**File:** `src/lib/agents.ts`

```typescript
// Item that can have compatibility derived
export interface CompatibleItem {
  subagents_count?: number | null;
  is_claude_plugin?: boolean | null;
}
```

| Task | Status |
|------|--------|
| Define `CompatibleItem` interface | ✅ |
| Export interface from agents.ts | ✅ |

---

### 3.2 Create `deriveCompatibility()` Function

**File:** `src/lib/agents.ts`

```typescript
/**
 * Derive agent compatibility from item properties.
 * Core rule: Subagents exclude Windsurf (no subagent support).
 */
export function deriveCompatibility(item?: CompatibleItem | null): Agent[] {
  if (!item) {
    return agents; // Unknown item, assume all compatible
  }

  // Claude-only plugins (legacy /plugin install syntax)
  if (item.is_claude_plugin) {
    return agents.filter((a) => a.id === "claude-code");
  }

  // Subagents exclude Windsurf
  if (item.subagents_count && item.subagents_count > 0) {
    return agents.filter((a) => a.id !== "windsurf");
  }

  // Default: all agents compatible
  return agents;
}
```

| Task | Status |
|------|--------|
| Create `deriveCompatibility()` function | ✅ |
| Add JSDoc documentation | ✅ |
| Export from agents.ts | ✅ |

---

### 3.3 Deprecate or Refactor `getCompatibleAgents()`

**Decision:** Keep `getCompatibleAgents()` as an alias for backwards compatibility, but have it call `deriveCompatibility()` internally.

```typescript
/**
 * @deprecated Use deriveCompatibility() instead
 */
export function getCompatibleAgents(framework?: Framework | null): Agent[] {
  return deriveCompatibility(framework);
}
```

| Task | Status |
|------|--------|
| Refactor `getCompatibleAgents()` to call `deriveCompatibility()` | ✅ |
| Add deprecation notice in JSDoc | ✅ |
| Verify all existing usages still work | ✅ |

---

### 3.4 Add Compatibility Helpers for New Types

**File:** `src/lib/agents.ts`

```typescript
import type { Framework, StandaloneSkill, MCP } from "@/types/database";

// Skills are universally compatible (no subagents)
export function getSkillCompatibility(skill?: StandaloneSkill | null): Agent[] {
  return agents; // All agents support SKILL.md
}

// MCPs are universally compatible
export function getMcpCompatibility(mcp?: MCP | null): Agent[] {
  return agents; // All agents support MCP
}
```

| Task | Status |
|------|--------|
| Add `getSkillCompatibility()` function | ✅ |
| Add `getMcpCompatibility()` function | ✅ |
| Export new functions | ✅ |

---

### 3.5 Add Incompatibility Reason Helper

**File:** `src/lib/agents.ts`

Useful for UI to explain why an agent is incompatible.

```typescript
export type IncompatibilityReason =
  | "claude-only-plugin"
  | "requires-subagents"
  | null;

export function getIncompatibilityReason(
  item?: CompatibleItem | null,
  agentId?: string
): IncompatibilityReason {
  if (!item || !agentId) return null;

  if (item.is_claude_plugin && agentId !== "claude-code") {
    return "claude-only-plugin";
  }

  if (item.subagents_count && item.subagents_count > 0 && agentId === "windsurf") {
    return "requires-subagents";
  }

  return null;
}
```

| Task | Status |
|------|--------|
| Define `IncompatibilityReason` type | ✅ |
| Create `getIncompatibilityReason()` function | ✅ |
| Export type and function | ✅ |

---

### 3.6 Update Framework Card Component

**File:** `src/components/framework/framework-card.tsx`

No code changes needed if `getCompatibleAgents()` still works, but verify.

| Task | Status |
|------|--------|
| Verify framework-card.tsx works with refactored function | ✅ |
| Test with framework that has subagents | ✅ |
| Test with Claude-only plugin | ✅ |

---

### 3.7 Update Framework Modal Component

**File:** `src/components/framework/framework-modal.tsx`

Add incompatibility reason tooltip for disabled agents.

| Task | Status |
|------|--------|
| Import `getIncompatibilityReason` | ✅ |
| Show tooltip on incompatible agent badges | ✅ |
| Style incompatible agents with strikethrough or dimmed | ✅ |

---

### 3.8 Update Frameworks Home Component

**File:** `src/components/home/frameworks-home.tsx`

| Task | Status |
|------|--------|
| Verify compatibility display works | ✅ |
| Test with various framework types | ✅ |

---

### 3.9 Write Tests (Optional but Recommended)

**File:** `src/lib/__tests__/agents.test.ts` (new)

| Task | Status |
|------|--------|
| Test `deriveCompatibility()` with null input | ✅ |
| Test with subagents_count > 0 | ✅ |
| Test with is_claude_plugin = true | ✅ |
| Test with regular framework (all agents) | ✅ |
| Test `getIncompatibilityReason()` | ✅ |

---

### 3.10 Verify Build and Lint

| Task | Status |
|------|--------|
| Run `bun run build` | ✅ |
| Run `bun run lint` | ✅ |
| Fix any type errors | ✅ |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/agents.ts` | Add `CompatibleItem`, `deriveCompatibility()`, deprecate `getCompatibleAgents()`, add helpers |
| `src/components/framework/framework-modal.tsx` | Add incompatibility reason tooltips |
| `src/components/framework/framework-card.tsx` | Verify works (likely no changes) |
| `src/components/home/frameworks-home.tsx` | Verify works (likely no changes) |

---

## Compatibility Matrix Reference

**IMPORTANT**: Each agent only reads specific instruction files:

| Agent | Reads These Files |
|-------|-------------------|
| Claude Code | CLAUDE.md, SKILL.md |
| Cursor | AGENTS.md, .cursorrules, SKILL.md |
| Windsurf | AGENTS.md, .windsurfrules, SKILL.md (no subagent support) |
| Codex | AGENTS.md, SKILL.md |

**Note**: SKILL.md is an open standard supported by ALL agents.

**Framework Compatibility Examples:**

| Framework Has | Claude | Cursor | Windsurf | Codex |
|---------------|--------|--------|----------|-------|
| Only CLAUDE.md | ✅ | ❌ | ❌ | ❌ |
| Only AGENTS.md | ❌ | ✅ | ✅ | ✅ |
| Only SKILL.md | ✅ | ✅ | ✅ | ✅ |
| CLAUDE.md + AGENTS.md | ✅ | ✅ | ✅ | ✅ |
| SKILL.md + subagents | ✅ | ✅ | ❌ | ✅ |
| AGENTS.md + subagents | ❌ | ✅ | ❌ | ✅ |
| is_claude_plugin=true | ✅ | ❌ | ❌ | ❌ |
| No instruction files | ✅ | ✅ | ✅ | ✅ |

**Note**: Items without instruction files are assumed universally compatible (generic tools/MCPs).

---

## Success Criteria

- [x] `deriveCompatibility()` function exists and works
- [x] `getCompatibleAgents()` still works (backwards compatible)
- [x] `getIncompatibilityReason()` returns correct reasons
- [x] Framework cards show correct compatibility badges
- [x] Framework modal shows incompatibility reasons
- [x] `bun run build` succeeds
- [x] `bun run lint` succeeds

---

## Notes

**CORRECTION (Jan 2026)**: The original plan to remove file-based compatibility checking was incorrect.

Research confirmed that each agent only reads specific instruction files:
- **Claude Code**: Only reads CLAUDE.md (does NOT read AGENTS.md, .cursorrules, .windsurfrules)
- **Cursor**: Reads AGENTS.md and .cursorrules
- **Windsurf**: Reads AGENTS.md and .windsurfrules (but no subagent support)
- **Codex**: Reads AGENTS.md

The original simplification ("only subagents limit Windsurf") was wrong because:
1. Claude Code does not read AGENTS.md (open feature request: anthropics/claude-code#6235)
2. Frameworks with only CLAUDE.md should NOT show as compatible with Cursor/Windsurf/Codex

The corrected implementation properly checks which instruction files exist to determine agent compatibility.
