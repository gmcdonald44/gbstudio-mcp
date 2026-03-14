/**
 * @module project
 * @description Core project state management for GB Studio 4.2.2 MCP server.
 * 
 * Implements the native GB Studio 4.2.2 split-resource format:
 * - project.gbsproj (root metadata)
 * - project/settings.gbsres
 * - project/variables.gbsres
 * - project/engine_field_values.gbsres
 * - project/palettes/*.gbsres
 * - project/scenes/<path>/scene.gbsres
 * - project/scenes/<path>/actors/*.gbsres
 * - project/scenes/<path>/triggers/*.gbsres
 * - assets/backgrounds/*.png.gbsres
 * - assets/sprites/*.png.gbsres
 */
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ScriptEvent {
  id: string;
  command: string;
  args?: Record<string, any>;
  children?: Record<string, ScriptEvent[]>;
  __type?: "event";
}

export interface Actor {
  _resourceType: "actor";
  id: string;
  _index: number;
  symbol: string;
  prefabId: string;
  name: string;
  coordinateType: "tiles";
  x: number;
  y: number;
  frame: number;
  animate: boolean;
  spriteSheetId: string;
  paletteId: string;
  direction: "down" | "up" | "left" | "right";
  moveSpeed: number;
  animSpeed: number;
  isPinned: boolean;
  persistent: boolean;
  collisionGroup: string;
  collisionExtraFlags: string[];
  prefabScriptOverrides: Record<string, any>;
  script: ScriptEvent[];
  startScript: ScriptEvent[];
  updateScript: ScriptEvent[];
  hit1Script: ScriptEvent[];
  hit2Script: ScriptEvent[];
  hit3Script: ScriptEvent[];
}

export interface Trigger {
  _resourceType: "trigger";
  id: string;
  _index: number;
  symbol: string;
  prefabId: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  prefabScriptOverrides: Record<string, any>;
  script: ScriptEvent[];
  leaveScript: ScriptEvent[];
}

export interface Scene {
  _resourceType: "scene";
  id: string;
  _index: number;
  type: string;
  name: string;
  symbol: string;
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundId: string;
  tilesetId: string;
  colorModeOverride: string;
  paletteIds: string[];
  spritePaletteIds: string[];
  autoFadeSpeed: number;
  script: ScriptEvent[];
  playerHit1Script: ScriptEvent[];
  playerHit2Script: ScriptEvent[];
  playerHit3Script: ScriptEvent[];
  collisions: string;
  actors: Actor[];
  triggers: Trigger[];
}

export interface Background {
  _resourceType: "background";
  id: string;
  name: string;
  symbol: string;
  filename: string;
  width: number;
  height: number;
  imageWidth: number;
  imageHeight: number;
  tileColors: string;
  autoColor: boolean;
}

export interface SpriteSheet {
  _resourceType: "sprite";
  id: string;
  name: string;
  symbol: string;
  filename: string;
  states: SpriteState[];
}

export interface SpriteState {
  id: string;
  name: string;
  animationType: string;
  flipLeft: boolean;
  animations: SpriteAnimation[];
}

export interface SpriteAnimation {
  id: string;
  frames: SpriteFrame[];
}

export interface SpriteFrame {
  id: string;
  tiles: SpriteTile[];
}

export interface SpriteTile {
  id: string;
  x: number;
  y: number;
  sliceX: number;
  sliceY: number;
  flipX: boolean;
  flipY: boolean;
  palette: number;
  paletteIndex: number;
  objPalette: string;
  priority: boolean;
}

export interface Variable {
  id: string;
  name: string;
  symbol: string;
}

export interface Palette {
  _resourceType: "palette";
  id: string;
  name: string;
  colors: string[];
  defaultName: string;
  defaultColors: string[];
}

