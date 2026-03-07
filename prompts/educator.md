# 🏫 The Educator

## Who they are
Teacher (middle school, high school, or after-school program) using Game Boy game-making as a way to teach concepts — could be CS fundamentals, creative writing, game design, or even history. They need something that works reliably, is easy to explain to students, and produces visible results fast.

## What they want
A structured, repeatable workflow they can walk students through. Probably a template project that students can modify. Bonus: something that maps to curriculum concepts (variables = math, dialogue = writing, scene design = storytelling).

## What they DON'T know
- May or may not know programming (varies widely)
- Probably hasn't used GB Studio before
- Doesn't know MCP or how AI tool-calling works under the hood
- Needs things to work the FIRST time — no debugging in front of 30 kids

## How they talk
- "My students", "the class", "the lesson"
- Asks for things in terms of learning objectives
- Wants step-by-step breakdowns they can turn into handouts
- Concerned about things that could go wrong
- Values clarity over cleverness

---

## Prompts

### 🟢 Quick Win — Template project for a class

> I need a starter project my students can modify. Something simple — two rooms, one NPC, one door between them. Can you make that?

**What the AI should do:** `create_project`, `add_scene` × 2 ("Room A", "Room B"), `add_actor` in Room A with simple dialogue, `add_trigger` connecting the rooms. Save. This is a **template** — name things clearly, keep positions obvious. Tell them exactly what students can change (dialogue text, NPC position, add more rooms).

---

### 🟢 Quick Win — Show what's possible

> Before I commit to using this in class, can you just show me a quick example? Make something small but impressive I can demo.

**What the AI should do:** Build a tiny polished game — 3 scenes, a couple NPCs with personality, a simple item/variable puzzle (find key → open door → meet king). Save it. This is a sales pitch to the teacher. Make it feel complete.

---

### 🟡 Medium — Lesson-aligned project

> I'm teaching variables and conditionals to 8th graders. Can you set up a game where students have to add a variable and an if/then check to make it work? Like, the game is broken without their code.

**What the AI should do:** Build a game where everything works EXCEPT one conditional. For example: a guard blocks a door and says "Show me the pass" but there's no variable check yet. Leave a clear gap. Then give the teacher instructions: "Students need to: 1) Create a variable called `hasPass`, 2) Add a script event to the guard that checks `hasPass`, 3) Connect the key NPC to set `hasPass` to true." This is a worksheet, not a finished game.

---

### 🟡 Medium — Multiple student variations

> I have 6 groups in my class. Can you make 6 versions of the same base project but with different themes? Like one is a pirate game, one is a space game, one is a haunted house...

**What the AI should do:** Create 6 projects (or explain how to duplicate one). Same structure (2-3 scenes, NPCs, triggers) but different names and dialogue for each theme. This is tedious but valuable — the teacher can't spend an hour per group. Batch it efficiently.

---

### 🟡 Medium — Step-by-step breakdown

> Can you walk me through exactly what commands create a scene with an NPC? I want to make a handout for my students.

**What the AI should do:** Don't just build it — explain each step:
1. `create_project` — "This creates a new game file"
2. `add_scene` — "This adds a room to your game"
3. `add_actor` — "This places a character in the room"
4. `add_script_event` — "This makes the character say something when you interact"
5. `save_project` — "This saves your work"

Use the simplest possible example. Teacher will copy this into a Google Doc.

---

### 🔴 Deep Dive — Curriculum-mapped unit

> I want to build a 3-week unit around this. Week 1: scenes and navigation. Week 2: NPCs and dialogue. Week 3: variables and conditionals. Can you create three project files — one for each week — where each one builds on the last?

**What the AI should do:** Three separate projects:
- **Week 1:** 3 empty scenes connected by triggers. Students explore navigation.
- **Week 2:** Same project but with NPCs added. Students write dialogue.
- **Week 3:** Same project but with a variable puzzle. Students wire up conditionals.

Each project should be self-contained (works on its own) but progressive. Save all three with clear names (`week1-navigation.gbsproj`, etc.).

---

### 🔴 Deep Dive — Student showcase prep

> My students built 15 games. Can you help me check if they all have at least 2 scenes, 1 NPC, and 1 trigger? I don't want to open each one manually.

**What the AI should do:** For each project file: `open_project` → `get_project_info` → check scene count, actor count, trigger count. Report a simple table: project name, scenes, actors, triggers, pass/fail. This is grading — speed and accuracy matter.

---

## Gotchas

| They do this | What's actually happening | How to handle it |
|---|---|---|
| Need it to work perfectly the first time | Classroom demos can't have errors | Test the flow mentally before responding. Use `save_project` after every major step. Suggest they test it in GB Studio before class. |
| Ask for the same thing 6/15/30 times | One per student/group | Look for the pattern and offer batch approaches. If possible, create one template and explain how to duplicate it. |
| Want printable instructions | They're making handouts | Format steps as numbered lists with clear, non-technical language. Avoid jargon. They'll copy-paste this. |
| Worry about students breaking things | Students will definitely break things | Suggest saving backups: "Have students save before experimenting. They can re-open the saved version if something goes wrong." |
| Ask if this is "age-appropriate" | Legitimate concern for schools | GB Studio makes kid-friendly retro games. No violence, no online features, no data collection. Content is whatever the students write. |
