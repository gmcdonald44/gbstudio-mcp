/**
 * @module tools/actors
 * @description Actor management tools — list, add, update, and delete actors in scenes.
 * Actors are NPCs, objects, or interactive entities that players can interact with.
 */
import { requireProject, findScene, findActor, uuid } from "../project.js";
import type { Actor } from "../project.js";

export const actorTools = {
  /**
   * @description List all actors in a scene with their positions and directions.
   *
   * @param args.sceneId - UUID of the scene
   * @returns MCP response with JSON array of actor summaries
   * @throws {Error} If scene not found
   *
   * @example
   * // MCP call:
   * { "name": "list_actors", "arguments": { "sceneId": "scene-uuid" } }
   * // Returns: [{ "id": "...", "name": "Shopkeeper", "x": 5, "y": 8, "direction": "down" }]
   */
  list_actors: {
    description: "List all actors in a scene",
    inputSchema: {
      type: "object" as const,
      properties: { sceneId: { type: "string" } },
      required: ["sceneId"],
    },
    handler: async (args: { sceneId: string }) => {
      const scene = findScene(args.sceneId);
      const list = scene.actors.map((a) => ({ id: a.id, name: a.name, x: a.x, y: a.y, direction: a.direction }));
      return { content: [{ type: "text" as const, text: JSON.stringify(list, null, 2) }] };
    },
  },

  /**
   * @description Add a new actor to a scene. The actor starts with empty script arrays
   * that can be populated with add_script_event.
   *
   * @param args.sceneId - UUID of the scene to add the actor to (required)
   * @param args.name - Actor name (required)
   * @param args.x - Tile X position (required)
   * @param args.y - Tile Y position (required)
   * @param args.spriteSheetId - Sprite sheet UUID (uses project default if omitted)
   * @param args.direction - Facing direction: "down" | "up" | "left" | "right" (default: "down")
   * @param args.spriteType - Sprite type: "STATIC" | "ACTOR" | "ACTOR_ANIMATED" (default: "STATIC")
   * @param args.moveSpeed - Movement speed 1-4 (default: 1)
   * @param args.animSpeed - Animation speed 1-4 (default: 3)
   * @returns MCP response with actor name, UUID, and position
   *
   * @example
   * // MCP call:
   * {
   *   "name": "add_actor",
   *   "arguments": {
   *     "sceneId": "scene-uuid",
   *     "name": "Old Wizard",
   *     "x": 10,
   *     "y": 5,
   *     "direction": "left",
   *     "spriteType": "ACTOR"
   *   }
   * }
   * // Returns: "Actor added: \"Old Wizard\" (actor-uuid) at (10, 5) in scene \"Town\""
   */
  add_actor: {
    description: "Add an actor to a scene",
    inputSchema: {
      type: "object" as const,
      properties: {
        sceneId: { type: "string" },
        name: { type: "string" },
        x: { type: "number", description: "Tile X position" },
        y: { type: "number", description: "Tile Y position" },
        spriteSheetId: { type: "string", description: "Sprite sheet UUID (uses default if omitted)" },
        direction: { type: "string", enum: ["down", "up", "left", "right"] },
        spriteType: { type: "string", enum: ["STATIC", "ACTOR", "ACTOR_ANIMATED"] },
        moveSpeed: { type: "number" },
        animSpeed: { type: "number" },
      },
      required: ["sceneId", "name", "x", "y"],
    },
    handler: async (args: { sceneId: string; name: string; x: number; y: number; spriteSheetId?: string; direction?: string; spriteType?: string; moveSpeed?: number; animSpeed?: number }) => {
      const p = requireProject();
      const scene = findScene(args.sceneId);
      const actor: Actor = {
        id: uuid(),
        name: args.name,
        x: args.x,
        y: args.y,
        spriteSheetId: args.spriteSheetId || p.spriteSheets[0]?.id || "",
        spriteType: (args.spriteType as Actor["spriteType"]) || "STATIC",
        direction: (args.direction as Actor["direction"]) || "down",
        moveSpeed: args.moveSpeed ?? 1,
        animSpeed: args.animSpeed ?? 3,
        script: [],
        startScript: [],
        updateScript: [],
        hit1Script: [],
        hit2Script: [],
        hit3Script: [],
      };
      scene.actors.push(actor);
      return { content: [{ type: "text" as const, text: `Actor added: "${actor.name}" (${actor.id}) at (${actor.x}, ${actor.y}) in scene "${scene.name}"` }] };
    },
  },

  /**
   * @description Update properties of an existing actor. Only provided fields are changed.
   *
   * @param args.sceneId - UUID of the scene containing the actor (required)
   * @param args.actorId - UUID of the actor to update (required)
   * @param args.name - New name
   * @param args.x - New tile X position
   * @param args.y - New tile Y position
   * @param args.direction - New direction
   * @param args.spriteSheetId - New sprite sheet UUID
   * @param args.spriteType - New sprite type
   * @param args.moveSpeed - New movement speed
   * @param args.animSpeed - New animation speed
   * @returns MCP response confirming the update
   * @throws {Error} If scene or actor not found
   *
   * @example
   * // MCP call:
   * {
   *   "name": "update_actor",
   *   "arguments": { "sceneId": "scene-uuid", "actorId": "actor-uuid", "x": 12, "direction": "right" }
   * }
   * // Returns: "Actor updated: \"Old Wizard\""
   */
  update_actor: {
    description: "Update actor properties",
    inputSchema: {
      type: "object" as const,
      properties: {
        sceneId: { type: "string" },
        actorId: { type: "string" },
        name: { type: "string" },
        x: { type: "number" },
        y: { type: "number" },
        direction: { type: "string", enum: ["down", "up", "left", "right"] },
        spriteSheetId: { type: "string" },
        spriteType: { type: "string", enum: ["STATIC", "ACTOR", "ACTOR_ANIMATED"] },
        moveSpeed: { type: "number" },
        animSpeed: { type: "number" },
      },
      required: ["sceneId", "actorId"],
    },
    handler: async (args: { sceneId: string; actorId: string; [key: string]: any }) => {
      const scene = findScene(args.sceneId);
      const actor = findActor(scene, args.actorId);
      const updatable = ["name", "x", "y", "direction", "spriteSheetId", "spriteType", "moveSpeed", "animSpeed"];
      for (const key of updatable) {
        if (args[key] !== undefined) (actor as any)[key] = args[key];
      }
      return { content: [{ type: "text" as const, text: `Actor updated: "${actor.name}"` }] };
    },
  },

  /**
   * @description Delete an actor from a scene. This also removes all scripts attached to the actor.
   *
   * @param args.sceneId - UUID of the scene containing the actor (required)
   * @param args.actorId - UUID of the actor to delete (required)
   * @returns MCP response confirming the deletion
   * @throws {Error} If scene or actor not found
   *
   * @example
   * // MCP call:
   * { "name": "delete_actor", "arguments": { "sceneId": "scene-uuid", "actorId": "actor-uuid" } }
   * // Returns: "Actor deleted: \"Old Wizard\""
   */
  delete_actor: {
    description: "Delete an actor from a scene",
    inputSchema: {
      type: "object" as const,
      properties: {
        sceneId: { type: "string" },
        actorId: { type: "string" },
      },
      required: ["sceneId", "actorId"],
    },
    handler: async (args: { sceneId: string; actorId: string }) => {
      const scene = findScene(args.sceneId);
      const idx = scene.actors.findIndex((a) => a.id === args.actorId);
      if (idx === -1) throw new Error(`Actor not found: ${args.actorId}`);
      const removed = scene.actors.splice(idx, 1)[0];
      return { content: [{ type: "text" as const, text: `Actor deleted: "${removed.name}"` }] };
    },
  },
};
