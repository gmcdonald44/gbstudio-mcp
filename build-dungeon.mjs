/**
 * Build script for DungeonOfShadows_v2 demo project.
 * Creates a valid GB Studio 4.2.2 project with 3 scenes using the MCP server directly.
 * 
 * Uses jimp to compose 16x16 dungeon tiles into GB Studio-compatible backgrounds (160x144).
 */
import { Jimp } from "jimp";
import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";

// Import MCP modules directly
import {
  createDefaultProject, setProject, saveProjectToDisk, uuid,
  createBackground, createStaticSprite, createPlayerSprite,
  createScene, createActor, createTrigger,
} from "./dist/project.js";

const TILES_DIR = "C:/Users/mcdoo/Downloads/0x72_16x16DungeonTileset.v5/0x72_16x16DungeonTileset.v5/items";
const PROJECT_DIR = "C:/Users/mcdoo/.openclaw/workspace/projects/gbstudio-mcp/demo/DungeonOfShadows_v2";

// ─── Helper: compose a background from 16x16 tiles ──────────────────────────

async function composeTiledBackground(tileGrid, outputPath) {
  // Grid is array of rows, each row is array of tile filenames
  const rows = tileGrid.length;
  const cols = tileGrid[0].length;
  const tileW = 16, tileH = 16;
  const imgW = cols * tileW;
  const imgH = rows * tileH;

  const img = new Jimp({ width: imgW, height: imgH, color: 0x000000FF });

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tileName = tileGrid[r][c];
      if (tileName) {
        const tilePath = path.join(TILES_DIR, tileName);
        if (fs.existsSync(tilePath)) {
          const tile = await Jimp.read(tilePath);
          img.composite(tile, c * tileW, r * tileH);
        }
      }
    }
  }

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await img.write(outputPath);
  return { width: imgW, height: imgH };
}

// ─── Helper: create a simple 16x16 sprite PNG ───────────────────────────────

async function copySprite(srcFile, destPath) {
  const src = path.join(TILES_DIR, srcFile);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(src, destPath);
}

// ─── Build backgrounds ──────────────────────────────────────────────────────

// GB Studio backgrounds must be multiples of 8px wide and 8px tall
// 160x144 = 20x18 tiles (8x8) = 10x9 tiles (16x16)
// We'll use 10 columns x 9 rows of 16x16 tiles = 160x144

function makeFloor(rows, cols) {
  const grid = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push("floor_plain.png");
    }
    grid.push(row);
  }
  return grid;
}

async function buildEntranceHall() {
  const grid = makeFloor(9, 10);
  // Top wall
  for (let c = 0; c < 10; c++) grid[0][c] = "Wall_front.png";
  // Bottom wall with gap for entrance
  for (let c = 0; c < 10; c++) grid[8][c] = "Wall_front.png";
  // Side walls
  for (let r = 1; r < 8; r++) { grid[r][0] = "wall_left.png"; grid[r][9] = "wall_right.png"; }
  // Torches
  grid[1][1] = "torch_1.png"; grid[1][8] = "torch_1.png";
  // Stairs down (to dungeon)
  grid[0][4] = "stairs_top.png"; grid[0][5] = "stairs_top.png";
  // Merchant NPC position
  grid[4][7] = "floor_plain.png"; // merchant stands here
  // Chest
  grid[3][2] = "chest_closed.png";
  return grid;
}

async function buildDungeonCorridor() {
  const grid = makeFloor(9, 10);
  // Walls
  for (let c = 0; c < 10; c++) { grid[0][c] = "Wall_front.png"; grid[8][c] = "Wall_front.png"; }
  for (let r = 1; r < 8; r++) { grid[r][0] = "wall_left.png"; grid[r][9] = "wall_right.png"; }
  // Column decorations
  grid[2][3] = "column.png"; grid[2][6] = "column.png";
  grid[5][3] = "column.png"; grid[5][6] = "column.png";
  // Stairs up (back to entrance)
  grid[8][4] = "stairs_bottom.png"; grid[8][5] = "stairs_bottom.png";
  // Door to boss (locked)
  grid[0][4] = "door_closed.png"; grid[0][5] = "door_closed.png";
  return grid;
}

