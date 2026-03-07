/**
 * Dungeon of Shadows — Build backgrounds + assemble GB Studio project via MCP
 */
import { Jimp } from 'jimp';
import { spawn } from 'child_process';
import { existsSync, mkdirSync, copyFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ITEMS = 'C:/Users/mcdoo/Downloads/0x72_16x16DungeonTileset.v5/0x72_16x16DungeonTileset.v5/items';
const PROJECT_DIR = 'C:/Users/mcdoo/.openclaw/workspace/projects/DungeonOfShadows';
const BG_DIR = join(PROJECT_DIR, 'assets', 'backgrounds');
const SPRITE_DIR = join(PROJECT_DIR, 'assets', 'sprites');
const SERVER = join(__dirname, 'dist', 'index.js');

// Ensure directories
for (const d of [BG_DIR, SPRITE_DIR,
  join(PROJECT_DIR, 'assets', 'music'),
  join(PROJECT_DIR, 'assets', 'sounds'),
  join(PROJECT_DIR, 'assets', 'fonts'),
  join(PROJECT_DIR, 'assets', 'palettes')]) {
  mkdirSync(d, { recursive: true });
}

// ── STEP 1: Build background images ──────────────────────────────────────
async function loadTile(name) {
  return Jimp.read(join(ITEMS, name));
}

async function buildBackgrounds() {
  console.log('🎨 Building background images...');
  const floor = await loadTile('floor_plain.png');
  const stain1 = await loadTile('floor_stain_1.png');
  const stain2 = await loadTile('floor_stain_2.png');
  const wallN = await loadTile('Wall_outer_n.png');
  const wallS = await loadTile('Wall_front.png');
  const wallE = await loadTile('Wall_outer_e.png');
  const wallW = await loadTile('Wall_outer_w.png');
  const wallNE = await loadTile('Wall_outer_ne.png');
  const wallNW = await loadTile('Wall_outer_nw.png');
  const wallSE = await loadTile('Wall_front_right.png');
  const wallSW = await loadTile('Wall_front_left.png');
  const ladder = await loadTile('Floor_ladder.png');
  const gargoyle1 = await loadTile('wall_gargoyle_red_1.png');
  const gargoyle2 = await loadTile('wall_gargoyle_red_2.png');
  const torch = await loadTile('torch_1.png');
  const column = await loadTile('column.png');

  function tileFloor(img, w, h) {
    for (let y = 0; y < h; y += 16)
      for (let x = 0; x < w; x += 16)
        img.composite(floor, x, y);
  }

  function addWalls(img, w, h) {
    // Top wall
    for (let x = 16; x < w - 16; x += 16) img.composite(wallN, x, 0);
    // Bottom wall
    for (let x = 16; x < w - 16; x += 16) img.composite(wallS, x, h - 16);
    // Left wall
    for (let y = 16; y < h - 16; y += 16) img.composite(wallW, 0, y);
    // Right wall
    for (let y = 16; y < h - 16; y += 16) img.composite(wallE, w - 16, y);
    // Corners
    img.composite(wallNW, 0, 0);
    img.composite(wallNE, w - 16, 0);
    img.composite(wallSW, 0, h - 16);
    img.composite(wallSE, w - 16, h - 16);
  }

  // Entrance Hall 160×144
  const entrance = new Jimp({ width: 160, height: 144, color: 0x2a2a2aFF });
  tileFloor(entrance, 160, 144);
  addWalls(entrance, 160, 144);
  // Add torches on walls
  entrance.composite(torch, 32, 16);
  entrance.composite(torch, 112, 16);
  // Add ladder (staircase) at bottom center
  entrance.composite(ladder, 72, 112);
  await entrance.write(join(BG_DIR, 'entrance_hall.png'));
  console.log('  ✅ entrance_hall.png');

  // Dungeon Room 160×144
  const dungeon = new Jimp({ width: 160, height: 144, color: 0x1a1a1aFF });
  tileFloor(dungeon, 160, 144);
  // Add stains for atmosphere
  dungeon.composite(stain1, 48, 48);
  dungeon.composite(stain2, 96, 64);
  dungeon.composite(stain1, 64, 96);
  addWalls(dungeon, 160, 144);
  // Add columns
  dungeon.composite(column, 48, 32);
  dungeon.composite(column, 96, 32);
  await dungeon.write(join(BG_DIR, 'dungeon_room.png'));
  console.log('  ✅ dungeon_room.png');

  // Boss Chamber 128×112
  const boss = new Jimp({ width: 128, height: 112, color: 0x1a0000FF });
  tileFloor(boss, 128, 112);
  addWalls(boss, 128, 112);
  // Gargoyles on top wall
  boss.composite(gargoyle1, 32, 0);
  boss.composite(gargoyle2, 48, 0);
  boss.composite(gargoyle1, 64, 0);
  boss.composite(gargoyle2, 80, 0);
  // Torches
  boss.composite(torch, 16, 16);
  boss.composite(torch, 96, 16);
  await boss.write(join(BG_DIR, 'boss_chamber.png'));
  console.log('  ✅ boss_chamber.png');
}

// ── STEP 2: Copy sprites ────────────────────────────────────────────────
function copySprites() {
  console.log('🧙 Copying sprites...');
  const sprites = [
    'hero_basic.png', 'npc_merchant.png', 'monster_bat.png',
    'monster_dark_knight.png', 'chest_closed.png'
  ];
  for (const s of sprites) {
    copyFileSync(join(ITEMS, s), join(SPRITE_DIR, s));
    console.log('  ✅ ' + s);
  }
}

// ── STEP 3: Build game via MCP ──────────────────────────────────────────
let msgId = 0, pending = {}, serverProcess, buffer = '';

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
    pending[id] = { resolve, reject };
    serverProcess.stdin.write(msg);
    setTimeout(() => { if (pending[id]) { delete pending[id]; reject(new Error('Timeout: ' + method)); } }, 10000);
  });
}

