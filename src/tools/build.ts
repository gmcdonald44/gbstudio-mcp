import { requireProject, getProjectPath } from "../project.js";
import { execSync } from "child_process";
import * as path from "path";

export const buildTools = {
  build_rom: {
    description: "Build a Game Boy ROM from the current project using GB Studio CLI",
    inputSchema: {
      type: "object" as const,
      properties: {
        outputPath: { type: "string", description: "Output path for the ROM file (optional)" },
      },
    },
    handler: async (args: { outputPath?: string }) => {
      const p = requireProject();
      const projectPath = getProjectPath();
      if (!projectPath) throw new Error("No project path set");

      const outputDir = args.outputPath || path.join(path.dirname(projectPath), "build");
      const cmd = `npx gb-studio-cli export ${JSON.stringify(projectPath)} --output ${JSON.stringify(outputDir)}`;

      try {
        const result = execSync(cmd, {
          encoding: "utf-8",
          timeout: 120000,
          cwd: path.dirname(projectPath),
        });
        return { content: [{ type: "text" as const, text: `Build complete!\nOutput: ${outputDir}\n${result}` }] };
      } catch (e: any) {
        const msg = e.stderr || e.message || String(e);
        if (msg.includes("not found") || msg.includes("not recognized") || msg.includes("ERR_MODULE_NOT_FOUND")) {
          return {
            content: [{
              type: "text" as const,
              text: `GB Studio CLI not found. To build ROMs, install it:\n\n  npm install -g gb-studio-cli\n\nOr install GB Studio desktop app and use its built-in build.\n\nThe .gbsproj file is ready to open in GB Studio for building.\n\nError: ${msg}`,
            }],
          };
        }
        return { content: [{ type: "text" as const, text: `Build failed: ${msg}` }] };
      }
    },
  },
};
