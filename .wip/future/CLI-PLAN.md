# Augs CLI - Connect & Sync Plan

## Vision

A CLI tool (`npx augs`) that connects local Claude Code setups to the Agent Augments web UI, enabling:
- Real-time visibility into installed augments
- Installation tracking with modification detection
- Multi-project awareness
- Guided augment creation with composition intelligence

```
┌─────────────────┐     WebSocket      ┌─────────────────┐
│   Web Browser   │◄──────────────────►│  Local CLI      │
│   (React UI)    │                    │  (bun/node)     │
└─────────────────┘                    └────────┬────────┘
                                               │
                                      ┌────────▼────────┐
                                      │  File Watcher   │
                                      │  (chokidar)     │
                                      └────────┬────────┘
                                               │ watches
                   ┌───────────────────────────┼───────────────────────────┐
                   ▼                           ▼                           ▼
           ~/.claude/                  ./project/.claude/           CLAUDE.md files
           settings.json               skills/, commands/           (any depth)
                   │
                   └──────────► ~/.augments/manifest.json (installation tracking)
```

---

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Repo structure** | Monorepo (`packages/augs-cli`) | Shared types with web app, easier development |
| **Build tool** | Bun | Consistency with web app |
| **Runtime target** | Node.js | Broader compatibility for npm distribution |
| **Package registry** | npm | Enables `npx augs` to work |
| **Auth (Phase 1)** | Anonymous, session-based | No friction for local use |
| **Auth (Phase 2+)** | Optional GitHub auth | For cloud sync features |
| **Default scope** | Project | Safety: doesn't affect other projects |

---

## Phase 1: Read-Only MVP

**Goal**: User can see their local augments in the web UI with real-time updates.

### CLI Commands

```bash
npx augs scan              # Detect all augments, print summary to terminal
npx augs connect           # Start WebSocket server + open browser
npx augs manifest          # Export JSON manifest to stdout
npx augs manifest --json   # Machine-readable output
```

### What We Detect

| Location | What to Find |
|----------|--------------|
| `~/.claude/` | Global settings, MCP servers |
| `./.claude/` | Project skills, commands, hooks |
| `./CLAUDE.md` | Project instructions |
| `**/SKILL.md` | Skill definitions |
| `**/settings.json` | Claude Code config |

### Web UI Features

- `/connect` route with WebSocket client
- Dashboard showing installed augments by category
- Real-time updates as files change locally
- "You have this" badges on marketplace items
- Connection status indicator

### WebSocket Protocol

**Port**: `3847` (mnemonic: "AUGS" on phone keypad), configurable via `--port`

**Session Security**:
- CLI generates unique token on `connect`
- Token included in browser URL: `/connect?token=abc123`
- Prevents unauthorized access to local setup

**Message Types**:
```typescript
// CLI → Browser
{ type: 'manifest', data: AugmentManifest }
{ type: 'update', data: AugmentManifest }
{ type: 'error', message: string }

// Browser → CLI (Phase 2)
{ type: 'install', plugin: string, scope: 'project' | 'global' }
{ type: 'remove', plugin: string }
```

### File Watching

- Use `chokidar` for cross-platform support
- Debounce 500ms to avoid spam
- Ignore: `node_modules`, `.git`, build outputs

### Success Criteria

- [ ] `npx augs scan` shows local augments in terminal
- [ ] `npx augs connect` opens browser with live dashboard
- [ ] File changes reflect in UI within 1 second
- [ ] "You have this" badges work on marketplace items
- [ ] Disconnect/reconnect works gracefully

---

## Phase 2: Installation & Tracking

**Goal**: Install, remove, and update augments with full tracking of what was installed vs. user-created.

### CLI Commands

