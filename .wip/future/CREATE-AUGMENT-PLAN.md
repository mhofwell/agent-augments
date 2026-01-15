# Create Augment - Composition Wizard Plan

## Problem Statement

Users don't know which augment type to create:
- Skill? Command? Subagent? Hook? Rule in CLAUDE.md?
- When should a command call a skill?
- When should a subagent orchestrate multiple skills?

The taxonomy is confusing even for power users. Users guess, get it wrong, refactor.

**Goal**: Guide users to the right augment type through intent-based questions, then either generate files or delegate to Claude Code's native flows.

---

## Mental Model

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   CAPABILITIES          TRIGGERS            CONSTRAINTS         │
│   (what)                (when)              (how)               │
│                                                                 │
│   Skills                Commands            Rules               │
│                         Agents              CLAUDE.md           │
│                         Hooks                                   │
│                                                                 │
│   "Claude can..."       "Claude does        "Claude always..."  │
│                          this when..."      "Claude never..."   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Key Insight**: Skills are the building blocks. Everything else is orchestration or constraints.

---

## Claude Code Official Structure

### File Locations

| Type | Project Location | Personal Location |
|------|------------------|-------------------|
| Skills | `.claude/skills/<name>/SKILL.md` | `~/.claude/skills/<name>/SKILL.md` |
| Commands | `.claude/commands/<name>.md` | `~/.claude/commands/<name>.md` |
| Agents | `.claude/agents/<name>.md` | `~/.claude/agents/<name>.md` |
| Rules | `.claude/rules/<name>.md` | `~/.claude/rules/<name>.md` |
| Main Rules | `CLAUDE.md` or `.claude/CLAUDE.md` | `~/.claude/CLAUDE.md` |
| Hooks | `.claude/settings.json` | `~/.claude/settings.json` |

### Naming Conventions

- **Skill names**: lowercase, hyphens only (e.g., `code-review-expert`)
- **Skill directory**: Must match `name` field in frontmatter
- **Command files**: Filename becomes command name (e.g., `deploy.md` → `/deploy`)
- **Agent names**: lowercase, hyphens (e.g., `security-validator`)
- **Rule files**: Descriptive lowercase with hyphens (e.g., `api-design.md`)

---

## Decision Tree

```
START: What do you want Claude to do?
│
├─► Should it ALWAYS apply (passive behavior)?
│   │
│   ├─ Yes → Is it specific to this project?
│   │         ├─ Yes → CLAUDE.md or .claude/rules/*.md
│   │         └─ No  → ~/.claude/CLAUDE.md or ~/.claude/rules/*.md
│   │
│   └─ No → Continue...
│
├─► Is it triggered by an EVENT (tool use, session start, etc)?
│   │
│   ├─ Yes → HOOK in settings.json
│   └─ No  → Continue...
│
├─► Does it need EXTERNAL tools/APIs?
│   │
│   ├─ Yes → MCP SERVER (possibly wrapped in skill)
│   └─ No  → Continue...
│
├─► Is it a SIMPLE one-shot action?
│   │
│   ├─ Yes → COMMAND (inline logic)
│   └─ No  → Continue...
│
├─► Does it need to run AUTONOMOUSLY in parallel?
│   │
│   ├─ Yes → AGENT (may call skills)
│   └─ No  → Continue...
│
└─► Default: SKILL
    │
    └─► Should it have a quick trigger?
        ├─ Yes → COMMAND that invokes the SKILL
        └─ No  → SKILL only (invoked naturally or via Skill tool)
```

---

## Composition Patterns

### Pattern 1: Standalone Command
```
┌──────────┐
│ /commit  │ ──→ (inline logic, simple)
└──────────┘
```
**Use when**: Simple, one-shot, doesn't need reuse.
**Files**: `.claude/commands/commit.md`

### Pattern 2: Command → Skill
```
┌──────────┐      ┌─────────────┐
│ /deploy  │ ──→  │ deploy-flow │
└──────────┘      └─────────────┘
```
**Use when**: Complex logic that benefits from skill's structure. Quick trigger needed.
**Files**:
- `.claude/commands/deploy.md`
- `.claude/skills/deploy-flow/SKILL.md`

