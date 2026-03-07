/**
 * @module project
 * @description Core project state management for the GB Studio MCP server.
 *
 * This module defines all TypeScript interfaces for GB Studio project structures
 * (scenes, actors, triggers, variables, etc.) and provides the in-memory state
 * layer that all tool handlers operate on. The project is held in memory and
 * can be saved to / loaded from `.gbsproj` files on disk.
 */
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * @interface ScriptEvent
 * @description A single scripted event in a GB Studio script array.
 * Script events are the building blocks of game logic — dialogue, scene switches,
 * conditionals, variable operations, movement, camera control, etc.
 *
 * @example
 * const dialogueEvent: ScriptEvent = {
 *   id: "a1b2c3d4-...",
 *   command: "EVENT_DIALOGUE",
 *   args: { text: "Hello, adventurer!" }
 * };
 *
 * @example
 * // Conditional event with true/false branches
 * const conditional: ScriptEvent = {
 *   id: "e5f6g7h8-...",
 *   command: "EVENT_IF_VARIABLE_TRUE",
 *   args: { variableId: "var-uuid" },
 *   children: {
 *     true: [{ id: "...", command: "EVENT_DIALOGUE", args: { text: "You have the key!" } }],
 *     false: [{ id: "...", command: "EVENT_DIALOGUE", args: { text: "Come back with the key." } }]
 *   }
 * };
 */
export interface ScriptEvent {
  /** Unique identifier (UUID v4) */
  id: string;
  /** Event command name, e.g. "EVENT_DIALOGUE", "EVENT_SCENE_SWITCH" */
  command: string;
  /** Command-specific arguments */
  args?: Record<string, any>;
  /** Child script branches, used by conditionals (keys: "true", "false") */
  children?: Record<string, ScriptEvent[]>;
}

/**
 * @interface Actor
 * @description An actor (NPC, object, or interactive entity) placed in a scene.
 * Actors have a position, sprite, direction, and multiple script slots for
 * different interaction types.
 *
 * @example
 * const shopkeeper: Actor = {
 *   id: "uuid-here",
 *   name: "Shopkeeper",
 *   x: 5, y: 8,
 *   spriteSheetId: "sprite-uuid",
 *   spriteType: "STATIC",
 *   direction: "down",
 *   moveSpeed: 1, animSpeed: 3,
 *   script: [],        // On interact
 *   startScript: [],   // On scene load
 *   updateScript: [],  // Every frame
 *   hit1Script: [], hit2Script: [], hit3Script: []
 * };
 */
export interface Actor {
  /** Unique identifier (UUID v4) */
  id: string;
  /** Display name */
  name: string;
  /** Tile X position within the scene */
  x: number;
  /** Tile Y position within the scene */
  y: number;
  /** Reference to sprite sheet asset UUID */
  spriteSheetId: string;
  /** Sprite rendering type */
  spriteType: "STATIC" | "ACTOR" | "ACTOR_ANIMATED";
  /** Facing direction */
  direction: "down" | "up" | "left" | "right";
  /** Movement speed (1-4) */
  moveSpeed: number;
  /** Animation speed (1-4) */
  animSpeed: number;
  /** Script executed when player interacts with this actor */
  script: ScriptEvent[];
  /** Script executed when the scene starts */
  startScript: ScriptEvent[];
  /** Script executed every frame */
  updateScript: ScriptEvent[];
  /** Script executed on collision hit 1 */
  hit1Script: ScriptEvent[];
  /** Script executed on collision hit 2 */
  hit2Script: ScriptEvent[];
  /** Script executed on collision hit 3 */
  hit3Script: ScriptEvent[];
}

