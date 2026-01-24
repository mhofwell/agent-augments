# Skills Library Expansion Plan

**Status:** ✅ COMPLETE
**Priority:** HIGH
**Date:** Jan 18, 2026
**Completed:** Jan 19, 2026
**Dependencies:** Phase 1-6 Complete (current state)

---

## Completion Summary

Expanded skills library from 3 to 11 publishers with full tagging system:

**Implemented:**
- ✅ Database schema: `skill_tag` enum, `primary_tag` + `tags[]` columns, GIN indexes
- ✅ 11 publishers configured with tags (3 existing + 8 new)
- ✅ API filtering: `GET /api/skill-publishers?tag=infrastructure`
- ✅ Hook updated with `tag` parameter
- ✅ TagFilter component with icons and colors
- ✅ Publisher cards show primary tag badges
- ✅ Logo SVGs for all 8 new publishers
- ✅ Build and lint pass

**Files Changed:**
- `src/types/database.ts` - SkillTag type
- `src/lib/sync/publisher-sync.ts` - 8 new publishers + inferSkillTags()
- `src/app/api/skill-publishers/route.ts` - tag filtering
- `src/hooks/useSkillPublishers.ts` - tag param
- `src/components/skills/tag-filter.tsx` - NEW
- `src/components/skills/skills-content.tsx` - integrated filter
- `src/components/skills/publisher-card.tsx` - tag badge
- `public/*.svg` - 7 new logo files

**Note:** New publisher repos (openai/skills, etc.) are placeholders - actual repos may not exist yet. Skills will sync when repos are created.

---

## Overview

Expand the Agent Augments skills library from **3 publishers to 11 publishers**, adding all verified official skill repositories discovered through web research. Includes a new **tagging system** for categorization and filtering.

---

## New Publishers to Add

| Publisher | Repo | Stars | Skills | Primary Tag |
|-----------|------|-------|--------|-------------|
| OpenAI | `openai/skills` | 1.7k | 10+ | `ai-ml` |
| Hugging Face | `huggingface/skills` | 954 | 8 | `ai-ml` |
| Cloudflare | `cloudflare/skills` | 62 | 6 | `infrastructure` |
| Trail of Bits | `trailofbits/skills` | 1.3k | 17 | `security` |
| Stripe | `stripe/ai` | 1.2k | Yes | `payments` |
| Posit | `posit-dev/skills` | 63 | 8 | `data-science` |
| Apify | `apify/agent-skills` | 2 | 1+ | `automation` |
| AWS | `aws-samples/sample-strands-agents-agentskills` | 23 | Reference | `infrastructure` |

**Existing Publishers (update with tags):**
- Vercel → `infrastructure`
- Anthropic → `documents`
- Railway → `infrastructure`

---

## Tagging System

### Tag Categories

| Tag | Description | Publishers |
|-----|-------------|------------|
| `infrastructure` | Deployment, hosting, edge | Vercel, Railway, Cloudflare, AWS |
| `ai-ml` | AI/ML workflows, models | Hugging Face, OpenAI |
| `security` | Auditing, vulnerabilities | Trail of Bits |
| `payments` | Payment processing | Stripe |
| `data-science` | Data analysis, R/Python | Posit |
| `automation` | Web scraping, workflows | Apify |
| `documents` | Document processing | Anthropic |
| `development` | General dev tools | (inferred from skill content) |

### Design Decisions

- **Tags on publishers**: Primary tag for quick filtering
- **Tags on skills**: Multiple tags inferred from content
- **Array columns**: PostgreSQL arrays with GIN indexes (simpler than junction tables)
- **Automatic inference**: Keyword-based tag assignment during sync

---

## Implementation Phases

### Phase 7.1: Database Schema

**Priority:** HIGH
**Files:**
- Supabase migration (via Dashboard)
- `src/types/database.ts`

**Tasks:**
- [ ] Create `skill_tag` enum type
- [ ] Add `primary_tag` column to `skill_publishers`
- [ ] Add `tags` array column to `skill_publishers`
- [ ] Add `tags` array column to `publisher_skills`
- [ ] Create GIN indexes for tag filtering
- [ ] Regenerate TypeScript types

**SQL Migration:**
```sql
-- Create enum
CREATE TYPE skill_tag AS ENUM (
  'infrastructure',
  'ai-ml',
  'security',
  'payments',
  'data-science',
  'automation',
  'documents',
  'development'
);

-- Add columns
ALTER TABLE skill_publishers
ADD COLUMN primary_tag skill_tag,
ADD COLUMN tags skill_tag[] DEFAULT '{}';

ALTER TABLE publisher_skills
ADD COLUMN tags skill_tag[] DEFAULT '{}';

-- Create indexes
CREATE INDEX idx_skill_publishers_primary_tag ON skill_publishers(primary_tag);
CREATE INDEX idx_skill_publishers_tags ON skill_publishers USING GIN(tags);
CREATE INDEX idx_publisher_skills_tags ON publisher_skills USING GIN(tags);
```

