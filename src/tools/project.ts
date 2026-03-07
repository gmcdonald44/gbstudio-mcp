import { createDefaultProject, setProject, requireProject, getProjectPath, saveProjectToDisk, loadProjectFromDisk, uuid } from "../project.js";
import * as path from "path";

export const projectTools = {
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

  save_project: {
    description: "Save the current in-memory project to disk",
    inputSchema: { type: "object" as const, properties: {} },
    handler: async () => {
      const savedPath = saveProjectToDisk();
      return { content: [{ type: "text" as const, text: `Project saved to: ${savedPath}` }] };
    },
  },

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
