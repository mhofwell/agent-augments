# Agent Augments UX Analysis & Plan

## Executive Summary

After a holistic review of the site, research into marketplace UX best practices, and analysis of comparable platforms (VS Code, Raycast, npm), I've identified several opportunities to clarify the user experience and create a more compelling story around "equipping agents with superpowers."

**The core tension:** The site currently serves multiple audiences with overlapping content types (frameworks, skills, plugins, components) without a clear mental model for how they relate. Users may not understand what they're looking at or what action to take.

---

## Current State Analysis

### Navigation Structure
```
Header: [Frameworks] [Skills] [Components] [Submit] ... [GitHub]
                         |
                    Hidden: /browse (full plugin catalog)
```

**Issues:**
1. `/browse` exists but isn't in navigation - users miss the full catalog
2. "Frameworks" is the default, but plugins are the atomic unit
3. "Skills" and "Components" feel like peer categories but are actually different taxonomies
4. No clear hierarchy between content types

### Content Taxonomy (Current)
| Type | What it is | How it displays |
|------|-----------|-----------------|
| Framework | Bundle of augments + config | Dedicated page |
| Skill | Single capability from verified publisher | Card → Publisher page |
| Plugin | Generic augment from community | Card → Modal |
| Component | UI library MCP server | Card |

**The problem:** Users don't inherently know Framework > Skill > Plugin hierarchy. The site presents them as equals.

### Detail View Inconsistency
- **Frameworks:** Navigate to `/frameworks/[slug]` - full page with "What's Included"
- **Plugins:** Open modal overlay - inline detail
- **Skills:** Navigate to `/skills` - publisher-centric view

This creates an inconsistent mental model.

---

## User Journey Questions (Your Questions, Answered)

### 1. Where should users land?
**Current:** Curated homepage with sections (Frameworks → Skills → Official → Community)

**Recommendation:** Keep the curated homepage but reframe it as a **discovery flow**:
```
Landing: "Equip your agent"
    │
    ├─→ "I want a complete setup" → Frameworks (bundles)
    ├─→ "I want specific capabilities" → Skills (atomic units)
    └─→ "I want to browse everything" → Catalog
```

The homepage should tell a story, not just list content.

### 2. How should users find augments? Is current structure OK?
**Assessment:** The current structure is functional but confusing.

**Issues:**
- Search is on homepage but `/browse` has richer filtering
- Users can't filter by "what problem does this solve?" only by type
- No "recommended for you" or "popular this week" curation

**Recommendation:**
1. Elevate search as THE primary discovery mechanism (like Raycast)
2. Add faceted filtering: by use case, by agent compatibility, by author
3. Consider merging `/browse` into the homepage flow

### 3. Search vs Browse All?
**Answer: Both, but search should be primary.**

Research shows:
- 85% of users prefer search when they know what they want
- Browse is essential for discovery when users don't know what exists

**Pattern to adopt:** Raycast's model
- Big prominent search bar
- "Featured" curated section below
- "All Extensions" accessible with one click
- Categories visible but not overwhelming

### 4. UX Innovation Opportunities

#### A. The "Loadout" Concept
Instead of individual installs, let users build a **loadout** - a collection of augments they want to equip. Visual metaphor similar to:
- Game character equipment screens
- VS Code "Profile" feature
- Raycast "Extension Collections"

```
┌─────────────────────────────────────────┐
│  Your Loadout                      [3]  │
│  ┌─────┐ ┌─────┐ ┌─────┐              │
│  │ PR  │ │Test │ │Docs │    [+ Add]   │
│  │Review│ │Suite│ │Gen  │              │
│  └─────┘ └─────┘ └─────┘              │
│                                         │
│  [Export as install script]             │
└─────────────────────────────────────────┘
```

#### B. Agent-Centric Discovery
Instead of "here are plugins", flip it to "here's what your agent can do":
- "Make Claude Code better at PR reviews"
- "Add project management to Cursor"
- "Give your agent security superpowers"

This is task-oriented vs. tool-oriented.

#### C. Comparison/Differentiation
When multiple augments solve similar problems, help users choose:
- "For PR review: pr-review-toolkit vs review-agent (comparison)"
- Show stars, installs, update frequency side-by-side

#### D. "See it in action"
CLI tools are hard to evaluate. Consider:
- Screenshots/GIFs of the augment in use
- Terminal recordings (asciinema embeds)
- Community showcase section

### 5. Visual Representation of "Equipping"

**Current state:** CLI commands with copy button. Functional but uninspired.

**The CLI reality:** Installation IS via CLI. You can't change that. But you can make it feel less like homework.

**Ideas to explore:**

#### Option A: The "One-Click" Illusion
Deep linking that opens terminal/IDE:
```
[Equip in Claude Code] → claude-code://install/plugin-name
```
Raycast does this with `raycast://extensions/...` links.