### Pattern 3: Agent → Skills
```
┌────────────┐      ┌─────────────┐
│ code-review│ ──→  │ lint-check  │
│  agent     │ ──→  │ test-runner │
└────────────┘ ──→  │ security    │
                    └─────────────┘
```
**Use when**: Orchestrating multiple capabilities autonomously.
**Files**:
- `.claude/agents/code-review.md` (with `skills:` field)
- `.claude/skills/lint-check/SKILL.md`
- `.claude/skills/test-runner/SKILL.md`
- `.claude/skills/security/SKILL.md`

### Pattern 4: Hook → Command/Skill
```
┌────────────┐      ┌─────────────┐
│ PostToolUse│ ──→  │ auto-format │
│   hook     │      └─────────────┘
└────────────┘
```
**Use when**: Event-driven automation.
**Files**:
- `.claude/settings.json` (hook config)
- `.claude/skills/auto-format/SKILL.md` (optional, if complex)

### Pattern 5: Rule (No Code)
```
CLAUDE.md or .claude/rules/testing.md:
- Always write tests before implementation
- Never commit directly to main
```
**Use when**: Behavioral constraint, no custom logic.
**Files**: `CLAUDE.md` or `.claude/rules/<topic>.md`

---

## Official Templates (Anthropic Best Practices)

### Skill Template

**File**: `.claude/skills/<skill-name>/SKILL.md`

```yaml
---
name: skill-name
description: >
  Concise description of what this skill does.
  Include trigger keywords users would naturally say.
  Max 1024 characters.
model: sonnet                    # Optional: sonnet, opus, haiku, or full model ID
context: fork                    # Optional: run in isolated subagent context
agent: general-purpose           # Optional: agent type when context: fork
allowed-tools: Read, Grep, Glob, Bash  # Optional: tools this skill can use
user-invocable: true             # Optional: show in slash menu (default: true)
disable-model-invocation: false  # Optional: block Skill tool invocation
skills:                          # Optional: other skills to load (for subagents)
  - helper-skill-1
  - helper-skill-2
hooks:                           # Optional: scoped hooks
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate.sh $TOOL_INPUT"
          once: true
---

# Skill Title

Brief overview of what this skill accomplishes.

## When to Use

Describe the scenarios when Claude should invoke this skill.
Include specific trigger phrases users might say.

## Instructions

Step-by-step guidance for Claude:

1. First, understand the context by...
2. Then, analyze the requirements...
3. Execute the main task...
4. Finally, verify the results...

## Constraints

- Never do X without confirmation
- Always check Y before proceeding
- Maximum Z attempts before asking for help

## Examples

### Example 1: Basic Usage

User says: "run the tdd flow"

Claude should:
1. Run tests
2. Analyze failures
3. Fix issues
4. Commit when green

## Additional Resources

For detailed API documentation, see [reference.md](reference.md)
For more examples, see [examples.md](examples.md)
```

**Required Fields**:
- `name`: lowercase, letters/numbers/hyphens, max 64 chars, must match directory name
- `description`: explains what skill does, include trigger keywords

**Optional Fields**:
| Field | Values | Purpose |
|-------|--------|---------|
| `model` | `sonnet`, `opus`, `haiku`, or full ID | Override model for this skill |
| `context` | `fork` | Run in isolated subagent with own history |
| `agent` | `general-purpose`, `Explore`, `Plan` | Agent type when forked |
| `allowed-tools` | comma-separated or YAML list | Tools skill can use without asking |
| `user-invocable` | `true`/`false` | Show in slash menu |
| `disable-model-invocation` | `true`/`false` | Block Skill tool access |
| `skills` | list of skill names | Skills to load into subagent |
| `hooks` | hook configuration | Lifecycle hooks scoped to skill |

---

### Command Template

**File**: `.claude/commands/<command-name>.md`

