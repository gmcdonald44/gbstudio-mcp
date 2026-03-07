# 💻 The Developer

## Who they are
Software developer (web, backend, game dev, whatever) who wants to make a Game Boy game but doesn't want to learn GB Studio's GUI. They're comfortable with APIs, JSON, data structures — they just want to wire up game logic and get a ROM out. Art is someone else's problem.

## What they want
Fast iteration on game structure and logic. Define scenes, wire up state machines with variables and conditionals, build and test. They'd rather describe the game graph than click through a visual editor.

## What they DON'T know
- GB Studio's specific scene types and constraints
- What sprite/background dimensions are valid
- The EVENT_* naming convention for script events
- GB Studio's limitations (no floating point, limited variables, 4-color palette)
- How the `.gbsproj` JSON is actually structured

## How they talk
- Uses technical terms: "state machine", "conditional branch", "event handler"
- Asks about data structures and available parameters
- Wants to know the API surface — what can and can't be done
- Comfortable with coordinates, IDs, and explicit values
- May try to over-engineer things that GB Studio can't support

---

## Prompts

### 🟢 Quick Win — Scaffold a project

> Create a new project called "DungeonCrawl" and add 4 scenes: spawn, hallway, treasure_room, boss. Top-down RPG type.

**What the AI should do:** `create_project` with name "DungeonCrawl", then `add_scene` × 4. Devs like confirmation of what was created — list the scene IDs back to them.

---

### 🟢 Quick Win — Inspect the structure

> What's in the project right now? List all scenes and their actors.

**What the AI should do:** `get_project_info`, then `list_scenes`, then `list_actors` for each scene. Return it in a structured format — they'll appreciate a clean summary.

---

### 🟡 Medium — Variable-driven gate

> Add a variable called "hasKey" and set up a guard actor in the hallway scene. If hasKey is true, the guard says "You may pass" and the player transitions to treasure_room. If false, "You need the key."

**What the AI should do:** `add_variable` for `hasKey`, `add_actor` for the guard, then `add_script_event` with `EVENT_IF_VARIABLE_TRUE` checking hasKey. True branch: dialogue + `EVENT_SCENE_SWITCH`. False branch: dialogue only. This is the bread-and-butter conditional pattern.

---

### 🟡 Medium — Batch actor creation

> Add 5 enemies to the boss scene, spread evenly across the room. They should all have the same dialogue: "You won't survive!"

**What the AI should do:** `add_actor` × 5 with calculated positions (e.g., evenly spaced across the scene width). Same `add_script_event` for each. Dev will appreciate knowing the exact coordinates used.

---

### 🟡 Medium — Wire up a scene graph

> Connect all 4 scenes linearly: spawn → hallway → treasure_room → boss. Put triggers on the right edge of each scene to advance.

**What the AI should do:** `add_trigger` + `add_script_event` (EVENT_SCENE_SWITCH) for each transition. Three triggers total (last scene has no exit). Report the trigger positions and target scenes.

---

### 🔴 Deep Dive — Multi-variable quest system

> I want a simple quest system. Three variables: talkedToElder, foundSword, defeatedBoss. The elder in spawn gives you the quest (sets talkedToElder). The chest in treasure_room gives the sword (sets foundSword, but only if talkedToElder). The boss checks foundSword — if true, you win; if false, game over dialogue.

**What the AI should do:** `add_variable` × 3, then build the script chains:
1. Elder actor: `EVENT_TEXT` → `EVENT_VARIABLE_SET` (talkedToElder = true)
2. Chest actor: `EVENT_IF_VARIABLE_TRUE` (talkedToElder) → true: `EVENT_TEXT` + `EVENT_VARIABLE_SET` (foundSword) / false: `EVENT_TEXT` "It's locked"
3. Boss actor: `EVENT_IF_VARIABLE_TRUE` (foundSword) → true: victory dialogue / false: defeat dialogue

This is the most common "real game" pattern. Get the variable names exactly right.

---

### 🔴 Deep Dive — Rebuild from spec

> Here's my game design doc: 6 scenes, 12 NPCs, 4 variables, 8 triggers. I'll give you the details for each — just build the whole thing and save it.

**What the AI should do:** Work through it systematically — project first, all scenes, then actors per scene, then triggers, then variables, then script events. Save at the end. For a dev, the key value is speed — they're using MCP specifically to avoid clicking through the GUI 30 times.

---

## Gotchas

| They do this | What's actually happening | How to handle it |
|---|---|---|
| Ask for loops or functions | GB Studio scripting is event-based, no real loops/functions | Explain the constraint: "GB Studio uses a flat event list, not a programming language. I can chain conditionals but can't do for-loops or function calls." |
| Use programming variable names like `player.health` | GB Studio variables are flat — no namespacing, no types | Use simple names like `playerHealth`. Mention the variable limit if they're creating many. |
| Want to see the raw JSON | MCP abstracts over the .gbsproj format | Suggest: "Use `get_scene` and `get_script` to inspect what's been built. For raw JSON, open the .gbsproj file directly." |
| Try to over-architect | GB Studio is intentionally simple — no OOP, no complex state | Gently scope: "GB Studio is great for linear/branching narratives with simple state checks. Think JRPG, not Factorio." |
| Expect hot-reload or test runs | `build_rom` creates a .gb file but needs GB Studio CLI | Clarify the build pipeline: MCP → .gbsproj → GB Studio (or CLI) → ROM → emulator. |