/**
 * @interface Trigger
 * @description An invisible zone in a scene that fires scripts when the player
 * enters or leaves it. Commonly used for doors, scene transitions, and events.
 *
 * @example
 * const doorTrigger: Trigger = {
 *   id: "uuid-here",
 *   name: "Door to Dungeon",
 *   x: 10, y: 15, width: 2, height: 1,
 *   script: [{ id: "...", command: "EVENT_SCENE_SWITCH", args: { sceneId: "dungeon-uuid", x: 1, y: 1, direction: "down", fadeSpeed: 2 } }],
 *   leaveScript: []
 * };
 */
export interface Trigger {
  /** Unique identifier (UUID v4) */
  id: string;
  /** Display name */
  name: string;
  /** Tile X position */
  x: number;
  /** Tile Y position */
  y: number;
  /** Width in tiles */
  width: number;
  /** Height in tiles */
  height: number;
  /** Script executed when player enters the trigger zone */
  script: ScriptEvent[];
  /** Script executed when player leaves the trigger zone */
  leaveScript: ScriptEvent[];
}

/**
 * @interface Scene
 * @description A game scene (screen/map/room) containing actors, triggers,
 * collision data, and scripts. Scenes are the primary organizational unit
 * in a GB Studio project.
 */
export interface Scene {
  /** Unique identifier (UUID v4) */
  id: string;
  /** Display name */
  name: string;
  /** Reference to background asset UUID */
  backgroundId: string;
  /** World X position in pixels (for editor layout) */
  x: number;
  /** World Y position in pixels (for editor layout) */
  y: number;
  /** Width in tiles */
  width: number;
  /** Height in tiles */
  height: number;
  /** Scene type identifier */
  type: string;
  /** Actors placed in this scene */
  actors: Actor[];
  /** Trigger zones in this scene */
  triggers: Trigger[];
  /** Collision tile data */
  collisions: number[];
  /** Scene initialization script */
  script: ScriptEvent[];
  /** Player hit scripts */
  playerHit1Script: ScriptEvent[];
  playerHit2Script: ScriptEvent[];
  playerHit3Script: ScriptEvent[];
}

/**
 * @interface Background
 * @description A background image asset. References a PNG file in the project's
 * assets/backgrounds/ directory.
 */
export interface Background {
  id: string;
  name: string;
  /** Filename relative to assets/backgrounds/ */
  filename: string;
  /** Width in tiles */
  width: number;
  /** Height in tiles */
  height: number;
  /** Image width in pixels */
  imageWidth: number;
  /** Image height in pixels */
  imageHeight: number;
}

/**
 * @interface SpriteSheet
 * @description A sprite sheet asset. References a PNG file in the project's
 * assets/sprites/ directory.
 */
export interface SpriteSheet {
  id: string;
  name: string;
  /** Filename relative to assets/sprites/ */
  filename: string;
  /** Number of animation frames */
  numFrames: number;
}

/**
 * @interface Variable
 * @description A global game variable used for tracking game state (flags, counters, etc.).
 */
export interface Variable {
  id: string;
  name: string;
}

/**
 * @interface Palette
 * @description A color palette for Game Boy rendering. Each palette contains
 * arrays of 4 hex color strings (darkest to lightest).
 */
export interface Palette {
  id: string;
  name: string;
  /** Array of color sets, each with 4 hex color strings */
  colors: string[][];
}

/**
 * @interface GBSProject
 * @description The root structure of a GB Studio project (.gbsproj file).
 * Contains all scenes, assets, variables, palettes, and settings.
 */
export interface GBSProject {
  /** Project format version */
  _v: number;
  /** Project name */
  name: string;
  /** Author name */
  author: string;
  /** Project notes */
  notes: string;
  /** All scenes in the project */
  scenes: Scene[];
  /** Background image assets */
  backgrounds: Background[];
  /** Sprite sheet assets */
  spriteSheets: SpriteSheet[];
  /** Color palettes */
  palettes: Palette[];
  /** Music tracks */
  music: any[];
  /** Global game variables */
  variables: Variable[];
  /** Project settings (start scene, player sprite, palettes, etc.) */
  settings: Record<string, any>;
}

// ─── State ───────────────────────────────────────────────────────────────────

