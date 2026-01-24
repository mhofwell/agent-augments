# Phase 2: Sync Updates Implementation

**Status:** ✅ COMPLETE (2026-01-16)
**Priority:** High (enables UI updates in Phase 4)
**Depends on:** Phase 1 (Data Model) ✅ COMPLETE

---

## Summary

Update sync logic to populate the new taxonomy columns and create discovery functions for standalone skills and MCPs.

| Task | File | Status |
|------|------|--------|
| Add skills_count detection | `framework-sync.ts` | ✅ |
| Add mcps_count detection | `framework-sync.ts` | ✅ |
| Add methodology extraction | `framework-sync.ts` | ✅ |
| Add autonomy_level estimation | `framework-sync.ts` | ✅ |
| Create standalone skill discovery | `skill-sync.ts` | ✅ |
| Create MCP discovery | `mcp-sync.ts` | ✅ |
| Update cron script | `scripts/cron-sync.ts` | ✅ |

---

## 1. Framework Sync Updates

### 1.1 Count SKILL.md Files

Use GitHub's Tree API to search for SKILL.md files recursively.

```typescript
async function countSkillFiles(owner: string, repo: string): Promise<number> {
  // Use recursive tree API: /repos/{owner}/{repo}/git/trees/{branch}?recursive=1
  // Filter for files ending in SKILL.md
  // Return count
}
```

**Detection locations:**
- `**/SKILL.md` - Standard skill definitions
- `.claude/skills/*.md` - Claude Code skills directory
- `.cursor/skills/*.md` - Cursor skills directory

### 1.2 Detect MCP Configurations

Check for MCP config files and count servers.

```typescript
async function detectMcpConfig(owner: string, repo: string): Promise<{ hasMcp: boolean; count: number }> {
  // Check these locations:
  // - mcp.json (Claude Code)
  // - .claude/mcp.json
  // - mcp_config.json (Windsurf)
  // - config.toml (Codex)

  // If found, parse and count servers
}
```

**MCP config locations per agent:**
| Agent | Location |
|-------|----------|
| Claude Code | `~/.claude/mcp.json` or `.claude/mcp.json` |
| Cursor | `.cursor/mcp.json` |
| Windsurf | `mcp_config.json` |
| Codex | `config.toml` under `[mcp_servers]` |

### 1.3 Extract Methodology from README

Scan README content for methodology keywords.

```typescript
function extractMethodology(readme: string): string | null {
  const lower = readme.toLowerCase();

  // Priority order (return first match)
  if (/agentic.?mesh|multi.?agent|orchestrat|delegat|subagent/i.test(lower)) {
    return 'agentic-mesh';
  }
  if (/spec.?driven|spec.?first|plan.?first|design\s+doc|specification/i.test(lower)) {
    return 'spec-driven';
  }
  if (/tdd|test.?driven|test.?first|bdd/i.test(lower)) {
    return 'test-first';
  }
  if (/iterative|incremental|agile|fast\s+iteration/i.test(lower)) {
    return 'iterative';
  }

  return null;
}
```

**Methodology Detection Keywords:**
| Tag | Keywords |
|-----|----------|
| `spec-driven` | specification, spec-first, plan-first, design doc |
| `iterative` | incremental, iterative, agile, fast iteration |
| `test-first` | TDD, test-driven, test-first, BDD |
| `agentic-mesh` | subagent, delegation, orchestration, multi-agent |

### 1.4 Estimate Autonomy Level

Estimate based on README content and skill configuration.

```typescript
function estimateAutonomyLevel(readme: string, subagentsCount: number): string | null {
  const lower = readme.toLowerCase();

  // HIGH: Autonomous patterns
  if (subagentsCount > 2 || /auto.?approve|autonomous|hands.?off|fully\s+automated/i.test(lower)) {
    return 'HIGH';
  }

  // LOW: Manual/interactive patterns
  if (/manual|interactive|step.?by.?step|confirm|approval\s+required/i.test(lower)) {
    return 'LOW';
  }

  // MED: Default for anything with subagents or structured methodology
  if (subagentsCount > 0 || /workflow|process|methodology/i.test(lower)) {
    return 'MED';
  }

  return null;
}
```

