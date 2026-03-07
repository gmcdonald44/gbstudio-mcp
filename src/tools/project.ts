/**
 * @module tools/project
 * @description Project management tools for GB Studio 4.2.2 split-resource format.
 */
import {
  createDefaultProject, setProject, requireProject, getProjectPath,
  saveProjectToDisk, loadProjectFromDisk, uuid, createBackground,
  createStaticSprite, createPlayerSprite,
} from "../project.js";
import * as path from "path";
import * as fs from "fs";

export const projectTools = {
  create_project: {
    description: "Create a new GB Studio 4.2.2 project with split-resource format (.gbsproj + project/ + assets/)",
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
      const safeName = args.name.replace(/[^a-zA-Z0-9_-]/g, "_");
      const projectPath = path.resolve(args.path, `${safeName}.gbsproj`);
      setProject(project, projectPath);

      // Create asset directories
      const projectDir = path.dirname(projectPath);
      for (const dir of [
        "assets/backgrounds", "assets/sprites", "assets/music", "assets/sounds",
        "assets/fonts", "assets/emotes", "assets/avatars", "assets/tilesets", "assets/ui",
        "project/palettes", "project/scenes", "plugins"
      ]) {
        fs.mkdirSync(path.join(projectDir, dir), { recursive: true });
      }

      saveProjectToDisk();
      return {
        content: [{
          type: "text" as const,
          text: `Project created: ${projectPath}\nFormat: GB Studio 4.2.2 split-resource\nVersion: ${project._version} release ${project._release}\n\nNext steps:\n1. Add backgrounds with add_background\n2. Add sprites with add_sprite\n3. Add scenes with add_scene\n4. Save with save_project`,
        }],
      };
    },
  },

  open_project: {
    description: "Open an existing GB Studio 4.2.2 project from disk (reads split-resource files)",
    inputSchema: {
      type: "object" as const,
      properties: {
        path: { type: "string", description: "Path to the .gbsproj file" },
      },
      required: ["path"],
    },
    handler: async (args: { path: string }) => {
      const project = loadProjectFromDisk(args.path);
      return {
        content: [{
          type: "text" as const,
          text: `Opened project: ${project.name}\nVersion: ${project._version} r${project._release}\nScenes: ${project.scenes.length}\nBackgrounds: ${project.backgrounds.length}\nSprites: ${project.spriteSheets.length}\nVariables: ${project.variables.length}`,
        }],
      };
    },
  },

  save_project: {
    description: "Save the current project to disk in GB Studio 4.2.2 split-resource format",
    inputSchema: { type: "object" as const, properties: {} },
    handler: async () => {
      const savedPath = saveProjectToDisk();
      return { content: [{ type: "text" as const, text: `Project saved: ${savedPath}` }] };
    },
  },

  get_project_info: {
    description: "Get project metadata and summary",
    inputSchema: { type: "object" as const, properties: {} },
    handler: async () => {
      const p = requireProject();
      const info = {
        name: p.name,
        author: p.author,
        version: p._version,
        release: p._release,
        scenes: p.scenes.length,
        backgrounds: p.backgrounds.length,
        sprites: p.spriteSheets.length,
        variables: p.variables.length,
        startSceneId: p.settings.startSceneId,
        path: getProjectPath(),
      };
      return { content: [{ type: "text" as const, text: JSON.stringify(info, null, 2) }] };
    },
  },

  set_start_scene: {
    description: "Set the starting scene and player position",
    inputSchema: {
      type: "object" as const,
      properties: {
        sceneId: { type: "string", description: "Scene UUID" },
        x: { type: "number", description: "Start X position (tiles)" },
        y: { type: "number", description: "Start Y position (tiles)" },
        direction: { type: "string", description: "Start direction: up/down/left/right" },
      },
      required: ["sceneId"],
    },
    handler: async (args: { sceneId: string; x?: number; y?: number; direction?: string }) => {
      const p = requireProject();
      p.settings.startSceneId = args.sceneId;
      if (args.x !== undefined) p.settings.startX = args.x;
      if (args.y !== undefined) p.settings.startY = args.y;
      if (args.direction) p.settings.startDirection = args.direction;
      return { content: [{ type: "text" as const, text: `Start scene set to ${args.sceneId}` }] };
    },
  },

  set_player_sprite: {
    description: "Set the default player sprite for a scene type",
    inputSchema: {
      type: "object" as const,
      properties: {
        spriteId: { type: "string", description: "Sprite sheet UUID" },
        sceneType: { type: "string", description: "Scene type: TOPDOWN, PLATFORM, ADVENTURE, SHMUP, POINTNCLICK, LOGO (default: all)" },
      },
      required: ["spriteId"],
    },
    handler: async (args: { spriteId: string; sceneType?: string }) => {
      const p = requireProject();
      if (!p.settings.defaultPlayerSprites) p.settings.defaultPlayerSprites = {};
      if (args.sceneType) {
        p.settings.defaultPlayerSprites[args.sceneType] = args.spriteId;
      } else {
        for (const t of ["TOPDOWN", "PLATFORM", "ADVENTURE", "SHMUP", "POINTNCLICK", "LOGO"]) {
          p.settings.defaultPlayerSprites[t] = args.spriteId;
        }
      }
      return { content: [{ type: "text" as const, text: `Player sprite set: ${args.spriteId}` }] };
    },
  },

  add_background: {
    description: "Register a background image asset. The PNG file must already exist in assets/backgrounds/",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Background name" },
        filename: { type: "string", description: "PNG filename (e.g. 'cave.png')" },
        width: { type: "number", description: "Width in tiles (imageWidth / 8)" },
        height: { type: "number", description: "Height in tiles (imageHeight / 8)" },
        imageWidth: { type: "number", description: "Image width in pixels" },
        imageHeight: { type: "number", description: "Image height in pixels" },
      },
      required: ["name", "filename", "width", "height", "imageWidth", "imageHeight"],
    },
    handler: async (args: { name: string; filename: string; width: number; height: number; imageWidth: number; imageHeight: number }) => {
      const p = requireProject();
      const bg = createBackground(args);
      p.backgrounds.push(bg);
      return { content: [{ type: "text" as const, text: `Background added: "${bg.name}" (${bg.id})\nFilename: ${bg.filename}\nSize: ${bg.width}x${bg.height} tiles (${bg.imageWidth}x${bg.imageHeight}px)` }] };
    },
  },

  add_sprite: {
    description: "Register a sprite sheet asset. The PNG file must already exist in assets/sprites/",
    inputSchema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Sprite name" },
        filename: { type: "string", description: "PNG filename (e.g. 'player.png')" },
        type: { type: "string", description: "Sprite type: static, actor, player (default: static)" },
      },
      required: ["name", "filename"],
    },
    handler: async (args: { name: string; filename: string; type?: string }) => {
      const p = requireProject();
      let sprite;
      if (args.type === "player") {
        sprite = createPlayerSprite(args.name, args.filename);
      } else {
        sprite = createStaticSprite(args.name, args.filename);
      }
      p.spriteSheets.push(sprite);
      return { content: [{ type: "text" as const, text: `Sprite added: "${sprite.name}" (${sprite.id})\nFilename: ${sprite.filename}\nType: ${sprite.states[0].animationType}` }] };
    },
  },
};
