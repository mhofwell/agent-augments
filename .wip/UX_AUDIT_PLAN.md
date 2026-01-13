# Agent Augments - UX/UI Audit & Redesign Plan

## Executive Summary

This audit addresses navigation confusion, information architecture issues, and integration opportunities. The strategic direction is **"brand broad, content narrow (for now), architecture ready"**:

- **Rebrand** from "Plugin Hub for Claude Code" to "Agent Augments"
- **Frameworks** are agent-agnostic (work with Claude Code, Cursor, Windsurf, etc.)
- **Plugins** are agent-specific (Claude Code now, others in future)
- **Architecture** supports multi-agent expansion without current commitment

Target user: Experienced AI coding agent users seeking to expand their toolkit.

---

## Part 1: Current State Issues

### 1.1 Navigation Problems

**Issue: Mixed Content Types & Filter States in Nav**
```
Current: [Discover] [Featured] [New] [Frameworks] [Bookmarks]
                      ^           ^
                    These are filter states, not content types
```

- "Featured" and "New" are really just sorted/filtered views of "Discover"
- "Frameworks" IS a different content type but sits at same level
- "Bookmarks" is a user action/collection, not a content type
- Creates cognitive load: "Am I browsing content types or applying filters?"

**Issue: Plugin Types Hidden Behind Filter Panel**
- Plugin types (Skill, Agent, Command, Bundle, Hook) are fundamental to Claude Code
- Currently buried in a collapsible "Filters" panel
- Experienced users need quick type filtering - it's how they think about augments

### 1.2 Information Architecture Confusion

**Issue: Plugin vs Framework Mental Model**
- **Plugins**: Agent-specific augments (currently Claude Code only)
  - Skills: Specialized behaviors triggered by context
  - Agents: Autonomous task handlers
  - Commands: /slash commands
  - Bundles: Collections of the above
  - Hooks: Event-triggered automations
  - **Installation**: `claude plugin install x@marketplace`

- **Frameworks**: Agent-agnostic development methodologies
  - BMAD Method: Project management + persona-driven workflows
  - GSD: Pragmatic coding efficiency
  - Specify: Specification-driven development
  - **Installation**: npx/curl/uv/pip (external tools)
  - **Works with**: Claude Code, Cursor, Windsurf, Codex, etc.

**Current Problem**: These sit at the same navigation level despite being categorically different. The site is branded "Plugin Hub for Claude Code" but frameworks aren't Claude Code specific.

**Issue: Marketplace Badges Are Unclear**
- "cc-marketplace" vs "claude-code-plugins" - what do these mean to users?
- No visual hierarchy distinguishing official from community sources
- The "Official" badge exists but its meaning isn't obvious

### 1.3 User Journey Gaps

**Current Happy Path:**
1. Land on Discover page
2. Browse/search/filter plugins
3. Click to open modal
4. Find install command... where?
5. Copy command
6. Open terminal, paste, run

**Problems:**
- No clear "how to install" guidance for new users
- Install commands are in the modal but not prominently featured
- Framework install commands are clearer (copy button right on card)
- No connection between browsing and actual installation

### 1.4 Integration Limitations

