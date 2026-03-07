/**
 * @module tools/scripts
 * @description Script event tools for GB Studio 4.2.2.
 * 
 * GB Studio 4.2.2 Event Commands (verified from source):
 * 
 * - EVENT_TEXT — Show dialogue text
 *   args: { text: string | string[] }
 * 
 * - EVENT_SWITCH_SCENE — Switch to another scene
 *   args: { sceneId: string, x: {type:"number",value:N}, y: {type:"number",value:N}, direction: string, fadeSpeed: string }
 * 
 * - EVENT_SET_VALUE — Set a variable to a value
 *   args: { variable: string, value: {type:"number"|"true"|"false",value?:N} }
 * 
 * - EVENT_IF — Conditional branch
 *   args: { condition: {type:"eq"|"ne"|"lt"|"gt"|"gte"|"lte", valueA:{type:"variable",value:string}, valueB:{type:"number",value:N}} }
 *   children: { true: [...events], false: [...events] }
 * 
 * - EVENT_WAIT — Wait for duration
 *   args: { time: {type:"number",value:N}, units?: "time"|"frames" }
 * 
 * - EVENT_ACTOR_MOVE_TO — Move actor to position
 *   args: { actorId: string, x: {type:"number",value:N}, y: {type:"number",value:N}, moveType?: string, useCollisions?: boolean }
 * 
 * - EVENT_ACTOR_SET_DIRECTION — Set actor facing direction
 *   args: { actorId: string, direction: {type:"direction",value:string} }
 * 
 * - EVENT_ACTOR_SET_POSITION — Set actor position instantly
 *   args: { actorId: string, x: {type:"number",value:N}, y: {type:"number",value:N} }
 * 
 * - EVENT_MUSIC_PLAY — Play music
 *   args: { musicId: string, loop: boolean }
 * 
 * - EVENT_MUSIC_STOP — Stop music
 *   args: {}
 * 
 * - EVENT_CAMERA_MOVE_TO — Move camera
 *   args: { x: {type:"number",value:N}, y: {type:"number",value:N}, speed: number }
 * 
 * - EVENT_CALL_CUSTOM_EVENT — Call custom event
 *   args: { customEventId: string }
 * 
 * - EVENT_FADE_IN / EVENT_FADE_OUT — Screen fade
 *   args: { speed: string }
 * 
 * - EVENT_ACTOR_EMOTE — Show emote bubble
 *   args: { actorId: string, emoteId: string }
 * 
 * - EVENT_ACTOR_SHOW / EVENT_ACTOR_HIDE
 *   args: { actorId: string }
 * 
 * - EVENT_SET_INPUT_SCRIPT — Bind input to script
 *   args: { input: string[] }
 *   children: { true: [...events] }
 * 
 * - EVENT_COMMENT — Developer comment (no-op)
 *   args: { text: string }
 */
import { resolveScriptTarget, uuid } from "../project.js";
import type { ScriptEvent } from "../project.js";

/** Ensure script events with children have __type: "event" */
function normalizeEvent(event: ScriptEvent): ScriptEvent {
  if (event.children) {
    event.__type = "event";
    // Recursively normalize children
    for (const key of Object.keys(event.children)) {
      event.children[key] = event.children[key].map(normalizeEvent);
    }
  }
  return event;
}

export const scriptTools = {
  add_script_event: {
    description: "Append a script event to a scene, actor, or trigger script. Uses GB Studio 4.2.2 event format.",
    inputSchema: {
      type: "object" as const,
      properties: {
        target: { type: "string", enum: ["scene", "actor", "trigger"], description: "Target type" },
        targetId: { type: "string", description: "UUID of the target" },
        scriptType: { type: "string", description: "Script array: script, startScript, updateScript, hit1Script, hit2Script, hit3Script, leaveScript, playerHit1Script, etc." },
        command: { type: "string", description: "Event command (e.g. EVENT_TEXT, EVENT_SWITCH_SCENE, EVENT_IF, EVENT_SET_VALUE, EVENT_WAIT)" },
        args: { type: "object", description: "Event arguments (command-specific)" },
        children: { type: "object", description: "Child branches for conditionals: { true: [...], false: [...] }" },
        sceneId: { type: "string", description: "Scene UUID (required for actor/trigger targets)" },
      },
      required: ["target", "targetId", "scriptType", "command"],
    },
    handler: async (args: {
      target: string; targetId: string; scriptType: string; command: string;
      args?: Record<string, any>; children?: Record<string, ScriptEvent[]>;
      sceneId?: string;
    }) => {
      const { owner, scriptKey } = resolveScriptTarget(args.target, args.targetId, args.scriptType, args.sceneId);

      // Build the event with proper IDs
      const event: ScriptEvent = {
        id: uuid(),
        command: args.command,
        args: args.args || {},
      };

      if (args.children) {
        event.children = {};
        for (const [key, events] of Object.entries(args.children)) {
          event.children[key] = (events as ScriptEvent[]).map(e => {
            const normalized = { ...e, id: e.id || uuid() };
            return normalizeEvent(normalized);
          });
        }
        event.__type = "event";
      }

      (owner as any)[scriptKey].push(event);
      return { content: [{ type: "text" as const, text: `Script event added: ${args.command} (${event.id})` }] };
    },
  },

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