export interface GBSProject {
  // Root .gbsproj fields
  _resourceType: "project";
  name: string;
  author: string;
  notes: string;
  _version: string;
  _release: string;
  // In-memory collections (not saved to .gbsproj)
  scenes: Scene[];
  backgrounds: Background[];
  spriteSheets: SpriteSheet[];
  palettes: Palette[];
  music: any[];
  variables: Variable[];
  constants: any[];
  settings: Record<string, any>;
  engineFieldValues: any[];
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

/** Generate a symbol-safe name from a display name */
function toSymbol(prefix: string, name: string): string {
  return prefix + "_" + name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/, "").replace(/^_+/, "");
}

/** Create default palettes matching GB Studio 4.2.2 blank template */
function createDefaultPalettes(): Palette[] {
  return [
    { _resourceType: "palette", id: "default-bg-1", name: "Default BG 1", colors: ["F8E8C8", "D89048", "A82820", "082048"], defaultName: "Default BG 1", defaultColors: ["F8E8C8", "D89048", "A82820", "301850"] },
    { _resourceType: "palette", id: "default-bg-2", name: "Default BG 2", colors: ["E0F8D0", "88C070", "346856", "081820"], defaultName: "Default BG 2", defaultColors: ["E0F8D0", "88C070", "346856", "081820"] },
    { _resourceType: "palette", id: "default-bg-3", name: "Default BG 3", colors: ["F8D8A8", "E0A878", "785888", "002030"], defaultName: "Default BG 3", defaultColors: ["F8D8A8", "E0A878", "785888", "002030"] },
    { _resourceType: "palette", id: "default-bg-4", name: "Default BG 4", colors: ["F8F8B0", "90C8B8", "486878", "082048"], defaultName: "Default BG 4", defaultColors: ["F8F8B0", "90C8B8", "486878", "082048"] },
    { _resourceType: "palette", id: "default-bg-5", name: "Default BG 5", colors: ["F8D8B0", "78C078", "688840", "583820"], defaultName: "Default BG 5", defaultColors: ["F8D8B0", "78C078", "688840", "583820"] },
    { _resourceType: "palette", id: "default-bg-6", name: "Default BG 6", colors: ["D8D8C0", "C8B070", "B05010", "000000"], defaultName: "Default BG 6", defaultColors: ["D8D8C0", "C8B070", "B05010", "000000"] },
    { _resourceType: "palette", id: "default-sprite", name: "Default Sprites", colors: ["F8F0E0", "D88868", "983860", "082048"], defaultName: "Default Sprites", defaultColors: ["F8F0E0", "D88868", "983860", "082048"] },
    { _resourceType: "palette", id: "default-ui", name: "Default UI", colors: ["F8F8B0", "A8A060", "685830", "202010"], defaultName: "Default UI", defaultColors: ["F8F8B0", "A8A060", "685830", "202010"] },
  ];
}

/** Create a minimal static sprite with a single tile */
export function createStaticSprite(name: string, filename: string, sliceX = 0, sliceY = 0): SpriteSheet {
  return {
    _resourceType: "sprite",
    id: uuid(),
    name,
    symbol: toSymbol("sprite", name),
    filename,
    states: [{
      id: uuid(),
      name: "",
      animationType: "fixed",
      flipLeft: false,
      animations: [{
        id: uuid(),
        frames: [{
          id: uuid(),
          tiles: [{
            id: uuid(),
            x: 0, y: 0,
            sliceX, sliceY,
            flipX: false, flipY: false,
            palette: 0, paletteIndex: 0,
            objPalette: "OBP0", priority: false,
          }],
        }],
      }],
    }],
  };
}

