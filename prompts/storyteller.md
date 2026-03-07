# 📖 The Storyteller

## Who they are
Writer, tabletop RPG designer, or interactive fiction author. They think in characters, dialogue trees, narrative arcs, and world-building. They might have written a novel, run D&D campaigns, or made Twine games. They see Game Boy as a charming medium for a short story.

## What they want
To bring a narrative to life — branching conversations, characters with personality, a world that reveals its story as you explore. The *writing* is the game. Everything else is plumbing.

## What they DON'T know
- How game engines structure things (scenes vs levels vs rooms)
- Technical limitations of Game Boy text display (character limits per textbox)
- That "branching dialogue" in GB Studio means variable checks, not a dialogue tree editor
- Anything about coordinates, tile maps, or sprites
- That GB Studio text boxes are ~18 chars × 4 lines max

## How they talk
- Describes characters and motivations, not game objects
- Uses narrative language: "chapter", "act", "reveal", "arc", "twist"
- Writes dialogue IN their prompts, often with stage directions
- Thinks about pacing, not level design
- Says "room" or "place" instead of "scene"

---

## Prompts

### 🟢 Quick Win — Set the stage

> I'm writing a short ghost story set in an old lighthouse. Three locations: the beach, the lighthouse ground floor, and the top of the lighthouse where the ghost appears. Can you set that up?

**What the AI should do:** `create_project`, `add_scene` × 3. Name them evocatively (not "Scene 1"). Connect beach → ground floor → lighthouse top with triggers. This person cares about the *names* of things.

---

### 🟢 Quick Win — A character with voice

> Add an old fisherman on the beach. He should say: "I wouldn't go up there if I were you, kid. Last keeper went in and never came out. But you look like the stubborn type."

**What the AI should do:** `add_actor`, then `add_script_event` with the exact dialogue. Respect their writing — use their words verbatim. If the text is too long for one GB text box (~72 chars), split it naturally across multiple `EVENT_TEXT` events. Don't rewrite their dialogue.

---

### 🟡 Medium — Branching conversation

> The ghost at the top should ask "Do you know why I'm here?" and then the player can say "Yes" or "No." If yes, the ghost tells the short version. If no, the ghost tells the whole tragic backstory.

**What the AI should do:** This needs `add_variable` (e.g., `playerKnowsStory`), then a dialogue sequence using `EVENT_IF_VARIABLE_TRUE` to branch. BUT — GB Studio's branching is variable-based, not choice-based. Be transparent: "GB Studio doesn't have built-in dialogue choices. I can set it up so a previous conversation sets a flag, and the ghost checks it. Or I can do a simpler version where the ghost just tells the full story." Offer the workaround, don't pretend it's native.

---

### 🟡 Medium — Environmental storytelling

> In the ground floor, I want the player to find a journal on a desk. When they read it, it shows three entries — each one getting more panicked. The last one just says "It's coming."

**What the AI should do:** `add_actor` for the journal/desk, then `add_script_event` with multiple `EVENT_TEXT` events in sequence. Three text boxes: entry 1 (calm), entry 2 (worried), entry 3 ("It's coming."). The pacing of multiple text boxes IS the storytelling here.

---

### 🟡 Medium — Character relationships

> After talking to the fisherman, I want the lighthouse keeper's ghost to say something different — like she knows you talked to him. "So... old Murray sent you, did he?"

**What the AI should do:** `add_variable` (e.g., `talkedToFisherman`), set it to true when the fisherman dialogue finishes, then add `EVENT_IF_VARIABLE_TRUE` to the ghost's script. True branch: "So... old Murray sent you, did he?" False branch: "Who are you? How did you find this place?" This is the storyteller's favorite pattern — characters that react to what you've done.

---

### 🔴 Deep Dive — A full short story

> Here's my story outline:
> - Act 1: Beach. Meet the fisherman, get warned. Find a locket in the sand.
> - Act 2: Ground floor. Read the journal. Find a photo that matches the locket.
> - Act 3: Lighthouse top. Meet the ghost. If you have the locket, she remembers who she was and finds peace. If not, she attacks (game over).
> Can you build the whole thing?

**What the AI should do:** Full build — `create_project`, 3 scenes, 3 actors (fisherman, journal, ghost), 2 variables (`hasLocket`, `readJournal`), triggers between scenes, and branching scripts on the ghost. The locket actor sets `hasLocket` on interact. The ghost checks it for the ending branch. This is a complete game — build it, save it, tell them they just made a game.

---

### 🔴 Deep Dive — Multiple endings

> I want three endings based on what the player did: the "good" ending if you have the locket and read the journal, the "bad" ending if you have neither, and a "bittersweet" ending if you only have one.

**What the AI should do:** This requires combining two variable checks. Use nested `EVENT_IF_VARIABLE_TRUE`: check `hasLocket` first, then within each branch check `readJournal`. Four possible states → map to three endings. Build the script chain carefully and explain the logic back to them in narrative terms, not code terms.

---

## Gotchas

| They do this | What's actually happening | How to handle it |
|---|---|---|
| Write dialogue that's way too long | GB text boxes hold ~72 characters | Split across multiple EVENT_TEXT events at natural break points. Don't truncate — just flow it across boxes. Tell them about the limit gently. |
| Ask for dialogue choices | GB Studio doesn't have a native choice menu via MCP | Offer variable-based alternatives: "A previous action determines what the character says." Or suggest using two actors as "response options" the player walks to. |
| Think in "chapters" not scenes | They imagine linear flow, not spatial | Map chapters to scenes. "Each chapter becomes a location the player walks through." |
| Describe things cinematically | "The camera pans to reveal..." | GB Studio has limited camera control. Translate to what's possible: sequential text boxes revealing information, actor show/hide. |
| Focus only on dialogue, forget structure | Pages of dialogue but no scene layout | Gently add structure: "I'll place these conversations in scenes and connect them. Here's how the player moves through your story." |
