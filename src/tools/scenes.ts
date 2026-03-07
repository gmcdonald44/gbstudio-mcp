import { requireProject, findScene, uuid } from "../project.js";
import type { Scene } from "../project.js";

export const sceneTools = {
  list_scenes: {
    description: "List all scenes in the current project",
    inputSchema: { type: "object" as const, properties: {} },
    handler: async () => {
      const p = requireProject();
      const list = p.scenes.map((s) => ({ id: s.id, name: s.name, width: s.width, height: s.height, actors: s.actors.length, triggers: s.triggers.length }));
      return { content: [{ type: "text" as const, text: JSON.stringify(list, null, 2) }] };
    },
  },

  add_scene: {
    description: "Add a new scene to the project",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Scene name" },
        width: { type: "number", description: "Width in tiles (default 20)" },
        height: { type: "number", description: "Height in tiles (default 18)" },
        backgroundId: { type: "string", description: "Background asset UUID (uses default if omitted)" },
        x: { type: "number", description: "World X position in px (default 0)" },
        y: { type: "number", description: "World Y position in px (default 0)" },
      },
      required: ["name"],
    },
    handler: async (args: { name: string; width?: number; height?: number; backgroundId?: string; x?: number; y?: number }) => {
      const p = requireProject();
      const bgId = args.backgroundId || p.backgrounds[0]?.id || "";
      const scene: Scene = {
        id: uuid(),
        name: args.name,
        backgroundId: bgId,
        x: args.x ?? (p.scenes.length * 300),
        y: args.y ?? 0,
        width: args.width ?? 20,
        height: args.height ?? 18,
        type: "0",
        actors: [],
        triggers: [],
        collisions: [],
        script: [],
        playerHit1Script: [],
        playerHit2Script: [],
        playerHit3Script: [],
      };
      p.scenes.push(scene);
      // Set as start scene if first
      if (p.scenes.length === 1) {
        p.settings.startSceneId = scene.id;
      }
      return { content: [{ type: "text" as const, text: `Scene added: "${scene.name}" (${scene.id})` }] };
    },
  },

  get_scene: {
    description: "Get full details of a scene",
    inputSchema: {
      type: "object" as const,
      properties: { sceneId: { type: "string" } },
      required: ["sceneId"],
    },
    handler: async (args: { sceneId: string }) => {
      const scene = findScene(args.sceneId);
      return { content: [{ type: "text" as const, text: JSON.stringify(scene, null, 2) }] };
    },
  },

  update_scene: {
    description: "Update scene properties (name, width, height, backgroundId, type)",
    inputSchema: {
      type: "object" as const,
      properties: {
        sceneId: { type: "string" },
        name: { type: "string" },
        width: { type: "number" },
        height: { type: "number" },
        backgroundId: { type: "string" },
      },
      required: ["sceneId"],
    },
    handler: async (args: { sceneId: string; name?: string; width?: number; height?: number; backgroundId?: string }) => {
      const scene = findScene(args.sceneId);
      if (args.name !== undefined) scene.name = args.name;
      if (args.width !== undefined) scene.width = args.width;
      if (args.height !== undefined) scene.height = args.height;
      if (args.backgroundId !== undefined) scene.backgroundId = args.backgroundId;
      return { content: [{ type: "text" as const, text: `Scene updated: "${scene.name}"` }] };
    },
  },

  delete_scene: {
    description: "Delete a scene from the project",
    inputSchema: {
      type: "object" as const,
      properties: { sceneId: { type: "string" } },
      required: ["sceneId"],
    },
    handler: async (args: { sceneId: string }) => {
      const p = requireProject();
      const idx = p.scenes.findIndex((s) => s.id === args.sceneId);
      if (idx === -1) throw new Error(`Scene not found: ${args.sceneId}`);
      const removed = p.scenes.splice(idx, 1)[0];
      return { content: [{ type: "text" as const, text: `Scene deleted: "${removed.name}"` }] };
    },
  },
};