```yaml
---
description: Brief description shown in /help
argument-hint: "[file] [--verbose]"
allowed-tools: Bash(npm test:*), Read, Edit
model: sonnet                    # Optional: override model
context: fork                    # Optional: run in isolated context
agent: general-purpose           # Optional: agent type when forked
disable-model-invocation: false  # Optional: block Skill tool access
hooks:                           # Optional: scoped hooks
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/pre-check.sh"
          once: true
---

# Command Title

What this command does and when to use it.

## Context

Current branch: !`git branch --show-current`
Modified files: !`git status --short`

## Instructions

Based on the context above and the user's arguments ($ARGUMENTS):

1. First step...
2. Second step...
3. Final step...

## Arguments

- `$1` - First positional argument (e.g., filename)
- `$2` - Second positional argument (e.g., flag)
- `$ARGUMENTS` - All arguments as a string

## Examples

/command-name src/app.ts --verbose
```

**Features**:
- `!`backtick`` - Execute bash and include output in prompt
- `@path/to/file` - Include file contents in prompt
- `$ARGUMENTS` - All user arguments
- `$1`, `$2`, etc. - Positional arguments

**Required Field**:
- `description` or first line of file

---

### Agent Template

**File**: `.claude/agents/<agent-name>.md`

```yaml
---
name: agent-name
description: >
  When to use this agent. Include specific trigger keywords
  that Claude should look for to delegate work here.
tools: Read, Grep, Glob, Bash
disallowedTools: Edit, Write    # Optional: explicit denials
model: sonnet                    # sonnet, opus, haiku, or inherit
permissionMode: default          # default, acceptEdits, dontAsk, bypassPermissions, plan
skills:                          # Optional: skills to inject at startup
  - code-review-checklist
  - security-scanner
hooks:                           # Optional: lifecycle hooks
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-command.sh $TOOL_INPUT"
---

You are a specialized agent for [specific domain].

## Role

Describe the agent's expertise and focus area.

## Responsibilities

- Primary responsibility 1
- Primary responsibility 2
- Primary responsibility 3

## Approach

How this agent should approach problems:

1. First, gather context...
2. Then, analyze...
3. Finally, provide actionable feedback...

## Constraints

- Never modify files (read-only analysis)
- Always explain reasoning
- Escalate to user if uncertain

## Output Format

Structure findings as:
- **Issue**: Description
- **Location**: File and line
- **Severity**: High/Medium/Low
- **Recommendation**: How to fix
```

**Required Fields**:
- `name`: unique identifier (lowercase, hyphens)
- `description`: when Claude should delegate to this agent

**Permission Modes**:
| Mode | Behavior |
|------|----------|
| `default` | Standard permission prompts |
| `acceptEdits` | Auto-accept file edits |
| `dontAsk` | Auto-deny prompts (allowed tools still work) |
| `bypassPermissions` | Skip all permission checks |
| `plan` | Read-only exploration mode |

**Model Choices**:
| Model | Best For |
|-------|----------|
| `haiku` | Fast, read-only exploration |
| `sonnet` | General work (default) |
| `opus` | Complex analysis |
| `inherit` | Use parent model |

---

### Hook Template

**File**: `.claude/settings.json`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.command' | ./scripts/validate-bash.sh",
            "timeout": 60
          }
        ]
      },
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/check-file-protection.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | xargs -I {} npx prettier --write \"{}\""
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/prompt-validator.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Review if the task is truly complete. Consider edge cases.",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

**Supported Events**:
| Event | Matcher | Purpose |
|-------|---------|---------|
| `PreToolUse` | Yes | Block/allow/modify tool calls |
| `PostToolUse` | Yes | React to tool results |
| `UserPromptSubmit` | No | Validate user prompts |
| `Stop` | No | Decide if Claude should stop |
| `SessionStart` | Yes | Initialize environment |
| `SessionEnd` | No | Cleanup tasks |
| `Notification` | Yes | Custom notifications |

**Matcher Patterns**:
- `"Bash"` - Exact match
- `"Edit|Write"` - Regex OR
- `"mcp__github__*"` - Wildcard for MCP tools
- `"*"` or `""` - All tools

**Exit Codes**:
- `0` - Success (process stdout as JSON)
- `2` - Block action (only stderr shown)
- Other - Non-blocking error

---

### Rule Template

**File**: `CLAUDE.md` (main project rules)

