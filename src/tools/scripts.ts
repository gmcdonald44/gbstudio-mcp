import { resolveScriptTarget, uuid } from "../project.js";
import type { ScriptEvent } from "../project.js";

export const scriptTools = {
  add_script_event: {
    description: "Append a script event to a scene, actor, or trigger script",
    inputSchema: {
      type: "object" as const,
      properties: {
        target: { type: "string", enum: ["scene", "actor", "trigger"], description: "Target type" },
        targetId: { type: "string", description: "UUID of the target (scene/actor/trigger)" },
        scriptType: { type: "string", description: "Script array name: script, startScript, updateScript, hit1Script, etc." },
        command: { type: "string", description: "Event command, e.g. EVENT_DIALOGUE" },
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