/** Create a multi_movement sprite (player-style) with 4 directions */
export function createPlayerSprite(name: string, filename: string): SpriteSheet {
  const makeAnim = (sliceX: number, sliceY: number) => ({
    id: uuid(),
    frames: [{
      id: uuid(),
      tiles: [
        { id: uuid(), x: 0, y: 0, sliceX, sliceY, flipX: false, flipY: false, palette: 0, paletteIndex: 0, objPalette: "OBP0", priority: false },
        { id: uuid(), x: 8, y: 0, sliceX: sliceX + 8, sliceY, flipX: false, flipY: false, palette: 0, paletteIndex: 0, objPalette: "OBP0", priority: false },
      ],
    }],
  });

  // 8 animations: idle_down, idle_right, idle_up, idle_left (mirrored), walk_down, walk_right, walk_up, walk_left
  return {
    _resourceType: "sprite",
    id: uuid(),
    name,
    symbol: toSymbol("sprite", name),
    filename,
    states: [{
      id: uuid(),
      name: "",
      animationType: "multi_movement",
      flipLeft: true,
      animations: [
        makeAnim(0, 0),   // idle down
        makeAnim(16, 0),  // idle right
        makeAnim(32, 0),  // idle up
        makeAnim(16, 0),  // idle left (flipped)
        makeAnim(0, 0),   // walk down
        makeAnim(16, 0),  // walk right
        makeAnim(32, 0),  // walk up
        makeAnim(16, 0),  // walk left (flipped)
      ],
    }],
  };
}

export function createDefaultProject(name: string, author: string): GBSProject {
  return {
    _resourceType: "project",
    name,
    author,
    notes: "",
    _version: "4.2.0",
    _release: "10",
    scenes: [],
    backgrounds: [],
    spriteSheets: [],
    palettes: createDefaultPalettes(),
    music: [],
    variables: [],
    constants: [],
    settings: {
      _resourceType: "settings",
      startSceneId: "",
      startX: 0,
      startY: 0,
      startMoveSpeed: 1,
      startAnimSpeed: 15,
      startDirection: "down",
      showCollisionExtraTiles: false,
      showCollisionTileValues: false,
      collisionLayerOpacity: 50,
      sgbEnabled: false,
      customHead: "",
      defaultBackgroundPaletteIds: [
        "default-bg-1", "default-bg-2", "default-bg-3", "default-bg-4",
        "default-bg-5", "default-bg-6", "dmg", "default-ui"
      ],
      defaultSpritePaletteIds: [
        "default-sprite", "default-sprite", "default-sprite", "default-sprite",
        "default-sprite", "default-sprite", "default-sprite", "default-sprite"
      ],
      defaultSpritePaletteId: "default-sprite",
      defaultUIPaletteId: "default-ui",
      playerPaletteId: "",
      defaultMonoBGP: [0, 1, 2, 3],
      defaultMonoOBP0: [0, 1, 3],
      defaultMonoOBP1: [0, 2, 3],
      defaultFontId: "",
      defaultCharacterEncoding: "",
      defaultPlayerSprites: {},
      musicDriver: "huge",
      cartType: "mbc5",
      batterylessEnabled: false,
      customColorsWhite: "E8F8E0",
      customColorsLight: "B0F088",
      customColorsDark: "509878",
      customColorsBlack: "202850",
      customControlsUp: ["ArrowUp", "w"],
      customControlsDown: ["ArrowDown", "s"],
      customControlsLeft: ["ArrowLeft", "a"],
      customControlsRight: ["ArrowRight", "d"],
      customControlsA: ["Alt", "z", "j"],
      customControlsB: ["Control", "k", "x"],
      customControlsStart: ["Enter"],
      customControlsSelect: ["Shift"],
      colorMode: "mono",
      colorCorrection: "default",
      generateDebugFilesEnabled: false,
      compilerPreset: 3000,
      scriptEventPresets: {},
      scriptEventDefaultPresets: {},
      runSceneSelectionOnly: false,
      spriteMode: "8x16",
      openBuildFolderOnExport: true,
      showRomUsageAfterBuild: false,
      romFilename: "",
      defaultSceneTypeId: "TOPDOWN",
      disabledSceneTypeIds: [],
      autoTileFlipEnabled: true,
    },
    engineFieldValues: [
      { id: "fade_style", value: 0 },
      { id: "FEAT_PLATFORM_COYOTE_TIME", value: 0 },
      { id: "FEAT_PLATFORM_DROP_THROUGH", value: 0 },
      { id: "SHOOTER_MOVEMENT_TYPE", value: "MOVEMENT_TYPE_LOCK_PERPENDICULAR" },
      { id: "SHOOTER_TRIGGER_ACTIVATION", value: "ON_PLAYER_COLLISION" },
      { id: "SHOOTER_WALL_COLLISION_GROUP", value: "COLLISION_GROUP_NONE" },
    ],
  };
}

