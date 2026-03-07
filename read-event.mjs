import { openSync, readSync } from 'fs';

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

// Print every if-related event file with its id
const ifFiles = all.filter(x => x.includes('/events/event') && x.toLowerCase().includes('if') && x.endsWith('.js'));
ifFiles.forEach(f => {
  const c = readFile(f.split('/'));
  // Find id field
  const m = c.match(/\bid\s*:\s*["']([^"']+)["']/);
  const dep = c.includes('deprecated') ? ' DEPRECATED' : '';
  process.stdout.write(f.split('/').pop().padEnd(45) + ' id=' + (m ? m[1] : '???') + dep + '\n');
});

// Also print the blank project example to see what format it uses for IF events
const blankFiles = all.filter(x => x.includes('blank-project') && x.endsWith('.gbsres'));
for (const bf of blankFiles) {
  const c = readFile(bf.split('/'));
  if (c && (c.includes('EVENT_IF') || c.includes('ifScript') || c.includes('conditional'))) {
    process.stdout.write('\nBLANK EXAMPLE: ' + bf + '\n' + c + '\n');
  }
}
