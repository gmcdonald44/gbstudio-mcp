/**
 * @module tools/triggers
 * @description Trigger management tools for GB Studio 4.2.2.
 */
import { findScene, findTrigger, createTrigger } from "../project.js";

export const triggerTools = {
  list_triggers: {
    description: "List all triggers in a scene",
    inputSchema: {
      type: "object" as const,
      properties: { sceneId: { type: "string" } },
      required: ["sceneId"],
    },
    handler: async (args: { sceneId: string }) => {
      const scene = findScene(args.sceneId);
      const list = scene.triggers.map((t) => ({
        id: t.id, name: t.name, symbol: t.symbol,
        x: t.x, y: t.y, width: t.width, height: t.height,
      }));
      return { content: [{ type: "text" as const, text: JSON.stringify(list, null, 2) }] };
    },
  },

  add_trigger: {
    description: "Add a trigger zone to a scene",
    inputSchema: {
      type: "object" as const,
      properties: {
        sceneId: { type: "string", description: "Scene UUID" },
        name: { type: "string", description: "Trigger name (optional)" },
        x: { type: "number", description: "Tile X position" },
        y: { type: "number", description: "Tile Y position" },
        width: { type: "number", description: "Width in tiles (default: 2)" },
        height: { type: "number", description: "Height in tiles (default: 1)" },
      },
      required: ["sceneId", "x", "y"],
    },
    handler: async (args: { sceneId: string; name?: string; x: number; y: number; width?: number; height?: number }) => {
      const scene = findScene(args.sceneId);
      const trigger = createTrigger({
        name: args.name,
        x: args.x,
        y: args.y,
        width: args.width ?? 2,
        height: args.height ?? 1,
        _index: scene.triggers.length,
      });
      scene.triggers.push(trigger);
      return { content: [{ type: "text" as const, text: `Trigger added: "${trigger.name || trigger.symbol}" (${trigger.id}) at (${trigger.x}, ${trigger.y}) ${trigger.width}x${trigger.height}` }] };
    },
  },

  update_trigger: {
    description: "Update trigger properties",
    inputSchema: {
      type: "object" as const,
      properties: {
        sceneId: { type: "string" },
        triggerId: { type: "string" },
        name: { type: "string" },
        x: { type: "number" },
        y: { type: "number" },
        width: { type: "number" },
        height: { type: "number" },
      },
      required: ["sceneId", "triggerId"],
    },
    handler: async (args: { sceneId: string; triggerId: string; name?: string; x?: number; y?: number; width?: number; height?: number }) => {
      const scene = findScene(args.sceneId);
      const trigger = findTrigger(scene, args.triggerId);
      if (args.name !== undefined) trigger.name = args.name;
      if (args.x !== undefined) trigger.x = args.x;
      if (args.y !== undefined) trigger.y = args.y;
      if (args.width !== undefined) trigger.width = args.width;
      if (args.height !== undefined) trigger.height = args.height;
      return { content: [{ type: "text" as const, text: `Trigger updated: "${trigger.name || trigger.symbol}"` }] };
    },
  },

  delete_trigger: {
    description: "Delete a trigger from a scene",
    inputSchema: {
      type: "object" as const,
      properties: {
        sceneId: { type: "string" },
        triggerId: { type: "string" },
      },
      required: ["sceneId", "triggerId"],
    },
    handler: async (args: { sceneId: string; triggerId: string }) => {
      const scene = findScene(args.sceneId);
      const idx = scene.triggers.findIndex((t) => t.id === args.triggerId);
      if (idx === -1) throw new Error(`Trigger not found: ${args.triggerId}`);
      const removed = scene.triggers.splice(idx, 1)[0];
      return { content: [{ type: "text" as const, text: `Trigger deleted: "${removed.name || removed.symbol}"` }] };
    },
  },
};