```bash
npx augs install <name>              # Install to project scope (default)
npx augs install <name> --global     # Install to ~/.claude/
npx augs install <name> --project    # Explicit project scope
npx augs remove <name>               # Remove files + update manifest
npx augs update <name>               # Fetch latest version, apply if unmodified
npx augs upgrade                     # Update all outdated augments
npx augs status                      # Show installed + modification status
```

### Installation Tracking

All installations tracked in `~/.augments/manifest.json`:

```typescript
interface InstallationManifest {
  version: '1.0'
  installed: {
    [id: string]: {
      source: 'marketplace' | 'github' | 'local'
      marketplace_id?: string
      version?: string
      installed_at: string
      installed_to: string[]        // Paths where files were placed
      content_hash: string          // SHA256 of original content
      modified: boolean             // User edited after install?
    }
  }
}
```

### Install Flow

```
1. User runs: npx augs install memory
2. CLI fetches from marketplace API
3. Downloads files to ~/.augments/cache/memory/
4. Copies to target location:
   - Project scope: ./project/.claude/commands/memory.md
   - Global scope: ~/.claude/commands/memory.md
5. Records in manifest with content hash
6. File watcher detects change
7. WebSocket pushes updated manifest to browser
```

### Modification Detection

On every scan:
1. Read manifest for tracked installations
2. Hash current file contents
3. Compare with stored `content_hash`
4. Update `modified: true` if changed

This enables:
- **Status display**: "memory (modified)" vs "memory (v1.2.0)"
- **Safe updates**: Warn before overwriting user modifications
- **Clean removes**: Know exactly which files to delete

### Web UI → CLI Flow

```
1. User clicks "Install" on web UI
2. WebSocket message: { type: 'install', plugin: 'memory', scope: 'project' }
3. CLI receives, prompts for confirmation in terminal
4. CLI executes install flow
5. Success/error sent back via WebSocket
```

### Safety Features

- Confirmation prompts in CLI for all write operations
- `--yes` flag to skip confirmation (for scripts)
- `--dry-run` flag to preview changes
- Backup before destructive operations
- Conflict detection: "This will overwrite X (modified). Continue? [y/N]"

### Success Criteria

- [ ] `npx augs install` downloads and tracks in manifest
- [ ] `npx augs status` shows installed vs modified vs user-created
- [ ] `npx augs update` detects outdated, warns if modified, applies update
- [ ] `npx augs remove` cleanly removes tracked augments
- [ ] Web UI can trigger installs via WebSocket

---

## Phase 3: Multi-Project Awareness

**Goal**: Manage augments across multiple projects from a single view.

### CLI Commands

```bash
npx augs projects add .              # Register current directory
npx augs projects add ~/code/myapp   # Register specific directory
npx augs projects list               # Show all registered projects
npx augs projects remove <path>      # Unregister a project
npx augs scan --all                  # Scan all registered projects
npx augs connect --all               # Connect with all projects visible
```

### Project Registry

Stored in `~/.augments/projects.json`:

```typescript
interface ProjectRegistry {
  version: '1.0'
  projects: {
    [path: string]: {
      name: string                   // Detected from package.json or folder name
      added_at: string
      last_scanned?: string
    }
  }
}
```

### Web UI Matrix View

With multi-project data, the web UI can show:

```
┌──────────────────┬────────────┬──────────────┬──────────────┐
│  Augment         │  Global    │  webapp      │  api-service │
├──────────────────┼────────────┼──────────────┼──────────────┤
│  memory          │  ✓ v1.2.0  │      -       │      -       │
│  deploy          │     -      │  ✓ v1.0.0    │  ✓ v1.0.0    │
│  testing         │     -      │  ✓ v1.1.0    │  ⚠ v1.0.0   │
└──────────────────┴────────────┴──────────────┴──────────────┘
```

### Success Criteria

- [ ] Can register/list/remove projects
- [ ] `npx augs scan --all` shows augments across all projects
- [ ] Web UI shows matrix view of augments per project
- [ ] Can install to specific project from web UI

---

## Phase 4: Create Wizard

