/**
 * Direct handler test — bypasses MCP protocol, tests core logic
 */
import { createRequire } from 'module';
import { readFileSync, existsSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Import compiled JS directly
const { projectTools } = await import('./dist/tools/project.js');
const { sceneTools }   = await import('./dist/tools/scenes.js');
const { actorTools }   = await import('./dist/tools/actors.js');
const { triggerTools } = await import('./dist/tools/triggers.js');
const { scriptTools }  = await import('./dist/tools/scripts.js');
const { variableTools } = await import('./dist/tools/variables.js');

const OUTPUT_DIR = join(__dirname, 'test-output');
const OUTPUT_FILE = join(OUTPUT_DIR, 'TestGame.gbsproj');

// Clean up old test output
if (existsSync(OUTPUT_FILE)) rmSync(OUTPUT_FILE);

let pass = 0, fail = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ ${name}`);
    pass++;
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message}`);
    fail++;
  }
}

function txt(resp) {
  return resp?.content?.[0]?.text || '';
}

console.log('🎮 GB Studio MCP — Direct Handler Test\n');

// ── PROJECT ────────────────────────────────────────────────────────────────
console.log('📁 Project');

await test('create_project', async () => {
  const r = await projectTools.create_project.handler({ name: 'TestGame', author: 'Hal', path: OUTPUT_DIR });
  const t = txt(r);
  if (!t.includes('TestGame')) throw new Error(`Got: ${t}`);
});

await test('get_project_info', async () => {
  const r = await projectTools.get_project_info.handler({});
  const t = txt(r);
  if (!t.includes('TestGame')) throw new Error(`Got: ${t}`);
});

// ── VARIABLES ──────────────────────────────────────────────────────────────
console.log('\n📊 Variables');
let varId;

await test('add_variable', async () => {
  const r = await variableTools.add_variable.handler({ name: 'hasSword' });
  const t = txt(r);
  if (!t.includes('hasSword')) throw new Error(`Got: ${t}`);
  const m = t.match(/\(([^)]+)\)/);
  varId = m?.[1];
});

await test('list_variables', async () => {
  const r = await variableTools.list_variables.handler({});
  const t = txt(r);
  if (!t.includes('hasSword')) throw new Error(`Got: ${t}`);
});

// ── SCENES ────────────────────────────────────────────────────────────────
console.log('\n🗺  Scenes');
let townId, dungeonId;

await test('add_scene (Town)', async () => {
  const r = await sceneTools.add_scene.handler({ name: 'Town Square', width: 20, height: 18 });
  const t = txt(r);
  if (!t.includes('Town Square')) throw new Error(`Got: ${t}`);
  const m = t.match(/\(([^)]+)\)/);
  townId = m?.[1];
});

await test('add_scene (Dungeon)', async () => {
  const r = await sceneTools.add_scene.handler({ name: 'Dungeon Entrance', width: 16, height: 14 });
  const t = txt(r);
  if (!t.includes('Dungeon')) throw new Error(`Got: ${t}`);
  const m = t.match(/\(([^)]+)\)/);
  dungeonId = m?.[1];
});

await test('list_scenes', async () => {
  const r = await sceneTools.list_scenes.handler({});
  const t = txt(r);
  if (!t.includes('Town Square')) throw new Error(`Got: ${t}`);
});

await test('get_scene', async () => {
  const r = await sceneTools.get_scene.handler({ sceneId: townId });
  const t = txt(r);
  if (!t.includes('Town')) throw new Error(`Got: ${t.slice(0,100)}`);
});

// ── ACTORS ────────────────────────────────────────────────────────────────
console.log('\n🧙 Actors');
let shopkeeperId;

await test('add_actor', async () => {
  const r = await actorTools.add_actor.handler({ sceneId: townId, name: 'Shopkeeper', x: 5, y: 8, direction: 'down' });
  const t = txt(r);
  if (!t.includes('Shopkeeper')) throw new Error(`Got: ${t}`);
  const m = t.match(/\(([^)]+)\)/);
  shopkeeperId = m?.[1];
});

await test('list_actors', async () => {
  const r = await actorTools.list_actors.handler({ sceneId: townId });
  const t = txt(r);
  if (!t.includes('Shopkeeper')) throw new Error(`Got: ${t}`);
});

await test('update_actor', async () => {
  const r = await actorTools.update_actor.handler({ sceneId: townId, actorId: shopkeeperId, updates: { x: 6 } });
  if (!txt(r)) throw new Error('No response');
});

