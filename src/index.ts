#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { projectTools } from "./tools/project.js";
import { sceneTools } from "./tools/scenes.js";
import { actorTools } from "./tools/actors.js";
import { triggerTools } from "./tools/triggers.js";
import { scriptTools } from "./tools/scripts.js";
import { variableTools } from "./tools/variables.js";
import { buildTools } from "./tools/build.js";

const server = new McpServer({
  name: "gbstudio-mcp",
  version: "1.0.0",
});

// Collect all tools
const allTools: Record<string, { description: string; inputSchema: any; handler: (args: any) => Promise<any> }> = {
  ...projectTools,
  ...sceneTools,
  ...actorTools,
  ...triggerTools,
  ...scriptTools,
  ...variableTools,
  ...buildTools,
};

// Register each tool with the MCP server
for (const [name, tool] of Object.entries(allTools)) {
  // The MCP SDK's server.tool() expects (name, description, schema, handler)
  // where schema is the properties object and handler receives parsed args
  server.tool(
    name,
    tool.description,
    tool.inputSchema.properties || {},
    async (args: any) => {
      try {
        return await tool.handler(args);
      } catch (e: any) {
        return {
          content: [{ type: "text" as const, text: `Error: ${e.message}` }],
          isError: true,
        };
      }
    }
  );
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