**Technical Reality:**
- Claude Code has NO deep-link support (open feature request #10366)
- Only installation method: CLI commands (`claude plugin install x@marketplace`)
- Interactive TUI exists (`/plugin` inside Claude Code) but separate from this web UI
- Claude.ai and Claude Code CLI are SEPARATE ecosystems with no cross-compatibility
- Other agents (Cursor, Codex, Windsurf) have their own incompatible plugin systems

**Implication:** One-click install is NOT possible today. The best we can do:
- Optimized copy-to-clipboard experience
- Clear, contextual installation instructions
- Future-ready architecture for when deep-linking arrives

---

## Part 2: Recommended Information Architecture

### 2.1 Strategic Positioning

**"Agent Augments"** - THE directory for AI coding augments

```
Agent Augments
│
├── Frameworks (AGENT-AGNOSTIC)
│   └── Development methodologies that work with ANY AI coding agent
│   └── "Works with: Claude Code, Cursor, Windsurf, Codex..."
│
└── Plugins (AGENT-SPECIFIC)
    ├── Claude Code [current]
    │   └── Skills, Agents, Commands, Bundles, Hooks
    │
    ├── Cursor [future]
    │   └── .cursorrules, custom rules
    │
    ├── Windsurf [future]
    │   └── Rules, configurations
    │
    └── Codex [future]
        └── Configs, prompts
```

### 2.2 Content Type Definitions

| Type | Scope | Installation | Examples |
|------|-------|--------------|----------|
| **Frameworks** | Agent-agnostic | npx, curl, uv, pip | BMAD, GSD, Specify |
| **Plugins** | Agent-specific | Agent's CLI/UI | Skills, Commands, Rules |

### 2.3 Proposed Site Structure

```
/ (Home - Agent Augments)
├── /frameworks - Browse agent-agnostic frameworks
│   └── Filter by: install tool, compatible agents
│
├── /plugins - Browse agent-specific plugins
│   └── Filter by: agent, type, category, source
│   └── Currently: Claude Code only
│   └── Future: Cursor, Windsurf, Codex tabs
│
├── /bookmarks - User's saved items (auth required)
│   └── Organized by type (frameworks vs plugins)
│
└── /collections - Curated bundles (future)
```

### 2.4 Unified Search with Divergent Results

One search bar that searches BOTH plugins and frameworks, with clearly separated result sections:

```
┌─────────────────────────────────────────────────┐
│ 🔍 Search augments...                           │
└─────────────────────────────────────────────────┘

Frameworks (3 results)
├── BMAD Method - Works with Claude Code, Cursor...
├── GSD - Works with Claude Code, Cursor...
└── View all frameworks →

Claude Code Plugins (12 results)
├── plugin-dev [Skill]
├── pr-review-toolkit [Agent]
└── View all plugins →
```

---

## Part 3: Navigation Redesign

### Recommended: Minimal Nav with Agent-Aware Tabs

```
┌─────────────────────────────────────────────────────────────────────┐
│ [>_] Agent Augments          [🔍 Search...]        [♡] [Sign in]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   [ Frameworks (16) ]    [ Plugins (147) ]                         │
│                                                                     │
│   ─────────────────────────────────────────────────────────────    │
│                                                                     │
│   When on Plugins tab:                                              │
│   [Claude Code ▾]  [All] [Skills] [Agents] [Commands] [Hooks]      │
│        │                                                            │
│        └── Future: Cursor | Windsurf | Codex                       │
│                                                                     │
│   When on Frameworks tab:                                           │
│   [All Tools] [NPX] [UV] [CURL] [BASH]    Sort: [Popular ▾]        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Changes:**
- Rebrand header: "Agent Augments" (not "Plugin Hub for Claude Code")
- Two primary content tabs: Frameworks | Plugins
- Plugin tab has agent selector (Claude Code now, others future)
- Plugin types as quick filters (not buried in panel)
- "Featured" and "New" become sort options, not nav items
- Bookmarks accessible via heart icon (not primary nav)

### Navigation States

**Frameworks Tab:**
```
/frameworks
/frameworks?tool=npx
/frameworks?tool=uv&sort=popular
/frameworks?q=specification
```

**Plugins Tab:**
```
/plugins                          → All Claude Code plugins
/plugins?agent=claude-code        → Explicit agent filter
/plugins?type=skill               → Filter by plugin type
/plugins?type=agent&sort=new      → Combined filters
/plugins?agent=cursor             → Future: Cursor rules
```

---

## Part 4: Specific UI/UX Improvements

### 4.1 Framework Card Redesign

```
┌────────────────────────────────────────────────────────────────┐
│ BMAD Method                                         [★] [NPX]  │
│ ⭐ 29.3k                                                       │
│                                                                │
│ A structured methodology for AI-assisted development          │
│ with persona-driven workflows and comprehensive               │
│ project management.                                           │
│                                                                │
│ ┌────────────────────────────────────────────────────────────┐│
│ │ Works with: Claude Code • Cursor • Windsurf • Codex       ││
│ └────────────────────────────────────────────────────────────┘│
│                                                                │
│ Requires: Node.js 20+                                          │
│                                                                │
│ ┌──────────────────────────────────────────────────┐          │
│ │ npx bmad-method@alpha install              [📋] │          │
│ └──────────────────────────────────────────────────┘          │
└────────────────────────────────────────────────────────────────┘
```

**New Elements:**
- **"Works with" badge row** - Shows agent compatibility (key differentiator)
- Install tool badge (NPX/UV/CURL/BASH) top-right
- Star count prominent
- Prerequisites visible
- Install command with copy button on card

### 4.2 Plugin Card Redesign

```
┌────────────────────────────────────────────────────────────────┐
│ [Skill]  plugin-dev                            [★]  [Claude]   │
│          claude-code-plugins • Official                        │
│                                                                │
│ Comprehensive toolkit for developing Claude Code              │
│ plugins. Includes 7 expert skills covering hooks,             │
│ MCP integration, commands, agents...                          │
│                                                                │
│ ⬇ 1.2k   ☆ development                                        │
│                                                                │
│ ┌──────────────────────────────────────────────────┐          │
│ │ claude plugin install plugin-dev@cc        [📋] │          │
│ └──────────────────────────────────────────────────┘          │
└────────────────────────────────────────────────────────────────┘
```

**Changes from Current:**
- Type badge (Skill/Agent/etc) TOP-LEFT as primary identifier
- Agent badge (Claude) TOP-RIGHT - shows which agent this is for
- Source + official badge on second line
- Bookmark star next to agent badge
- Install command directly copyable from card (not just modal)
- Stats at bottom with visual hierarchy

### 4.3 Installation Experience

**Quick Install (Card Level):**
- One-click copy button on every card
- Shows the default install command
- Toast notification: "Copied! Paste in your terminal"

**Detailed Install (Modal):**
```
┌─────────────────────────────────────────────────────────────────┐
│ Install plugin-dev                                          [X] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Choose installation scope:                                      │
│                                                                 │
│ ○ User (recommended)                                            │
│   Available in all your projects                                │
│   claude plugin install plugin-dev@cc-plugins --scope user      │
│                                                        [📋]     │
│                                                                 │
│ ○ Project                                                       │
│   Shared with your team via .claude/settings.json               │
│   claude plugin install plugin-dev@cc-plugins --scope project   │
│                                                        [📋]     │
│                                                                 │
│ ○ Local                                                         │
│   This project only, not version controlled                     │
│   claude plugin install plugin-dev@cc-plugins --scope local     │
│                                                        [📋]     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ First time installing plugins?                              [▾] │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 1. Open your terminal                                       │ │
│ │ 2. Navigate to your project directory                       │ │
│ │ 3. Paste the command above and press Enter                  │ │
│ │ 4. The plugin will be available next time you start Claude  │ │
│ │                                                             │ │
│ │ Learn more: Claude Code Plugin Docs →                       │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 Search & Filter UX

**Unified Search Bar (Header):**
- Searches both plugins AND frameworks
- Results grouped by type in dropdown
- Keyboard navigation (↑↓ to navigate, Enter to select, Esc to close)
- Recent searches (stored locally)

**Quick Filters (Below Tabs):**

For Plugins:
```
[Claude Code ▾]  [All] [Skills] [Agents] [Commands] [Hooks] [Bundles]

Advanced ▾
├── Sort by: Popular | New | Updated | Name
├── Source: All | Official | Community
└── Category: (existing categories)
```

For Frameworks:
```
[All Tools] [NPX] [UV] [CURL] [BASH]     Sort: [Popular ▾]

Advanced ▾
├── Compatible with: Claude Code | Cursor | Windsurf | All
└── Category: methodology | workflow | documentation
```

### 4.5 Bookmarks Redesign

**Organized by Type:**
```
My Bookmarks
├── Frameworks (3)
│   └── BMAD Method, GSD, Specify
│
└── Plugins (8)
    └── Claude Code
        └── plugin-dev, pr-review-toolkit...
```

**Future Features:**
- Collections (user-created groupings)
- Export as shareable list
- Export as `settings.json` snippet for plugins
- Share bookmarks via URL

---

## Part 5: Integration Strategy

### 5.1 Current Best Practices (No Deep-Link)

Since one-click install isn't possible:

1. **Optimize Copy Experience**
   - One-click copy on every card (not just modal)
   - Copy feedback animation
   - Toast notification with next steps

2. **Contextual Install Commands**
   - Show the RIGHT command based on content type
   - Plugins: `claude plugin install x@marketplace`
   - Frameworks: `npx x` / `uv tool install x` / etc.
   - Future: Remember user's preferred scope

3. **Installation Guides**
   - Expandable "First time?" section in modals
   - Links to official docs for each agent
   - Common troubleshooting

### 5.2 Future Integration (When Deep-Link Arrives)

Monitor Claude Code feature request #10366 for deep-link support.

**Prepared Architecture:**
```typescript
// src/lib/install.ts
export async function installPlugin(plugin: Plugin) {
  const deepLinkSupported = await checkDeepLinkSupport('claude-code');

  if (deepLinkSupported) {
    // Future: trigger direct install
    window.location.href = `vscode://anthropic.claude-code/plugin/install?name=${plugin.name}&marketplace=${plugin.marketplace}`;
  } else {
    // Current: copy to clipboard
    await copyToClipboard(getInstallCommand(plugin));
    showToast('Copied! Paste in your terminal');
  }
}
```

### 5.3 Multi-Agent Integration Prep

**Database Ready:**
```sql
-- plugins table already has flexibility for agent-specific fields
-- Add agent column when expanding:
ALTER TABLE plugins ADD COLUMN agent TEXT DEFAULT 'claude-code';

