/**
 * @module tools/variables
 * @description Variable management tools for GB Studio 4.2.2.
 * Variables use string IDs (numeric "0", "1", ... for globals, or "actorId__L0" for locals).
 */
import { requireProject, uuid } from "../project.js";

export const variableTools = {
  add_variable: {
    description: "Add a global variable to the project. Uses GB Studio 4.2.2 format with id, name, and symbol.",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Variable display name" },
        symbol: { type: "string", description: "Variable symbol (auto-generated if omitted)" },
      },
      required: ["name"],
    },
    handler: async (args: { name: string; symbol?: string }) => {
      const p = requireProject();
      // Use next numeric ID for globals
      const numericIds = p.variables.filter(v => /^\d+$/.test(v.id)).map(v => parseInt(v.id));
      const nextId = numericIds.length > 0 ? Math.max(...numericIds) + 1 : 0;
      const symbol = args.symbol || "var_" + args.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/, "");

      const variable = { id: String(nextId), name: args.name, symbol };
      p.variables.push(variable);
      return { content: [{ type: "text" as const, text: `Variable added: "${variable.name}" (id: ${variable.id}, symbol: ${variable.symbol})` }] };
    },
  },

  list_variables: {
    description: "List all global variables",
    inputSchema: { type: "object" as const, properties: {} },
    handler: async () => {
      const p = requireProject();
      return { content: [{ type: "text" as const, text: JSON.stringify(p.variables, null, 2) }] };
    },
  },

  delete_variable: {
    description: "Delete a global variable by ID",
    inputSchema: {
      type: "object" as const,
      properties: { variableId: { type: "string" } },
      required: ["variableId"],
    },
    handler: async (args: { variableId: string }) => {
      const p = requireProject();
      const idx = p.variables.findIndex(v => v.id === args.variableId);
      if (idx === -1) throw new Error(`Variable not found: ${args.variableId}`);
      const removed = p.variables.splice(idx, 1)[0];
      return { content: [{ type: "text" as const, text: `Variable deleted: "${removed.name}"` }] };
    },
  },
};