function callTool(name, args = {}) { return send('tools/call', { name, arguments: args }); }

function txt(resp) {
  if (resp?.error) throw new Error('RPC error: ' + JSON.stringify(resp.error));
  return resp?.result?.content?.[0]?.text || '';
}

function extractId(text) {
  const m = String(text).match(/\(([0-9a-f-]{36})\)/i);
  return m ? m[1] : null;
}

async function buildGame() {
  console.log('\n🎮 Building game via MCP server...');

  serverProcess = spawn('node', [SERVER], { stdio: ['pipe', 'pipe', 'pipe'] });
  serverProcess.stderr.on('data', d => {}); // suppress
  serverProcess.stdout.on('data', chunk => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.id && pending[msg.id]) { pending[msg.id].resolve(msg); delete pending[msg.id]; }
      } catch (_) {}
    }
  });

  await send('initialize', {
    protocolVersion: '2024-11-05', capabilities: {},
    clientInfo: { name: 'builder', version: '1.0' }
  });

  // Create project
  let r = txt(await callTool('create_project', { name: 'DungeonOfShadows', author: 'Grant & Hal', path: PROJECT_DIR }));
  console.log('  📁 ' + r.split('\n')[0]);

  // Variables
  const varR1 = txt(await callTool('add_variable', { name: 'hasKey' }));
  const hasKeyVarId = extractId(varR1);
  console.log('  📊 hasKey: ' + hasKeyVarId);
  const varR2 = txt(await callTool('add_variable', { name: 'bossDefeated' }));
  const bossDefeatedVarId = extractId(varR2);
  console.log('  📊 bossDefeated: ' + bossDefeatedVarId);

  // Scenes
  let r1 = txt(await callTool('add_scene', { name: 'Entrance Hall', width: 20, height: 18 }));
  const entranceId = extractId(r1);
  console.log('  🗺  Entrance Hall: ' + entranceId);

  let r2 = txt(await callTool('add_scene', { name: 'Dungeon Room', width: 20, height: 18 }));
  const dungeonId = extractId(r2);
  console.log('  🗺  Dungeon Room: ' + dungeonId);

  let r3 = txt(await callTool('add_scene', { name: 'Boss Chamber', width: 16, height: 14 }));
  const bossRoomId = extractId(r3);
  console.log('  🗺  Boss Chamber: ' + bossRoomId);

  // Actors
  let a1 = txt(await callTool('add_actor', { sceneId: entranceId, name: 'Merchant', x: 5, y: 4, direction: 'down' }));
  const merchantId = extractId(a1);
  console.log('  🧙 Merchant: ' + merchantId);

  let a2 = txt(await callTool('add_actor', { sceneId: dungeonId, name: 'Bat', x: 8, y: 5, direction: 'down' }));
  const batId = extractId(a2);
  console.log('  🦇 Bat: ' + batId);

  let a3 = txt(await callTool('add_actor', { sceneId: bossRoomId, name: 'Dark Knight', x: 7, y: 3, direction: 'down' }));
  const knightId = extractId(a3);
  console.log('  ⚔  Dark Knight: ' + knightId);

  let a4 = txt(await callTool('add_actor', { sceneId: dungeonId, name: 'Chest', x: 12, y: 8, direction: 'down' }));
  const chestActorId = extractId(a4);
  console.log('  📦 Chest actor: ' + chestActorId);

  // Triggers
  // 1. Staircase in Entrance → Dungeon
  let t1 = txt(await callTool('add_trigger', { sceneId: entranceId, name: 'Staircase Down', x: 9, y: 14, width: 2, height: 1 }));
  const staircaseTriggerId = extractId(t1);
  console.log('  🚪 Staircase trigger: ' + staircaseTriggerId);

  // 2. Chest trigger in Dungeon
  let t2 = txt(await callTool('add_trigger', { sceneId: dungeonId, name: 'Chest Pickup', x: 12, y: 9, width: 1, height: 1 }));
  const chestTriggerId = extractId(t2);
  console.log('  🚪 Chest trigger: ' + chestTriggerId);

  // 3. Locked door in Dungeon → Boss Chamber
  let t3 = txt(await callTool('add_trigger', { sceneId: dungeonId, name: 'Locked Door', x: 17, y: 8, width: 1, height: 2 }));
  const doorTriggerId = extractId(t3);
  console.log('  🚪 Door trigger: ' + doorTriggerId);

  // 4. Victory altar in Boss Chamber
  let t4 = txt(await callTool('add_trigger', { sceneId: bossRoomId, name: 'Victory Altar', x: 7, y: 6, width: 2, height: 1 }));
  const altarTriggerId = extractId(t4);
  console.log('  🚪 Altar trigger: ' + altarTriggerId);

  // Scripts
  console.log('\n📜 Adding scripts...');

  // Merchant dialogue
  txt(await callTool('add_script_event', {
    target: 'actor', targetId: merchantId, sceneId: entranceId,
    scriptType: 'script', command: 'EVENT_DIALOGUE',
    args: { text: "Buy a torch for the dungeon?\nYou'll need it." }
  }));
  console.log('  ✅ Merchant dialogue');

  // Bat dialogue
  txt(await callTool('add_script_event', {
    target: 'actor', targetId: batId, sceneId: dungeonId,
    scriptType: 'script', command: 'EVENT_DIALOGUE',
    args: { text: '...' }
  }));
  console.log('  ✅ Bat dialogue');

  // Staircase → scene switch to Dungeon
  txt(await callTool('add_script_event', {
    target: 'trigger', targetId: staircaseTriggerId, sceneId: entranceId,
    scriptType: 'script', command: 'EVENT_DIALOGUE',
    args: { text: 'You descend into the darkness...' }
  }));
  txt(await callTool('add_script_event', {
    target: 'trigger', targetId: staircaseTriggerId, sceneId: entranceId,
    scriptType: 'script', command: 'EVENT_SCENE_SWITCH',
    args: { sceneId: dungeonId, x: 5, y: 2, direction: 'down', fadeSpeed: 2 }
  }));
  console.log('  ✅ Staircase scene switch');

  // Chest → set hasKey, dialogue
  txt(await callTool('add_script_event', {
    target: 'trigger', targetId: chestTriggerId, sceneId: dungeonId,
    scriptType: 'script', command: 'EVENT_VARIABLE_SET',
    args: { variable: hasKeyVarId, value: 1 }
  }));
  txt(await callTool('add_script_event', {
    target: 'trigger', targetId: chestTriggerId, sceneId: dungeonId,
    scriptType: 'script', command: 'EVENT_DIALOGUE',
    args: { text: 'You found a rusty key!' }
  }));
  console.log('  ✅ Chest pickup script');

  // Locked door → conditional scene switch
  txt(await callTool('add_script_event', {
    target: 'trigger', targetId: doorTriggerId, sceneId: dungeonId,
    scriptType: 'script', command: 'EVENT_IF_VARIABLE_VALUE',
    args: { variable: hasKeyVarId, comparator: '==', value: 1 }
  }));
  txt(await callTool('add_script_event', {
    target: 'trigger', targetId: doorTriggerId, sceneId: dungeonId,
    scriptType: 'script', command: 'EVENT_SCENE_SWITCH',
    args: { sceneId: bossRoomId, x: 4, y: 10, direction: 'up', fadeSpeed: 2 }
  }));
  txt(await callTool('add_script_event', {
    target: 'trigger', targetId: doorTriggerId, sceneId: dungeonId,
    scriptType: 'script', command: 'EVENT_DIALOGUE',
    args: { text: 'The door is locked.\nYou need a key.' }
  }));
  console.log('  ✅ Locked door conditional');

  // Dark Knight dialogue
  txt(await callTool('add_script_event', {
    target: 'actor', targetId: knightId, sceneId: bossRoomId,
    scriptType: 'script', command: 'EVENT_DIALOGUE',
    args: { text: 'You dare enter my chamber?!' }
  }));
  txt(await callTool('add_script_event', {
    target: 'actor', targetId: knightId, sceneId: bossRoomId,
    scriptType: 'script', command: 'EVENT_DIALOGUE',
    args: { text: 'You will not leave here alive!' }
  }));
  console.log('  ✅ Dark Knight dialogue');

  // Victory altar → set bossDefeated, dialogue
  txt(await callTool('add_script_event', {
    target: 'trigger', targetId: altarTriggerId, sceneId: bossRoomId,
    scriptType: 'script', command: 'EVENT_VARIABLE_SET',
    args: { variable: bossDefeatedVarId, value: 1 }
  }));
  txt(await callTool('add_script_event', {
    target: 'trigger', targetId: altarTriggerId, sceneId: bossRoomId,
    scriptType: 'script', command: 'EVENT_DIALOGUE',
    args: { text: 'Victory! The dungeon is cleared!' }
  }));
  console.log('  ✅ Victory altar script');

  // Save
  r = txt(await callTool('save_project'));
  console.log('\n💾 ' + r);

  serverProcess.kill();
}

