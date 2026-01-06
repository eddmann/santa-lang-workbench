# AGENTS.md

## Project Overview

- **santa-lang Toy Shop**: Tauri 2.0 desktop IDE for santa-lang (functional language for Advent of Code)
- Frontend: React 19 + Redux Toolkit + Monaco Editor + TailwindCSS v4
- Backend: Rust (Tauri) with process spawning for language implementations
- "Reindeer" = language implementation binaries (Comet, Blitzen, Dasher, Donner, Prancer, Vixen)
- Executes code via external binaries, streams JSONL results with JSON patches

### Key Directories

```
src/                    # React frontend
  components/           # UI components (Editor, Toolbar, OutputPanel, etc.)
  store/slices/         # Redux slices (tabs, reindeer, execution, settings, formatter)
  hooks/                # React hooks (useMenuEvents)
  lib/                  # Types and themes
src-tauri/              # Rust backend
  src/commands/         # Tauri IPC commands (reindeer, execution, github, formatter, settings)
  src/state.rs          # AppState (reindeer registry, settings, running processes)
  src/config.rs         # Codename → GitHub repo mapping
  src/menu.rs           # Native menu definitions
```

## Setup

```bash
# Install frontend dependencies
bun install

# Run development mode (Vite + Tauri)
bun tauri dev

# Build production app
bun tauri build
```

**Requirements:**
- Bun (package manager)
- Rust toolchain (for Tauri backend)
- Tauri CLI (`@tauri-apps/cli` in devDeps)

## Common Commands

```bash
# Development
bun tauri dev           # Start dev server + Tauri app

# Build
bun run build           # TypeScript + Vite build (frontend only)
bun tauri build         # Full production build with bundled app

# Lint
bun run lint            # ESLint

# Type check
bun run build           # tsc -b runs as part of build

# Rust checks
cd src-tauri && cargo check
cd src-tauri && cargo clippy
cd src-tauri && cargo fmt --check
```

## Code Conventions

### Frontend (TypeScript/React)

- Redux Toolkit for state management with async thunks
- Slices in `src/store/slices/` - one per domain (tabs, reindeer, execution, settings, formatter)
- Types in `src/lib/types.ts`
- Tauri IPC via `@tauri-apps/api` invoke/listen pattern
- Event streaming: listen to `execution-event`, apply JSON patches via `fast-json-patch`
- Themes defined in `src/lib/themes.ts`, applied via CSS variables

### Backend (Rust/Tauri)

- Commands in `src-tauri/src/commands/` - exported via `mod.rs`
- AppState wrapped in `Mutex<AppState>` for thread-safe access
- Config persistence: `{config_dir}/com.eddmann.santa-lang-toy-shop/config.json`
  - Linux: `~/.config/...`
  - macOS: `~/Library/Application Support/...`
  - Windows: `%APPDATA%/...`
- Process spawning: write source to temp `.santa` file, spawn reindeer with `-o jsonl`
- Events emitted via `window.emit("execution-event", payload)`

### Naming

- "Reindeer" not "implementation" (recent refactor)
- Codenames: comet, blitzen, dasher, donner, prancer, vixen

## Tests & CI

- **No test suite currently configured**
- **No CI workflows in `.github/workflows/`**
- Lint only: `bun run lint`

## PR & Workflow Rules

- Main branch: `main`
- Commit message style: conventional (`feat:`, `fix:`, `refactor:`, etc.)
- Format Rust before commit: `cd src-tauri && cargo fmt`
- Lint TypeScript before commit: `bun run lint`

## Security & Gotchas

### Sensitive Data

- `aoc_session_token` stored in settings - do not log or expose
- Passed to reindeer via `SANTA_CLI_SESSION_TOKEN` env var

### Process Management

- Running process PIDs tracked in `AppState.running_processes`
- Cancel uses OS kill: `kill -9 {pid}` (Unix) or `taskkill /F /PID {pid}` (Windows)
- Temp files written to system temp dir with `.santa` extension

### Platform-Specific

- Unix: Sets executable permissions (0o755) after downloading binaries
- macOS code signing not configured (dev builds only)

### State Persistence

- Config file loaded on startup in `lib.rs` setup hook
- Must call `state.save(app)` after mutations to persist

### Event Streaming

- Execution results use RFC 6902 JSON patches
- Frontend must handle: `initial`, `patch`, `console`, `complete`, `error` event types
