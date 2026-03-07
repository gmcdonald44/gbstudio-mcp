import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScriptEvent {
  id: string;
  command: string;
  args?: Record<string, any>;
  children?: Record<string, ScriptEvent[]>;
}

export interface Actor {
  id: string;
  name: string;
  x: number;
  y: number;
  spriteSheetId: string;
  spriteType: "STATIC" | "ACTOR" | "ACTOR_ANIMATED";
  direction: "down" | "up" | "left" | "right";
  moveSpeed: number;
  animSpeed: number;
  script: ScriptEvent[];
  startScript: ScriptEvent[];
  updateScript: ScriptEvent[];
  hit1Script: ScriptEvent[];
  hit2Script: ScriptEvent[];
  hit3Script: ScriptEvent[];
}

export interface Trigger {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  script: ScriptEvent[];
  leaveScript: ScriptEvent[];
}

export interface Scene {
  id: string;
  name: string;
  backgroundId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  actors: Actor[];
  triggers: Trigger[];
  collisions: number[];
  script: ScriptEvent[];
  playerHit1Script: ScriptEvent[];
  playerHit2Script: ScriptEvent[];
  playerHit3Script: ScriptEvent[];
}

export interface Background {
  id: string;
  name: string;
  filename: string;
  width: number;
  height: number;
  imageWidth: number;
  imageHeight: number;
}

export interface SpriteSheet {
  id: string;
  name: string;
  filename: string;
  numFrames: number;
}

export interface Variable {
  id: string;
  name: string;
}

export interface Palette {
  id: string;
  name: string;
  colors: string[][];
}

export interface GBSProject {
  _v: number;
  name: string;
  author: string;
  notes: string;
  scenes: Scene[];
  backgrounds: Background[];
  spriteSheets: SpriteSheet[];
  palettes: Palette[];
  music: any[];
  variables: Variable[];
  settings: Record<string, any>;
}

// ─── State ───────────────────────────────────────────────────────────────────

let currentProject: GBSProject | null = null;
let currentProjectPath: string | null = null;

export function uuid(): string {
  return crypto.randomUUID();
}

export function getProject(): GBSProject | null {
  return currentProject;
}

export function getProjectPath(): string | null {
  return currentProjectPath;
}

export function requireProject(): GBSProject {
  if (!currentProject) throw new Error("No project loaded. Use create_project or open_project first.");
  return currentProject;
}

export function setProject(project: GBSProject, projectPath: string) {
  currentProject = project;
  currentProjectPath = projectPath;
}

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

export function saveProjectToDisk(): string {
  const project = requireProject();
  if (!currentProjectPath) throw new Error("No project path set.");
  const dir = path.dirname(currentProjectPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(currentProjectPath, JSON.stringify(project, null, 2), "utf-8");
  return currentProjectPath;
}

export function loadProjectFromDisk(filePath: string): GBSProject {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);
  const data = JSON.parse(fs.readFileSync(abs, "utf-8"));
  currentProject = data as GBSProject;
  currentProjectPath = abs;
  return currentProject;
}

export function findScene(sceneId: string): Scene {
  const p = requireProject();
  const s = p.scenes.find((s) => s.id === sceneId);
  if (!s) throw new Error(`Scene not found: ${sceneId}`);
  return s;
}

export function findActor(scene: Scene, actorId: string): Actor {
  const a = scene.actors.find((a) => a.id === actorId);
  if (!a) throw new Error(`Actor not found: ${actorId} in scene ${scene.name}`);
  return a;
}

export function findTrigger(scene: Scene, triggerId: string): Trigger {
  const t = scene.triggers.find((t) => t.id === triggerId);
  if (!t) throw new Error(`Trigger not found: ${triggerId} in scene ${scene.name}`);
  return t;
}

// Resolve a script array from target/targetId/scriptType
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