```markdown
# Project Name

## Overview

Brief description of the project, its purpose, and tech stack.

## Architecture

- Frontend: React + TypeScript
- Backend: Node.js + Express
- Database: PostgreSQL
- See @docs/architecture.md for details

## Development Workflow

1. Create feature branch from `main`
2. Write tests first (TDD)
3. Implement feature
4. Run `npm test` and `npm run lint`
5. Create PR for review

## Coding Standards

- Use 2-space indentation
- TypeScript strict mode required
- All functions must have JSDoc comments
- No `any` types without explicit justification

## Common Commands

- `npm run dev` - Start development server
- `npm test` - Run test suite
- `npm run build` - Production build
- `npm run lint` - Check code style

## File References

- @README.md - Project overview
- @package.json - Dependencies
- @docs/api.md - API documentation
```

**File**: `.claude/rules/testing.md` (modular rules)

```yaml
---
paths:
  - "**/*.test.ts"
  - "**/*.spec.ts"
  - "src/**/__tests__/**"
---

# Testing Standards

## Test Structure

- Use `describe` blocks for grouping
- Use `it` for individual tests
- Follow Arrange-Act-Assert pattern

## Naming Conventions

- Test files: `*.test.ts` or `*.spec.ts`
- Describe blocks: noun (the thing being tested)
- It blocks: verb phrase (what it should do)

## Coverage Requirements

- Minimum 80% line coverage
- 100% coverage for critical paths
- All edge cases must have tests

## Mocking

- Use dependency injection over global mocks
- Reset mocks in `beforeEach`
- Avoid mocking implementation details
```

**Path Patterns**:
| Pattern | Matches |
|---------|---------|
| `**/*.ts` | All TypeScript files |
| `src/**/*` | All files under src/ |
| `*.md` | Markdown in root only |
| `{src,lib}/**/*.ts` | TS files in src/ or lib/ |

---

## CLI Flow: `npx augs create`

### Step 1: Intent Capture

```
$ npx augs create

  What do you want Claude to do?
  ─────────────────────────────────────────────────────────────
  │ Run tests, fix failures, and commit when green            │
  ─────────────────────────────────────────────────────────────

  Press Enter to continue...
```

### Step 2: Trigger Question

```
  When should this happen?

  ○ When I type a command (e.g., /tdd)
  ○ When an event occurs (e.g., after tool use)
  ○ Always (behavioral rule)
  ● When I ask naturally ("run the TDD flow")

  Use ↑↓ to navigate, Enter to select
```

### Step 3: Complexity Question

```
  How complex is the task?

  ○ Simple, one-shot action
  ● Multi-step workflow with decisions
  ○ Needs to run independently in parallel

  Use ↑↓ to navigate, Enter to select
```

### Step 4: Reusability Question

```
  Should this logic be reusable by other augments?

  ● Yes, other commands or agents might use it
  ○ No, it's a one-off

  Use ↑↓ to navigate, Enter to select
```

### Step 5: Recommendation

```
  ───────────────────────────────────────────────────────────────

  Recommended: Skill with /tdd command trigger

  ┌─────────────┐
  │   /tdd      │ command (quick trigger)
  └──────┬──────┘
         │ invokes via Skill tool
         ▼
  ┌─────────────┐
  │  tdd-flow   │ skill (the logic)
  └─────────────┘

  Files to create:
  • .claude/commands/tdd.md
  • .claude/skills/tdd-flow/SKILL.md

  Why:
  • Multi-step workflow → Skill gives structure
  • Needs quick trigger → Command provides /tdd
  • Reusable → Other agents can call the skill too

  ───────────────────────────────────────────────────────────────

  How would you like to create this?

  ○ Generate files now (augs will create the files)
  ● Use Claude Code /skill wizard (recommended for best practices)
  ○ Show me the template (I'll create manually)

  Use ↑↓ to navigate, Enter to select
```

### Step 6a: Generate Files

```
  Creating augment files...

  ✓ Created .claude/skills/tdd-flow/SKILL.md
  ✓ Created .claude/commands/tdd.md

  Files created! The augment is ready to use.

  To test it:
  • Type /tdd in Claude Code
  • Or say "run the TDD flow"
```

### Step 6b: Delegate to Claude Code

```
  ───────────────────────────────────────────────────────────────

  To create this skill with Claude Code's best practices:

  1. Open Claude Code in your project
  2. Type: /skill
  3. Describe: "TDD flow that runs tests, analyzes failures,
     fixes code, and commits when green"
  4. Claude Code will generate the skill with proper structure

  After the skill is created, add the command trigger:

    npx augs create --command tdd --invokes tdd-flow

  ───────────────────────────────────────────────────────────────
```

