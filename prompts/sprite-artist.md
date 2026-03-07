# 🎨 The Sprite Artist

## Who they are
Pixel artist who's drawn a bunch of Game Boy-style sprites and backgrounds. Maybe they post on Twitter or itch.io. They know Aseprite inside and out but have never touched JSON or written a line of code. They want to turn their art into an actual playable game.

## What they want
A game structure that matches their art — scenes that use their backgrounds, characters placed where they drew them, basic interactions so it *feels* like a game. They'll swap in their real PNGs later in GB Studio.

## What they DON'T know
- What a `.gbsproj` file actually contains
- What "script events" or "triggers" mean in GB Studio terms
- How coordinates work (they think in pixels, not tile positions)
- What variables are for
- Anything about JSON, APIs, or MCP

## How they talk
- References art by description ("my tavern background", "the skeleton enemy")
- Thinks in visual terms ("put him in the corner", "near the door")
- Says "sprite" for everything — actors, NPCs, enemies, the player
- Describes interactions visually ("when you walk up to the chest it opens")

---

## Prompts

### 🟢 Quick Win — First game from scratch

> I've got a bunch of pixel art for a little dungeon crawler. Can you set up a project with three rooms — a village, a cave entrance, and a boss room?

**What the AI should do:** `create_project`, then `add_scene` × 3 with descriptive names. Mention that the scenes use placeholder backgrounds and they'll need to swap in their art in GB Studio. Keep scene types simple (top-down RPG style).

---

### 🟢 Quick Win — Place a character

> Put a villager sprite near the fountain in my village scene. She should just say "The cave is dangerous, take this torch!"

**What the AI should do:** `add_actor` to the village scene at a reasonable position, then `add_script_event` with `EVENT_TEXT` dialogue. Don't ask about sprite sheet IDs — use defaults and tell them they can change the sprite in GB Studio.

---

### 🟡 Medium — Connect rooms

> I want the player to walk to the right edge of the village and end up in the cave entrance. Like a door but it's just the edge of the screen.

**What the AI should do:** `add_trigger` at the right edge of the village scene, then `add_script_event` with `EVENT_SCENE_SWITCH` pointing to the cave scene. Explain what a trigger is in simple terms — "an invisible zone that does something when the player steps on it."

---

### 🟡 Medium — Multiple NPCs with dialogue

> Can you add three NPCs to the village? A blacksmith, an old lady, and a kid. They should each say something different — the blacksmith talks about swords, the old lady warns about the cave, and the kid just says something funny.

**What the AI should do:** `add_actor` × 3 at different positions (spread them out), then `add_script_event` with dialogue for each. Use distinct, short dialogue lines. Don't cluster them — space actors at least 3-4 tiles apart.

---

### 🟡 Medium — Describe the layout

> I drew my cave scene with a treasure chest in the bottom-left and a locked door at the top. Can you set that up with actors?

**What the AI should do:** `add_actor` for the chest (bottom-left coordinates, maybe x:2, y:12) and `add_actor` for the door (top-center, maybe x:9, y:2). Add basic interact dialogue for each. Note: "bottom-left" in GB Studio means high Y value, which may be counterintuitive — just place it correctly without confusing them with coordinate math.

---

### 🔴 Deep Dive — Boss room with a fight sequence

> The boss room should have a big skeleton boss in the middle. When you walk up to him he says "You dare enter my domain!" and then... I dunno, can we fake a fight somehow? Like check if the player has a sword and if they do the skeleton disappears?

**What the AI should do:** `add_actor` for the skeleton boss, `add_variable` for `hasSword`, then `add_script_event` with `EVENT_TEXT` for the boss dialogue, followed by `EVENT_IF_VARIABLE_TRUE` checking `hasSword`. If true → dialogue "The skeleton crumbles!" + `EVENT_ACTOR_HIDE`. If false → dialogue "You have no weapon... run!" The artist doesn't need to know about variable internals — just tell them "when you pick up the sword elsewhere, set this variable to true."

---

### 🔴 Deep Dive — Full scene wiring

> OK so I have 5 scenes drawn. Village, cave entrance, cave depths, boss room, and ending screen. Can you wire them all up so the player goes through them in order? Like doors between each one.

**What the AI should do:** `add_scene` × 5 (or use existing), then `add_trigger` + `add_script_event` (EVENT_SCENE_SWITCH) for each transition — village→cave entrance, cave entrance→cave depths, etc. Explain the flow back to them so they can verify it matches their art layout. Save frequently.

---

## Gotchas

| They do this | What's actually happening | How to handle it |
|---|---|---|
| Say "sprite" for everything | Could mean actor, background element, or player character | Ask: "Is this something the player talks to / interacts with, or part of the background?" Actors = interactive. Background = part of the scene image. |
| Give positions in pixels | GB Studio uses tile coordinates (8×8 px tiles) | Silently convert: divide pixel coords by 8. Don't lecture about tile grids. |
| Expect their art to appear | MCP creates placeholder assets, not real PNGs | Always mention: "This creates a placeholder — drop your actual PNG into the project folder and assign it in GB Studio." |
| Describe animations | gbstudio-mcp doesn't handle sprite animation states | Be upfront: "I can place the character and add interactions, but animation frames are set up in GB Studio's sprite editor." |
| Want things to "look right" | They're thinking visually but MCP is structural | Reassure them: "I'm building the skeleton — positions, interactions, scene flow. You'll make it pretty in GB Studio with your art." |
