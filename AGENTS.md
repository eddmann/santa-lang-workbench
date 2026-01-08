# AGENTS.md

## Project Overview

- **santa-lang Workbench**: Tauri 2.0 desktop IDE for santa-lang (functional language for Advent of Code)
- Frontend: React 19 + Redux Toolkit + Monaco Editor + TailwindCSS v4
- Backend: Rust (Tauri) with process spawning for language implementations
- "Reindeer" = language implementation binaries (Comet, Blitzen, Dasher, Donner, Prancer)
- Formatter: Tinsel (separate binary, managed in settings)
- Executes code via external binaries, streams JSONL results with JSON patches

### Key Directories

```
src/                    # React frontend
  components/           # UI components (Editor, Toolbar, OutputPanel, etc.)
  store/slices/         # Redux slices (tabs, reindeer, execution, settings, formatter, aoc)
  hooks/                # Custom hooks (useMenuEvents, useAocDetection)
  lib/                  # Types, themes, Monaco config
src-tauri/              # Rust backend
  src/commands/         # Tauri IPC commands (reindeer, execution, github, formatter, settings, aoc)
  src/state.rs          # AppState (reindeer registry, settings, running processes)
  src/config.rs         # Codename → GitHub repo mapping
  src/menu.rs           # Native menu definitions
```

## Setup

```bash
# Install frontend dependencies
make install

# Run development mode (Vite + Tauri)
make dev

# Build production app
make build
```

**Requirements:**
- Bun (package manager)
- Rust toolchain (for Tauri backend)
- Tauri CLI (`@tauri-apps/cli` in devDeps)
- Linux only: `sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf`

## Common Commands

```bash
# Makefile targets (preferred)
make install            # bun install
make dev                # Start dev server + Tauri app
make build              # Full production build
make build/TARGET       # Cross-compile (e.g., make build/aarch64-apple-darwin)
make fmt                # Format TypeScript + Rust
make lint               # ESLint + cargo clippy
make can-release        # Run all CI checks (lint only, currently)

# Direct commands
bun run build           # TypeScript + Vite build (frontend only)
bun run lint            # ESLint only

# Rust checks
cd src-tauri && cargo check
cd src-tauri && cargo clippy -- -D warnings
cd src-tauri && cargo fmt --check
```

## Code Conventions

### Frontend (TypeScript/React)

- Redux Toolkit for state management with async thunks
- Slices in `src/store/slices/` - one per domain
- Types in `src/lib/types.ts`
- Tauri IPC via `@tauri-apps/api` invoke/listen pattern
- Event streaming: listen to `execution-event`, apply JSON patches via `fast-json-patch`
- Themes defined in `src/lib/themes.ts`, applied via CSS variables

### Backend (Rust/Tauri)

- Commands in `src-tauri/src/commands/` - exported via `mod.rs`
- AppState wrapped in `Mutex<AppState>` for thread-safe access
- Config persistence: `{config_dir}/com.eddmann.santa-lang-workbench/config.json`
  - Linux: `~/.config/...`
  - macOS: `~/Library/Application Support/...`
  - Windows: `%APPDATA%/...`
- Process spawning: write source to temp `.santa` file, spawn reindeer with `-o jsonl`
- Events emitted via `window.emit("execution-event", payload)`

### Naming

- "Reindeer" not "implementation"
- Codenames: comet, blitzen, dasher, donner, prancer

## Tests & CI

- **No unit tests** - lint/clippy only
- CI: GitHub Actions in `.github/workflows/`
- `test.yml`: Runs `make can-release` on push/PR to main
  - On main merge: auto-pushes to `draft-release` branch
- `build.yml`: Triggered by draft-release, updates release via release-drafter
- `build-app.yml`: Matrix build for platforms:
  - `linux-amd64` (ubuntu-24.04) → .deb, .AppImage
  - `macos-amd64` (macos-15) → .dmg
  - `macos-arm64` (macos-15) → .dmg

```bash
# Run CI checks locally
make can-release
```

## PR & Workflow Rules

- Main branch: `main`
- Commit message style: conventional (`feat:`, `fix:`, `refactor:`, etc.)
- Before commit:
  ```bash
  make fmt        # Format all code
  make lint       # Check for issues
  ```
- PRs require passing `test.yml` workflow

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
