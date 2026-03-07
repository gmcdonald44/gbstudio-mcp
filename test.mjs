/**
 * GB Studio MCP — Full integration test (MCP protocol)
 */
import { spawn } from 'child_process';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SERVER = join(__dirname, 'dist', 'index.js');
const OUTPUT_DIR = join(__dirname, 'test-output');
const OUTPUT_FILE = join(OUTPUT_DIR, 'TestGame.gbsproj');

mkdirSync(OUTPUT_DIR, { recursive: true });

let msgId = 0;
let pending = {};
let serverProcess;
let buffer = '';

function send(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++msgId;
    const msg = JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n';
    pending[id] = { resolve, reject };
    serverProcess.stdin.write(msg);
    setTimeout(() => {
      if (pending[id]) {
        delete pending[id];
        reject(new Error('Timeout waiting for ' + method));
      }
    }, 8000);
  });
}

function callTool(name, args = {}) {
  return send('tools/call', { name, arguments: args });
}

function txt(resp) {
  if (resp && resp.error) throw new Error('RPC error: ' + JSON.stringify(resp.error));
  return resp && resp.result && resp.result.content && resp.result.content[0]
    ? resp.result.content[0].text || ''
    : '';
}

function extractId(text) {
  const m = String(text).match(/\(([0-9a-f-]{36})\)/i);
  return m ? m[1] : null;
}