---

## Architecture

### CLI Package Additions

```
packages/augs-cli/
├── src/
│   ├── commands/
│   │   └── create.ts              # Wizard entry point
│   ├── wizard/
│   │   ├── index.ts               # Wizard orchestrator
│   │   ├── questions.ts           # Question definitions
│   │   ├── decision-tree.ts       # Type recommendation logic
│   │   ├── templates/
│   │   │   ├── skill.ts           # Skill template generator
│   │   │   ├── command.ts         # Command template generator
│   │   │   ├── agent.ts           # Agent template generator
│   │   │   ├── hook.ts            # Hook template generator
│   │   │   └── rule.ts            # Rule template generator
│   │   └── generator.ts           # File writing
│   └── ...existing
```

### Web App Additions

```
src/
├── app/
│   └── create/
│       └── page.tsx               # Create wizard page
├── components/
│   └── create/
│       ├── wizard-form.tsx        # Multi-step form
│       ├── type-recommendation.tsx # Shows recommendation
│       ├── template-preview.tsx   # Preview generated files
│       └── index.ts
└── lib/
    └── wizard/
        ├── decision-tree.ts       # Shared with CLI
        └── templates.ts           # Shared with CLI
```

### Shared Logic

```typescript
// packages/shared/src/wizard/decision-tree.ts

interface WizardInput {
  intent: string
  trigger: 'command' | 'event' | 'always' | 'natural'
  complexity: 'simple' | 'multi-step' | 'autonomous'
  reusable: boolean
}

interface WizardOutput {
  primaryType: 'skill' | 'command' | 'agent' | 'hook' | 'rule'
  composition: {
    type: 'standalone' | 'command-invokes-skill' | 'agent-uses-skills'
    components: string[]
  }
  files: GeneratedFile[]
  reasoning: string[]
}

interface GeneratedFile {
  path: string
  content: string
  type: 'skill' | 'command' | 'agent' | 'hook' | 'rule'
}

export function recommendAugmentType(input: WizardInput): WizardOutput {
  // Decision tree logic
}
```

---

## Success Metrics

### Wizard Completion
- [ ] User can complete wizard in under 60 seconds
- [ ] Recommendation matches user intent 90%+ of the time
- [ ] Generated files work without modification
- [ ] Generated files follow Anthropic's official structure

### User Satisfaction
- [ ] Users create correct type on first try (vs. previous trial-and-error)
- [ ] Reduction in "how do I create a skill" support questions
- [ ] Positive feedback on wizard UX

### Adoption
- [ ] X% of new augments created via wizard (vs. manual)
- [ ] Repeat usage of wizard by same users

---

## Implementation Phases

### Phase 1: CLI Wizard (MVP)
- [ ] Implement decision tree logic
- [ ] Create interactive CLI prompts
- [ ] Generate files for skill and command types
- [ ] Validate generated files match Anthropic's structure
- [ ] Delegate to Claude Code for complex cases

### Phase 2: Web UI Wizard
- [ ] Create `/create` page
- [ ] Implement wizard form component
- [ ] Show template preview with syntax highlighting
- [ ] Generate CLI command to copy
- [ ] Download files as zip

### Phase 3: All Augment Types
- [ ] Agent templates with skills integration
- [ ] Hook templates (JSON for settings.json)
- [ ] Rule templates (CLAUDE.md and .claude/rules/)
- [ ] MCP server scaffolding

### Phase 4: Intelligence
- [ ] Analyze user's existing augments
- [ ] Suggest compositions based on patterns
- [ ] "Similar augments" recommendations
- [ ] Conflict detection before creation

---

## Open Questions

1. **Template richness**: How much structure should templates include?
   - **Recommendation**: Full example with comments explaining each section

2. **Claude Code integration**: Should we detect if user has Claude Code?
   - **Recommendation**: Yes, offer `/skill` delegation when detected

3. **Validation**: Should wizard validate generated files?
   - **Recommendation**: Yes, basic schema validation + offer to test

4. **Community templates**: Allow users to share compositions?
   - **Recommendation**: Future feature, start with official templates
