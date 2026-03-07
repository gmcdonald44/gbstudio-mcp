/**
 * @module tools/scenes
 * @description Scene management tools — list, add, get, update, and delete scenes.
 * Scenes are the primary organizational unit in GB Studio; each scene represents
 * one screen/room/map in the game.
 */
import { requireProject, findScene, uuid } from "../project.js";
import type { Scene } from "../project.js";

export const sceneTools = {
  /**
   * @description List all scenes in the current project with summary info.
   *
   * @returns MCP response with JSON array of scene summaries
   * @throws {Error} If no project is loaded
   *
   * @example
   * // MCP call:
   * { "name": "list_scenes", "arguments": {} }
   * // Returns: [{ "id": "...", "name": "Town", "width": 20, "height": 18, "actors": 2, "triggers": 1 }]
   */
  list_scenes: {
    description: "List all scenes in the current project",
    inputSchema: { type: "object" as const, properties: {} },
    handler: async () => {
      const p = requireProject();
      const list = p.scenes.map((s) => ({ id: s.id, name: s.name, width: s.width, height: s.height, actors: s.actors.length, triggers: s.triggers.length }));
      return { content: [{ type: "text" as const, text: JSON.stringify(list, null, 2) }] };
    },
  },

  /**
   * @description Add a new scene to the project. If this is the first scene,
   * it automatically becomes the start scene.
   *
   * @param args.name - Scene name (required)
   * @param args.width - Width in tiles (default: 20)
   * @param args.height - Height in tiles (default: 18)
   * @param args.backgroundId - Background asset UUID (uses project default if omitted)
   * @param args.x - World X position in pixels for editor layout (default: auto-spaced)
   * @param args.y - World Y position in pixels for editor layout (default: 0)
   * @returns MCP response with the scene name and UUID
   *
   * @example
   * // MCP call:
   * {
   *   "name": "add_scene",
   *   "arguments": { "name": "Dark Forest", "width": 32, "height": 24 }
   * }
   * // Returns: "Scene added: \"Dark Forest\" (a1b2c3d4-...)"
   */
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

  /**
   * @description Get the full details of a scene including all actors, triggers, and scripts.
   *
   * @param args.sceneId - UUID of the scene
   * @returns MCP response with the full scene JSON
   * @throws {Error} If scene not found
   *
   * @example
   * // MCP call:
   * { "name": "get_scene", "arguments": { "sceneId": "a1b2c3d4-..." } }
   * // Returns: Full scene JSON with actors, triggers, scripts, etc.
   */
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

  /**
   * @description Update properties of an existing scene. Only provided fields are changed.
   *
   * @param args.sceneId - UUID of the scene to update (required)
   * @param args.name - New scene name
   * @param args.width - New width in tiles
   * @param args.height - New height in tiles
   * @param args.backgroundId - New background asset UUID
   * @returns MCP response confirming the update
   * @throws {Error} If scene not found
   *
   * @example
   * // MCP call:
   * {
   *   "name": "update_scene",
   *   "arguments": { "sceneId": "a1b2c3d4-...", "name": "Enchanted Forest" }
   * }
   * // Returns: "Scene updated: \"Enchanted Forest\""
   */
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

  /**
   * @description Delete a scene and all its actors, triggers, and scripts.
   *
   * @param args.sceneId - UUID of the scene to delete
   * @returns MCP response confirming the deletion
   * @throws {Error} If scene not found
   *
   * @example
   * // MCP call:
   * { "name": "delete_scene", "arguments": { "sceneId": "a1b2c3d4-..." } }
   * // Returns: "Scene deleted: \"Dark Forest\""
   */
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
