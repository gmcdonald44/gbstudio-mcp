# Prompts Library

Example prompts for `gbstudio-mcp`, organized by the type of person using it.

## Who is this for?

Anyone using an AI assistant (Claude, OpenClaw, etc.) with gbstudio-mcp to build Game Boy games. These examples show how different people naturally ask for things — use them as inspiration, copy-paste starters, or reference for building your own workflows.

## How to use

1. Find the persona closest to you
2. Skim their prompts for ideas
3. Copy, tweak, and paste into your AI chat
4. Check the "Gotchas" section so you don't hit common snags

## Personas

| File | Persona | One-liner |
|------|---------|-----------|
| [sprite-artist.md](sprite-artist.md) | 🎨 The Sprite Artist | Has pixel art, zero code experience, wants to build a game around their art |
| [developer.md](developer.md) | 💻 The Developer | Comfortable with code, wants to build game logic fast without learning the GUI |
| [hobbyist-gamer.md](hobbyist-gamer.md) | 🎮 The Hobbyist Gamer | Just wants to make their dream game, no technical background |
| [storyteller.md](storyteller.md) | 📖 The Storyteller | Writer or RPG designer who thinks in narrative, not systems |
| [educator.md](educator.md) | 🏫 The Educator | Teacher using GB Studio for a classroom project |
| [power-user.md](power-user.md) | 🔧 The GB Studio Power User | Knows GB Studio deeply, wants to automate repetitive tasks |
| [game-jammer.md](game-jammer.md) | ⏱️ The Game Jammer | Has 48 hours, needs a playable game NOW |

## Tool Quick Reference

For prompt context, here are the 20 tools available:

- **Project:** `create_project`, `open_project`, `save_project`, `get_project_info`
- **Scenes:** `list_scenes`, `add_scene`, `get_scene`, `update_scene`, `delete_scene`
- **Actors:** `list_actors`, `add_actor`, `update_actor`, `delete_actor`
- **Triggers:** `add_trigger`, `update_trigger`, `delete_trigger`
- **Scripting:** `add_script_event`, `clear_script`, `get_script`
- **Variables:** `add_variable`, `list_variables`
- **Build:** `build_rom`
