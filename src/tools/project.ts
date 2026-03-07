/**
 * @module tools/project
 * @description Project management tools — create, open, save, and inspect GB Studio projects.
 */
import { createDefaultProject, setProject, requireProject, getProjectPath, saveProjectToDisk, loadProjectFromDisk, uuid } from "../project.js";
import * as path from "path";

export const projectTools = {
  /**
   * @description Create a new GB Studio project file with sensible defaults.
   * Generates a `.gbsproj` file with a default background, sprite sheet, and palette.
   * The first scene added will automatically become the start scene.
   *
   * @param args.name - Project name (used in the filename)
   * @param args.author - Author name
   * @param args.path - Directory path to create the project in
   * @returns MCP response with the project path and default asset IDs
   *
   * @example
   * // MCP call:
   * {
   *   "name": "create_project",
   *   "arguments": {
   *     "name": "MyRPG",
   *     "author": "Grant",
   *     "path": "C:/games/MyRPG"
   *   }
   * }
   * // Returns: "Project created: C:/games/MyRPG/MyRPG.gbsproj\nDefault background ID: ...\nDefault sprite ID: ..."
   */
  create_project: {
    description: "Create a new GB Studio project file with defaults",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Project name" },
        author: { type: "string", description: "Author name" },
        path: { type: "string", description: "Directory path to create the project in" },
      },
      required: ["name", "author", "path"],
    },
    handler: async (args: { name: string; author: string; path: string }) => {
      const project = createDefaultProject(args.name, args.author);
      const projectPath = path.resolve(args.path, `${args.name.replace(/[^a-zA-Z0-9_-]/g, "_")}.gbsproj`);
      setProject(project, projectPath);
      saveProjectToDisk();
      return { content: [{ type: "text" as const, text: `Project created: ${projectPath}\nDefault background ID: ${project.backgrounds[0].id}\nDefault sprite ID: ${project.spriteSheets[0].id}` }] };
    },
  },

  /**
   * @description Open an existing GB Studio project file from disk.
   * Loads the `.gbsproj` JSON into memory for editing with other tools.
   *
   * @param args.path - Path to the .gbsproj file
   * @returns MCP response with project name and summary stats
   * @throws {Error} If the file doesn't exist or isn't valid JSON
   *
   * @example
   * // MCP call:
   * {
   *   "name": "open_project",
   *   "arguments": { "path": "C:/games/MyRPG/MyRPG.gbsproj" }
   * }
   * // Returns: "Opened project: MyRPG (3 scenes, 2 variables)"
   */
  open_project: {
    description: "Open an existing GB Studio project file",
    inputSchema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "Path to the .gbsproj file" },
      },
      required: ["path"],
    },
    handler: async (args: { path: string }) => {
      const project = loadProjectFromDisk(args.path);
      return { content: [{ type: "text" as const, text: `Opened project: ${project.name} (${project.scenes.length} scenes, ${project.variables.length} variables)` }] };
    },
  },

  /**
   * @description Save the current in-memory project state to the `.gbsproj` file on disk.
   * Always save after making changes to persist them.
   *
   * @returns MCP response confirming the save path
   * @throws {Error} If no project is loaded
   *
   * @example
   * // MCP call:
   * { "name": "save_project", "arguments": {} }
   * // Returns: "Project saved to: C:/games/MyRPG/MyRPG.gbsproj"
   */
  save_project: {
    description: "Save the current in-memory project to disk",
    inputSchema: { type: "object" as const, properties: {} },
    handler: async () => {
      const savedPath = saveProjectToDisk();
      return { content: [{ type: "text" as const, text: `Project saved to: ${savedPath}` }] };
    },
  },

  /**
   * @description Get summary information about the current project, including
   * counts of scenes, backgrounds, sprites, variables, and a list of all scenes.
   *
   * @returns MCP response with JSON project info
   * @throws {Error} If no project is loaded
   *
   * @example
   * // MCP call:
   * { "name": "get_project_info", "arguments": {} }
   * // Returns JSON: { "name": "MyRPG", "scenes": 3, "sceneList": [{ "id": "...", "name": "Town" }, ...] }
   */
  get_project_info: {
    description: "Get info about the current project",
    inputSchema: { type: "object" as const, properties: {} },
    handler: async () => {
      const p = requireProject();
      const info = {
        name: p.name,
        author: p.author,
        path: getProjectPath(),
        scenes: p.scenes.length,
        backgrounds: p.backgrounds.length,
        spriteSheets: p.spriteSheets.length,
        variables: p.variables.length,
        sceneList: p.scenes.map((s) => ({ id: s.id, name: s.name })),
      };
      return { content: [{ type: "text" as const, text: JSON.stringify(info, null, 2) }] };
    },
  },
};
