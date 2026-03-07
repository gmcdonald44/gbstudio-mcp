import { requireProject, uuid } from "../project.js";

export const variableTools = {
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

  list_variables: {
    description: "List all global variables",
    inputSchema: { type: "object" as const, properties: {} },
    handler: async () => {
      const p = requireProject();
      return { content: [{ type: "text" as const, text: JSON.stringify(p.variables, null, 2) }] };
    },
  },
};
