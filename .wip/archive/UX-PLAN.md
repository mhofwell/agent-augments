# UX Overhaul Plan

**Goal**: Transform Agent Augments from a "developer tool catalog" into a "curated marketplace" that answers "What should I install and why?"

**Aesthetic Direction**: Maintain dark-mode-first, but shift from dense uniformity to visual hierarchy with breathing room. Think Raycast Extensions, not npm.

---

## Phase 1: Hero Spotlight & Visual Hierarchy

**Problem**: Wall of sameness. All 147 plugins look identical. Featured section duplicates content below.

**Solution**: Replace Featured with a dramatic Hero Spotlight for 1-2 transformative plugins.

### Tasks

1. **Add `featured_order` column to plugins table**
   - Nullable integer column
   - `featured_order = 1` = primary hero, `= 2` = secondary
   - Migration: `ALTER TABLE plugins ADD COLUMN featured_order INTEGER;`

2. **Create `HeroSpotlight` component**
   - Full-width container with generous padding
   - Primary plugin: Large title, full description (no truncation), author, install count
   - Screenshot/demo placeholder area (future: actual screenshots)
   - Prominent "Add to Agent" CTA button
   - Secondary plugin: Smaller card beside primary (optional, 2-up layout)
   - Visual distinction: Gradient border, subtle glow effect, different card structure

3. **Update `HomeContent` to use Hero**
   - Remove current Featured section
   - Insert `HeroSpotlight` component above grid
   - Pass featured plugins from API

4. **Update plugins API**
   - Add `featured=true` query param to return only featured plugins
   - Order by `featured_order ASC`

5. **Admin: Set initial featured plugins**
   - Run SQL to mark 2 plugins as featured (pr-review-toolkit, sugar, or similar high-value ones)

### Visual Spec

```
┌─────────────────────────────────────────────────────────────────┐
│  ✨ SPOTLIGHT                                                   │
│                                                                 │
│  ┌─────────────────────────────────┐  ┌───────────────────────┐│
│  │  [Agent Badge]                  │  │ plugin-dev            ││
│  │                                 │  │ 7 expert skills...    ││
│  │  pr-review-toolkit              │  │                       ││
│  │  by Anthropic                   │  │ [Add to Agent]        ││
│  │                                 │  └───────────────────────┘│
│  │  Comprehensive PR review agents │                           │
│  │  specializing in comments,      │                           │
│  │  tests, error handling...       │                           │
│  │                                 │                           │
│  │  ⬇ 2.4K installs · productivity │                           │
│  │                                 │                           │
│  │  [ Add to Agent ]  [ Learn More]│                           │
│  └─────────────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 2: Install Command UX

**Problem**: Every card screams `/plugin install...` in bright cyan. Visual noise. Premature call-to-action.

**Solution**: Hide install commands until hover. Show only on intent.

### Tasks

1. **Update `PluginCard` component**
   - Default state: Show type badge, title, source, description, stats
   - Remove install command from default view
   - Add hover state: Slide in install command from bottom
   - Use CSS transition for smooth reveal (transform + opacity)

2. **Add "Add to Agent" micro-CTA**
   - Small button or icon that appears on hover
   - Clicking opens modal (existing behavior) OR copies install command with toast
   - Decide: Direct copy vs modal? (Recommend: icon button → copy, card click → modal)

3. **Update `SkillCard` similarly**
   - Same hover-to-reveal pattern for consistency

### Visual Spec

```
Default State:
┌──────────────────────────────┐
│ [Agent]        [New][Claude] │
│                              │
│ sugar                        │
│ cc-marketplace               │
│                              │
│ Transform Claude Code into   │
│ an autonomous AI development │
│ powerhouse with rich task... │
│                              │
│ ⬇ 0  ◎ workflow              │
└──────────────────────────────┘

Hover State:
┌──────────────────────────────┐
│ [Agent]        [New][Claude] │
│                              │
│ sugar                   [📋] │  ← Copy button appears
│ cc-marketplace               │
│                              │
│ Transform Claude Code into   │
│ an autonomous AI development │
│ powerhouse with rich task... │
│                              │
│ /plugin install sugar@cc...  │  ← Slides up
└──────────────────────────────┘
```

---

## Phase 3: Category Sections

**Problem**: Categories buried in dropdown filter. No visual organization.

**Solution**: Surface top categories as browsable sections.

### Tasks

1. **Group plugins by category in grid**
   - Instead of one flat grid, show category headers
   - Each category shows 3-6 plugins + "View all X →" link
   - Categories: Development, Workflow, Documentation, Security, Testing, etc.

2. **Create `CategorySection` component**
   - Section header with category name + plugin count
   - Horizontal scroll or 3-column grid
   - "View all" link filters to that category

3. **Update `HomeContent` layout**
   - Hero Spotlight (featured)
   - "All Plugins" toggle vs "Browse by Category" toggle
   - Default: Category browsing (curated feel)
   - Toggle: Flat grid (power user)

4. **Smart category ordering**
   - Order categories by total installs or plugin count
   - Put most popular categories first

### Visual Spec

```
┌─────────────────────────────────────────────────────────────────┐
│ Development                                         View all → │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│ │ plugin1  │ │ plugin2  │ │ plugin3  │ │ plugin4  │            │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
├─────────────────────────────────────────────────────────────────┤
│ Workflow                                            View all → │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│ │ plugin5  │ │ plugin6  │ │ plugin7  │                         │
│ └──────────┘ └──────────┘ └──────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase 4: Value Proposition & Onboarding