/** Create a default actor with all GB Studio 4.2.2 fields */
export function createActor(opts: {
  name: string;
  x: number;
  y: number;
  spriteSheetId: string;
  direction?: string;
  _index?: number;
}): Actor {
  return {
    _resourceType: "actor",
    id: uuid(),
    _index: opts._index ?? 0,
    symbol: toSymbol("actor", opts.name),
    prefabId: "",
    name: opts.name,
    coordinateType: "tiles",
    x: opts.x,
    y: opts.y,
    frame: 0,
    animate: false,
    spriteSheetId: opts.spriteSheetId,
    paletteId: "",
    direction: (opts.direction as any) || "down",
    moveSpeed: 1,
    animSpeed: 15,
    isPinned: false,
    persistent: false,
    collisionGroup: "",
    collisionExtraFlags: [],
    prefabScriptOverrides: {},
    script: [],
    startScript: [],
    updateScript: [],
    hit1Script: [],
    hit2Script: [],
    hit3Script: [],
  };
}

/** Create a default trigger with all GB Studio 4.2.2 fields */
export function createTrigger(opts: {
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  _index?: number;
}): Trigger {
  const symbolName = opts.name || `trigger_${opts._index ?? 0}`;
  return {
    _resourceType: "trigger",
    id: uuid(),
    _index: opts._index ?? 0,
    symbol: toSymbol("trigger", symbolName),
    prefabId: "",
    name: opts.name || "",
    x: opts.x,
    y: opts.y,
    width: opts.width,
    height: opts.height,
    prefabScriptOverrides: {},
    script: [],
    leaveScript: [],
  };
}

/** Create a default scene with all GB Studio 4.2.2 fields */
export function createScene(opts: {
  name: string;
  backgroundId: string;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  type?: string;
  _index?: number;
}): Scene {
  return {
    _resourceType: "scene",
    id: uuid(),
    _index: opts._index ?? 0,
    type: opts.type || "TOPDOWN",
    name: opts.name,
    symbol: toSymbol("scene", opts.name),
    x: opts.x ?? 0,
    y: opts.y ?? 0,
    width: opts.width ?? 20,
    height: opts.height ?? 18,
    backgroundId: opts.backgroundId,
    tilesetId: "",
    colorModeOverride: "none",
    paletteIds: [],
    spritePaletteIds: [],
    autoFadeSpeed: 1,
    script: [],
    playerHit1Script: [],
    playerHit2Script: [],
    playerHit3Script: [],
    collisions: "",
    actors: [],
    triggers: [],
  };
}

/** Create a default background resource */
export function createBackground(opts: {
  name: string;
  filename: string;
  width: number;
  height: number;
  imageWidth: number;
  imageHeight: number;
}): Background {
  return {
    _resourceType: "background",
    id: uuid(),
    name: opts.name,
    symbol: toSymbol("bg", opts.name),
    filename: opts.filename,
    width: opts.width,
    height: opts.height,
    imageWidth: opts.imageWidth,
    imageHeight: opts.imageHeight,
    tileColors: "",
    autoColor: false,
  };
}

// ─── Save / Load (Split-Resource Format) ─────────────────────────────────────

