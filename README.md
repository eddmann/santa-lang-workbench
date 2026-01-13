# santa-lang Workbench

<p align="center">
  <img src="docs/icon.png" alt="santa-lang Workbench" width="200">
</p>

A cross-platform desktop IDE for [santa-lang](https://eddmann.com/santa-lang/), a functional programming language designed for solving [Advent of Code](https://adventofcode.com/) puzzles.

Built to provide a controlled environment for writing and testing AoC solutions, while exploring the different backend implementations (reindeer) available for santa-lang.

## Screenshots

<table>
<tr>
<td width="50%">
<img src="docs/editor-answer.png" alt="Running a solution">
<p align="center"><em>Run solutions with real-time output</em></p>
</td>
<td width="50%">
<img src="docs/editor-tests.png" alt="Running tests">
<p align="center"><em>Run tests with expected values</em></p>
</td>
</tr>
<tr>
<td width="50%">
<img src="docs/editor-puzzle.png" alt="Puzzle integration">
<p align="center"><em>Integrated AoC puzzle descriptions</em></p>
</td>
<td width="50%">
<img src="docs/editor-comparision-graph.png" alt="Performance comparison">
<p align="center"><em>Compare performance across reindeer</em></p>
</td>
</tr>
</table>

<details>
<summary>Settings</summary>

<table>
<tr>
<td width="50%">
<img src="docs/settings-general.png" alt="General settings">
<p align="center"><em>Theme and AoC session configuration</em></p>
</td>
<td width="50%">
<img src="docs/settings-reindeer-list.png" alt="Reindeer management">
<p align="center"><em>Manage installed reindeer</em></p>
</td>
</tr>
<tr>
<td width="50%">
<img src="docs/settings-formatting.png" alt="Formatting settings">
<p align="center"><em>Code formatting with Tinsel</em></p>
</td>
<td width="50%">
</td>
</tr>
</table>

</details>

## Installation

### Homebrew (macOS)

```bash
brew install eddmann/tap/santa-lang-workbench
```

### Manual Download

Download the latest release from [GitHub Releases](https://github.com/eddmann/santa-lang-workbench/releases).

## Features

- **Run Solutions** - Execute santa-lang code with real-time streaming output showing progress as each part runs
- **Multiple Reindeer** - Download and manage multiple backend implementations, switch between them instantly
- **AoC Integration** - Auto-detects `read("aoc://YEAR/DAY")` patterns in your code and fetches puzzle descriptions and inputs using your session token
- **Comparative Testing** - Run the same code on multiple reindeer simultaneously, comparing execution times side-by-side with performance charts
- **Code Formatting** - Built-in formatting via [santa-lang Tinsel](https://github.com/eddmann/santa-lang-tinsel)
- **Modern Editor** - Monaco editor with syntax highlighting, multiple tabs, and dark themes

## Tech Stack

- **Frontend**: React 19, Redux Toolkit, TailwindCSS v4, Monaco Editor
- **Backend**: Tauri 2.0, Rust
- **Build**: Vite, Bun, TypeScript

## Development

### Prerequisites

- [Bun](https://bun.sh) - JavaScript runtime and package manager
- [Rust](https://rustup.rs) - For the Tauri backend

### Commands

| Command | Description |
|---------|-------------|
| `make install` | Install all dependencies |
| `make dev` | Start development server |
| `make build` | Build production app |
| `make fmt` | Format all code |
| `make lint` | Run all linting |

## Reindeer

| Codename | Type | Description | Repository |
|----------|------|-------------|------------|
| Comet | Rust | Tree-walking interpreter | [eddmann/santa-lang-comet](https://github.com/eddmann/santa-lang-comet) |
| Blitzen | Rust | Bytecode VM | [eddmann/santa-lang-blitzen](https://github.com/eddmann/santa-lang-blitzen) |
| Dasher | Rust | LLVM native compiler | [eddmann/santa-lang-dasher](https://github.com/eddmann/santa-lang-dasher) |
| Donner | Kotlin | JVM bytecode compiler | [eddmann/santa-lang-donner](https://github.com/eddmann/santa-lang-donner) |
| Prancer | TypeScript | JavaScript interpreter | [eddmann/santa-lang-prancer](https://github.com/eddmann/santa-lang-prancer) |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd + Enter` | Run solution |
| `Cmd + Shift + Enter` | Run tests |
| `Cmd + S` | Save file |
| `Cmd + K` | Format code |

## Related Projects

- [santa-lang](https://eddmann.com/santa-lang/) - The language documentation
- [santa-lang Tinsel](https://github.com/eddmann/santa-lang-tinsel) - Code formatter

## License

MIT License - see [LICENSE](LICENSE) for details.