async function buildBossChamber() {
  const grid = makeFloor(9, 10);
  // Walls
  for (let c = 0; c < 10; c++) { grid[0][c] = "Wall_front.png"; grid[8][c] = "Wall_front.png"; }
  for (let r = 1; r < 8; r++) { grid[r][0] = "wall_left.png"; grid[r][9] = "wall_right.png"; }
  // Gargoyle decorations
  grid[1][2] = "gargoyle_top_1.png"; grid[1][7] = "gargoyle_top_2.png";
  // Boss position
  grid[3][5] = "floor_plain.png"; // boss stands here
  // Stairs back
  grid[8][4] = "stairs_bottom.png"; grid[8][5] = "stairs_bottom.png";
  // Treasure
  grid[1][5] = "chest_golden_closed.png";
  return grid;
}

// ─── Main build ─────────────────────────────────────────────────────────────

async function main() {
  console.log("Building DungeonOfShadows_v2...");

  // Clean
  if (fs.existsSync(PROJECT_DIR)) {
    fs.rmSync(PROJECT_DIR, { recursive: true, force: true });
  }

  // Create project
  const project = createDefaultProject("DungeonOfShadows_v2", "Grant");
  const projFile = path.join(PROJECT_DIR, "DungeonOfShadows_v2.gbsproj");
  setProject(project, projFile);

  // Create asset dirs
  for (const dir of [
    "assets/backgrounds", "assets/sprites", "assets/music", "assets/sounds",
    "assets/fonts", "assets/emotes", "assets/avatars", "assets/tilesets", "assets/ui",
    "project/palettes", "project/scenes", "plugins"
  ]) {
    fs.mkdirSync(path.join(PROJECT_DIR, dir), { recursive: true });
  }

  // ── Build backgrounds ──
  console.log("Composing backgrounds...");

  const entranceGrid = await buildEntranceHall();
  const entranceDims = await composeTiledBackground(entranceGrid,
    path.join(PROJECT_DIR, "assets/backgrounds/entrance_hall.png"));

  const corridorGrid = await buildDungeonCorridor();
  const corridorDims = await composeTiledBackground(corridorGrid,
    path.join(PROJECT_DIR, "assets/backgrounds/dungeon_corridor.png"));

  const bossGrid = await buildBossChamber();
  const bossDims = await composeTiledBackground(bossGrid,
    path.join(PROJECT_DIR, "assets/backgrounds/boss_chamber.png"));

  // Register backgrounds
  const bgEntrance = createBackground({
    name: "entrance_hall", filename: "entrance_hall.png",
    width: entranceDims.width / 8, height: entranceDims.height / 8,
    imageWidth: entranceDims.width, imageHeight: entranceDims.height,
  });
  const bgCorridor = createBackground({
    name: "dungeon_corridor", filename: "dungeon_corridor.png",
    width: corridorDims.width / 8, height: corridorDims.height / 8,
    imageWidth: corridorDims.width, imageHeight: corridorDims.height,
  });
  const bgBoss = createBackground({
    name: "boss_chamber", filename: "boss_chamber.png",
    width: bossDims.width / 8, height: bossDims.height / 8,
    imageWidth: bossDims.width, imageHeight: bossDims.height,
  });
  project.backgrounds.push(bgEntrance, bgCorridor, bgBoss);

  // ── Build sprites ──
  console.log("Copying sprites...");

  // Player sprite (hero)
  await copySprite("hero_basic.png", path.join(PROJECT_DIR, "assets/sprites/hero.png"));
  const playerSprite = createStaticSprite("hero", "hero.png");
  project.spriteSheets.push(playerSprite);

  // NPC: Merchant
  await copySprite("npc_merchant.png", path.join(PROJECT_DIR, "assets/sprites/merchant.png"));
  const merchantSprite = createStaticSprite("merchant", "merchant.png");
  project.spriteSheets.push(merchantSprite);

  // NPC: Sage (gives key)
  await copySprite("npc_sage.png", path.join(PROJECT_DIR, "assets/sprites/sage.png"));
  const sageSprite = createStaticSprite("sage", "sage.png");
  project.spriteSheets.push(sageSprite);

  // Monster: Boss demon
  await copySprite("monster_demon.png", path.join(PROJECT_DIR, "assets/sprites/demon.png"));
  const bossSprite = createStaticSprite("demon", "demon.png");
  project.spriteSheets.push(bossSprite);

  // Chest
  await copySprite("chest_closed.png", path.join(PROJECT_DIR, "assets/sprites/chest.png"));
  const chestSprite = createStaticSprite("chest", "chest.png");
  project.spriteSheets.push(chestSprite);

  // Set player sprite for all scene types
  for (const t of ["TOPDOWN", "PLATFORM", "ADVENTURE", "SHMUP", "POINTNCLICK", "LOGO"]) {
    project.settings.defaultPlayerSprites[t] = playerSprite.id;
  }

  // ── Variables ──
  console.log("Adding variables...");
  project.variables.push(
    { id: "0", name: "Has Key", symbol: "var_has_key" },
    { id: "1", name: "Talked to Merchant", symbol: "var_talked_to_merchant" },
    { id: "2", name: "Boss Defeated", symbol: "var_boss_defeated" },
  );

  // ── Scenes ──
  console.log("Creating scenes...");

  // Scene 1: Entrance Hall
  const sceneEntrance = createScene({
    name: "Entrance Hall",
    backgroundId: bgEntrance.id,
    width: bgEntrance.width,
    height: bgEntrance.height,
    x: 0, y: 0,
    _index: 0,
  });

  // Scene 2: Dungeon Corridor
  const sceneCorridor = createScene({
    name: "Dungeon Corridor",
    backgroundId: bgCorridor.id,
    width: bgCorridor.width,
    height: bgCorridor.height,
    x: 300, y: 0,
    _index: 1,
  });

  // Scene 3: Boss Chamber
  const sceneBoss = createScene({
    name: "Boss Chamber",
    backgroundId: bgBoss.id,
    width: bgBoss.width,
    height: bgBoss.height,
    x: 600, y: 0,
    _index: 2,
  });

  project.scenes.push(sceneEntrance, sceneCorridor, sceneBoss);

  // Set start scene
  project.settings.startSceneId = sceneEntrance.id;
  project.settings.startX = 5;
  project.settings.startY = 6;
  project.settings.startDirection = "up";

  // ── Actors ──
  console.log("Adding actors...");

  // Merchant in Entrance Hall
  const merchant = createActor({
    name: "Merchant", x: 7, y: 4,
    spriteSheetId: merchantSprite.id,
    direction: "down", _index: 0,
  });
  merchant.script = [
    {
      id: uuid(), command: "EVENT_TEXT",
      args: { text: "Welcome, adventurer!\nI sell swords and\npotions." },
    },
    {
      id: uuid(), command: "EVENT_TEXT",
      args: { text: "The dungeon below\nis dangerous.\nBe careful!" },
    },
    {
      id: uuid(), command: "EVENT_SET_VALUE",
      args: { variable: "1", value: { type: "true" } },
    },
  ];
  sceneEntrance.actors.push(merchant);

  // Chest in Entrance Hall (gives key)
  const chest = createActor({
    name: "Chest", x: 2, y: 3,
    spriteSheetId: chestSprite.id,
    direction: "down", _index: 1,
  });
  chest.script = [
    {
      id: uuid(), command: "EVENT_IF",
      args: {
        condition: {
          type: "eq",
          valueA: { type: "variable", value: "0" },
          valueB: { type: "number", value: 1 },
        },
      },
      children: {
        true: [
          { id: uuid(), command: "EVENT_TEXT", args: { text: "The chest is empty." } },
        ],
        false: [
          { id: uuid(), command: "EVENT_TEXT", args: { text: "You found a key!" } },
          { id: uuid(), command: "EVENT_SET_VALUE", args: { variable: "0", value: { type: "true" } } },
        ],
      },
      __type: "event",
    },
  ];
  sceneEntrance.actors.push(chest);

  // Staircase trigger in Entrance Hall → Dungeon Corridor
  const stairsDown = createTrigger({
    name: "Stairs Down", x: 4, y: 0, width: 2, height: 1, _index: 0,
  });
  stairsDown.script = [
    {
      id: uuid(), command: "EVENT_SWITCH_SCENE",
      args: {
        sceneId: sceneCorridor.id,
        x: { type: "number", value: 4 },
        y: { type: "number", value: 16 },
        direction: "up",
        fadeSpeed: "2",
      },
    },
  ];
  sceneEntrance.triggers.push(stairsDown);

  // Staircase trigger in Dungeon Corridor → back to Entrance
  const stairsUp = createTrigger({
    name: "Stairs Up", x: 4, y: 17, width: 2, height: 1, _index: 0,
  });
  stairsUp.script = [
    {
      id: uuid(), command: "EVENT_SWITCH_SCENE",
      args: {
        sceneId: sceneEntrance.id,
        x: { type: "number", value: 4 },
        y: { type: "number", value: 1 },
        direction: "down",
        fadeSpeed: "2",
      },
    },
  ];
  sceneCorridor.triggers.push(stairsUp);

  // Locked door trigger in Dungeon Corridor → Boss Chamber (requires key)
  const lockedDoor = createTrigger({
    name: "Locked Door", x: 4, y: 0, width: 2, height: 1, _index: 1,
  });
  lockedDoor.script = [
    {
      id: uuid(), command: "EVENT_IF",
      args: {
        condition: {
          type: "eq",
          valueA: { type: "variable", value: "0" },
          valueB: { type: "number", value: 1 },
        },
      },
      children: {
        true: [
          { id: uuid(), command: "EVENT_TEXT", args: { text: "You use the key.\nThe door opens!" } },
          {
            id: uuid(), command: "EVENT_SWITCH_SCENE",
            args: {
              sceneId: sceneBoss.id,
              x: { type: "number", value: 4 },
              y: { type: "number", value: 16 },
              direction: "up",
              fadeSpeed: "2",
            },
          },
        ],
        false: [
          { id: uuid(), command: "EVENT_TEXT", args: { text: "The door is locked.\nYou need a key." } },
        ],
      },
      __type: "event",
    },
  ];
  sceneCorridor.triggers.push(lockedDoor);

  // Boss in Boss Chamber
  const boss = createActor({
    name: "Demon Boss", x: 5, y: 3,
    spriteSheetId: bossSprite.id,
    direction: "down", _index: 0,
  });
  boss.script = [
    {
      id: uuid(), command: "EVENT_IF",
      args: {
        condition: {
          type: "eq",
          valueA: { type: "variable", value: "2" },
          valueB: { type: "number", value: 1 },
        },
      },
      children: {
        true: [
          { id: uuid(), command: "EVENT_TEXT", args: { text: "You already\ndefeated me..." } },
        ],
        false: [
          { id: uuid(), command: "EVENT_TEXT", args: { text: "FOOLISH MORTAL!\nYou dare enter\nmy chamber?!" } },
          { id: uuid(), command: "EVENT_TEXT", args: { text: "...Fine. You win.\nTake the treasure." } },
          { id: uuid(), command: "EVENT_SET_VALUE", args: { variable: "2", value: { type: "true" } } },
        ],
      },
      __type: "event",
    },
  ];
  sceneBoss.actors.push(boss);

  // Stairs back from Boss Chamber → Dungeon Corridor
  const stairsBack = createTrigger({
    name: "Stairs Back", x: 4, y: 17, width: 2, height: 1, _index: 0,
  });
  stairsBack.script = [
    {
      id: uuid(), command: "EVENT_SWITCH_SCENE",
      args: {
        sceneId: sceneCorridor.id,
        x: { type: "number", value: 4 },
        y: { type: "number", value: 1 },
        direction: "down",
        fadeSpeed: "2",
      },
    },
  ];
  sceneBoss.triggers.push(stairsBack);

  // ── Save ──
  console.log("Saving project...");
  saveProjectToDisk();

  console.log(`\nDungeonOfShadows_v2 built successfully!`);
  console.log(`Project: ${projFile}`);
  console.log(`Scenes: ${project.scenes.length}`);
  console.log(`Backgrounds: ${project.backgrounds.length}`);
  console.log(`Sprites: ${project.spriteSheets.length}`);
  console.log(`Variables: ${project.variables.length}`);
  console.log(`\nOpen in GB Studio 4.2.2 to verify.`);
}

main().catch(e => {
  console.error("Build failed:", e);
  process.exit(1);
});