#### Option B: The Export Script
Let users build a loadout, then export:
```bash
# Your Agent Augments loadout - generated 2024-01-22
/plugin marketplace add anthropic/cc-marketplace
/plugin install pr-review-toolkit@cc-marketplace --scope user
/plugin install test-generator@cc-marketplace --scope user
```

This makes batch installation feel intentional, not tedious.

#### Option C: Visual Progress
When showing install steps, make it feel like equipping:
```
[ ] Add marketplace    ← Copy command
[✓] Choose scope       ← User (recommended)
[ ] Install augment    ← Copy command
───────────────────────
Progress: 1/3 steps
```

#### Option D: Config File Generation
Generate `.claude/settings.json` snippets that users can paste:
```json
{
  "plugins": {
    "pr-review-toolkit": { "scope": "user" },
    "test-generator": { "scope": "project" }
  }
}
```

### 6. Is Simpler Better?

**Yes, but "simple" doesn't mean "less"—it means "less cognitive load."**

**What to simplify:**
1. **Navigation:** Reduce from 4+ nav items to 2-3 clear paths
2. **Taxonomy:** Don't make users understand Framework vs Skill vs Plugin - show them use cases
3. **Installation:** One copy, not two (combine marketplace + install)

**What to NOT simplify:**
1. **Power-user features:** Keep filters, search, sorting
2. **Information density:** Developers want data (stars, installs, last updated)
3. **Customization:** Keep scope options, they matter

---

## Recommended Page Structure

### Option A: Search-First (Raycast Model)
```
/ (Homepage)
├── Hero: "Equip your agent with superpowers"
├── Search bar (prominent)
├── Featured: 3 curated picks
├── Categories: [Frameworks] [Skills] [Utilities] [DevOps]
├── Trending this week
└── Footer

/explore (replaces /browse)
├── Search + Filters
├── Grid of all augments
└── Sort: Popular, New, Updated

/[type]/[slug] (detail pages for all)
├── Description
├── Installation
├── Included components
├── Related augments
└── Reviews/ratings (future)
```

### Option B: Category-First (Current, Refined)
```
/ (Homepage)
├── Hero
├── Quick search
├── Frameworks section (bundles)
├── Skills section (official capabilities)
├── Community section (everything else)
└── Footer

/frameworks → Full frameworks list
/skills → Full skills list
/browse → Full plugin catalog (LINK THIS IN NAV)
```

### Option C: Use-Case First (Innovative)
```
/ (Homepage)
├── "What do you want to do?"
│   ├── Code Review & PRs
│   ├── Testing & Quality
│   ├── Documentation
│   ├── Security
│   └── Browse All
├── Featured Loadouts (curated bundles)
└── Trending

/use-case/[slug]
├── Augments for this use case
├── Recommended loadout
└── User testimonials
```

---

## Concrete Recommendations

### Phase 1: Quick Wins (Ship This Week)
1. **Add `/browse` to navigation** - Users are missing the full catalog
2. **Unify detail views** - Either all modals or all pages (I recommend: all modals for speed)
3. **Combine install commands** - Generate a single script that adds marketplace AND installs
4. **Add "copy all" button** for multi-step installs

### Phase 2: Story Improvement (Next Sprint)
1. **Homepage rewrite** - Lead with "What can you do?" not "What types exist?"
2. **Search elevation** - Make search the hero, not a utility
3. **Compatible agents visual** - Show which agents work with which augments prominently
4. **"Loadout" export** - Let users collect and batch-export

### Phase 3: Innovation (Future)
1. **Deep linking** - `agent-augments://install/...` protocol handler
2. **Showcase section** - Terminal recordings, screenshots
3. **Comparison tool** - Side-by-side augment comparison
4. **Use-case navigation** - Browse by problem, not by type

---

## Decision: What to Build Next?

Before proceeding, you need to decide:

1. **Page paradigm:** Search-first, Category-first, or Use-case-first?
2. **Detail pattern:** All modals, all pages, or hybrid?
3. **Install UX:** Keep current (2 commands) or innovate (1 script, deep link, config file)?
4. **Navigation:** Keep 4 items or simplify?

My recommendation: **Search-first with Use-case hints**, all modals for detail, combined install script, simplified navigation to:
```
[Search...] [Explore] [Submit] [GitHub]
```

Where "Explore" is the new `/browse` with filters for frameworks, skills, etc.

---

## Summary

The site has solid bones. The content is there, the design is clean, the data model works. What's missing is:

1. **Clear story:** Users don't know what journey they're on
2. **Unified experience:** Inconsistent patterns break immersion
3. **Install delight:** CLI commands feel like chores, not power-ups
4. **Discovery paths:** Can't find augments by what they DO, only by what they ARE

Fix these, and you have a genuinely useful tool for the Claude Code community.
