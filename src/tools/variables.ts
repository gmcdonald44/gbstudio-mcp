/**
 * @module tools/variables
 * @description Variable management tools — add and list global game variables.
 * Variables are used to track game state (flags like "hasSword", counters like "gold", etc.)
 * and can be checked/modified in script events.
 */
import { requireProject, uuid } from "../project.js";

export const variableTools = {
  /**
   * @description Add a new global variable to the project. Variables are referenced
   * by UUID in script events like EVENT_IF_VARIABLE_TRUE and EVENT_SET_VARIABLE_TRUE.
   *
   * @param args.name - Variable name (required)
   * @returns MCP response with the variable name and UUID
   *
   * @example
   * // MCP call:
   * { "name": "add_variable", "arguments": { "name": "hasSword" } }
   * // Returns: "Variable added: \"hasSword\" (variable-uuid)"
   *
   * @example
   * // Then use the UUID in a conditional:
   * // add_script_event with command "EVENT_IF_VARIABLE_TRUE" and args { variableId: "variable-uuid" }
   */
  add_variable: {
    description: "Add a global variable to the project",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Variable name" },
      },
      required: ["name"],
    },
    handler: async (args: { name: string }) => {
      const p = requireProject();
      const v = { id: uuid(), name: args.name };
      p.variables.push(v);
      return { content: [{ type: "text" as const, text: `Variable added: "${v.name}" (${v.id})` }] };
    },
  },

  /**
   * @description List all global variables in the project with their UUIDs.
   *
   * @returns MCP response with JSON array of all variables
   * @throws {Error} If no project is loaded
   *
   * @example
   * // MCP call:
   * { "name": "list_variables", "arguments": {} }
   * // Returns: [{ "id": "uuid-here", "name": "hasSword" }, { "id": "uuid-here", "name": "gold" }]
   */
  list_variables: {
    description: "List all global variables",
    inputSchema: { type: "object" as const, properties: {} },
    handler: async () => {
      const p = requireProject();
      return { content: [{ type: "text" as const, text: JSON.stringify(p.variables, null, 2) }] };
    },
  },
};
