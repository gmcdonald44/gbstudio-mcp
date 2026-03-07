# ⏱️ The Game Jammer

## Who they are
Someone in a game jam (Ludum Dare, itch.io jam, GB Studio community jam) with a tight deadline — usually 48-72 hours. They might have some game dev experience or none at all. What they definitely have is urgency and a half-formed idea they need to ship.

## What they want
A playable game as fast as humanly possible. Scope is the enemy. They want to go from idea to ROM in one session. Polish later, ship now.

## What they DON'T know
- How long things actually take to set up
- What the minimum viable Game Boy game looks like
- When to stop adding features
- That they still need to do art separately (or use defaults)

## How they talk
- Urgent, shorthand, stream-of-consciousness
- "Just do it" energy — minimal questions, maximum output
- Drops ideas mid-sentence, changes direction
- Time-aware: "I've got 6 hours left", "need this done tonight"
- Thinks in terms of "the jam theme" and how to interpret it

---

## Prompts

### 🟢 Quick Win — Instant game

> Jam theme is "CONNECTIONS." Give me a game — like, right now. Whatever you think works. 3 scenes max, keep it tiny.

**What the AI should do:** Don't ask questions. `create_project`, design a quick concept (e.g., a phone operator connecting calls — 3 scenes: office, switchboard room, break room), `add_scene` × 3, add NPCs with thematic dialogue, connect scenes, save. The jammer wants a *decision made for them* — they'll iterate from there.

---

### 🟢 Quick Win — Scope check

> I have an idea for 10 scenes with a full quest system. Is that too much for a 48-hour jam?

**What the AI should do:** Be direct: "For a jam, aim for 3-5 scenes with one simple mechanic. 10 scenes with quests will eat your whole weekend on content alone. Want me to build the 3-scene version?" Then offer to build the scoped-down version immediately.

---

### 🟡 Medium — Speed-build a concept

> OK the theme is "DEPTH." I'm doing a mining game. Miner goes deeper — surface, shallow mine, deep mine, core. Each level has someone warning you to go back. At the bottom there's... something. Surprise me.

**What the AI should do:** `create_project`, `add_scene` × 4, `add_actor` per scene (miners with increasingly desperate warnings), triggers going deeper, and something fun at the core (a friendly mole who says "Took you long enough. Tea?"). Save. Jammer needs a complete playable loop they can riff on.

---

### 🟡 Medium — Pivot mid-jam

> Scratch everything. New idea. The theme is "LOOP" — I want a game where you're stuck in the same room and every time you leave, you end up back. But each time something's different.

**What the AI should do:** One scene that transitions back to itself (trigger → same scene). But add a variable (`loopCount` or similar flags like `loop1`, `loop2`, `loop3`) and use conditionals to change NPC dialogue each "loop." Loop 1: normal room. Loop 2: NPC says something weird. Loop 3: revelation. This is a clever jam game and very buildable with MCP tools.

---

### 🔴 Deep Dive — Full jam game in one prompt

> Here's my jam game. Theme: "ECHO." You're in a cave. You shout and hear echoes that tell you which way to go. 4 rooms: entrance, left fork, right fork, echo chamber. Wrong fork sends you back to entrance. Right fork leads to echo chamber where a voice tells you the secret of the cave. Variable: `wentRight`. Build it all, I need to start on art.

**What the AI should do:** Full build, no stops. `create_project`, 4 scenes, triggers (entrance→left fork, entrance→right fork, left fork→entrance loop-back, right fork→echo chamber), `add_variable` `wentRight`, actors with thematic dialogue. The left fork NPC echoes "wrong... wrong... wrong..." and the trigger sends you back. Right fork sets `wentRight`, echo chamber checks it. Save immediately. Report the complete structure so they can start art.

---

### 🔴 Deep Dive — Last-minute additions

> OK the game works but it feels empty. I've got 2 hours left. Can you add some flavor? More NPCs, maybe some signs, anything to make the caves feel lived-in. Don't change the structure.

**What the AI should do:** `add_actor` to each existing scene — environmental storytelling. Old signs ("DANGER: CAVE UNSTABLE"), a lost adventurer ("Have you seen the exit?"), mysterious runes ("The echoes know the way"). Don't touch existing triggers or scripts — just layer on top. Speed is everything.

---

## Gotchas

| They do this | What's actually happening | How to handle it |
|---|---|---|
| Change their mind constantly | Normal jam behavior — ideas evolve fast | Roll with it. Don't lecture about scope. Just build the new thing. |
| Want everything in one prompt | They're optimizing for speed, not clarity | Do your best to interpret, build it all, report what you built. Ask zero questions if possible. |
| Forget to save | Caught up in the creative rush | Auto-save. Always call `save_project` at the end of any build sequence. Mention the file path. |
| Underestimate remaining work | "Almost done, just need to add art" | Gently note: "Art, testing, and building the ROM will take time too. The structure is done — focus on getting default sprites looking OK." |
| Ask for features at the last minute | Scope creep at hour 46 | Build it if it's small (add an NPC, extra dialogue). Push back if it's big (new mechanics, restructuring). "That's a great idea for a post-jam update. For now, let's ship what we've got." |