**Goal**: Guide users to the correct augment type through intent-based questions.

### CLI Command

```bash
npx augs create                      # Interactive wizard
npx augs create --type skill         # Skip to skill template
npx augs create --command tdd --calls tdd-flow  # Create command that calls skill
```

### Decision Tree

```
What do you want Claude to do?
│
├─► Always apply (passive)? → RULE (CLAUDE.md)
├─► Triggered by event? → HOOK
├─► Needs external APIs? → MCP SERVER
├─► Simple one-shot? → COMMAND (inline)
├─► Runs autonomously? → SUBAGENT
└─► Complex multi-step? → SKILL
    └─► Need quick trigger? → COMMAND that calls SKILL
```

### Integration with Claude Code

When creating complex augments, offer delegation:

```
Recommended: Skill with /tdd command trigger

How would you like to create this?

○ Generate files now (augs will create the files)
● Use Claude Code /skill wizard (recommended for best practices)
○ Show me the template (I'll create manually)
```

This positions the CLI as a "meta layer" - helping users choose the right approach, then either generating files or delegating to Claude Code's native flows.

### Success Criteria

- [ ] Wizard asks 2-3 questions to determine type
- [ ] Generates correct file structure for each type
- [ ] Can delegate to Claude Code /skill for complex cases
- [ ] Templates follow Claude Code best practices

**Full specification**: See `.wip/future/CREATE-AUGMENT-PLAN.md`

---

## Phase 5: Advanced Features

**Goal**: Power-user features for mature workflows.

### Planned Features

- **Daemon mode**: `npx augs daemon start` for background sync
- **Conflict detection**: "This skill conflicts with X"
- **Export/import**: `npx augs export > my-setup.json` to share with teammates
- **Recommendations**: "Based on your setup, try memory for persistent context"
- **Version pinning**: Lock specific versions to avoid breaking changes

### Success Criteria

- [ ] Daemon runs in background, survives terminal close
- [ ] Export produces shareable setup file
- [ ] Import applies setup to new machine
- [ ] Recommendations surface relevant augments

---

## Architecture

### Phase 1 Structure

```
packages/augs-cli/
├── src/
│   ├── index.ts              # CLI entry point (commander)
│   ├── types.ts              # Shared types
│   ├── commands/
│   │   ├── scan.ts           # Scan command
│   │   ├── connect.ts        # WebSocket server + browser open
│   │   └── manifest.ts       # JSON export
│   ├── scanner/
│   │   ├── index.ts          # Main scanner orchestrator
│   │   ├── global.ts         # ~/.claude/ scanner
│   │   ├── project.ts        # ./.claude/ scanner
│   │   ├── claude-md.ts      # CLAUDE.md parser
│   │   ├── skills.ts         # SKILL.md scanner
│   │   └── mcp.ts            # MCP server detection
│   └── server/
│       ├── websocket.ts      # WebSocket server
│       └── watcher.ts        # File system watcher (chokidar)
├── package.json
├── tsconfig.json
└── README.md
```

### Phase 2 Additions

```
├── src/
│   ├── commands/
│   │   ├── install.ts        # Download and track
│   │   ├── remove.ts         # Remove and untrack
│   │   ├── update.ts         # Update installed augments
│   │   └── status.ts         # Show installation status
│   └── manifest/
│       ├── index.ts          # Manifest read/write
│       ├── hash.ts           # Content hashing (SHA256)
│       └── types.ts          # InstallationManifest types
```

### Phase 3 Additions

```
├── src/
│   ├── commands/
│   │   └── projects.ts       # Project registry commands
│   └── projects/
│       ├── index.ts          # Registry read/write
│       └── types.ts          # ProjectRegistry types
```

### Phase 4 Additions

