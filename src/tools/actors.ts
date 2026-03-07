/**
 * @module tools/actors
 * @description Actor management tools for GB Studio 4.2.2.
 */
import { requireProject, findScene, findActor, createActor } from "../project.js";

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
      const list = scene.actors.map((a) => ({
        id: a.id, name: a.name, symbol: a.symbol,
        x: a.x, y: a.y, direction: a.direction,
        spriteSheetId: a.spriteSheetId,
      }));
      return { content: [{ type: "text" as const, text: JSON.stringify(list, null, 2) }] };
    },
  },

  add_actor: {
    description: "Add a new actor to a scene with correct GB Studio 4.2.2 fields",
    inputSchema: {
      type: "object" as const,
      properties: {
        sceneId: { type: "string", description: "Scene UUID" },
        name: { type: "string", description: "Actor name" },
        x: { type: "number", description: "Tile X position" },
        y: { type: "number", description: "Tile Y position" },
        spriteSheetId: { type: "string", description: "Sprite sheet UUID" },
        direction: { type: "string", description: "Facing direction: down/up/left/right (default: down)" },
        moveSpeed: { type: "number", description: "Movement speed (default: 1)" },
        animSpeed: { type: "number", description: "Animation speed (default: 15)" },
        animate: { type: "boolean", description: "Whether to animate (default: false)" },
        persistent: { type: "boolean", description: "Whether actor persists across scenes (default: false)" },
        collisionGroup: { type: "string", description: "Collision group (default: empty)" },
      },
      required: ["sceneId", "name", "x", "y", "spriteSheetId"],
    },
    handler: async (args: {
      sceneId: string; name: string; x: number; y: number; spriteSheetId: string;
      direction?: string; moveSpeed?: number; animSpeed?: number;
      animate?: boolean; persistent?: boolean; collisionGroup?: string;
    }) => {
      const scene = findScene(args.sceneId);
      const actor = createActor({
        name: args.name,
        x: args.x,
        y: args.y,
        spriteSheetId: args.spriteSheetId,
        direction: args.direction,
        _index: scene.actors.length,
      });
      if (args.moveSpeed !== undefined) actor.moveSpeed = args.moveSpeed;
      if (args.animSpeed !== undefined) actor.animSpeed = args.animSpeed;
      if (args.animate !== undefined) actor.animate = args.animate;
      if (args.persistent !== undefined) actor.persistent = args.persistent;
      if (args.collisionGroup !== undefined) actor.collisionGroup = args.collisionGroup;
      scene.actors.push(actor);
      return { content: [{ type: "text" as const, text: `Actor added: "${actor.name}" (${actor.id}) at (${actor.x}, ${actor.y})` }] };
    },
  },

  get_actor: {
    description: "Get full details of an actor",
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
      const actor = findActor(scene, args.actorId);
      return { content: [{ type: "text" as const, text: JSON.stringify(actor, null, 2) }] };
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
        direction: { type: "string" },
        spriteSheetId: { type: "string" },
        moveSpeed: { type: "number" },
        animSpeed: { type: "number" },
      },
      required: ["sceneId", "actorId"],
    },
    handler: async (args: {
      sceneId: string; actorId: string; name?: string; x?: number; y?: number;
      direction?: string; spriteSheetId?: string; moveSpeed?: number; animSpeed?: number;
    }) => {
      const scene = findScene(args.sceneId);
      const actor = findActor(scene, args.actorId);
      if (args.name !== undefined) actor.name = args.name;
      if (args.x !== undefined) actor.x = args.x;
      if (args.y !== undefined) actor.y = args.y;
      if (args.direction !== undefined) actor.direction = args.direction as any;
      if (args.spriteSheetId !== undefined) actor.spriteSheetId = args.spriteSheetId;
      if (args.moveSpeed !== undefined) actor.moveSpeed = args.moveSpeed;
      if (args.animSpeed !== undefined) actor.animSpeed = args.animSpeed;
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
