import { findScene, uuid } from "../project.js";
import type { Trigger } from "../project.js";

export const triggerTools = {
  add_trigger: {
    description: "Add a trigger zone to a scene",
    inputSchema: {
      type: "object" as const,
      properties: {
        sceneId: { type: "string" },
        name: { type: "string" },
        x: { type: "number" },
        y: { type: "number" },
        width: { type: "number" },
        height: { type: "number" },
      },
      required: ["sceneId", "name", "x", "y", "width", "height"],
    },
    handler: async (args: { sceneId: string; name: string; x: number; y: number; width: number; height: number }) => {
      const scene = findScene(args.sceneId);
      const trigger: Trigger = {
        id: uuid(),
        name: args.name,
        x: args.x,
        y: args.y,
        width: args.width,
        height: args.height,
        script: [],
        leaveScript: [],
      };
      scene.triggers.push(trigger);
      return { content: [{ type: "text" as const, text: `Trigger added: "${trigger.name}" (${trigger.id}) in scene "${scene.name}"` }] };
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
    handler: async (args: { sceneId: string; triggerId: string; [key: string]: any }) => {
      const scene = findScene(args.sceneId);
      const trigger = scene.triggers.find((t) => t.id === args.triggerId);
      if (!trigger) throw new Error(`Trigger not found: ${args.triggerId}`);
      for (const key of ["name", "x", "y", "width", "height"]) {
        if (args[key] !== undefined) (trigger as any)[key] = args[key];
      }
      return { content: [{ type: "text" as const, text: `Trigger updated: "${trigger.name}"` }] };
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
      return { content: [{ type: "text" as const, text: `Trigger deleted: "${removed.name}"` }] };
    },
  },
};