-- Future agents might have different type enums:
-- Cursor: 'rule' | 'snippet'
-- Codex: 'config' | 'prompt'
```

**UI Ready:**
- Agent selector in plugin filters
- Agent badge on plugin cards
- Agent-specific install command generation

### 5.4 VS Code Extension Opportunity (Future)

A companion VS Code extension could:
- Show installed plugins for each agent
- Install plugins via extension command
- Sync bookmarks with web UI
- "Install from Agent Augments" in sidebar

---

## Part 6: Implementation Priorities

### Phase 1: Rebranding & Navigation (High Impact)
1. [ ] Rebrand header: "Plugin Hub for Claude Code" → "Agent Augments"
2. [ ] Restructure nav: Frameworks | Plugins as primary tabs
3. [ ] Remove Featured/New from nav → make them sort options
4. [ ] Move Bookmarks to icon in header (not primary nav)
5. [ ] Add plugin type quick filters below search (Skills, Agents, etc.)

### Phase 2: Framework Enhancements (Medium Effort)
1. [ ] Add "Works with" badges showing agent compatibility
2. [ ] Create agent compatibility data (which frameworks work with which agents)
3. [ ] Improve framework cards with prerequisites and compatibility row

### Phase 3: Plugin Card & Install UX (High Impact)
1. [ ] Add copy-to-clipboard install command directly on plugin cards
2. [ ] Move type badge to top-left of cards
3. [ ] Add agent badge to plugin cards (prep for multi-agent)
4. [ ] Create detailed install modal with scope options
5. [ ] Add "First time?" expandable guide
6. [ ] Toast notifications for copy actions

### Phase 4: Search & Filter Polish (Medium Impact)
1. [ ] Unified search across plugins + frameworks
2. [ ] Keyboard navigation in search results
3. [ ] Recent searches (localStorage)
4. [ ] Ensure URL-shareable filter states work correctly

### Phase 5: Multi-Agent Prep (Architecture)
1. [ ] Add `agent` column to plugins table (default: 'claude-code')
2. [ ] Add agent filter to plugins API
3. [ ] Create agent selector UI component (disabled until needed)
4. [ ] Document how to add new agents (Cursor, Windsurf, Codex)

### Phase 6: User Features (Lower Priority)
1. [ ] Collections (user-created groupings)
2. [ ] Export bookmarks as settings.json snippet
3. [ ] User preferences (default scope, preferred view)
4. [ ] Share bookmarks via URL

### Phase 7: Future Integration (Blocked on External)
1. [ ] Monitor Claude Code deep-link feature request #10366
2. [ ] Prepare architecture for one-click install
3. [ ] Consider VS Code extension when there's demand

---

## Part 7: Success Metrics

### User Engagement
- Time to first install command copy
- Search → copy conversion rate
- Return visitor rate
- Bookmark usage

### Content Discovery
- Plugins viewed per session
- Framework views (are they finding frameworks?)
- Filter usage patterns
- Search query analysis

### Growth Indicators
- Unique visitors
- GitHub referrals (are people coming from plugin repos?)
- Social shares
- Community submissions (if enabled)

---

## Part 8: Open Questions

1. **Agent Compatibility Data**: How do we determine which frameworks work with which agents? Manual curation or automated detection?

2. **Community Contributions**: Should users be able to:
   - Submit new frameworks/plugins?
   - Add "Works with" compatibility info?
   - Rate/review items?

3. **Analytics Implementation**: What tool for tracking user behavior? (Plausible, PostHog, custom?)

4. **SEO Strategy**: Target keywords:
   - "Claude Code plugins"
   - "AI coding agent augments"
   - "Cursor rules directory"
   - "AI development frameworks"

---

## Summary

**Strategic Direction:** Brand broad, content narrow, architecture ready

**Core Changes:**
1. **Rebrand** → "Agent Augments" (not Claude Code specific)
2. **Navigation** → Frameworks | Plugins as primary tabs
3. **Frameworks** → Add "Works with" agent compatibility badges
4. **Plugins** → Agent selector ready (Claude Code now, others later)
5. **Install UX** → Copy command on cards, detailed modal with scope options
6. **Architecture** → Ready for Cursor, Windsurf, Codex expansion

**Value Proposition:** THE directory for AI coding augments - frameworks that work everywhere, plugins organized by agent.