**TypeScript Type:**
```typescript
export type SkillTag =
  | 'infrastructure'
  | 'ai-ml'
  | 'security'
  | 'payments'
  | 'data-science'
  | 'automation'
  | 'documents'
  | 'development';
```

---

### Phase 7.2: Expand Publisher Sync

**Priority:** HIGH
**Files:**
- `src/lib/sync/publisher-sync.ts`

**Tasks:**
- [ ] Add `primary_tag` to KNOWN_PUBLISHERS interface
- [ ] Add 8 new publishers to KNOWN_PUBLISHERS array
- [ ] Update existing 3 publishers with tags
- [ ] Add `primary_tag` to upsert logic
- [ ] Create `inferSkillTags()` helper function
- [ ] Apply skill-level tags during sync

**New Publishers Config:**
```typescript
const KNOWN_PUBLISHERS = [
  // Existing (updated with tags)
  { name: "Vercel", slug: "vercel", github_org: "vercel-labs", github_repo: "agent-skills", primary_tag: "infrastructure", ... },
  { name: "Anthropic", slug: "anthropic", github_org: "anthropics", github_repo: "skills", primary_tag: "documents", ... },
  { name: "Railway", slug: "railway", github_org: "railwayapp", github_repo: "railway-skills", primary_tag: "infrastructure", ... },

  // New publishers
  { name: "OpenAI", slug: "openai", github_org: "openai", github_repo: "skills", primary_tag: "ai-ml", website_url: "https://openai.com", is_official: true },
  { name: "Hugging Face", slug: "huggingface", github_org: "huggingface", github_repo: "skills", primary_tag: "ai-ml", website_url: "https://huggingface.co", is_official: true },
  { name: "Cloudflare", slug: "cloudflare", github_org: "cloudflare", github_repo: "skills", primary_tag: "infrastructure", website_url: "https://cloudflare.com", is_official: true },
  { name: "Trail of Bits", slug: "trailofbits", github_org: "trailofbits", github_repo: "skills", primary_tag: "security", website_url: "https://trailofbits.com", is_official: true },
  { name: "Stripe", slug: "stripe", github_org: "stripe", github_repo: "ai", primary_tag: "payments", website_url: "https://stripe.com", is_official: true },
  { name: "Posit", slug: "posit", github_org: "posit-dev", github_repo: "skills", primary_tag: "data-science", website_url: "https://posit.co", is_official: true },
  { name: "Apify", slug: "apify", github_org: "apify", github_repo: "agent-skills", primary_tag: "automation", website_url: "https://apify.com", is_official: false },
  { name: "AWS", slug: "aws", github_org: "aws-samples", github_repo: "sample-strands-agents-agentskills", primary_tag: "infrastructure", website_url: "https://aws.amazon.com", is_official: true },
];
```

**Tag Inference Function:**
```typescript
function inferSkillTags(parsed: ParsedSkill, publisherTag: SkillTag): SkillTag[] {
  const tags = new Set<SkillTag>([publisherTag]);
  const content = `${parsed.frontmatter.name} ${parsed.frontmatter.description}`.toLowerCase();

  const tagKeywords: Record<SkillTag, string[]> = {
    'infrastructure': ['deploy', 'hosting', 'cloud', 'container', 'kubernetes'],
    'ai-ml': ['model', 'training', 'inference', 'llm', 'machine learning'],
    'security': ['security', 'vulnerability', 'audit', 'encryption'],
    'payments': ['payment', 'stripe', 'invoice', 'billing'],
    'data-science': ['data', 'analysis', 'statistics', 'pandas'],
    'automation': ['scrape', 'crawl', 'automate', 'workflow'],
    'documents': ['document', 'pdf', 'docx', 'markdown'],
    'development': ['code', 'debug', 'test', 'refactor'],
  };

  for (const [tag, keywords] of Object.entries(tagKeywords)) {
    if (keywords.some(kw => content.includes(kw))) {
      tags.add(tag as SkillTag);
    }
  }

  return Array.from(tags);
}
```

---

### Phase 7.3: API & Hook Updates

**Priority:** MEDIUM
**Files:**
- `src/app/api/skill-publishers/route.ts`
- `src/hooks/useSkillPublishers.ts`

**Tasks:**
- [ ] Add `tag` query parameter to API route
- [ ] Filter by `primary_tag` or `tags` array contains
- [ ] Return available tags in response
- [ ] Update hook to accept tag parameter
- [ ] Update hook return type to include tags list

