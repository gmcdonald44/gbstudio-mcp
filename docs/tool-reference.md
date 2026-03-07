# Tool Reference

Complete reference for all 20 tools in the GB Studio MCP server.

---

## Project Management

### `create_project`

Create a new GB Studio project file with default assets (background, sprite sheet, palette).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | ✅ | Project name (used in filename) |
| `author` | string | ✅ | Author name |
| `path` | string | ✅ | Directory to create the project in |

**Returns:** Project path, default background ID, default sprite ID.

```json
{
  "name": "create_project",
  "arguments": { "name": "MyRPG", "author": "Grant", "path": "C:/games" }
}
```

**Common errors:**
- Directory doesn't exist → it will be created automatically
- Invalid characters in name → they're replaced with underscores in the filename

---

### `open_project`

Load an existing `.gbsproj` file into memory.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `path` | string | ✅ | Path to the `.gbsproj` file |

**Returns:** Project name, scene count, variable count.

```json
{
  "name": "open_project",
  "arguments": { "path": "C:/games/MyRPG/MyRPG.gbsproj" }
}
```

**Common errors:**
- `File not found` → check the path; must be absolute or relative to the server's working directory
- JSON parse error → the file is corrupted or not a valid `.gbsproj`

---

### `save_project`

Write the current in-memory project to disk. **Always call this after making changes.**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| *(none)* | | | |

```json
{ "name": "save_project", "arguments": {} }
```

**Common errors:**
- `No project loaded` → call `create_project` or `open_project` first

---

### `get_project_info`

Get summary information about the current project.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| *(none)* | | | |

**Returns:** JSON with name, author, path, scene/background/sprite/variable counts, and scene list.

```json
{ "name": "get_project_info", "arguments": {} }
```

---

## Scenes

### `list_scenes`

List all scenes with summary info.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| *(none)* | | | |

**Returns:** JSON array of `{ id, name, width, height, actors, triggers }`.

```json
{ "name": "list_scenes", "arguments": {} }
```

---

### `add_scene`