async function main() {
  console.log('🎮 GB Studio MCP — Integration Test\n');

  serverProcess = spawn('node', [SERVER], { stdio: ['pipe', 'pipe', 'pipe'] });
  serverProcess.stderr.on('data', d => process.stderr.write('[server] ' + d));
  serverProcess.stdout.on('data', chunk => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.id && pending[msg.id]) {
          const { resolve } = pending[msg.id];
          delete pending[msg.id];
          resolve(msg);
        }
      } catch (_) {}
    }
  });

  await send('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test', version: '1.0' }
  });

  let pass = 0, fail = 0, results = [];

  async function test(name, fn) {
    try {
      await fn();
      console.log('  ✅ ' + name);
      pass++;
    } catch (e) {
      console.log('  ❌ ' + name + ': ' + e.message);
      fail++;
      results.push({ name, error: e.message });
    }
  }

  // ── PROJECT ──────────────────────────────────────────────────────────────
  console.log('📁 Project Tools');

  await test('create_project', async () => {
    const r = txt(await callTool('create_project', { name: 'TestGame', author: 'Hal', path: OUTPUT_DIR }));
    if (!r.includes('TestGame')) throw new Error('Got: ' + r.slice(0, 100));
  });

  await test('get_project_info', async () => {
    const r = txt(await callTool('get_project_info'));
    const info = JSON.parse(r);
    if (info.name !== 'TestGame') throw new Error('Wrong name: ' + info.name);
  });

  // ── VARIABLES ────────────────────────────────────────────────────────────
  console.log('\n📊 Variable Tools');
  let varId;

  await test('add_variable', async () => {
    const r = txt(await callTool('add_variable', { name: 'hasSword' }));
    varId = extractId(r);
    if (!r.includes('hasSword')) throw new Error('Got: ' + r);
  });

  await test('list_variables', async () => {
    const r = txt(await callTool('list_variables'));
    const list = JSON.parse(r);
    if (!list.some(v => v.name === 'hasSword')) throw new Error('hasSword not found');
  });

  // ── SCENES ───────────────────────────────────────────────────────────────
  console.log('\n🗺  Scene Tools');
  let townId, dungeonId;

  await test('add_scene (Town)', async () => {
    const r = txt(await callTool('add_scene', { name: 'Town Square', width: 20, height: 18 }));
    townId = extractId(r);
    if (!r.includes('Town Square')) throw new Error('Got: ' + r);
  });

  await test('add_scene (Dungeon)', async () => {
    const r = txt(await callTool('add_scene', { name: 'Dungeon Entrance', width: 16, height: 14 }));
    dungeonId = extractId(r);
    if (!r.includes('Dungeon')) throw new Error('Got: ' + r);
  });

  await test('list_scenes', async () => {
    const r = txt(await callTool('list_scenes'));
    const list = JSON.parse(r);
    if (!list.some(s => s.name === 'Town Square')) throw new Error('Town Square not in list');
  });

  await test('get_scene', async () => {
    if (!townId) throw new Error('No townId');
    const r = txt(await callTool('get_scene', { sceneId: townId }));
    if (!r.includes('Town')) throw new Error('Got: ' + r.slice(0, 100));
  });

  await test('update_scene', async () => {
    if (!townId) throw new Error('No townId');
    txt(await callTool('update_scene', { sceneId: townId, updates: { name: 'Town Square (Updated)' } }));
  });

  // ── ACTORS ───────────────────────────────────────────────────────────────
  console.log('\n🧙 Actor Tools');
  let shopkeeperId;

  await test('add_actor', async () => {
    if (!townId) throw new Error('No townId');
    const r = txt(await callTool('add_actor', { sceneId: townId, name: 'Shopkeeper', x: 5, y: 8, direction: 'down' }));
    shopkeeperId = extractId(r);
    if (!r.includes('Shopkeeper')) throw new Error('Got: ' + r);
  });

  await test('list_actors', async () => {
    if (!townId) throw new Error('No townId');
    const r = txt(await callTool('list_actors', { sceneId: townId }));
    const list = JSON.parse(r);
    if (!list.some(a => a.name === 'Shopkeeper')) throw new Error('Shopkeeper not listed');
  });

  await test('update_actor', async () => {
    if (!townId || !shopkeeperId) throw new Error('Missing IDs');
    txt(await callTool('update_actor', { sceneId: townId, actorId: shopkeeperId, updates: { x: 6, y: 9 } }));
  });

  // ── TRIGGERS ─────────────────────────────────────────────────────────────
  console.log('\n🚪 Trigger Tools');
  let triggerId;

  await test('add_trigger', async () => {
    if (!townId) throw new Error('No townId');
    const r = txt(await callTool('add_trigger', { sceneId: townId, name: 'Dungeon Door', x: 10, y: 15, width: 2, height: 1 }));
    triggerId = extractId(r);
    if (!r.includes('Dungeon Door')) throw new Error('Got: ' + r);
  });

  await test('update_trigger', async () => {
    if (!townId || !triggerId) throw new Error('Missing IDs');
    txt(await callTool('update_trigger', { sceneId: townId, triggerId, updates: { name: 'Dungeon Door' } }));
  });

  // ── SCRIPTS ──────────────────────────────────────────────────────────────
  console.log('\n📜 Script Tools');

  await test('add_script_event (dialogue)', async () => {
    if (!townId || !shopkeeperId) throw new Error('Missing IDs');
    txt(await callTool('add_script_event', {
      target: 'actor', targetId: shopkeeperId, sceneId: townId,
      scriptType: 'script', command: 'EVENT_DIALOGUE',
      args: { text: 'Welcome! Buy a sword for 10 gold?' }
    }));
  });

  await test('add_script_event (scene switch)', async () => {
    if (!townId || !triggerId || !dungeonId) throw new Error('Missing IDs');
    txt(await callTool('add_script_event', {
      target: 'trigger', targetId: triggerId, sceneId: townId,
      scriptType: 'script', command: 'EVENT_SCENE_SWITCH',
      args: { sceneId: dungeonId, x: 1, y: 1, direction: 'down', fadeSpeed: 2 }
    }));
  });

  await test('add_script_event (wait on scene)', async () => {
    if (!townId) throw new Error('No townId');
    txt(await callTool('add_script_event', {
      target: 'scene', targetId: townId,
      scriptType: 'script', command: 'EVENT_WAIT', args: { time: 30 }
    }));
  });

  await test('get_script', async () => {
    if (!townId || !shopkeeperId) throw new Error('Missing IDs');
    const r = txt(await callTool('get_script', {
      target: 'actor', targetId: shopkeeperId, sceneId: townId, scriptType: 'script'
    }));
    if (!r.includes('DIALOGUE') && !r.includes('sword')) throw new Error('Got: ' + r.slice(0, 100));
  });

  // ── SAVE & VALIDATE ───────────────────────────────────────────────────────
  console.log('\n💾 Save & Validate');

  await test('save_project', async () => {
    const r = txt(await callTool('save_project'));
    if (!r.toLowerCase().includes('saved') && !r.toLowerCase().includes('project')) throw new Error('Got: ' + r);
  });

  await test('file exists', () => {
    if (!existsSync(OUTPUT_FILE)) throw new Error('Not found: ' + OUTPUT_FILE);
  });

  await test('valid JSON', () => {
    JSON.parse(readFileSync(OUTPUT_FILE, 'utf-8'));
  });

  await test('correct GB Studio schema', () => {
    const proj = JSON.parse(readFileSync(OUTPUT_FILE, 'utf-8'));
    ['name', 'scenes', 'variables', 'settings', 'backgrounds', 'spriteSheets'].forEach(k => {
      if (!(k in proj)) throw new Error('Missing: ' + k);
    });
    if (proj.name !== 'TestGame') throw new Error('Wrong name: ' + proj.name);
    if (proj.scenes.length < 2) throw new Error('Expected 2+ scenes, got ' + proj.scenes.length);
    const town = proj.scenes.find(s => s.name && s.name.includes('Town'));
    if (!town) throw new Error('Town scene missing from output');
    if (!town.actors || !town.actors.length) throw new Error('No actors in Town scene');
    const sk = town.actors.find(a => a.name === 'Shopkeeper');
    if (!sk) throw new Error('Shopkeeper not found');
    const dlg = sk.script && sk.script.find(e => e.command === 'EVENT_DIALOGUE');
    if (!dlg) throw new Error('No dialogue on Shopkeeper');
    if (!dlg.args || !dlg.args.text || !dlg.args.text.includes('sword')) throw new Error('Wrong dialogue');
    if (!town.triggers || !town.triggers.length) throw new Error('No triggers in Town');
    const trig = town.triggers.find(t => t.name && t.name.includes('Dungeon'));
    if (!trig) throw new Error('Dungeon trigger missing');
    if (!proj.variables || !proj.variables.find(v => v.name === 'hasSword')) throw new Error('hasSword variable missing');
    console.log('    Scenes: ' + proj.scenes.length + ' | Actors: ' + town.actors.length + ' | Variables: ' + proj.variables.length + ' | Scripts: ' + sk.script.length);
  });

  // ── BUILD ────────────────────────────────────────────────────────────────
  console.log('\n🔨 Build Tool');

  await test('build_rom (graceful fail without CLI)', async () => {
    const resp = await callTool('build_rom');
    const t = txt(resp);
    console.log('    ' + t.split('\n')[0]);
  });

  // ── DELETE TOOLS ─────────────────────────────────────────────────────────
  console.log('\n🗑  Delete Tools');

  await test('delete_actor', async () => {
    if (!townId || !shopkeeperId) throw new Error('Missing IDs');
    txt(await callTool('delete_actor', { sceneId: townId, actorId: shopkeeperId }));
  });

  await test('delete_trigger', async () => {
    if (!townId || !triggerId) throw new Error('Missing IDs');
    txt(await callTool('delete_trigger', { sceneId: townId, triggerId }));
  });

  await test('delete_scene', async () => {
    if (!dungeonId) throw new Error('No dungeonId');
    txt(await callTool('delete_scene', { sceneId: dungeonId }));
  });

  // ── RESULTS ──────────────────────────────────────────────────────────────
  serverProcess.kill();

  console.log('\n' + '─'.repeat(50));
  console.log('Results: ' + pass + ' passed, ' + fail + ' failed out of ' + (pass + fail) + ' tests');

  if (fail === 0) {
    console.log('✅ All tests passed! GB Studio MCP server is fully functional.');
    console.log('\n📄 Sample .gbsproj: ' + OUTPUT_FILE);
  } else {
    console.log('\nFailed:');
    results.forEach(r => console.log('  - ' + r.name + ': ' + r.error));
    process.exit(1);
  }
}

main().catch(e => {
  console.error('Fatal:', e);
  if (serverProcess) serverProcess.kill();
  process.exit(1);
});