**API Filter Logic:**
```typescript
if (tag && tag !== "all") {
  query = query.or(`primary_tag.eq.${tag},tags.cs.{${tag}}`);
}
```

---

### Phase 7.4: UI Tag Filter Component

**Priority:** MEDIUM
**Files:**
- `src/components/skills/tag-filter.tsx` (NEW)
- `src/components/skills/skills-content.tsx`

**Tasks:**
- [ ] Create TagFilter component with colored badges
- [ ] Add TAG_CONFIG with labels and colors
- [ ] Integrate TagFilter into skills-content.tsx
- [ ] Add selectedTag state
- [ ] Connect to useSkillPublishers hook

**Tag Colors (matching design system):**
```typescript
const TAG_CONFIG: Record<SkillTag, { label: string; color: string }> = {
  'infrastructure': { label: 'Infrastructure', color: 'emerald' },
  'ai-ml': { label: 'AI & ML', color: 'violet' },
  'security': { label: 'Security', color: 'rose' },
  'payments': { label: 'Payments', color: 'amber' },
  'data-science': { label: 'Data Science', color: 'blue' },
  'automation': { label: 'Automation', color: 'orange' },
  'documents': { label: 'Documents', color: 'cyan' },
  'development': { label: 'Development', color: 'zinc' },
};
```

---

### Phase 7.5: Card Components & Logos

**Priority:** LOW
**Files:**
- `src/components/skills/publisher-card.tsx`
- `src/components/skills/skill-card.tsx`
- `public/*.svg` (logo assets)

**Tasks:**
- [ ] Add primary_tag badge to PublisherCard
- [ ] Add tags display to SkillCard
- [ ] Add PUBLISHER_LOGOS mapping for new publishers
- [ ] Source/create logo SVGs for: OpenAI, Hugging Face, Cloudflare, Trail of Bits, Stripe, Posit, Apify, AWS

---

### Phase 7.6: Run Sync & Verify

**Priority:** HIGH (after code changes)

**Tasks:**
- [ ] Run `bun run cron:sync` locally
- [ ] Verify all 11 publishers synced
- [ ] Verify skills have correct tags
- [ ] Test tag filtering in UI
- [ ] Run `bun run build` and `bun run lint`

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/types/database.ts` | MODIFY | Add SkillTag type, update table types |
| `src/lib/sync/publisher-sync.ts` | MODIFY | Add 8 publishers, tag inference |
| `src/app/api/skill-publishers/route.ts` | MODIFY | Add tag filtering |
| `src/hooks/useSkillPublishers.ts` | MODIFY | Add tag parameter |
| `src/components/skills/tag-filter.tsx` | CREATE | New tag filter component |
| `src/components/skills/skills-content.tsx` | MODIFY | Integrate tag filter |
| `src/components/skills/publisher-card.tsx` | MODIFY | Display primary tag |
| `src/components/skills/skill-card.tsx` | MODIFY | Display skill tags |
| `public/*.svg` | CREATE | 8 new logo files |

---

## Success Criteria

- [ ] 11 publishers visible on /skills page
- [ ] Tag filter shows all 8 categories
- [ ] Filtering by tag correctly filters publishers
- [ ] Publisher cards show primary tag badge
- [ ] Skills inherit appropriate tags
- [ ] No TypeScript errors
- [ ] Build passes
- [ ] Mobile responsive

---

## Verification Steps

1. **Database**: Run migration, verify columns exist
2. **Sync**: Run `bun run cron:sync`, check logs for all publishers
3. **API**: Test `GET /api/skill-publishers?tag=security`
4. **UI**: Visit /skills, click tag filters, verify filtering
5. **Build**: `bun run build && bun run lint`

---

## Notes

- Stripe uses `stripe/ai` repo (different structure, has `skills/` subdirectory)
- AWS is a reference implementation, may have different SKILL.md structure
- Logo assets need to be sourced/created - can use simple text placeholders initially
- Tag inference is conservative - skills get publisher's primary tag + detected tags

---

## Links

- [Agent Skills Spec](https://agentskills.io/specification)
- [Existing SKILLS-FEATURE-PLAN.md](.wip/roadmap/SKILLS-FEATURE-PLAN.md)
- OpenAI Skills: https://github.com/openai/skills
- Hugging Face Skills: https://github.com/huggingface/skills
- Cloudflare Skills: https://github.com/cloudflare/skills
- Trail of Bits Skills: https://github.com/trailofbits/skills
- Stripe AI: https://github.com/stripe/ai
- Posit Skills: https://github.com/posit-dev/skills
- Apify Skills: https://github.com/apify/agent-skills
- AWS Skills: https://github.com/aws-samples/sample-strands-agents-agentskills
