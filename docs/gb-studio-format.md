# GB Studio 4.2.2 Project Format

## Split-Resource Format

GB Studio 4.2.2 uses a **split-resource format** where project data is stored across multiple `.gbsres` files rather than a single monolithic `.gbsproj` file.

### Project Structure

```
MyProject/
├── MyProject.gbsproj          # Root metadata only
├── assets/
│   ├── backgrounds/
│   │   ├── cave.png           # Image file
│   │   └── cave.png.gbsres   # Background metadata
│   ├── sprites/
│   │   ├── player.png
│   │   └── player.png.gbsres
│   ├── music/
│   ├── sounds/
│   ├── fonts/
│   ├── emotes/
│   ├── avatars/
│   ├── tilesets/
│   └── ui/
├── project/
│   ├── settings.gbsres
│   ├── variables.gbsres
│   ├── engine_field_values.gbsres
│   ├── palettes/
│   │   ├── default_bg_1.gbsres
│   │   └── ...
│   └── scenes/
│       └── my_scene/
│           ├── scene.gbsres
│           ├── actors/
│           │   └── guard.gbsres
│           └── triggers/
│               └── door.gbsres
└── plugins/
```

### Root File (.gbsproj)

```json
{
  "_resourceType": "project",
  "name": "MyProject",
  "author": "Author",
  "notes": "",
  "_version": "4.2.0",
  "_release": "10"
}
```

### Scene (.gbsres)

```json
{
  "_resourceType": "scene",
  "id": "uuid",
  "_index": 0,
  "type": "TOPDOWN",
  "name": "Cave",
  "symbol": "scene_cave",
  "x": 0,
  "y": 0,
  "width": 20,
  "height": 18,
  "backgroundId": "bg-uuid",
  "tilesetId": "",
  "colorModeOverride": "none",
  "paletteIds": [],
  "spritePaletteIds": [],
  "autoFadeSpeed": 1,
  "script": [],
  "playerHit1Script": [],
  "playerHit2Script": [],
  "playerHit3Script": [],
  "collisions": ""
}
```

**Scene types:** `TOPDOWN`, `PLATFORM`, `ADVENTURE`, `SHMUP`, `POINTNCLICK`, `LOGO`

### Actor (.gbsres)

```json
{
  "_resourceType": "actor",
  "id": "uuid",
  "_index": 0,
  "symbol": "actor_guard",
  "prefabId": "",
  "name": "Guard",
  "coordinateType": "tiles",
  "x": 5,
  "y": 3,
  "frame": 0,
  "animate": false,
  "spriteSheetId": "sprite-uuid",
  "paletteId": "",
  "direction": "down",
  "moveSpeed": 1,
  "animSpeed": 15,
  "isPinned": false,
  "persistent": false,
  "collisionGroup": "",
  "collisionExtraFlags": [],
  "prefabScriptOverrides": {},
  "script": [],
  "startScript": [],
  "updateScript": [],
  "hit1Script": [],
  "hit2Script": [],
  "hit3Script": []
}
```

### Trigger (.gbsres)

```json
{
  "_resourceType": "trigger",
  "id": "uuid",
  "_index": 0,
  "symbol": "trigger_door",
  "prefabId": "",
  "name": "Door",
  "x": 1,
  "y": 1,
  "width": 2,
  "height": 1,
  "prefabScriptOverrides": {},
  "script": [],
  "leaveScript": []
}
```

### Background (.png.gbsres)

```json
{
  "_resourceType": "background",
  "id": "uuid",
  "name": "cave",
  "symbol": "bg_cave",
  "filename": "cave.png",
  "width": 20,
  "height": 18,
  "imageWidth": 160,
  "imageHeight": 144,
  "tileColors": "",
  "autoColor": false
}
```

### Sprite (.png.gbsres)

```json
{
  "_resourceType": "sprite",
  "id": "uuid",
  "name": "player",
  "symbol": "sprite_player",
  "states": [{
    "id": "uuid",
    "name": "",
    "animationType": "multi_movement",
    "flipLeft": true,
    "animations": [{
      "id": "uuid",
      "frames": [{
        "id": "uuid",
        "tiles": [{
          "id": "uuid",
          "x": 0, "y": 0,
          "sliceX": 0, "sliceY": 0,
          "flipX": false, "flipY": false,
          "palette": 0, "paletteIndex": 0,
          "objPalette": "OBP0",
          "priority": false
        }]
      }]
    }]
  }]
}
```

**Animation types:** `fixed`, `multi_movement`, `multi`, `fixed_movement`

### Variable Format

Variables use string IDs: `"0"`, `"1"`, etc. for globals.

```json
{
  "_resourceType": "variables",
  "variables": [
    { "id": "0", "name": "Has Key", "symbol": "var_has_key" }
  ],
  "constants": []
}
```

### Value Types in Events

GB Studio 4.2.2 uses typed values in event args:

```json
{ "type": "number", "value": 5 }
{ "type": "true" }
{ "type": "false" }
{ "type": "variable", "value": "0" }
{ "type": "eq", "valueA": {...}, "valueB": {...} }
```