```
├── src/
│   ├── commands/
│   │   └── create.ts         # Wizard entry point
│   └── wizard/
│       ├── index.ts          # Wizard orchestrator
│       ├── questions.ts      # Interactive prompts
│       ├── decision-tree.ts  # Type recommendation logic
│       ├── templates.ts      # File templates
│       └── generator.ts      # File generation
```

### Web App Additions (All Phases)

```
src/
├── app/
│   └── connect/
│       └── page.tsx          # Connect dashboard
├── components/
│   └── connect/
│       ├── connection-status.tsx
│       ├── augment-dashboard.tsx
│       ├── project-matrix.tsx    # Phase 3
│       └── sync-indicator.tsx
```

---

## Manifest Schemas

### Scan Manifest (Runtime)

Sent via WebSocket, represents current state:

```typescript
interface AugmentManifest {
  version: '1.0'
  scanned_at: string
  session_token: string

  project: {
    path: string
    name: string
    has_claude_md: boolean
    claude_md_hash?: string
  }

  global: {
    claude_dir: string
    settings_path: string | null
  }

  augments: InstalledAugment[]
  mcp_servers: McpServer[]
}

interface InstalledAugment {
  id: string                              // Generated: "local/skill/memory"
  type: 'skill' | 'command' | 'hook' | 'agent' | 'bundle'
  name: string
  description?: string
  source: 'project' | 'global'
  path: string                            // Absolute path on disk

  // From installation manifest (if tracked)
  tracked?: {
    marketplace_id: string
    version: string
    modified: boolean
  }

  // From marketplace matching (if not tracked)
  marketplace_match?: {
    plugin_id: string
    plugin_name: string
    version_match: 'exact' | 'outdated' | 'unknown'
  }
}

interface McpServer {
  name: string
  command: string
  args?: string[]
  env?: Record<string, string>
  source: 'project' | 'global'
}
```

### Installation Manifest (Persistent)

Stored at `~/.augments/manifest.json`:

```typescript
interface InstallationManifest {
  version: '1.0'
  installed: {
    [id: string]: {
      source: 'marketplace' | 'github' | 'local'
      marketplace_id?: string
      version?: string
      installed_at: string
      installed_to: string[]        // Paths where files were placed
      content_hash: string          // SHA256 of original content
      modified: boolean             // User edited after install?
    }
  }
}
```

### Project Registry (Persistent)

Stored at `~/.augments/projects.json`:

```typescript
interface ProjectRegistry {
  version: '1.0'
  projects: {
    [path: string]: {
      name: string
      added_at: string
      last_scanned?: string
    }
  }
}
```

---

## Dependencies

### CLI Package

```json
{
  "dependencies": {
    "commander": "^12.0.0",
    "chokidar": "^3.6.0",
    "ws": "^8.16.0",
    "open": "^10.0.0",
    "picocolors": "^1.0.0",
    "inquirer": "^9.0.0"
  }
}
```

---

## Implementation Order

### Phase 1 Tasks (See CLI-TASKS.md)

1. CLI Package Setup
2. Scanner Module
3. Scan Command
4. WebSocket Server
5. File Watcher
6. Connect Command
7. Web UI /connect Page
8. Integration & Polish

### Phase 2 Tasks

1. Installation Manifest Module
2. Install Command
3. Remove Command
4. Update Command
5. Status Command
6. Web UI Install Integration

### Phase 3 Tasks

1. Project Registry Module
2. Projects Command
3. Multi-Project Scanner
4. Web UI Matrix View

### Phase 4 Tasks

1. Wizard Decision Tree
2. Interactive Prompts
3. Template Generator
4. Claude Code Delegation

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Claude Code changes file structure | Scanner uses pattern matching, not hardcoded paths |
| Large projects slow scanning | Implement caching, incremental scans |
| WebSocket port conflicts | Allow `--port` override, detect and suggest alternatives |
| User modifies tracked files | Hash comparison, warn before overwrite |
| Cross-platform path issues | Use `path` module, test on Windows/Mac/Linux |