function writeJson(filePath: string, data: any) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/** Save the current project in GB Studio 4.2.2 split-resource format */
export function saveProjectToDisk(): string {
  const project = requireProject();
  if (!currentProjectPath) throw new Error("No project path set.");

  const projectDir = path.dirname(currentProjectPath);
  const resDir = path.join(projectDir, "project");

  // 1. Write project.gbsproj (root metadata only)
  writeJson(currentProjectPath, {
    _resourceType: "project",
    name: project.name,
    author: project.author,
    notes: project.notes,
    _version: project._version,
    _release: project._release,
  });

  // 2. Write project/settings.gbsres
  // Auto-assign first sprite sheet as default player sprite for TOPDOWN scenes
  if (project.spriteSheets.length > 0 && !project.settings.defaultPlayerSprites?.TOPDOWN) {
    project.settings.defaultPlayerSprites = {
      ...project.settings.defaultPlayerSprites,
      TOPDOWN: project.spriteSheets[0].id,
    };
  }
  writeJson(path.join(resDir, "settings.gbsres"), project.settings);

  // 3. Write project/variables.gbsres
  writeJson(path.join(resDir, "variables.gbsres"), {
    _resourceType: "variables",
    variables: project.variables,
    constants: project.constants || [],
  });

  // 4. Write project/engine_field_values.gbsres
  writeJson(path.join(resDir, "engine_field_values.gbsres"), {
    _resourceType: "engineFieldValues",
    engineFieldValues: project.engineFieldValues,
  });

  // 5. Write palettes
  for (const pal of project.palettes) {
    const palName = pal.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/, "");
    writeJson(path.join(resDir, "palettes", `${palName}.gbsres`), pal);
  }

  // 6. Write scenes (each scene in its own directory)
  for (const scene of project.scenes) {
    const sceneDirName = scene.symbol.replace(/^scene_/, "") || scene.id;
    const sceneDir = path.join(resDir, "scenes", sceneDirName);

    // Scene .gbsres (without actors/triggers - they're separate files)
    const { actors, triggers, ...sceneData } = scene;
    writeJson(path.join(sceneDir, "scene.gbsres"), sceneData);

    // Actors
    for (const actor of actors) {
      const actorName = actor.symbol.replace(/^actor_/, "") || actor.id;
      writeJson(path.join(sceneDir, "actors", `${actorName}.gbsres`), actor);
    }

    // Triggers
    for (const trigger of triggers) {
      const triggerName = trigger.symbol.replace(/^trigger_/, "") || trigger.id;
      writeJson(path.join(sceneDir, "triggers", `${triggerName}.gbsres`), trigger);
    }
  }

  // 7. Write background .gbsres files
  const bgDir = path.join(projectDir, "assets", "backgrounds");
  fs.mkdirSync(bgDir, { recursive: true });
  for (const bg of project.backgrounds) {
    writeJson(path.join(bgDir, `${bg.filename}.gbsres`), bg);
  }

  // 8. Write sprite .gbsres files
  const spriteDir = path.join(projectDir, "assets", "sprites");
  fs.mkdirSync(spriteDir, { recursive: true });
  for (const sprite of project.spriteSheets) {
    writeJson(path.join(spriteDir, `${sprite.filename}.gbsres`), sprite);
  }

  return currentProjectPath;
}

