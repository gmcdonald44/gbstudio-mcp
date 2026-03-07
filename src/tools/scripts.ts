/**
 * @module tools/scripts
 * @description Script event tools — add, get, and clear script events on scenes, actors, and triggers.
 *
 * Scripts are arrays of {@link ScriptEvent} objects that define game logic. Each event has a
 * `command` (e.g. `EVENT_DIALOGUE`, `EVENT_SCENE_SWITCH`) and `args` specific to that command.
 *
 * **Supported GB Studio 4.x event commands include:**
 * - `EVENT_TEXT` — Show text dialogue (`args: { text: string }`)
 * - `EVENT_SWITCH_SCENE` — Transition to another scene (`args: { sceneId, x, y, direction, fadeSpeed }`)
 * - `EVENT_IF_TRUE` — Conditional branch on variable being true (`args: { variable }`, `children: { true: [...], false: [...] }`)
 * - `EVENT_IF_VALUE` — Conditional branch comparing variable to value (`args: { variable, operator, comparator }`, `children: { true: [...], false: [...] }`)
 * - `EVENT_SET_TRUE` / `EVENT_SET_FALSE` — Set a variable to true/false (`args: { variable }`)
 * - `EVENT_SET_VALUE` — Set a variable to a numeric value (`args: { variable, value }`)
 * - `EVENT_VARIABLE_MATH` — Math on variables (`args: { vectorX, operation, other, vectorY, value }`)
 * - `EVENT_ACTOR_MOVE_TO` — Move an actor (`args: { actorId, x, y }`)
 * - `EVENT_ACTOR_SET_DIRECTION` — Change actor direction (`args: { actorId, direction }`)
 * - `EVENT_CAMERA_MOVE_TO` — Move camera (`args: { x, y, speed }`)
 * - `EVENT_WAIT` — Wait frames (`args: { time }`)
 * - `EVENT_FADE_IN` / `EVENT_FADE_OUT` — Screen fade (`args: { speed }`)
 * - `EVENT_SOUND_PLAY_EFFECT` — Play sound effect (`args: { type, pitch, duration }`)
 * - `EVENT_MUSIC_PLAY` / `EVENT_MUSIC_STOP` — Music control (`args: { musicId }`)
 * - `EVENT_MENU` — Show a menu (`args: { options, variable }`)
 * - `EVENT_CHOICE` — Show a choice prompt (`args: { trueText, falseText }`, `children: { true, false }`)
 * - `EVENT_OVERLAY_SHOW` / `EVENT_OVERLAY_HIDE` — Overlay control
 * - `EVENT_PLAYER_SET_SPRITE` — Change player sprite (`args: { spriteSheetId }`)
 */
import { resolveScriptTarget, uuid } from "../project.js";
import type { ScriptEvent } from "../project.js";

