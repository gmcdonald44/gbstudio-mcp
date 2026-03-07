# Connecting to Claude Desktop

This guide walks you through connecting gbstudio-mcp to Claude Desktop so you can build Game Boy games by chatting naturally — no code required.

## Prerequisites

- [Claude Desktop](https://claude.ai/download) installed
- [Node.js 18+](https://nodejs.org) installed
- gbstudio-mcp cloned and built (see [Getting Started](./getting-started.md))

---

## Step 1 — Build the Server

```bash
git clone https://github.com/gmcdonald44/gbstudio-mcp.git
cd gbstudio-mcp
npm install
npm run build
```

Note the full path to `dist/index.js` — you'll need it in the next step.

---

## Step 2 — Edit Claude Desktop Config

Open the Claude Desktop config file for your OS:

| OS | Path |
|----|------|
| **macOS** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json` |
| **Linux** | `~/.config/Claude/claude_desktop_config.json` |

Add the `mcpServers` block. If the file doesn't exist yet, create it:

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

### Windows example
```json
{
  "mcpServers": {
    "gbstudio": {
      "command": "node",
      "args": ["C:\\Users\\YourName\\gbstudio-mcp\\dist\\index.js"]
    }
  }
}
```

### macOS / Linux example
```json
{
  "mcpServers": {
    "gbstudio": {
      "command": "node",
      "args": ["/Users/yourname/gbstudio-mcp/dist/index.js"]
    }
  }
}
```

> **Important:** Use the absolute path to `dist/index.js`. Relative paths won't work.

---

## Step 3 — Restart Claude Desktop

Fully quit and relaunch Claude Desktop. On first launch it starts the MCP server automatically as a background process.

---

## Step 4 — Verify the Connection

In Claude Desktop, look for the 🔌 tools icon in the chat input. Click it — you should see all 20 gbstudio tools listed:

- `create_project`, `get_project_info`, `save_project`
- `add_scene`, `get_scene`, `list_scenes`, `update_scene`, `delete_scene`
- `add_actor`, `list_actors`, `update_actor`, `delete_actor`
- `add_trigger`, `update_trigger`, `delete_trigger`
- `add_script_event`, `get_script`
- `add_variable`, `list_variables`
- `build_rom`

If you don't see them, check the [Troubleshooting](#troubleshooting) section below.

---

## Step 5 — Start Building

Just describe what you want:

```
Create a new GB Studio project called "MyAdventure" saved to ~/Desktop/MyAdventure
```

```
Add a town scene with a blacksmith NPC who says "The road east is dangerous, traveler."
```

```
Add a trigger at the north exit of town that switches to the Forest scene
```

For more prompt ideas tailored to your background, see the [prompts/](../prompts/README.md) library.

---

## How It Works

Claude Desktop acts as the **MCP client**. When you send a message, Claude decides which tools to call and passes the right arguments. The gbstudio-mcp server receives those calls over stdio (JSON-RPC), updates the in-memory project state, and writes the `.gbsproj` file when you call `save_project`.

```
You (chat)
    ↓
Claude Desktop (MCP client)
    ↓  JSON-RPC over stdio
gbstudio-mcp server (MCP server)
    ↓
.gbsproj file on disk
    ↓
GB Studio desktop app → ROM
```

---

## Opening the Output in GB Studio

Once you've built your project:

1. Download [GB Studio](https://www.gbstudio.dev) (free)
2. **File → Open** → select your `.gbsproj` file
3. Hit ▶️ **Play** to run in the browser emulator
4. Or **Export → Export ROM** to get a `.gb` file for any Game Boy emulator

---

## Troubleshooting

**Tools don't appear in Claude Desktop**
- Make sure you fully quit and relaunched (not just closed the window)
- Check the path to `dist/index.js` is correct and absolute
- Verify the JSON in `claude_desktop_config.json` is valid (no trailing commas)
- Run `node /path/to/dist/index.js` in a terminal — if it errors, the server has a build issue

**"Cannot find module" error**
- Run `npm run build` again from the project root
- Make sure you're pointing at `dist/index.js`, not `src/index.ts`

**Project state resets between conversations**
- This is expected — the server is stateless between Claude Desktop sessions
- Always call `save_project` before ending a conversation
- Load your project at the start of each session with `get_project_info`

**Claude says it can't find the tools**
- MCP tool availability depends on your Claude Desktop version — make sure it's up to date
- Check Claude's release notes for MCP support status

---

## Other MCP Clients

gbstudio-mcp works with any MCP-compatible client, not just Claude Desktop:

| Client | Notes |
|--------|-------|
| **Claude Desktop** | Best experience, natural language, full tool support |
| **Cursor** | Add to `.cursor/mcp.json` using the same config format |
| **Zed** | Add to Zed's assistant config under `context_servers` |
| **Custom client** | See `test.mjs` in the repo for a reference implementation |
