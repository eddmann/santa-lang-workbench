# Santa Lang Studio

A cross-platform desktop editor for [santa-lang](https://eddmann.com/santa-lang/), a functional programming language designed for solving Advent of Code puzzles.

## Features

- **Monaco Editor** with syntax highlighting (Rust mode)
- **Multiple tabs** for editing files
- **JSONL Streaming** - Real-time execution results as parts run
- **Test Runner** - See test cases pass/fail with expected vs actual values
- **Multiple Reindeer** - Switch between Comet, Blitzen, Dasher, Donner, Prancer, Vixen
- **GitHub Releases** - Download reindeer directly from the editor
- **AoC Integration** - Configure session token for `read("aoc://YEAR/DAY")`

## Tech Stack

- **Frontend**: React 19, Redux Toolkit, TailwindCSS v4, Monaco Editor
- **Backend**: Tauri 2.0, Rust
- **Build**: Vite 6, Bun, TypeScript 5.7

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun tauri dev

# Build for production
bun tauri build
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘ + Enter` | Run solution |
| `⌘ + Shift + Enter` | Run tests |
| `⌘ + S` | Save file |

## How It Works

Santa Lang Studio spawns CLI reindeer with `-o jsonl` flag to stream execution results. The JSONL format provides:

1. **Initial state** - Template with all parts set to "pending"
2. **JSON Patches** - RFC 6902 patches as execution progresses
3. **Real-time updates** - UI updates as parts transition from pending → running → complete

This enables live progress indicators as long-running solutions execute.

## Reindeer

| Codename | Type | Description |
|----------|------|-------------|
| Comet | Rust | Tree-walking interpreter (most complete) |
| Blitzen | Rust | Bytecode VM |
| Dasher | Rust | LLVM native compiler |
| Donner | Kotlin | JVM bytecode compiler |
| Prancer | TypeScript | JavaScript interpreter |
| Vixen | C | Embedded VM (subset) |

## License

MIT