export const scriptTools = {
  /**
   * @description Append a script event to a scene, actor, or trigger script array.
   * This is the primary tool for adding game logic — dialogue, scene transitions,
   * conditionals, variable changes, movement, and more.
   *
   * @param args.target - Target type: "scene", "actor", or "trigger" (required)
   * @param args.targetId - UUID of the target entity (required)
   * @param args.scriptType - Script array name: "script", "startScript", "updateScript",
   *   "hit1Script", "hit2Script", "hit3Script", "leaveScript", "playerHit1Script", etc. (required)
   * @param args.command - Event command string, e.g. "EVENT_DIALOGUE" (required)
   * @param args.args - Command-specific arguments (optional)
   * @param args.children - Child script branches for conditionals (optional)
   * @param args.sceneId - Scene UUID, required when target is "actor" or "trigger"
   * @returns MCP response with the event command and UUID
   * @throws {Error} If target not found, invalid script type, or missing sceneId for actor/trigger
   *
   * @example
   * // Add dialogue to an actor's interaction script:
   * {
   *   "name": "add_script_event",
   *   "arguments": {
   *     "target": "actor",
   *     "targetId": "actor-uuid",
   *     "sceneId": "scene-uuid",
   *     "scriptType": "script",
   *     "command": "EVENT_TEXT",
   *     "args": { "text": "Welcome to my shop!\nWould you like to buy something?" }
   *   }
   * }
   *
   * @example
   * // Add a scene switch to a trigger:
   * {
   *   "name": "add_script_event",
   *   "arguments": {
   *     "target": "trigger",
   *     "targetId": "trigger-uuid",
   *     "sceneId": "scene-uuid",
   *     "scriptType": "script",
   *     "command": "EVENT_SWITCH_SCENE",
   *     "args": { "sceneId": "dungeon-uuid", "x": 5, "y": 1, "direction": "down", "fadeSpeed": 2 }
   *   }
   * }
   *
   * @example
   * // Add a conditional check with true/false branches:
   * {
   *   "name": "add_script_event",
   *   "arguments": {
   *     "target": "actor",
   *     "targetId": "guard-uuid",
   *     "sceneId": "scene-uuid",
   *     "scriptType": "script",
   *     "command": "EVENT_IF_TRUE",
   *     "args": { "variable": "hasSword-uuid" },
   *     "children": {
   *       "true": [{ "id": "uuid", "command": "EVENT_TEXT", "args": { "text": "You may pass." } }],
   *       "false": [{ "id": "uuid", "command": "EVENT_TEXT", "args": { "text": "You need a sword!" } }]
   *     }
   *   }
   * }
   */
  add_script_event: {
    description: "Append a script event to a scene, actor, or trigger script",
    inputSchema: {
      type: "object" as const,
      properties: {
        target: { type: "string", enum: ["scene", "actor", "trigger"], description: "Target type" },
        targetId: { type: "string", description: "UUID of the target (scene/actor/trigger)" },
        scriptType: { type: "string", description: "Script array name: script, startScript, updateScript, hit1Script, etc." },
        command: { type: "string", description: "Event command, e.g. EVENT_TEXT, EVENT_SWITCH_SCENE" },
        args: { type: "object", description: "Event arguments" },
        children: { type: "object", description: "Child script branches (for conditionals)" },
        sceneId: { type: "string", description: "Scene UUID (required for actor/trigger targets)" },
      },
      required: ["target", "targetId", "scriptType", "command"],
    },
    handler: async (args: { target: string; targetId: string; scriptType: string; command: string; args?: Record<string, any>; children?: Record<string, ScriptEvent[]>; sceneId?: string }) => {
      const { owner, scriptKey } = resolveScriptTarget(args.target, args.targetId, args.scriptType, args.sceneId);
      const event: ScriptEvent = {
        id: uuid(),
        command: args.command,
        args: args.args || {},
      };
      if (args.children) event.children = args.children;
      (owner as any)[scriptKey].push(event);
      return { content: [{ type: "text" as const, text: `Script event added: ${args.command} (${event.id})` }] };
    },
  },

  /**
   * @description Clear all events from a script array, removing all game logic
   * from that script slot.
   *
   * @param args.target - Target type: "scene", "actor", or "trigger" (required)
   * @param args.targetId - UUID of the target (required)
   * @param args.scriptType - Script array name to clear (required)
   * @param args.sceneId - Scene UUID (required for actor/trigger targets)
   * @returns MCP response with the number of events cleared
   *
   * @example
   * // Clear an actor's interaction script:
   * {
   *   "name": "clear_script",
   *   "arguments": {
   *     "target": "actor",
   *     "targetId": "actor-uuid",
   *     "sceneId": "scene-uuid",
   *     "scriptType": "script"
   *   }
   * }
   * // Returns: "Cleared 3 events from script"
   */
  clear_script: {
    description: "Clear all events from a script",
    inputSchema: {
      type: "object" as const,
      properties: {
        target: { type: "string", enum: ["scene", "actor", "trigger"] },
        targetId: { type: "string" },
        scriptType: { type: "string" },
        sceneId: { type: "string" },
      },
      required: ["target", "targetId", "scriptType"],
    },
    handler: async (args: { target: string; targetId: string; scriptType: string; sceneId?: string }) => {
      const { owner, scriptKey } = resolveScriptTarget(args.target, args.targetId, args.scriptType, args.sceneId);
      const count = (owner as any)[scriptKey].length;
      (owner as any)[scriptKey] = [];
      return { content: [{ type: "text" as const, text: `Cleared ${count} events from ${args.scriptType}` }] };
    },
  },

  /**
   * @description Get all script events from a target's script array.
   * Useful for inspecting current game logic before making changes.
   *
   * @param args.target - Target type: "scene", "actor", or "trigger" (required)
   * @param args.targetId - UUID of the target (required)
   * @param args.scriptType - Script array name to read (required)
   * @param args.sceneId - Scene UUID (required for actor/trigger targets)
   * @returns MCP response with JSON array of script events
   *
   * @example
   * // Get an actor's interaction script:
   * {
   *   "name": "get_script",
   *   "arguments": {
   *     "target": "actor",
   *     "targetId": "actor-uuid",
   *     "sceneId": "scene-uuid",
   *     "scriptType": "script"
   *   }
   * }
   * // Returns: [{ "id": "...", "command": "EVENT_DIALOGUE", "args": { "text": "Hello!" } }]
   */
  get_script: {
    description: "Get all script events from a target",
    inputSchema: {
      type: "object" as const,
      properties: {
        target: { type: "string", enum: ["scene", "actor", "trigger"] },
        targetId: { type: "string" },
        scriptType: { type: "string" },
        sceneId: { type: "string" },
      },
      required: ["target", "targetId", "scriptType"],
    },
    handler: async (args: { target: string; targetId: string; scriptType: string; sceneId?: string }) => {
      const { owner, scriptKey } = resolveScriptTarget(args.target, args.targetId, args.scriptType, args.sceneId);
      return { content: [{ type: "text" as const, text: JSON.stringify((owner as any)[scriptKey], null, 2) }] };
    },
  },
};
