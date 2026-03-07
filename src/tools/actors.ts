import { requireProject, findScene, findActor, uuid } from "../project.js";
import type { Actor } from "../project.js";

export const actorTools = {
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