Add a new scene. The first scene added becomes the start scene automatically.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | ✅ | Scene name |
| `width` | number | ❌ | Width in tiles (default: 20) |
| `height` | number | ❌ | Height in tiles (default: 18) |
| `backgroundId` | string | ❌ | Background asset UUID (default: project's first background) |
| `x` | number | ❌ | World X position in pixels (default: auto-spaced) |
| `y` | number | ❌ | World Y position in pixels (default: 0) |

**Returns:** Scene name and UUID.

```json
{
  "name": "add_scene",
  "arguments": { "name": "Haunted Castle", "width": 32, "height": 24 }
}
```

---

### `get_scene`

Get full details of a scene including all actors, triggers, and scripts.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sceneId` | string | ✅ | Scene UUID |

```json
{ "name": "get_scene", "arguments": { "sceneId": "a1b2c3d4-e5f6-..." } }
```

---

### `update_scene`

Update scene properties. Only provided fields are changed.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sceneId` | string | ✅ | Scene UUID |
| `name` | string | ❌ | New name |
| `width` | number | ❌ | New width in tiles |
| `height` | number | ❌ | New height in tiles |
| `backgroundId` | string | ❌ | New background UUID |

```json
{
  "name": "update_scene",
  "arguments": { "sceneId": "uuid", "name": "Enchanted Forest", "width": 40 }
}
```

---

### `delete_scene`

Delete a scene and everything in it (actors, triggers, scripts).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sceneId` | string | ✅ | Scene UUID |

```json
{ "name": "delete_scene", "arguments": { "sceneId": "uuid" } }
```

**Common errors:**
- `Scene not found` → the UUID is wrong or the scene was already deleted

---

## Actors

### `list_actors`

List all actors in a scene.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sceneId` | string | ✅ | Scene UUID |

**Returns:** JSON array of `{ id, name, x, y, direction }`.

```json
{ "name": "list_actors", "arguments": { "sceneId": "scene-uuid" } }
```

---

### `add_actor`

Place a new actor in a scene with empty script arrays.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sceneId` | string | ✅ | Scene UUID |
| `name` | string | ✅ | Actor name |
| `x` | number | ✅ | Tile X position |
| `y` | number | ✅ | Tile Y position |
| `spriteSheetId` | string | ❌ | Sprite sheet UUID (default: project's first sprite) |
| `direction` | string | ❌ | "down", "up", "left", "right" (default: "down") |
| `spriteType` | string | ❌ | "STATIC", "ACTOR", "ACTOR_ANIMATED" (default: "STATIC") |
| `moveSpeed` | number | ❌ | Movement speed 1-4 (default: 1) |
| `animSpeed` | number | ❌ | Animation speed 1-4 (default: 3) |

```json
{
  "name": "add_actor",
  "arguments": {
    "sceneId": "scene-uuid",
    "name": "Village Elder",
    "x": 8,
    "y": 6,
    "direction": "down",
    "spriteType": "ACTOR"
  }
}
```

---

### `update_actor`

Update actor properties. Only provided fields are changed.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sceneId` | string | ✅ | Scene UUID |
| `actorId` | string | ✅ | Actor UUID |
| `name` | string | ❌ | New name |
| `x` | number | ❌ | New X position |
| `y` | number | ❌ | New Y position |
| `direction` | string | ❌ | New direction |
| `spriteSheetId` | string | ❌ | New sprite UUID |
| `spriteType` | string | ❌ | New sprite type |
| `moveSpeed` | number | ❌ | New move speed |
| `animSpeed` | number | ❌ | New anim speed |

```json
{
  "name": "update_actor",
  "arguments": { "sceneId": "scene-uuid", "actorId": "actor-uuid", "x": 10, "direction": "right" }
}
```

---

### `delete_actor`

Remove an actor from a scene.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sceneId` | string | ✅ | Scene UUID |
| `actorId` | string | ✅ | Actor UUID |

```json
{ "name": "delete_actor", "arguments": { "sceneId": "scene-uuid", "actorId": "actor-uuid" } }
```

---

## Triggers

### `add_trigger`

Add a trigger zone to a scene. Triggers fire when the player walks into them.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sceneId` | string | ✅ | Scene UUID |
| `name` | string | ✅ | Trigger name |
| `x` | number | ✅ | Tile X position |
| `y` | number | ✅ | Tile Y position |
| `width` | number | ✅ | Width in tiles |
| `height` | number | ✅ | Height in tiles |

```json
{
  "name": "add_trigger",
  "arguments": { "sceneId": "scene-uuid", "name": "Cave Entrance", "x": 15, "y": 2, "width": 2, "height": 1 }
}
```

---

### `update_trigger`

Update trigger properties. Only provided fields are changed.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sceneId` | string | ✅ | Scene UUID |
| `triggerId` | string | ✅ | Trigger UUID |
| `name` | string | ❌ | New name |
| `x` | number | ❌ | New X position |
| `y` | number | ❌ | New Y position |
| `width` | number | ❌ | New width |
| `height` | number | ❌ | New height |

```json
{
  "name": "update_trigger",
  "arguments": { "sceneId": "scene-uuid", "triggerId": "trigger-uuid", "width": 3 }
}
```

---

### `delete_trigger`

Remove a trigger from a scene.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sceneId` | string | ✅ | Scene UUID |
| `triggerId` | string | ✅ | Trigger UUID |

```json
{ "name": "delete_trigger", "arguments": { "sceneId": "scene-uuid", "triggerId": "trigger-uuid" } }
```

---

## Scripting

### `add_script_event`

Append a script event to any entity's script array. This is the core tool for game logic.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `target` | string | ✅ | "scene", "actor", or "trigger" |
| `targetId` | string | ✅ | UUID of the target entity |
| `scriptType` | string | ✅ | Script array: "script", "startScript", "updateScript", "hit1Script", "leaveScript", etc. |
| `command` | string | ✅ | Event command (e.g. "EVENT_DIALOGUE") |
| `args` | object | ❌ | Command-specific arguments |
| `children` | object | ❌ | Child branches for conditionals (`{ "true": [...], "false": [...] }`) |
| `sceneId` | string | ❌* | Scene UUID (*required* for actor/trigger targets) |

```json
{
  "name": "add_script_event",
  "arguments": {
    "target": "actor",
    "targetId": "actor-uuid",
    "sceneId": "scene-uuid",
    "scriptType": "script",
    "command": "EVENT_DIALOGUE",
    "args": { "text": "Greetings, traveler!" }
  }
}
```

See [Script Events](script-events.md) for the full list of commands and their arguments.

**Common errors:**
- `sceneId required for actor target` → add `sceneId` when targeting actors or triggers
- `Invalid script type` → check the script array name (e.g. "script" not "scripts")
- `Scene not found` / `Actor not found` → check UUIDs

---

### `get_script`

Read all events from a script array.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `target` | string | ✅ | "scene", "actor", or "trigger" |
| `targetId` | string | ✅ | Target UUID |
| `scriptType` | string | ✅ | Script array name |
| `sceneId` | string | ❌* | Required for actor/trigger |

```json
{
  "name": "get_script",
  "arguments": { "target": "actor", "targetId": "actor-uuid", "sceneId": "scene-uuid", "scriptType": "script" }
}
```

---

### `clear_script`

Remove all events from a script array.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `target` | string | ✅ | "scene", "actor", or "trigger" |
| `targetId` | string | ✅ | Target UUID |
| `scriptType` | string | ✅ | Script array name |
| `sceneId` | string | ❌* | Required for actor/trigger |

```json
{
  "name": "clear_script",
  "arguments": { "target": "actor", "targetId": "actor-uuid", "sceneId": "scene-uuid", "scriptType": "script" }
}
```

---

## Variables

### `add_variable`

Create a new global game variable.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | ✅ | Variable name |

**Returns:** Variable name and UUID (use the UUID in script events).

```json
{ "name": "add_variable", "arguments": { "name": "hasKey" } }
```

---

### `list_variables`

List all global variables.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| *(none)* | | | |

```json
{ "name": "list_variables", "arguments": {} }
```

---

## Build

### `build_rom`

Compile the project into a Game Boy ROM using the GB Studio CLI.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `outputPath` | string | ❌ | Output directory (default: `build/` next to the project file) |

```json
{ "name": "build_rom", "arguments": {} }
```

**Common errors:**
- `GB Studio CLI not found` → install with `npm install -g gb-studio-cli` or use GB Studio desktop app
- `Build timed out` → build took longer than 2 minutes; try again or build via the desktop app
- `No project loaded` → call `create_project` or `open_project` first