// ── TRIGGERS ──────────────────────────────────────────────────────────────
console.log('\n🚪 Triggers');
let triggerId;

await test('add_trigger', async () => {
  const r = await triggerTools.add_trigger.handler({ sceneId: townId, name: 'Dungeon Door', x: 10, y: 15, width: 2, height: 1 });
  const t = txt(r);
  if (!t.includes('Dungeon Door')) throw new Error(`Got: ${t}`);
  const m = t.match(/\(([^)]+)\)/);
  triggerId = m?.[1];
});

// ── SCRIPTS ───────────────────────────────────────────────────────────────
console.log('\n📜 Scripts');

await test('add dialogue to shopkeeper', async () => {
  const r = await scriptTools.add_script_event.handler({
    target: 'actor', targetId: shopkeeperId, sceneId: townId,
    scriptType: 'script', command: 'EVENT_DIALOGUE',
    args: { text: 'Welcome traveler! Buy a sword for 10 gold?' }
  });
  if (!txt(r)) throw new Error('No response');
});

await test('add scene switch to trigger', async () => {
  const r = await scriptTools.add_script_event.handler({
    target: 'trigger', targetId: triggerId, sceneId: townId,
    scriptType: 'script', command: 'EVENT_SCENE_SWITCH',
    args: { sceneId: dungeonId, x: 1, y: 1, direction: 'down', fadeSpeed: 2 }
  });
  if (!txt(r)) throw new Error('No response');
});

await test('get_script', async () => {
  const r = await scriptTools.get_script.handler({ target: 'actor', targetId: shopkeeperId, sceneId: townId, scriptType: 'script' });
  const t = txt(r);
  if (!t.includes('DIALOGUE') && !t.includes('sword')) throw new Error(`Got: ${t.slice(0,100)}`);
});

// ── SAVE & VALIDATE ────────────────────────────────────────────────────────
console.log('\n💾 Save & Validate');

await test('save_project', async () => {
  const r = await projectTools.save_project.handler({});
  const t = txt(r);
  if (!t.toLowerCase().includes('saved') && !t.toLowerCase().includes('project')) throw new Error(`Got: ${t}`);
});

await test('file exists on disk', () => {
  if (!existsSync(OUTPUT_FILE)) throw new Error(`Not found: ${OUTPUT_FILE}`);
});

await test('valid JSON', () => {
  JSON.parse(readFileSync(OUTPUT_FILE, 'utf-8'));
});

await test('correct GB Studio schema', () => {
  const proj = JSON.parse(readFileSync(OUTPUT_FILE, 'utf-8'));
  ['name','scenes','variables','settings','backgrounds','spriteSheets'].forEach(k => {
    if (!(k in proj)) throw new Error(`Missing key: ${k}`);
  });
  if (proj.name !== 'TestGame') throw new Error(`Wrong name: ${proj.name}`);
  if (proj.scenes.length < 2) throw new Error(`Expected 2+ scenes, got ${proj.scenes.length}`);
  const town = proj.scenes.find(s => s.name?.includes('Town'));
  if (!town) throw new Error('Town scene missing');
  if (!town.actors?.length) throw new Error('No actors in Town');
  const shopkeeper = town.actors.find(a => a.name === 'Shopkeeper');
  if (!shopkeeper) throw new Error('Shopkeeper missing');
  const dialogue = shopkeeper.script?.find(e => e.command === 'EVENT_DIALOGUE');
  if (!dialogue) throw new Error('No dialogue on shopkeeper');
  if (!dialogue.args?.text?.includes('sword')) throw new Error('Wrong dialogue text');
  const trig = town.triggers?.find(t => t.name?.includes('Dungeon'));
  if (!trig) throw new Error('Dungeon trigger missing');
  const sw = trig.script?.find(e => e.command === 'EVENT_SCENE_SWITCH');
  if (!sw) throw new Error('No scene switch on trigger');
  console.log(`    → Scenes: ${proj.scenes.length} | Actors: ${town.actors.length} | Variables: ${proj.variables.length}`);
});

// ── SUMMARY ───────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(50));
console.log(`Results: ${pass} passed, ${fail} failed`);
if (fail === 0) {
  console.log('✅ All core logic tests pass!');
  console.log(`\n📄 Sample .gbsproj: ${OUTPUT_FILE}`);
  console.log('\n⚠️  Note: MCP protocol layer has an argument-passing issue.');
  console.log('   Core handlers work correctly. Fix needed in server.tool() registration.');
} else {
  process.exit(1);
}
