# Getting Started

Go from zero to a playable Game Boy game in 5 minutes.

## Prerequisites

- **Node.js 18+** — [download](https://nodejs.org/)
- **GB Studio desktop app** — [download](https://www.gbstudio.dev/) (for opening projects and building ROMs)
- **An MCP client** — Claude Desktop, OpenClaw, or any MCP-compatible AI tool

## 1. Install and Build

```bash
git clone https://github.com/gmcdonald44/gbstudio-mcp.git
cd gbstudio-mcp
npm install
npm run build
```

This compiles the TypeScript source into `dist/index.js`.

## 2. Connect to Your MCP Client

### Claude Desktop

Edit `claude_desktop_config.json` (usually at `~/Library/Application Support/Claude/claude_desktop_config.json` on macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "gbstudio": {
      "command": "node",
      "args": ["C:/path/to/gbstudio-mcp/dist/index.js"]
    }
  }
}
```

Replace the path with the actual absolute path to `dist/index.js`.

### OpenClaw

Add to your `openclaw.json` MCP config:

```json
{
  "mcpServers": {
    "gbstudio": {
      "command": "node",
      "args": ["C:/path/to/gbstudio-mcp/dist/index.js"]
    }
  }
}
```

## 3. Your First Game

Restart your MCP client so it picks up the new server. Then send this prompt:

> **"Build me a simple Game Boy game with 2 scenes: a Town with a shopkeeper NPC, and a Forest connected by a door trigger. The shopkeeper should say 'Welcome to my shop!' when you talk to them."**

The AI will call these tools in sequence:

1. `create_project` — Creates the `.gbsproj` file
2. `add_scene` × 2 — Creates "Town" and "Forest" scenes
3. `add_actor` — Places the Shopkeeper in Town
4. `add_script_event` — Adds dialogue to the Shopkeeper
5. `add_trigger` — Creates a door trigger in Town
6. `add_script_event` — Wires the trigger to switch to the Forest scene
7. `save_project` — Writes everything to disk

## 4. Open in GB Studio

1. Open the GB Studio desktop app
2. **File → Open** and select the `.gbsproj` file (the AI will tell you the exact path)
3. You'll see your scenes, actors, and triggers in the visual editor
4. **Add pixel art**: Replace the stub backgrounds and sprites with real PNG files
   - Backgrounds go in `assets/backgrounds/` (160×144 px for standard scenes)
   - Sprites go in `assets/sprites/` (16×16 px per frame)

## 5. Build and Play the ROM

### Option A: GB Studio Desktop (recommended)
1. In GB Studio, click **Game → Build & Run** (or press Ctrl+B)
2. The built-in emulator launches immediately
3. To export: **Game → Export ROM** to get a `.gb` file

### Option B: GB Studio CLI
```bash
npm install -g gb-studio-cli
gb-studio-cli export path/to/YourGame.gbsproj --output ./build
```

### Option C: Ask the AI
> "Build the ROM for me"

The AI will call `build_rom`, which attempts to use the CLI. If the CLI isn't installed, it tells you how to build manually.

## 6. Play Your ROM

Load the `.gb` file in any Game Boy emulator:
- [BGB](https://bgb.bircd.org/) (Windows)
- [SameBoy](https://sameboy.github.io/) (macOS/Windows/Linux)
- [mGBA](https://mgba.io/) (cross-platform)
- Or flash it to a real Game Boy cartridge!

## What's Next?

- Read the [Tool Reference](tool-reference.md) to see everything the server can do
- Check [Script Events](script-events.md) to learn about dialogue, conditionals, and game logic
- See [GB Studio Format](gb-studio-format.md) to understand the project file structure