// ── Main ────────────────────────────────────────────────────────────────
async function main() {
  await buildBackgrounds();
  copySprites();
  await buildGame();

  // Verify
  const projFile = join(PROJECT_DIR, 'DungeonOfShadows.gbsproj');
  if (existsSync(projFile)) {
    const proj = JSON.parse(readFileSync(projFile, 'utf-8'));
    console.log('\n✅ PROJECT COMPLETE!');
    console.log('  📄 ' + projFile);
    console.log('  🗺  Scenes: ' + proj.scenes.length);
    console.log('  📊 Variables: ' + proj.variables.length);
    const totalActors = proj.scenes.reduce((n, s) => n + (s.actors?.length || 0), 0);
    const totalTriggers = proj.scenes.reduce((n, s) => n + (s.triggers?.length || 0), 0);
    const totalScripts = proj.scenes.reduce((n, s) => {
      let c = 0;
      for (const a of (s.actors || [])) c += (a.script?.length || 0);
      for (const t of (s.triggers || [])) c += (t.script?.length || 0);
      c += (s.script?.length || 0);
      return n + c;
    }, 0);
    console.log('  🧙 Actors: ' + totalActors);
    console.log('  🚪 Triggers: ' + totalTriggers);
    console.log('  📜 Script events: ' + totalScripts);
  } else {
    console.log('❌ Project file not found!');
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
