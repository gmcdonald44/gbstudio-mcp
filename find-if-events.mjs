import { readFileSync, writeFileSync, openSync, readSync } from 'fs';

const ASAR = 'C:/Users/mcdoo/AppData/Local/gb_studio/app-4.2.2/resources/app.asar';
const fd = openSync(ASAR, 'r');
const sizeBuf = Buffer.alloc(8); readSync(fd, sizeBuf, 0, 8, 0);
const headerSize = sizeBuf.readUInt32LE(4) + 8;
const headerBuf = Buffer.alloc(headerSize - 8); readSync(fd, headerBuf, 0, headerSize - 8, 8);
const header = JSON.parse(headerBuf.toString('utf8').replace(/\0/g, ''));

function readFile(parts) {
  const nav = (o, ps) => ps.reduce((x, k) => x && (x.files ? x.files[k] : x[k]), o);
  const e = nav(header.files, parts);
  if (!e || e.files) return null;
  const b = Buffer.alloc(e.size);
  readSync(fd, b, 0, e.size, headerSize + parseInt(e.offset));
  return b.toString('utf8');
}

function listAll(obj, p = '', r = []) {
  for (const [k, v] of Object.entries(obj)) {
    const f = p ? p + '/' + k : k;
    if (v.files) listAll(v.files, f, r); else r.push(f);
  }
  return r;
}

const all = listAll(header.files);

// Find all if/conditional event files
const ifFiles = all.filter(x => x.includes('/events/event') && x.toLowerCase().includes('if') && x.endsWith('.js'));
console.log('Conditional event files and their IDs:');
ifFiles.forEach(f => {
  const content = readFile(f.split('/'));
  const idMatch = content.match(/id:\s*["']([^"']+)["']/);
  const deprecated = content.includes('deprecated') ? ' [DEPRECATED]' : '';
  console.log(' ', f.split('/').pop(), '->', idMatch ? idMatch[1] : '???', deprecated);
});

// Also read eventIfScriptValue specifically
const ifScriptFile = all.find(x => x.includes('eventIfScript') && x.endsWith('.js'));
if (ifScriptFile) {
  console.log('\n=== FULL eventIfScriptValue.js ===');
  console.log(readFile(ifScriptFile.split('/')));
}
