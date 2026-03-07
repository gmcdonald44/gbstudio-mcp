/**
 * @module tools/triggers
 * @description Trigger management tools — add, update, and delete trigger zones in scenes.
 * Triggers are invisible rectangular zones that fire scripts when the player walks into them.
 * Common uses: doors, scene transitions, cutscene triggers, trap zones.
 */
import { findScene, uuid } from "../project.js";
import type { Trigger } from "../project.js";

export const triggerTools = {
  /**
   * @description Add a trigger zone to a scene. The trigger starts with empty script arrays
   * that can be populated with add_script_event.
   *
   * @param args.sceneId - UUID of the scene (required)
   * @param args.name - Trigger name (required)
   * @param args.x - Tile X position (required)
   * @param args.y - Tile Y position (required)
   * @param args.width - Width in tiles (required)
   * @param args.height - Height in tiles (required)
   * @returns MCP response with trigger name and UUID
   *
   * @example
   * // MCP call — create a door trigger:
   * {
   *   "name": "add_trigger",
   *   "arguments": {
   *     "sceneId": "scene-uuid",
   *     "name": "Door to Dungeon",
   *     "x": 10,
   *     "y": 15,
   *     "width": 2,
   *     "height": 1
   *   }
   * }
   * // Returns: "Trigger added: \"Door to Dungeon\" (trigger-uuid) in scene \"Town\""
   */
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

  /**
   * @description Update properties of an existing trigger. Only provided fields are changed.
   *
   * @param args.sceneId - UUID of the scene containing the trigger (required)
   * @param args.triggerId - UUID of the trigger to update (required)
   * @param args.name - New name
   * @param args.x - New tile X position
   * @param args.y - New tile Y position
   * @param args.width - New width in tiles
   * @param args.height - New height in tiles
   * @returns MCP response confirming the update
   * @throws {Error} If scene or trigger not found
   *
   * @example
   * // MCP call:
   * {
   *   "name": "update_trigger",
   *   "arguments": { "sceneId": "scene-uuid", "triggerId": "trigger-uuid", "width": 3 }
   * }
   * // Returns: "Trigger updated: \"Door to Dungeon\""
   */
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

  /**
   * @description Delete a trigger from a scene, including its scripts.
   *
   * @param args.sceneId - UUID of the scene (required)
   * @param args.triggerId - UUID of the trigger to delete (required)
   * @returns MCP response confirming the deletion
   * @throws {Error} If scene or trigger not found
   *
   * @example
   * // MCP call:
   * { "name": "delete_trigger", "arguments": { "sceneId": "scene-uuid", "triggerId": "trigger-uuid" } }
   * // Returns: "Trigger deleted: \"Door to Dungeon\""
   */
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