**Problem**: Hero says "147 plugins across 6 marketplaces" - inventory, not value.

**Solution**: Lead with outcomes. Help new users understand what this is.

### Tasks

1. **Update hero copy**
   - Current: "Plugins" / "147 plugins across 6 marketplaces"
   - New: "Supercharge Your AI Agent" / "Skills, frameworks, and automations from the community"

2. **Add contextual subtitle per tab**
   - Plugins: "Ready-to-install packages that extend your agent's capabilities"
   - Skills: "Individual capabilities that work across multiple AI coding agents"
   - Frameworks: "Structured methodologies for AI-assisted development"

3. **First-visit onboarding** (optional enhancement)
   - Detect first visit (localStorage)
   - Show brief tooltip or banner: "New here? Start with these essentials →"
   - Link to featured plugins

---

## Phase 5: Search Unification

**Problem**: Two search bars (header + tab-level) compete for attention.

**Solution**: Single unified search with smart filtering.

### Tasks

1. **Remove tab-level search inputs**
   - Remove search input from Plugins tab
   - Remove search input from Skills tab
   - Remove search input from Frameworks tab

2. **Enhance header search**
   - Already has unified search component
   - Add type filters as chips: "in:plugins", "in:skills", "in:frameworks"
   - Or: Auto-switch tabs based on result type clicked

3. **Mobile: Show search prominently**
   - Currently hidden on mobile (lg screens only)
   - Add mobile search button that expands to full search

---

## Phase 6: Card Density & Scanability

**Problem**: Cards pack too much info. Hard to scan quickly.

**Solution**: Progressive disclosure. Show less by default, expand on interest.

### Tasks

1. **Simplify default card state**
   - Must show: Type badge, title, one-line description
   - Show on hover: Full description, stats, install command
   - Consider: "Compact" vs "Detailed" view toggle

2. **Add description expand on hover**
   - Currently: 3-line clamp always
   - New: 2-line clamp default, expand to full on hover (max 5 lines)

3. **Stats de-emphasis**
   - Move stats (install count, category) to hover or subtle footer
   - Prioritize what the plugin DOES over metadata

---

## Phase 7: Polish & Microinteractions

**Problem**: Interactions are functional but not delightful.

**Solution**: Add subtle polish to key moments.

### Tasks

1. **Card hover effects**
   - Subtle lift (translateY -2px)
   - Border glow on hover (use type color)
   - Staggered fade-in for hover elements

2. **Copy feedback**
   - Current: Toast notification
   - Add: Brief icon animation (checkmark bounce)

3. **Tab transitions**
   - Add fade/slide between tab content
   - Skeleton loading with stagger

4. **Hero spotlight animation**
   - Subtle gradient animation on hero border
   - Fade-in on page load

---

## Implementation Order

| Phase | Effort | Impact | Status |
|-------|--------|--------|--------|
| 1. Hero Spotlight | Medium | High | ✅ Complete |
| 2. Install Command UX | Low | High | ✅ Complete |
| 3. Category Sections | Medium | High | ✅ Complete |
| 4. Value Prop | Low | Medium | ✅ Complete |
| 5. Search Unification | Low | Medium | ✅ Complete |
| 6. Card Density | Medium | Medium | ✅ Complete |
| 7. Polish | Low | Low | ✅ Complete |

---

## Files to Modify

### Phase 1
- `supabase/migrations/` - Add featured_order column
- `src/components/home/hero-spotlight.tsx` - NEW
- `src/components/home/home-content.tsx` - Integrate hero
- `src/app/api/plugins/route.ts` - Featured query param

### Phase 2
- `src/components/plugin/plugin-card.tsx` - Hover state
- `src/components/skill/skill-card.tsx` - Hover state

### Phase 3
- `src/components/home/category-section.tsx` - NEW
- `src/components/home/home-content.tsx` - Category layout

### Phase 4
- `src/components/home/home-content.tsx` - Copy updates

### Phase 5
- `src/components/home/home-content.tsx` - Remove search inputs
- `src/components/layout/header.tsx` - Mobile search

### Phase 6
- `src/components/plugin/plugin-card.tsx` - Simplified default

### Phase 7
- `src/app/globals.css` - Animations
- Various components - Polish touches

---

## Success Metrics

- **Reduced time to first install**: User finds and installs a plugin faster
- **Reduced bounce rate**: Users engage with content instead of leaving
- **Increased click-through on featured**: Hero spotlight drives discovery
- **Qualitative**: Site feels "curated" not "dumped"

---

## Open Questions

1. **Screenshots for Hero**: Do we want to add screenshot URLs to plugins table for rich hero display?
2. **Category naming**: Use existing category values as-is, or create friendlier display names?
3. **Mobile layout**: Horizontal scroll for categories, or stack vertically?

---

## Notes

- Preserve existing semantic color system (type colors are sacred)
- Don't break existing functionality while iterating
- Test each phase in isolation before moving to next
- Consider A/B testing hero vs no-hero if analytics available
