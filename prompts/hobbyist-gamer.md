# 🎮 The Hobbyist Gamer

## Who they are
Someone who grew up playing Game Boy games and thinks "I could make one of those." No programming, no art skills, no game dev experience. They've maybe watched a YouTube video about GB Studio but haven't actually opened it yet. Pure enthusiasm.

## What they want
A playable game they can show their friends. Ideally something that feels like the games they loved — Pokémon, Zelda, Final Fantasy. They don't care about the technical details, they just want it to *work*.

## What they DON'T know
- Basically everything technical
- What scenes, actors, triggers, and variables are
- How Game Boy hardware constraints work (screen size, colors, etc.)
- That they'll need to open GB Studio separately for art
- That "making a game" involves lots of small structural decisions

## How they talk
- References games they've played: "like Pokémon", "Zelda-style", "like Final Fantasy battles"
- Describes what they want to *experience*, not what to build
- Vague on details — "some enemies", "a cool boss", "a shop or something"
- Gets excited and asks for huge scope immediately
- Uses "game" to mean the whole thing — doesn't distinguish art from logic from structure

---

## Prompts

### 🟢 Quick Win — The dream pitch

> I wanna make a Game Boy game! It's like a mini Zelda — you're a knight exploring a dungeon to save a princess. Can you start it for me?

**What the AI should do:** `create_project`, then `add_scene` for 3-4 iconic scenes (castle, dungeon entrance, dungeon, throne room). Add a couple NPCs with dialogue. Keep it small and completable — this person will lose steam if the first version takes an hour to set up. Save the project. Explain what they got and what to do next (open in GB Studio, add art).

---

### 🟢 Quick Win — Add something cool

> Can you add a secret room? Like a hidden passage behind a bookshelf or something.

**What the AI should do:** `add_scene` for the secret room, `add_trigger` in an existing scene (near a wall) with `EVENT_SCENE_SWITCH`. Add a fun NPC or treasure in the secret room. The "hidden" feel comes from trigger placement — put it somewhere non-obvious and mention that in the explanation.

---

### 🟡 Medium — NPCs that matter

> I want the village to feel alive. Add some people walking around... or at least standing there saying interesting stuff. Like a baker, a guard, and a mysterious stranger.

**What the AI should do:** `add_actor` × 3 with distinct positions, each with unique `EVENT_TEXT` dialogue. Make the dialogue characterful — the baker talks about bread, the guard warns about monsters, the stranger hints at a secret. This person wants *flavor*, not systems.

---

### 🟡 Medium — The "Pokémon request"

> Can we add like a battle system? Like when you fight a monster?

**What the AI should do:** Be honest about limitations — GB Studio (via MCP) doesn't have a real battle system. Offer the closest alternative: "I can fake a simple encounter — the monster appears, you check if the player has a weapon, and either win or lose with dialogue. Want me to set that up?" Then use variables + conditionals to create a lightweight "battle."

---

### 🟡 Medium — Items and progression

> How do I make it so the player picks up a key and then can open a locked door later?

**What the AI should do:** `add_variable` for `hasKey`, add a key actor with `EVENT_VARIABLE_SET` on interact, then modify the door/guard to use `EVENT_IF_VARIABLE_TRUE`. Explain the concept simply: "I'll create a flag called 'hasKey' — when you touch the key it turns on, and the door checks if it's on."

---

### 🔴 Deep Dive — The whole game

> OK here's my game idea: You're a pizza delivery guy in a haunted mansion. There are 5 rooms, each one has a ghost you need to deliver pizza to. When you deliver all 5 pizzas you escape. Can you build the whole thing??

**What the AI should do:** This is a full game build. `create_project`, `add_scene` × 5 (foyer, kitchen, library, attic, basement), connect them with triggers, add a ghost actor per room with conditional dialogue (checks `deliveredPizza1` through `deliveredPizza5`), add a variable per pizza, and a final door that checks all 5. This is ambitious but doable — build it step by step and save often. The person wants to see the whole vision realized.

---

### 🔴 Deep Dive — Scope management

> I want my game to have 20 towns, a world map, 50 NPCs, a leveling system, an inventory with 30 items, and multiplayer co-op.

**What the AI should do:** Gently scope down. "Game Boy games are beautifully small — let's start with the most exciting part. How about 3 towns, a handful of key NPCs, and a simple item system? We can always add more scenes later." Then build what's realistic. Don't say "no" — say "let's start with the good stuff."

---

## Gotchas

| They do this | What's actually happening | How to handle it |
|---|---|---|
| Ask for features that don't exist | Battles, inventory screens, world maps aren't built-in to MCP | Acknowledge the desire, offer the closest doable alternative, be specific about what IS possible |
| Give zero specifics | "Add some cool stuff" | Ask one targeted question: "What kind of vibe — spooky, funny, epic?" Then just make decisions for them. They want results, not a requirements meeting. |
| Think the game is "done" after MCP | They still need to add art and build the ROM | Always include a "next steps" note: open in GB Studio, add your pixel art (or use the defaults), hit Build. |
| Reference modern game features | "Like Breath of the Wild shrines" | Translate to Game Boy scale: "On Game Boy, we can do a puzzle room with a switch and a locked door — same idea, smaller scale." |
| Get overwhelmed by options | Too many scenes/features causes decision paralysis | Make opinionated choices for them. "I'll give you 4 rooms — you can always add more later." |
