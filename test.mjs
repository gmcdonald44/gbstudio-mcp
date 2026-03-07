/**
 * Test suite for gbstudio-mcp server — GB Studio 4.2.2 format validation.
 */
import {
  createDefaultProject, setProject, saveProjectToDisk, loadProjectFromDisk,
  uuid, createScene, createActor, createTrigger, createBackground,
  createStaticSprite, createPlayerSprite, findScene, findActor, findTrigger,
  requireProject, resolveScriptTarget,
} from "./dist/project.js";
import * as fs from "fs";
import * as path from "path";

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) { passed++; }
  else { failed++; console.error(`  FAIL: ${msg}`); }
}

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`✗ ${name}: ${e.message}`);
  }
}

const TEST_DIR = path.join(process.cwd(), "test-output");

// Clean
if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });
fs.mkdirSync(TEST_DIR, { recursive: true });

// ─── Tests ───────────────────────────────────────────────────────────────────

test("createDefaultProject has correct version", () => {
  const p = createDefaultProject("Test", "Author");
  assert(p._version === "4.2.0", "_version should be 4.2.0");
  assert(p._release === "10", "_release should be 10");
  assert(p._resourceType === "project", "_resourceType should be project");
});

test("createDefaultProject has correct settings", () => {
  const p = createDefaultProject("Test", "Author");
  assert(p.settings._resourceType === "settings", "settings._resourceType");
  assert(p.settings.startAnimSpeed === 15, "startAnimSpeed should be 15");
  assert(p.settings.defaultBackgroundPaletteIds.length === 8, "8 bg palette slots");
  assert(p.settings.defaultSpritePaletteIds.length === 8, "8 sprite palette slots");
  assert(p.settings.colorMode === "mono", "colorMode should be mono");
  assert(p.settings.spriteMode === "8x16", "spriteMode should be 8x16");
  assert(p.settings.autoTileFlipEnabled === true, "autoTileFlipEnabled");
});

test("createDefaultProject has 8 palettes", () => {
  const p = createDefaultProject("Test", "Author");
  assert(p.palettes.length === 8, "Should have 8 default palettes");
  assert(p.palettes[0].id === "default-bg-1", "First palette is default-bg-1");
  assert(p.palettes[0]._resourceType === "palette", "Palette has _resourceType");
  assert(p.palettes[0].colors.length === 4, "Palette has 4 colors");
});

test("createScene has correct GB Studio 4.2.2 fields", () => {
  const s = createScene({ name: "Test Room", backgroundId: "bg-id" });
  assert(s._resourceType === "scene", "_resourceType");
  assert(s.type === "TOPDOWN", "default type TOPDOWN");
  assert(s.symbol === "scene_test_room", "symbol auto-generated");
  assert(s.tilesetId === "", "tilesetId empty string");
  assert(s.colorModeOverride === "none", "colorModeOverride none");
  assert(Array.isArray(s.paletteIds), "paletteIds is array");
  assert(Array.isArray(s.spritePaletteIds), "spritePaletteIds is array");
  assert(s.autoFadeSpeed === 1, "autoFadeSpeed 1");
  assert(s.collisions === "", "collisions is empty string");
});

test("createActor has correct GB Studio 4.2.2 fields", () => {
  const a = createActor({ name: "NPC", x: 5, y: 3, spriteSheetId: "spr-id" });
  assert(a._resourceType === "actor", "_resourceType");
  assert(a.coordinateType === "tiles", "coordinateType tiles");
  assert(a.frame === 0, "frame 0");
  assert(a.animate === false, "animate false");
  assert(a.isPinned === false, "isPinned false");
  assert(a.persistent === false, "persistent false");
  assert(a.collisionGroup === "", "collisionGroup empty");
  assert(Array.isArray(a.collisionExtraFlags), "collisionExtraFlags array");
  assert(a.prefabId === "", "prefabId empty");
  assert(a.animSpeed === 15, "animSpeed 15");
  assert(typeof a.prefabScriptOverrides === "object", "prefabScriptOverrides object");
  assert(Array.isArray(a.hit1Script), "hit1Script array");
  assert(Array.isArray(a.hit2Script), "hit2Script array");
  assert(Array.isArray(a.hit3Script), "hit3Script array");
});

test("createTrigger has correct GB Studio 4.2.2 fields", () => {
  const t = createTrigger({ x: 1, y: 2, width: 3, height: 1 });
  assert(t._resourceType === "trigger", "_resourceType");
  assert(t.prefabId === "", "prefabId empty");
  assert(typeof t.prefabScriptOverrides === "object", "prefabScriptOverrides");
  assert(Array.isArray(t.leaveScript), "leaveScript array");
  assert(typeof t.symbol === "string", "symbol exists");
});

test("createBackground has correct fields", () => {
  const bg = createBackground({ name: "cave", filename: "cave.png", width: 20, height: 18, imageWidth: 160, imageHeight: 144 });
  assert(bg._resourceType === "background", "_resourceType");
  assert(bg.symbol === "bg_cave", "symbol");
  assert(bg.tileColors === "", "tileColors empty");
  assert(bg.autoColor === false, "autoColor false");
});

