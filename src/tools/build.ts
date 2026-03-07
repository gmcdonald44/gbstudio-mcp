/**
 * @module tools/build
 * @description Build tool — compile the GB Studio project into a Game Boy ROM (.gb file).
 * Requires the GB Studio CLI (`gb-studio-cli`) to be installed. If not available,
 * provides instructions for building via the GB Studio desktop app instead.
 */
import { requireProject, getProjectPath } from "../project.js";
import { spawn } from "child_process";
import * as path from "path";

/**
 * Run a shell command and capture its output.
 *
 * @param cmd - Command to execute
 * @param args - Command arguments
 * @param cwd - Working directory
 * @param timeoutMs - Timeout in milliseconds (default: 120000)
 * @returns Stdout output on success
 * @throws {Error} On non-zero exit code, timeout, or spawn error
 * @internal
 */
function runCommand(cmd: string, args: string[], cwd: string, timeoutMs = 120000): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { cwd, shell: true });
    let stdout = "";
    let stderr = "";
    proc.stdout?.on("data", (d: Buffer) => { stdout += d.toString(); });
    proc.stderr?.on("data", (d: Buffer) => { stderr += d.toString(); });
    const timer = setTimeout(() => { proc.kill(); reject(new Error("Build timed out")); }, timeoutMs);
    proc.on("close", (code: number) => {
      clearTimeout(timer);
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || stdout || `Exit code ${code}`));
    });
    proc.on("error", (e: Error) => { clearTimeout(timer); reject(e); });
  });
}

export const buildTools = {
  /**
   * @description Build a Game Boy ROM (.gb) from the current project using the GB Studio CLI.
   * If the CLI is not installed, returns instructions for alternative build methods.
   *
   * @param args.outputPath - Output directory for the ROM file (optional, defaults to build/ next to project)
   * @returns MCP response with build result or instructions if CLI not found
   * @throws {Error} If no project is loaded
   *
   * @example
   * // MCP call — build with default output path:
   * { "name": "build_rom", "arguments": {} }
   * // Returns: "Build complete!\nOutput: C:/games/MyRPG/build\n..."
   *
   * @example
   * // MCP call — build to specific directory:
   * { "name": "build_rom", "arguments": { "outputPath": "C:/roms/output" } }
   *
   * @example
   * // If CLI not installed, returns:
   * // "GB Studio CLI not found.\n\nTo build ROMs, either:\n  1. Install the CLI: npm install -g gb-studio-cli\n  2. Or open the .gbsproj file in the GB Studio desktop app..."
   */
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

      try {
        const result = await runCommand(
          "npx",
          ["--no-install", "gb-studio-cli", "export", projectPath, "--output", outputDir],
          path.dirname(projectPath),
          120000
        );
        return { content: [{ type: "text" as const, text: `Build complete!\nOutput: ${outputDir}\n${result}` }] };
      } catch (e: any) {
        const msg: string = e.message || String(e);
        const isNotFound =
          msg.includes("not found") ||
          msg.includes("not recognized") ||
          msg.includes("ERR_MODULE_NOT_FOUND") ||
          msg.includes("Cannot find") ||
          msg.includes("No command");
        if (isNotFound) {
          return {
            content: [{
              type: "text" as const,
              text: `GB Studio CLI not found.\n\nTo build ROMs, either:\n  1. Install the CLI: npm install -g gb-studio-cli\n  2. Or open the .gbsproj file in the GB Studio desktop app and use its built-in build.\n\nThe project file is ready at: ${projectPath}`,
            }],
          };
        }
        return { content: [{ type: "text" as const, text: `Build failed: ${msg}` }] };
      }
    },
  },
};