/** Load a GB Studio 4.2.2 project from its split-resource files */
export function loadProjectFromDisk(filePath: string): GBSProject {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);

  const projectDir = path.dirname(abs);
  const resDir = path.join(projectDir, "project");

  // Read root
  const root = JSON.parse(fs.readFileSync(abs, "utf-8"));

  // Read settings
  const settingsPath = path.join(resDir, "settings.gbsres");
  const settings = fs.existsSync(settingsPath) ? JSON.parse(fs.readFileSync(settingsPath, "utf-8")) : {};

  // Read variables
  const varsPath = path.join(resDir, "variables.gbsres");
  const varsData = fs.existsSync(varsPath) ? JSON.parse(fs.readFileSync(varsPath, "utf-8")) : { variables: [], constants: [] };

  // Read engine field values
  const efvPath = path.join(resDir, "engine_field_values.gbsres");
  const efvData = fs.existsSync(efvPath) ? JSON.parse(fs.readFileSync(efvPath, "utf-8")) : { engineFieldValues: [] };

  // Read palettes
  const palettes: Palette[] = [];
  const palDir = path.join(resDir, "palettes");
  if (fs.existsSync(palDir)) {
    for (const f of fs.readdirSync(palDir).filter(f => f.endsWith(".gbsres"))) {
      palettes.push(JSON.parse(fs.readFileSync(path.join(palDir, f), "utf-8")));
    }
  }

  // Read scenes
  const scenes: Scene[] = [];
  const scenesDir = path.join(resDir, "scenes");
  if (fs.existsSync(scenesDir)) {
    const readScenesRecursive = (dir: string) => {
      if (fs.existsSync(path.join(dir, "scene.gbsres"))) {
        const sceneData = JSON.parse(fs.readFileSync(path.join(dir, "scene.gbsres"), "utf-8"));
        sceneData.actors = [];
        sceneData.triggers = [];

        // Read actors
        const actorsDir = path.join(dir, "actors");
        if (fs.existsSync(actorsDir)) {
          for (const f of fs.readdirSync(actorsDir).filter(f => f.endsWith(".gbsres"))) {
            sceneData.actors.push(JSON.parse(fs.readFileSync(path.join(actorsDir, f), "utf-8")));
          }
          sceneData.actors.sort((a: any, b: any) => (a._index ?? 0) - (b._index ?? 0));
        }

        // Read triggers
        const triggersDir = path.join(dir, "triggers");
        if (fs.existsSync(triggersDir)) {
          for (const f of fs.readdirSync(triggersDir).filter(f => f.endsWith(".gbsres"))) {
            sceneData.triggers.push(JSON.parse(fs.readFileSync(path.join(triggersDir, f), "utf-8")));
          }
          sceneData.triggers.sort((a: any, b: any) => (a._index ?? 0) - (b._index ?? 0));
        }

        scenes.push(sceneData);
      }

      // Recurse into subdirectories (for nested scene paths)
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory() && entry.name !== "actors" && entry.name !== "triggers") {
          readScenesRecursive(path.join(dir, entry.name));
        }
      }
    };
    readScenesRecursive(scenesDir);
    scenes.sort((a, b) => (a._index ?? 0) - (b._index ?? 0));
  }

  // Read backgrounds
  const backgrounds: Background[] = [];
  const bgDir = path.join(projectDir, "assets", "backgrounds");
  if (fs.existsSync(bgDir)) {
    for (const f of fs.readdirSync(bgDir).filter(f => f.endsWith(".png.gbsres"))) {
      backgrounds.push(JSON.parse(fs.readFileSync(path.join(bgDir, f), "utf-8")));
    }
  }

  // Read sprites
  const spriteSheets: SpriteSheet[] = [];
  const spriteDir = path.join(projectDir, "assets", "sprites");
  if (fs.existsSync(spriteDir)) {
    for (const f of fs.readdirSync(spriteDir).filter(f => f.endsWith(".png.gbsres"))) {
      spriteSheets.push(JSON.parse(fs.readFileSync(path.join(spriteDir, f), "utf-8")));
    }
  }

  const project: GBSProject = {
    _resourceType: "project",
    name: root.name,
    author: root.author,
    notes: root.notes || "",
    _version: root._version,
    _release: root._release,
    scenes,
    backgrounds,
    spriteSheets,
    palettes,
    music: [],
    variables: varsData.variables || [],
    constants: varsData.constants || [],
    settings,
    engineFieldValues: efvData.engineFieldValues || [],
  };

  currentProject = project;
  currentProjectPath = abs;
  return project;
}

// ─── Finders ─────────────────────────────────────────────────────────────────

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
