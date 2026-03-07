# GB Studio Project Format

Technical reference for the `.gbsproj` file format used by GB Studio and this MCP server.

## Overview

A `.gbsproj` file is a single JSON file containing the entire game project: scenes, actors, triggers, scripts, variables, asset references, and settings. This MCP server reads and writes this format directly.

## Root Structure

```json
{
  "_v": 21,
  "name": "MyRPG",
  "author": "Grant",
  "notes": "",
  "scenes": [],
  "backgrounds": [],
  "spriteSheets": [],
  "palettes": [],
  "music": [],
  "variables": [],
  "settings": {}
}
```

| Field | Type | Description |
|-------|------|-------------|
| `_v` | number | Format version (this server uses 21) |
| `name` | string | Project name |
| `author` | string | Author name |
| `notes` | string | Free-form notes |
| `scenes` | Scene[] | All game scenes |
| `backgrounds` | Background[] | Background image assets |
| `spriteSheets` | SpriteSheet[] | Sprite sheet assets |
| `palettes` | Palette[] | Color palettes |
| `music` | Music[] | Music track assets |
| `variables` | Variable[] | Global game variables |
| `settings` | object | Project settings |

## UUID System

Every entity (scene, actor, trigger, variable, background, sprite, palette, script event) has a unique `id` field containing a UUID v4 string (e.g. `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"`).

References between entities use these UUIDs. For example:
- A scene's `backgroundId` references a background's `id`
- An actor's `spriteSheetId` references a sprite sheet's `id`
- An `EVENT_SWITCH_SCENE` command's `args.sceneId` references a scene's `id`
- An `EVENT_IF_TRUE` command's `args.variable` references a variable's `id`

## Scene Structure

