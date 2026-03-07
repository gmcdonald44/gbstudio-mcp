/**
 * Direct tool handler test for gbstudio-mcp — tests MCP tool interface.
 */
import { projectTools } from "./dist/tools/project.js";
import { sceneTools } from "./dist/tools/scenes.js";
import { actorTools } from "./dist/tools/actors.js";
import { triggerTools } from "./dist/tools/triggers.js";
import { scriptTools } from "./dist/tools/scripts.js";
import { variableTools } from "./dist/tools/variables.js";
import * as fs from "fs";
import * as path from "path";

const TEST_DIR = path.join(process.cwd(), "test-direct-output");
if (fs.existsSync(TEST_DIR)) fs.rmSync(TEST_DIR, { recursive: true, force: true });

let passed = 0, failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`✗ ${name}: ${e.message}`);
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }
function getText(result) { return result.content[0].text; }

// ─── Tests ───────────────────────────────────────────────────────────────────

await test("create_project creates split-resource format", async () => {
  const r = await projectTools.create_project.handler({
    name: "TestProject", author: "Tester", path: TEST_DIR,
  });
  const text = getText(r);
  assert(text.includes("Project created"), "should say created");
  assert(text.includes("4.2.2"), "should mention format" + text); // Actually mentions "split-resource"
  assert(fs.existsSync(path.join(TEST_DIR, "TestProject.gbsproj")), ".gbsproj exists");
  assert(fs.existsSync(path.join(TEST_DIR, "project/settings.gbsres")), "settings.gbsres exists");
});

await test("add_background registers background", async () => {
  const r = await projectTools.add_background.handler({
    name: "dungeon", filename: "dungeon.png", width: 20, height: 18, imageWidth: 160, imageHeight: 144,
  });
  assert(getText(r).includes("Background added"), "should confirm add");
});

await test("add_sprite registers sprite", async () => {
  const r = await projectTools.add_sprite.handler({
    name: "hero", filename: "hero.png", type: "static",
  });
  assert(getText(r).includes("Sprite added"), "should confirm add");
});

let sceneId, bgId, spriteId;

await test("add_scene creates scene with correct format", async () => {
  // Get bg id from project
  const { requireProject } = await import("./dist/project.js");
  const p = requireProject();
  bgId = p.backgrounds[0].id;
  spriteId = p.spriteSheets[0].id;

  const r = await sceneTools.add_scene.handler({
    name: "Test Room", backgroundId: bgId,
  });
  const text = getText(r);
  assert(text.includes("Scene added"), "should confirm add");
  sceneId = text.match(/\(([a-f0-9-]+)\)/)?.[1];
  assert(sceneId, "should return scene ID");
});

let actorId;

await test("add_actor creates actor with 4.2.2 fields", async () => {
  const r = await actorTools.add_actor.handler({
    sceneId, name: "Guard", x: 5, y: 3, spriteSheetId: spriteId,
  });
  actorId = getText(r).match(/\(([a-f0-9-]+)\)/)?.[1];
  assert(actorId, "should return actor ID");

  const r2 = await actorTools.get_actor.handler({ sceneId, actorId });
  const actor = JSON.parse(getText(r2));
  assert(actor._resourceType === "actor", "_resourceType");
  assert(actor.coordinateType === "tiles", "coordinateType");
  assert(actor.prefabId === "", "prefabId");
  assert(actor.animSpeed === 15, "animSpeed");
});

let triggerId;

await test("add_trigger creates trigger with 4.2.2 fields", async () => {
  const r = await triggerTools.add_trigger.handler({
    sceneId, name: "Door", x: 1, y: 1, width: 2, height: 1,
  });
  triggerId = getText(r).match(/\(([a-f0-9-]+)\)/)?.[1];
  assert(triggerId, "should return trigger ID");
});

await test("add_script_event adds EVENT_TEXT", async () => {
  const r = await scriptTools.add_script_event.handler({
    target: "actor", targetId: actorId, sceneId,
    scriptType: "script",
    command: "EVENT_TEXT",
    args: { text: "Halt! Who goes there?" },
  });
  assert(getText(r).includes("EVENT_TEXT"), "should confirm event");
});

await test("add_script_event adds EVENT_IF with children", async () => {
  const r = await scriptTools.add_script_event.handler({
    target: "actor", targetId: actorId, sceneId,
    scriptType: "script",
    command: "EVENT_IF",
    args: {
      condition: {
        type: "eq",
        valueA: { type: "variable", value: "0" },
        valueB: { type: "number", value: 1 },
      },
    },
    children: {
      true: [{ command: "EVENT_TEXT", args: { text: "You may pass." } }],
      false: [{ command: "EVENT_TEXT", args: { text: "Go away!" } }],
    },
  });
  assert(getText(r).includes("EVENT_IF"), "should confirm event");

  // Verify the event has __type
  const script = await scriptTools.get_script.handler({
    target: "actor", targetId: actorId, sceneId, scriptType: "script",
  });
  const events = JSON.parse(getText(script));
  const ifEvent = events.find(e => e.command === "EVENT_IF");
  assert(ifEvent.__type === "event", "EVENT_IF should have __type: event");
  assert(ifEvent.children.true.length === 1, "true branch has 1 event");
  assert(ifEvent.children.false.length === 1, "false branch has 1 event");
});

await test("add_variable uses numeric string IDs", async () => {
  const r = await variableTools.add_variable.handler({ name: "Has Key" });
  assert(getText(r).includes("id: 0"), "first var should be id 0");

  const r2 = await variableTools.add_variable.handler({ name: "Gold Count" });
  assert(getText(r2).includes("id: 1"), "second var should be id 1");
});

await test("save_project writes split-resource files", async () => {
  const r = await projectTools.save_project.handler({});
  assert(getText(r).includes("saved"), "should confirm save");

  // Verify scene file
  const sceneFiles = [];
  const walkDir = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      if (f.isDirectory()) walkDir(path.join(dir, f.name));
      else if (f.name === "scene.gbsres") sceneFiles.push(path.join(dir, f.name));
    }
  };
  walkDir(path.join(TEST_DIR, "project/scenes"));
  assert(sceneFiles.length === 1, "1 scene.gbsres file");

  const sceneData = JSON.parse(fs.readFileSync(sceneFiles[0], "utf-8"));
  assert(sceneData._resourceType === "scene", "scene _resourceType");
  assert(!sceneData.actors, "scene file should NOT contain actors (separate files)");
});

// ─── Results ─────────────────────────────────────────────────────────────────

console.log(`\n${"=".repeat(40)}`);
console.log(`Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

fs.rmSync(TEST_DIR, { recursive: true, force: true });