---

## 2. Standalone Skill Discovery (skill-sync.ts)

Search GitHub for repositories containing SKILL.md files.

### Search Strategy

```typescript
const SKILL_SEARCH_QUERIES = [
  "SKILL.md in:path",
  "claude code skill",
  "cursor skill SKILL.md",
  "windsurf skill",
];
```

### Skill Domain Detection

Detect domain from README/description content:

| Domain | Keywords |
|--------|----------|
| `infra` | deploy, infrastructure, docker, kubernetes, railway, vercel, aws |
| `git` | git, commit, branch, merge, pr, pull request |
| `testing` | test, jest, vitest, pytest, testing |
| `db` | database, postgres, mysql, supabase, prisma, sql |
| `design` | design, figma, ui, ux, css, tailwind |
| `docs` | documentation, readme, docs, markdown |

### Branded Skill Detection

Flag known branded skills:
- Railway, Vercel, Supabase, Netlify, Cloudflare
- GitHub, GitLab, Bitbucket
- Stripe, Twilio, SendGrid

---

## 3. MCP Discovery (mcp-sync.ts)

Search GitHub for MCP server repositories.

### Search Strategy

```typescript
const MCP_SEARCH_QUERIES = [
  "MCP server model context protocol",
  "mcp-server in:name",
  "@modelcontextprotocol/server",
  "model context protocol server",
];
```

### MCP Domain Detection

| Domain | Keywords |
|--------|----------|
| `data` | database, postgres, mysql, redis, elasticsearch |
| `browser` | browser, puppeteer, playwright, selenium, web |
| `design` | figma, sketch, design, ui, components |
| `external` | api, integration, webhook, slack, discord |

### Official MCP Detection

Flag MCPs from:
- `modelcontextprotocol/*`
- `anthropics/*`
- Listed in official MCP registry

---

## 4. Implementation Order

1. **Update `framework-sync.ts`** (4 changes)
   - Add `countSkillFiles()` function
   - Add `detectMcpConfig()` function
   - Add `extractMethodology()` function
   - Add `estimateAutonomyLevel()` function
   - Update `syncFrameworks()` to populate new columns

2. **Create `skill-sync.ts`**
   - Search GitHub for SKILL.md repos
   - Extract skill metadata
   - Insert into `standalone_skills` table

3. **Create `mcp-sync.ts`**
   - Search GitHub for MCP repos
   - Extract MCP metadata
   - Insert into `mcps` table

4. **Update cron script**
   - Add skill sync to cron job
   - Add MCP sync to cron job

---

## 5. Rate Limiting Considerations

GitHub API rate limits:
- Unauthenticated: 60 requests/hour
- Authenticated (PAT): 5,000 requests/hour

**Mitigation:**
- Use GITHUB_PAT env var (already in framework-sync.ts)
- Use recursive tree API (1 request per repo vs many for file checks)
- Add delays between requests (already using 500ms-1000ms)
- Cache results where possible

---

## 6. Testing

After implementation, verify:

```sql
-- Check frameworks have new columns populated
SELECT slug, name, skills_count, mcps_count, methodology, autonomy_level
FROM frameworks
WHERE skills_count > 0 OR mcps_count > 0;

-- Check standalone_skills has data
SELECT COUNT(*), domain FROM standalone_skills GROUP BY domain;

-- Check mcps has data
SELECT COUNT(*), domain FROM mcps GROUP BY domain;
```

---

## 7. Success Criteria

- [ ] All frameworks have `skills_count` populated (0 or more)
- [ ] All frameworks have `mcps_count` populated (0 or more)
- [ ] Frameworks with methodology keywords have `methodology` set
- [ ] Frameworks with autonomy indicators have `autonomy_level` set
- [ ] `standalone_skills` table has discovered skills
- [ ] `mcps` table has discovered MCP servers
- [ ] `bun run build` succeeds
- [ ] `bun run lint` succeeds