/** @internal The currently loaded project, or null if none is loaded */
let currentProject: GBSProject | null = null;
/** @internal File path of the currently loaded project */
let currentProjectPath: string | null = null;

/**
 * Generate a new UUID v4.
 * @returns A new random UUID string
 */
export function uuid(): string {
  return crypto.randomUUID();
}

/**
 * Get the current in-memory project.
 * @returns The current project, or null if none is loaded
 */
export function getProject(): GBSProject | null {
  return currentProject;
}

/**
 * Get the file path of the current project.
 * @returns The project file path, or null if none is set
 */
export function getProjectPath(): string | null {
  return currentProjectPath;
}

/**
 * Get the current project, throwing if none is loaded.
 * @returns The current project
 * @throws {Error} If no project is loaded
 *
 * @example
 * const project = requireProject(); // throws if no project loaded
 * console.log(project.name);
 */
export function requireProject(): GBSProject {
  if (!currentProject) throw new Error("No project loaded. Use create_project or open_project first.");
  return currentProject;
}

/**
 * Set the current in-memory project and its file path.
 * @param project - The project data
 * @param projectPath - The file path for saving
 */
export function setProject(project: GBSProject, projectPath: string) {
  currentProject = project;
  currentProjectPath = projectPath;
}

/**
 * Create a new GB Studio project with default assets and settings.
 * Includes a default background (160×144), sprite sheet, and classic Game Boy palette.
 *
 * @param name - Project name
 * @param author - Author name
 * @returns A new GBSProject with default assets
 *
 * @example
 * const project = createDefaultProject("MyRPG", "Grant");
 * // project.backgrounds[0].id → default background UUID
 * // project.spriteSheets[0].id → default sprite UUID
 */
export function createDefaultProject(name: string, author: string): GBSProject {
  const defaultBgId = uuid();
  const defaultSpriteId = uuid();
  const defaultPaletteId = uuid();

  return {
    _v: 21,
    name,
    author,
    notes: "",
    scenes: [],
    backgrounds: [
      {
        id: defaultBgId,
        name: "Default Background",
        filename: "default.png",
        width: 20,
        height: 18,
        imageWidth: 160,
        imageHeight: 144,
      },
    ],
    spriteSheets: [
      {
        id: defaultSpriteId,
        name: "Default Sprite",
        filename: "default_sprite.png",
        numFrames: 1,
      },
    ],
    palettes: [
      {
        id: defaultPaletteId,
        name: "Default Palette",
        colors: [
          ["E8F8E0", "B0F088", "509878", "202850"],
        ],
      },
    ],
    music: [],
    variables: [],
    settings: {
      startSceneId: "",
      startX: 0,
      startY: 0,
      startMoveSpeed: 1,
      startAnimSpeed: 3,
      startDirection: "down",
      playerSpriteSheetId: defaultSpriteId,
      defaultBackgroundPaletteIds: [defaultPaletteId, defaultPaletteId, defaultPaletteId, defaultPaletteId, defaultPaletteId, defaultPaletteId],
      defaultSpritePaletteIds: [defaultPaletteId, defaultPaletteId, defaultPaletteId, defaultPaletteId, defaultPaletteId, defaultPaletteId],
      defaultUIPaletteId: defaultPaletteId,
    },
  };
}

/**
 * Save the current in-memory project to its file path on disk.
 * Creates parent directories if they don't exist.
 *
 * @returns The absolute path where the project was saved
 * @throws {Error} If no project is loaded or no path is set
 *
 * @example
 * const savedPath = saveProjectToDisk();
 * // savedPath → "C:/games/MyRPG/MyRPG.gbsproj"
 */
