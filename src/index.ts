#!/usr/bin/env node
/**
 * @module gbstudio-mcp
 * @description GB Studio MCP Server entry point.
 *
 * This is the main entry point for the GB Studio MCP server. It registers all
 * tool modules, sets up the MCP protocol handlers over stdio transport, and
 * routes incoming tool calls to their respective handlers.
 *
 * The server communicates via JSON-RPC 2.0 over stdin/stdout (stdio transport),
 * which is the standard MCP transport for local tool servers.
 *
 * @example
 * // Start the server (typically done by the MCP client):
 * // node dist/index.js
 *
 * // The server then responds to JSON-RPC requests like:
 * // {"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}
 * // {"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"create_project","arguments":{...}}}
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { projectTools } from "./tools/project.js";
import { sceneTools } from "./tools/scenes.js";
import { actorTools } from "./tools/actors.js";
import { triggerTools } from "./tools/triggers.js";
import { scriptTools } from "./tools/scripts.js";
import { variableTools } from "./tools/variables.js";
import { buildTools } from "./tools/build.js";

/**
 * @description Registry of all available tools, keyed by tool name.
 * Each tool module exports a record of tools; they are merged here into
 * a single flat namespace for the MCP protocol handler.
 */
const allTools: Record<string, {
  description: string;
  inputSchema: any;
  handler: (args: any) => Promise<any>;
}> = {
  ...projectTools,
  ...sceneTools,
  ...actorTools,
  ...triggerTools,
  ...scriptTools,
  ...variableTools,
  ...buildTools,
};

/** MCP Server instance configured with tool capabilities */
const server = new Server(
  { name: "gbstudio-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

/**
 * @description Handles `tools/list` requests by enumerating all registered tools
 * with their names, descriptions, and JSON Schema input definitions.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: Object.entries(allTools).map(([name, tool]) => ({
    name,
    description: tool.description,
    inputSchema: {
      type: "object",
      properties: tool.inputSchema.properties || {},
      required: tool.inputSchema.required || [],
    },
  })),
}));

/**
 * @description Handles `tools/call` requests by dispatching to the appropriate
 * tool handler. Returns MCP-formatted content responses or error messages.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;
  const tool = allTools[name];

  if (!tool) {
    return {
      content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
      isError: true,
    };
  }

  try {
    return await tool.handler(args);
  } catch (e: any) {
    return {
      content: [{ type: "text" as const, text: `Error: ${e.message}` }],
      isError: true,
    };
  }
});

/**
 * @description Initializes the stdio transport and connects the server.
 * The server will then listen for JSON-RPC messages on stdin and respond on stdout.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
