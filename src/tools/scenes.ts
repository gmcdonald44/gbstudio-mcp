/**
 * @module tools/scenes
 * @description Scene management tools for GB Studio 4.2.2.
 */
import { requireProject, findScene, createScene } from "../project.js";

export const sceneTools = {
  list_scenes: {
    description: "List all scenes in the current project",
    inputSchema: { type: "object" as const, properties: {} },
    handler: async () => {
      const p = requireProject();
      const list = p.scenes.map((s) => ({
        id: s.id, name: s.name, symbol: s.symbol, type: s.type,
        width: s.width, height: s.height,
        actors: s.actors.length, triggers: s.triggers.length,
      }));
      return { content: [{ type: "text" as const, text: JSON.stringify(list, null, 2) }] };
    },
  },

  add_scene: {
    description: "Add a new scene to the project",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Scene name" },
        backgroundId: { type: "string", description: "Background asset UUID" },
        width: { type: "number", description: "Width in tiles (default: from background or 20)" },
        height: { type: "number", description: "Height in tiles (default: from background or 18)" },
        type: { type: "string", description: "Scene type: TOPDOWN, PLATFORM, ADVENTURE, SHMUP, POINTNCLICK, LOGO (default: TOPDOWN)" },
        x: { type: "number", description: "World X position in px for editor layout" },
        y: { type: "number", description: "World Y position in px for editor layout" },
      },
      required: ["name", "backgroundId"],
    },
    handler: async (args: { name: string; backgroundId: string; width?: number; height?: number; type?: string; x?: number; y?: number }) => {
      const p = requireProject();

      // Get dimensions from background if not specified
      let width = args.width ?? 20;
      let height = args.height ?? 18;
      const bg = p.backgrounds.find(b => b.id === args.backgroundId);
      if (bg && !args.width) width = bg.width;
      if (bg && !args.height) height = bg.height;

      const scene = createScene({
        name: args.name,
        backgroundId: args.backgroundId,
        width,
        height,
        type: args.type,
        x: args.x ?? (p.scenes.length * 300),
        y: args.y ?? 0,
        _index: p.scenes.length,
      });

      p.scenes.push(scene);

      // Auto-set as start scene if first
      if (p.scenes.length === 1) {
        p.settings.startSceneId = scene.id;
      }

      return { content: [{ type: "text" as const, text: `Scene added: "${scene.name}" (${scene.id})\nSymbol: ${scene.symbol}\nType: ${scene.type}\nSize: ${scene.width}x${scene.height}` }] };
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
    description: "Update scene properties",
    inputSchema: {
      type: "object" as const,
      properties: {
        sceneId: { type: "string" },
        name: { type: "string" },
        width: { type: "number" },
        height: { type: "number" },
        backgroundId: { type: "string" },
        type: { type: "string" },
      },
      required: ["sceneId"],
    },
    handler: async (args: { sceneId: string; name?: string; width?: number; height?: number; backgroundId?: string; type?: string }) => {
      const scene = findScene(args.sceneId);
      if (args.name !== undefined) scene.name = args.name;
      if (args.width !== undefined) scene.width = args.width;
      if (args.height !== undefined) scene.height = args.height;
      if (args.backgroundId !== undefined) scene.backgroundId = args.backgroundId;
      if (args.type !== undefined) scene.type = args.type;
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
