# 🎨 I Have Art Assets

You've got sprites or backgrounds ready. Use these prompts to build the game structure around them — then drop your PNGs into the GB Studio project folder.

> **Tip:** After saving the project, copy your PNG files into `assets/sprites/` and `assets/backgrounds/` inside the project folder. GB Studio will pick them up automatically.

---

## Getting Started

🟢 **Start a project around your assets:**
> "Create a new GB Studio project called 'ForestQuest'. I have sprites for a hero, a wizard NPC, and a slime enemy. Set up 3 scenes: a village, a forest, and a cave."

🟢 **Place a character you've already drawn:**
> "Add my merchant NPC to the village scene near the center. She should say 'Potions for sale! Only 10 gold each.' and 'Come back when you have more gold.' on repeat."

---

## Building Out the Game

🟡 **Wire up scene transitions:**
> "Add a trigger at the east edge of the village that takes the player to the forest scene. And another at the west edge of the forest that goes back to the village."

🟡 **Add a key item with a condition:**
> "Put a chest in the cave. When the player opens it, set a variable called 'hasKey' to true and show the message 'You found the iron key!'. Then add a locked door in the forest — if hasKey is true, switch to the boss scene. If not, say 'The door won't budge.'"

---

## Dialogue & Scripting

🔴 **NPC with branching state:**
> "There's a guard at the castle gate. Before the player finds the royal seal, he says 'No entry without authorization.' After they have it (variable 'hasSeal' is true), he says 'Ah, the royal seal! Right this way.' Can you set that up?"

🔴 **Full quest flow:**
> "Set up a quest: the wizard in the village sends the player to find a lost tome in the cave. When they get it (trigger on the tome object, sets 'hasTome' to true), the wizard's dialogue changes to 'You found it! Thank you, brave adventurer.' Save when done."