export function saveProjectToDisk(): string {
  const project = requireProject();
  if (!currentProjectPath) throw new Error("No project path set.");
  const dir = path.dirname(currentProjectPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(currentProjectPath, JSON.stringify(project, null, 2), "utf-8");
  return currentProjectPath;
}

/**
 * Load a GB Studio project from a `.gbsproj` file on disk.
 * Sets it as the current in-memory project.
 *
 * @param filePath - Path to the .gbsproj file
 * @returns The loaded project
 * @throws {Error} If the file does not exist or is not valid JSON
 *
 * @example
 * const project = loadProjectFromDisk("C:/games/MyRPG/MyRPG.gbsproj");
 * console.log(project.scenes.length); // number of scenes
 */
export function loadProjectFromDisk(filePath: string): GBSProject {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);
  const data = JSON.parse(fs.readFileSync(abs, "utf-8"));
  currentProject = data as GBSProject;
  currentProjectPath = abs;
  return currentProject;
}

/**
 * Find a scene by ID in the current project.
 *
 * @param sceneId - UUID of the scene to find
 * @returns The matching scene
 * @throws {Error} If no project is loaded or scene is not found
 */
export function findScene(sceneId: string): Scene {
  const p = requireProject();
  const s = p.scenes.find((s) => s.id === sceneId);
  if (!s) throw new Error(`Scene not found: ${sceneId}`);
  return s;
}

/**
 * Find an actor by ID within a scene.
 *
 * @param scene - The scene to search
 * @param actorId - UUID of the actor to find
 * @returns The matching actor
 * @throws {Error} If actor is not found in the scene
 */
export function findActor(scene: Scene, actorId: string): Actor {
  const a = scene.actors.find((a) => a.id === actorId);
  if (!a) throw new Error(`Actor not found: ${actorId} in scene ${scene.name}`);
  return a;
}

/**
 * Find a trigger by ID within a scene.
 *
 * @param scene - The scene to search
 * @param triggerId - UUID of the trigger to find
 * @returns The matching trigger
 * @throws {Error} If trigger is not found in the scene
 */
export function findTrigger(scene: Scene, triggerId: string): Trigger {
  const t = scene.triggers.find((t) => t.id === triggerId);
  if (!t) throw new Error(`Trigger not found: ${triggerId} in scene ${scene.name}`);
  return t;
}

/**
 * Resolve a script array from a target type, target ID, and script type.
 * Used by script tools to find the correct script array to modify.
 *
 * @param target - Target type: "scene", "actor", or "trigger"
 * @param targetId - UUID of the target entity
 * @param scriptType - Name of the script array (e.g. "script", "startScript", "updateScript")
 * @param sceneId - Scene UUID (required for actor and trigger targets)
 * @returns Object with the owner entity and the script key name
 * @throws {Error} If target type is invalid, target not found, or script type doesn't exist
 *
 * @example
 * // Get the interaction script array for an actor
 * const { owner, scriptKey } = resolveScriptTarget("actor", actorId, "script", sceneId);
 * owner[scriptKey].push(newEvent);
 */
export function resolveScriptTarget(
  target: string,
  targetId: string,
  scriptType: string,
  sceneId?: string
): { owner: any; scriptKey: string } {
  const p = requireProject();

  if (target === "scene") {
    const scene = findScene(targetId);
    if (!(scriptType in scene)) throw new Error(`Invalid script type '${scriptType}' for scene`);
    return { owner: scene, scriptKey: scriptType };
  }

  if (target === "actor") {
    if (!sceneId) throw new Error("sceneId required for actor target");
    const scene = findScene(sceneId);
    const actor = findActor(scene, targetId);
    if (!(scriptType in actor)) throw new Error(`Invalid script type '${scriptType}' for actor`);
    return { owner: actor, scriptKey: scriptType };
  }

  if (target === "trigger") {
    if (!sceneId) throw new Error("sceneId required for trigger target");
    const scene = findScene(sceneId);
    const trigger = findTrigger(scene, targetId);
    if (!(scriptType in trigger)) throw new Error(`Invalid script type '${scriptType}' for trigger`);
    return { owner: trigger, scriptKey: scriptType };
  }

  throw new Error(`Invalid target: ${target}`);
}