```json
{
  "id": "uuid",
  "name": "Town Square",
  "backgroundId": "bg-uuid",
  "x": 0,
  "y": 0,
  "width": 20,
  "height": 18,
  "type": "0",
  "actors": [],
  "triggers": [],
  "collisions": [],
  "script": [],
  "playerHit1Script": [],
  "playerHit2Script": [],
  "playerHit3Script": []
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique UUID |
| `name` | string | Display name |
| `backgroundId` | string | UUID of the background asset |
| `x`, `y` | number | Position in the GB Studio world editor (pixels, for layout only) |
| `width`, `height` | number | Scene dimensions in tiles (1 tile = 8×8 pixels) |
| `type` | string | Scene type ("0" = default top-down) |
| `actors` | Actor[] | Actors placed in this scene |
| `triggers` | Trigger[] | Trigger zones in this scene |
| `collisions` | number[] | Collision tile data array |
| `script` | ScriptEvent[] | Scene initialization script |
| `playerHit1Script` | ScriptEvent[] | Player collision script (slot 1) |
| `playerHit2Script` | ScriptEvent[] | Player collision script (slot 2) |
| `playerHit3Script` | ScriptEvent[] | Player collision script (slot 3) |

**Standard Game Boy screen:** 160×144 pixels = 20×18 tiles. Scenes can be larger for scrolling.

## Actor Structure

```json
{
  "id": "uuid",
  "name": "Shopkeeper",
  "x": 5,
  "y": 8,
  "spriteSheetId": "sprite-uuid",
  "spriteType": "STATIC",
  "direction": "down",
  "moveSpeed": 1,
  "animSpeed": 3,
  "script": [],
  "startScript": [],
  "updateScript": [],
  "hit1Script": [],
  "hit2Script": [],
  "hit3Script": []
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique UUID |
| `name` | string | Display name |
| `x`, `y` | number | Position in tiles within the scene |
| `spriteSheetId` | string | UUID of the sprite sheet asset |
| `spriteType` | string | `"STATIC"` (no animation), `"ACTOR"` (4-direction), `"ACTOR_ANIMATED"` (animated) |
| `direction` | string | `"down"`, `"up"`, `"left"`, `"right"` |
| `moveSpeed` | number | Movement speed (1-4) |
| `animSpeed` | number | Animation speed (1-4) |
| `script` | ScriptEvent[] | **Interact** — runs when player presses A facing this actor |
| `startScript` | ScriptEvent[] | **On scene load** — runs when scene starts |
| `updateScript` | ScriptEvent[] | **Every frame** — runs continuously |
| `hit1Script` | ScriptEvent[] | Collision handler 1 |
| `hit2Script` | ScriptEvent[] | Collision handler 2 |
| `hit3Script` | ScriptEvent[] | Collision handler 3 |

## Trigger Structure

```json
{
  "id": "uuid",
  "name": "Door to Forest",
  "x": 10,
  "y": 15,
  "width": 2,
  "height": 1,
  "script": [],
  "leaveScript": []
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique UUID |
| `name` | string | Display name |
| `x`, `y` | number | Top-left position in tiles |
| `width`, `height` | number | Size in tiles |
| `script` | ScriptEvent[] | **On enter** — runs when player walks into the zone |
| `leaveScript` | ScriptEvent[] | **On leave** — runs when player walks out of the zone |

## Variable Structure

```json
{
  "id": "uuid",
  "name": "hasSword"
}
```

Variables are global. They can be boolean flags or numeric values, depending on which script events operate on them.

## Background Asset

```json
{
  "id": "uuid",
  "name": "Default Background",
  "filename": "default.png",
  "width": 20,
  "height": 18,
  "imageWidth": 160,
  "imageHeight": 144
}
```

The `filename` is relative to the project's `assets/backgrounds/` directory. The actual PNG file must exist there for GB Studio to render it. This MCP server creates stub entries; you add the real PNG files via GB Studio's asset manager.

**Constraints:** Background images must use colors from the assigned palette (4 colors max per 8×8 tile).

## Sprite Sheet Asset

```json
{
  "id": "uuid",
  "name": "Default Sprite",
  "filename": "default_sprite.png",
  "numFrames": 1
}
```

The `filename` is relative to `assets/sprites/`. Sprite dimensions depend on `numFrames` and the sprite type.

## Palette Structure

```json
{
  "id": "uuid",
  "name": "Default Palette",
  "colors": [
    ["E8F8E0", "B0F088", "509878", "202850"]
  ]
}
```

Each palette contains arrays of 4 hex colors, from lightest to darkest. The classic Game Boy green palette is `["E8F8E0", "B0F088", "509878", "202850"]`.

## Settings

```json
{
  "startSceneId": "scene-uuid",
  "startX": 0,
  "startY": 0,
  "startMoveSpeed": 1,
  "startAnimSpeed": 3,
  "startDirection": "down",
  "playerSpriteSheetId": "sprite-uuid",
  "defaultBackgroundPaletteIds": ["pal-uuid", ...],
  "defaultSpritePaletteIds": ["pal-uuid", ...],
  "defaultUIPaletteId": "pal-uuid"
}
```

| Field | Description |
|-------|-------------|
| `startSceneId` | UUID of the scene where the game begins |
| `startX`, `startY` | Player's starting tile position |
| `startDirection` | Player's starting facing direction |
| `playerSpriteSheetId` | UUID of the player's sprite sheet |
| `defaultBackgroundPaletteIds` | Array of 6 palette UUIDs for background layers |
| `defaultSpritePaletteIds` | Array of 6 palette UUIDs for sprite layers |
| `defaultUIPaletteId` | UUID of the UI palette |

## Script Event Structure

See [Script Events](script-events.md) for the full reference. The basic structure is:

```json
{
  "id": "uuid",
  "command": "EVENT_TEXT",
  "args": { "text": "Hello!" },
  "children": {}
}
```

Events are stored in arrays and execute sequentially. Conditional events use the `children` field with `"true"` and `"false"` keys containing sub-arrays of events.