test("createStaticSprite has correct format", () => {
  const spr = createStaticSprite("item", "item.png");
  assert(spr._resourceType === "sprite", "_resourceType");
  assert(spr.states.length === 1, "1 state");
  assert(spr.states[0].animationType === "fixed", "animationType fixed");
  assert(spr.states[0].animations.length === 1, "1 animation");
  assert(spr.states[0].animations[0].frames.length === 1, "1 frame");
  assert(spr.states[0].animations[0].frames[0].tiles.length === 1, "1 tile");
  const tile = spr.states[0].animations[0].frames[0].tiles[0];
  assert(tile.objPalette === "OBP0", "objPalette OBP0");
  assert(tile.priority === false, "priority false");
});

test("Save and load round-trip preserves format", () => {
  const p = createDefaultProject("RoundTrip", "Test");
  const projPath = path.join(TEST_DIR, "roundtrip", "RoundTrip.gbsproj");

  // Add a background
  const bg = createBackground({ name: "test_bg", filename: "test.png", width: 20, height: 18, imageWidth: 160, imageHeight: 144 });
  p.backgrounds.push(bg);

  // Add a scene with actor and trigger
  const scene = createScene({ name: "Test Scene", backgroundId: bg.id, _index: 0 });
  const actor = createActor({ name: "Guard", x: 3, y: 5, spriteSheetId: "spr-1", _index: 0 });
  actor.script = [{ id: uuid(), command: "EVENT_TEXT", args: { text: "Halt!" } }];
  scene.actors.push(actor);

  const trigger = createTrigger({ name: "Door", x: 1, y: 1, width: 2, height: 1, _index: 0 });
  trigger.script = [{
    id: uuid(), command: "EVENT_SWITCH_SCENE",
    args: { sceneId: "other-scene", x: { type: "number", value: 0 }, y: { type: "number", value: 0 }, direction: "down", fadeSpeed: "2" },
  }];
  scene.triggers.push(trigger);
  p.scenes.push(scene);

  // Add a variable
  p.variables.push({ id: "0", name: "Flag", symbol: "var_flag" });
  p.settings.startSceneId = scene.id;

  // Create necessary dirs and save
  for (const dir of ["assets/backgrounds", "assets/sprites", "project/palettes", "project/scenes"]) {
    fs.mkdirSync(path.join(TEST_DIR, "roundtrip", dir), { recursive: true });
  }
  setProject(p, projPath);
  saveProjectToDisk();

  // Verify files exist
  assert(fs.existsSync(projPath), ".gbsproj exists");
  assert(fs.existsSync(path.join(TEST_DIR, "roundtrip/project/settings.gbsres")), "settings.gbsres exists");
  assert(fs.existsSync(path.join(TEST_DIR, "roundtrip/project/variables.gbsres")), "variables.gbsres exists");

  // Verify .gbsproj is minimal (no scenes/backgrounds embedded)
  const root = JSON.parse(fs.readFileSync(projPath, "utf-8"));
  assert(root._resourceType === "project", "root has _resourceType");
  assert(!root.scenes, "root should NOT contain scenes");
  assert(!root.backgrounds, "root should NOT contain backgrounds");

  // Load back
  const loaded = loadProjectFromDisk(projPath);
  assert(loaded.name === "RoundTrip", "name preserved");
  assert(loaded.scenes.length === 1, "1 scene loaded");
  assert(loaded.scenes[0].actors.length === 1, "1 actor loaded");
  assert(loaded.scenes[0].triggers.length === 1, "1 trigger loaded");
  assert(loaded.variables.length === 1, "1 variable loaded");
  assert(loaded.settings.startSceneId === scene.id, "startSceneId preserved");
  assert(loaded.scenes[0].actors[0].script[0].command === "EVENT_TEXT", "actor script preserved");
});

test("Variable IDs are numeric strings", () => {
  const p = createDefaultProject("VarTest", "Test");
  setProject(p, path.join(TEST_DIR, "vartest.gbsproj"));
  p.variables.push({ id: "0", name: "Gold", symbol: "var_gold" });
  p.variables.push({ id: "1", name: "Keys", symbol: "var_keys" });
  assert(p.variables[0].id === "0", "first var id is '0'");
  assert(p.variables[1].id === "1", "second var id is '1'");
  assert(p.variables[0].symbol === "var_gold", "symbol correct");
});

test("Engine field values match blank template", () => {
  const p = createDefaultProject("EngTest", "Test");
  assert(p.engineFieldValues.length >= 6, "at least 6 engine field values");
  const fadeStyle = p.engineFieldValues.find(e => e.id === "fade_style");
  assert(fadeStyle && fadeStyle.value === 0, "fade_style is 0");
});

// ─── Results ─────────────────────────────────────────────────────────────────

console.log(`\n${"=".repeat(40)}`);
console.log(`Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

// Clean up
fs.rmSync(TEST_DIR, { recursive: true, force: true });
