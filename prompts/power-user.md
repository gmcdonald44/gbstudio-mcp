# 🔧 The GB Studio Power User

## Who they are
Someone who's already shipped a game (or three) in GB Studio. They know the GUI inside and out — scene types, sprite limits, GBVM, collision maps. They're here because they're tired of clicking "Add Event" 50 times to set up dialogue trees, or manually wiring 20 triggers for a dungeon.

## What they want
Automation. They want to describe repetitive structures once and have them built in bulk. They also want a faster way to prototype — test an idea structurally before committing to it in the GUI.

## What they DON'T know
- The MCP tool API specifics (parameter names, exact syntax)
- What gbstudio-mcp can't do (collision editing, music, custom GBVM)
- Whether the generated .gbsproj is 100% compatible with their GB Studio version

## How they talk
- Uses GB Studio terminology correctly: "scene type", "on interact script", "GBVM", "sprite sheet"
- Knows EVENT_* names or at least the concepts behind them
- Thinks in terms of project structure, not abstract game design
- Asks specific questions: "Can I set the scene type to PLATFORM?" "Does add_actor support movement routes?"
- Compares to what they'd do in the GUI

---

## Prompts

### 🟢 Quick Win — Bulk scene creation

> I need 12 scenes for a dungeon. Name them dungeon_01 through dungeon_12, all top-down type. Go.

**What the AI should do:** `add_scene` × 12 with sequential names. Fast, no questions. They know what they want. Report the IDs.

---

### 🟢 Quick Win — Check what's there

> Open my project at C:/Games/MyRPG.gbsproj and tell me how many scenes have zero actors.

**What the AI should do:** `open_project`, `list_scenes`, then `list_actors` for each scene. Report which scenes are empty. This is an audit.

---

### 🟡 Medium — Wire a dungeon grid

> Connect dungeon_01 through dungeon_12 in a 3×4 grid. Right edge goes right, left edge goes left, top goes up, bottom goes down. Standard dungeon navigation.

**What the AI should do:** Create triggers for each directional connection. 3×4 grid = scenes arranged as:
```
01 02 03
04 05 06
07 08 09
10 11 12
```
Right edge of 01 → 02, bottom edge of 01 → 04, etc. This is ~30+ triggers. Do it systematically, report the connections.

---

### 🟡 Medium — NPC template stamping

> Add a "sign" actor to every dungeon scene at position (1, 1). Each sign says "Dungeon Room X" where X is the room number.

**What the AI should do:** `add_actor` + `add_script_event` for each of the 12 scenes. Same position, parameterized dialogue. This is the MCP value prop for power users — what would take 10 minutes of clicking per scene takes one prompt.

---

### 🟡 Medium — Script inspection

> Show me all the scripts on the guard actor in the castle_gate scene. I need to know what events are wired up.

**What the AI should do:** `get_scene` to find the actor, then `get_script` on the guard. Return the full event list. Power users will verify this against what they expect.

---

### 🔴 Deep Dive — Conditional dialogue chain

> Set up a conversation system for the elder NPC: first time you talk to him he says intro text and sets `metElder`. Second time, he checks if you have the 3 quest items (`hasGem`, `hasSword`, `hasShield`). If all three, quest complete dialogue. If not, he lists what you're missing.

**What the AI should do:** `add_variable` × 4, then build nested conditionals:
1. Check `metElder`: false → intro + set `metElder` to true
2. True → check `hasGem`, `hasSword`, `hasShield` in sequence
3. All true → completion dialogue
4. Missing items → specific "You still need the ___" text

This requires careful nesting of `EVENT_IF_VARIABLE_TRUE`. Get the nesting right — power users will notice if it's wrong.

---

### 🔴 Deep Dive — Project migration helper

> I'm rebuilding my game from scratch. Here's the scene list from my old project: [paste]. Create all these scenes with the same names and types, then I'll reconnect everything manually in the GUI.

**What the AI should do:** Parse their scene list, `create_project`, `add_scene` for each one matching names exactly. The value is purely speed — they'd spend 20 minutes creating scenes in the GUI. Save the project so they can open it immediately.

---

### 🔴 Deep Dive — Clear and rebuild scripts

> The shopkeeper dialogue is a mess. Clear his entire script and rebuild it: greeting → show 3 items → player picks one (use variables item1/item2/item3) → thank you message.

**What the AI should do:** `clear_script` on the shopkeeper actor, then rebuild with `add_script_event` chain: `EVENT_TEXT` greeting, then three `EVENT_TEXT` + `EVENT_VARIABLE_SET` blocks (one per item — since there's no real "menu", this would be sequential or use a workaround). Be upfront about the lack of native choice menus. Power users know the limitations but might hope MCP has a trick.

---

## Gotchas

| They do this | What's actually happening | How to handle it |
|---|---|---|
| Use GB Studio features MCP doesn't support | Collision editing, music, custom GBVM, parallax, color palettes | Be explicit about what's out of scope: "MCP handles scenes, actors, triggers, scripts, and variables. For collision/music/palettes, use the GB Studio editor." |
| Expect exact .gbsproj version compatibility | MCP generates a specific format version | Mention which GB Studio version the output targets. If there are known compatibility issues, flag them. |
| Ask for scene types MCP might not support | Platform, adventure, shooter, etc. | Check if the `add_scene` tool accepts a type parameter. If not, say so — they can change it in GB Studio. |
| Want to script custom GBVM | Raw assembly-level Game Boy scripting | Out of scope for MCP. "I can build EVENT_* script chains. For raw GBVM, you'll need the GB Studio script editor." |
| Test by opening in GB Studio immediately | They'll spot structural issues fast | Make sure every project is saved and valid. Double-check IDs and references. Power users will file bug reports. |
