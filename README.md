# gbstudio-mcp

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js 18+](https://img.shields.io/badge/node-18%2B-brightgreen.svg)](https://nodejs.org/)
![Tests](https://img.shields.io/badge/tests-26%2F26%20passing-brightgreen)
![Tools](https://img.shields.io/badge/tools-24-blue)

**Describe a Game Boy game in plain English. Get a playable `.gbsproj` file.**

An [MCP](https://modelcontextprotocol.io/) server that gives AI assistants (Claude, etc.) the ability to create and edit [GB Studio](https://www.gbstudio.dev/) projects. Build Game Boy games through conversation — scenes, actors, scripted events, variables, triggers — all from natural language.

## Why?

GB Studio is an amazing tool for making Game Boy games, but setting up scenes, wiring scripts, and managing project JSON by hand is tedious. This MCP server lets you skip the boilerplate: describe what you want, and the AI builds the project structure for you. Open the result in GB Studio to add pixel art and hit Build.

## Prerequisites

- **Node.js 18+**
- **GB Studio** installed ([download](https://www.gbstudio.dev/)) — for opening and building projects
- An MCP-compatible AI client (Claude Desktop, OpenClaw, etc.)

## Installation

```bash
git clone https://github.com/gmcdonald44/gbstudio-mcp.git
cd gbstudio-mcp
npm install
npm run build
```

## Setup

### Claude Desktop

Add to your `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gbstudio": {
      "command": "node",
      "args": ["/absolute/path/to/gbstudio-mcp/dist/index.js"]
    }
  }
}
```

Restart Claude Desktop. The 24 gbstudio tools will appear in the 🔌 tools panel.

📖 **Full setup guide with troubleshooting:** [docs/claude-desktop-setup.md](docs/claude-desktop-setup.md)

### Other MCP Clients

Works with any MCP-compatible client — Cursor, Zed, OpenClaw, or your own. Use the same config format with the absolute path to `dist/index.js`.

## Tools

### Project Management

| Tool | Description |
|------|-------------|
| `create_project` | Create a new `.gbsproj` with sensible defaults |
| `open_project` | Load an existing project into memory |
| `save_project` | Write the in-memory project to disk |
| `get_project_info` | Get project stats (scene count, actors, etc.) |

### Scenes

| Tool | Description |
|------|-------------|
| `list_scenes` | List all scenes in the project |
| `add_scene` | Create a new scene |
| `get_scene` | Get details of a specific scene |
| `update_scene` | Modify scene properties |
| `delete_scene` | Remove a scene |

### Actors

| Tool | Description |
|------|-------------|
| `list_actors` | List actors in a scene |
| `add_actor` | Place a new actor in a scene |
| `update_actor` | Modify actor properties |
| `delete_actor` | Remove an actor |

### Triggers

| Tool | Description |
|------|-------------|
| `list_triggers` | List triggers in a scene |
| `add_trigger` | Add a trigger zone to a scene |
| `update_trigger` | Modify trigger properties |
| `delete_trigger` | Remove a trigger |

### Scripting

| Tool | Description |
|------|-------------|
| `add_script_event` | Add a script event (dialogue, scene switch, conditional, etc.) |
| `get_script` | View the current script on an entity |
| `clear_script` | Remove all events from a script |

### Variables

| Tool | Description |
|------|-------------|
| `add_variable` | Create a new game variable |
| `list_variables` | List all variables |
| `delete_variable` | Remove a variable |

### Build

| Tool | Description |
|------|-------------|
| `build_rom` | Build a `.gb` ROM via GB Studio CLI |

## Example Prompts

```
"Build me a Game Boy RPG with 3 scenes and a shopkeeper"

"Add a new forest scene with two NPCs who give you a quest"

"Create a trigger at (5, 10) that teleports the player to the dungeon"

"Add dialogue to the shopkeeper that checks if the player has the key"

"Wire up a conditional: if hasSword is true, the guard lets you pass"
```

📚 **12 prompts in two buckets** — sprite artists, developers, storytellers, educators, game jammers, and more: **[prompts/](prompts/README.md)**

## Walkthrough: Building a Simple RPG

Here's what happens behind the scenes when you ask an AI to build a game:

1. **`create_project`** — Creates `MyRPG.gbsproj` with a default background and sprite
2. **`add_scene`** × 3 — Creates "Town", "Forest", and "Dungeon" scenes
3. **`add_actor`** — Places a shopkeeper NPC in the Town scene
4. **`add_script_event`** — Adds dialogue: *"Welcome! Buy a sword?"*
5. **`add_variable`** — Creates a `hasSword` variable
6. **`add_trigger`** — Adds a door trigger in the Town scene
7. **`add_script_event`** — Wires the trigger to `EVENT_SCENE_SWITCH` → Forest
8. **`save_project`** — Writes everything to disk

Open the `.gbsproj` in GB Studio, drop in your pixel art, and hit **Build ROM**!

## Architecture

```
Client (Claude, OpenClaw, etc.)
   │
   │  MCP Protocol (JSON-RPC 2.0 over stdio)
   ▼
Tool Router (src/index.ts)
   │
   ▼
In-Memory Project State (src/project.ts)
   │
   │  save_project / open_project
   ▼
.gbsproj file on disk
```

The server keeps the project in memory. You create or open a project, make changes with the various tools, then save. The `.gbsproj` file is standard GB Studio JSON — fully compatible with the GB Studio editor.

**Note:** Background and sprite assets are created as stubs. Add actual PNG files in GB Studio. The `build_rom` tool requires `gb-studio-cli` — without it, open the project in GB Studio to build.

## Documentation

- **[Claude Desktop Setup](docs/claude-desktop-setup.md)** — Connect to Claude Desktop, verify tools, troubleshoot
- **[Getting Started](docs/getting-started.md)** — Install, configure, build your first game
- **[Tool Reference](docs/tool-reference.md)** — All 20 tools with parameters and examples
- **[GB Studio Format](docs/gb-studio-format.md)** — `.gbsproj` file structure reference
- **[Script Events](docs/script-events.md)** — EVENT_* commands, patterns, and examples
- **[Architecture](docs/architecture.md)** — Internals, how to add tools, contributing
- **[Prompt Examples](prompts/README.md)** — 12 prompts across two buckets (has art / no art)

## Known Limitations

- **Asset files** (PNG sprites/backgrounds) must still be added manually in GB Studio
- **ROM compilation** requires GB Studio CLI or the desktop app
- **In-memory state resets** when the server restarts — use `save_project` frequently
- **No multiplayer/networking** support (it's Game Boy!)
- **No collision editor** — use GB Studio's visual editor for collision tiles
- **No undo** — inspect with `get_scene`/`get_script` before destructive changes

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

- 🐛 [Report a bug](https://github.com/gmcdonald44/gbstudio-mcp/issues)
- 💡 [Request a feature](https://github.com/gmcdonald44/gbstudio-mcp/issues)
- 🔧 [Submit a PR](https://github.com/gmcdonald44/gbstudio-mcp/pulls)

## License

[MIT](LICENSE) © Grant McDonald
