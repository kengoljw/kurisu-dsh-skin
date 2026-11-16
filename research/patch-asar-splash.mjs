// v2: HEADER SURGERY patcher for the DSH native loading screen.
//
// resources/app.asar -> lib/web-document.js -> LOADING_STYLE is injected VERBATIM
// into the first-paint <head>. The v1 patcher could only do an equal-length
// 512-byte colour swap. This one is free to grow the payload: it changes ONLY
// the lib/web-document.js entry's offset+size (and drops its integrity object),
// APPENDS the new file at EOF, and rewrites the header JSON padded with trailing
// spaces to exactly the same jsonSize. Every other one of the ~20k entries keeps
// its exact offset/size, so no 180 MB repack is needed.
//
// asar layout (verified against the real archive):
//   bytes 0..3   UInt32LE = 4
//   bytes 4..7   UInt32LE = headerSize
//   bytes 8..11  UInt32LE = 4 + align4(jsonSize)
//   bytes 12..15 UInt32LE = jsonSize
//   bytes 16..16+jsonSize   header JSON (trailing spaces are legal)
//   bytes 16+align4(jsonSize)..  file data (base = 8 + headerSize)
//   entry.offset is relative to base.
//
// Electron fuse EnableEmbeddedAsarIntegrityValidation is disabled, so dropping
// this entry's `integrity` is safe.
//
// CLI (default with NO flag = read-only dry run):
//   --dry-run   print the plan, never write app.asar
//   --apply     write backups once, then apply header surgery
//   --restore   write back the original header bytes and truncate to original length
//   --verify    read back and assert invariants + node --check
//
// NOTE ON spawnSync: stdio is always 'ignore' / 'inherit'. This sandbox forbids
// piped stdio capture for spawned processes, so we never ask for ':pipe'.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildPayload, assembleLoadingStyle, assertReplaceSafe } from './native-splash/payload.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.join(HERE, 'native-splash');
// Scoped test overrides: fixture-test.mjs points the CLI at a tiny synthetic
// asar + a temp backup dir. Nothing else sets these, so the real archive is the
// only default target.
const ENV_ASAR = process.env.KS_SPLASH_ASAR || '';
const ENV_BACKUP = process.env.KS_SPLASH_BACKUP_DIR || '';
const BDIR = ENV_BACKUP || BACKUP_DIR;

export const CONFIG = {
  asar: ENV_ASAR || '<install>\AppData\\Local\\Programs\\DSH NEXT\\resources\\app.asar',
  entry: 'lib/web-document.js',
  backupDir: BDIR,
  origFile: path.join(BDIR, 'web-document.orig.js'),
  origHeader: path.join(BDIR, 'header.orig.json'),
  manifest: path.join(BDIR, 'backup-manifest.json')
};

// ------------------------------------------------------------------ asar reader
export function parseAsar(archivePath = CONFIG.asar) {
  const fd = fs.openSync(archivePath, 'r');
  try {
    const preamble = Buffer.alloc(16);
    fs.readSync(fd, preamble, 0, 16, 0);
    if (preamble.readUInt32LE(0) !== 4) throw new Error('unexpected asar pickle preamble');
    const headerSize = preamble.readUInt32LE(4);
    const jsonSize = preamble.readUInt32LE(12);
    const jsonBytes = Buffer.alloc(jsonSize);
    fs.readSync(fd, jsonBytes, 0, jsonSize, 16);
    const header = JSON.parse(jsonBytes.toString('utf8'));
    const fileSize = fs.fstatSync(fd).size;
    const base = 8 + headerSize;
    if (base !== 16 + Math.ceil(jsonSize / 4) * 4) {
      throw new Error('unexpected asar header alignment: base=' + base + ' jsonSize=' + jsonSize);
    }
    return { preamble, headerSize, jsonSize, jsonBytes, header, base, fileSize, alignmentBytes: base - 16 - jsonSize };
  } finally {
    fs.closeSync(fd);
  }
}

export function getEntry(header, entryPath = CONFIG.entry) {
  let node = header;
  for (const part of entryPath.split('/')) node = node.files[part];
  if (!node || typeof node.offset === 'undefined') throw new Error('entry not found: ' + entryPath);
  return node;
}

export function countFileEntries(header) {
  let n = 0;
  (function walk(node) {
    for (const k of Object.keys(node.files || {})) {
      const child = node.files[k];
      if (child.files) walk(child); else n++;
    }
  })(header);
  return n;
}

export function listFileEntries(header) {
  const out = [];
  (function walk(node, prefix) {
    for (const k of Object.keys(node.files || {})) {
      const child = node.files[k];
      const p = prefix ? prefix + '/' + k : k;
      if (child.files) walk(child, p);
      else out.push({ path: p, node: child });
    }
  })(header, '');
  return out;
}

// ------------------------------------------------------- LOADING_STYLE statement
// Byte-level splice: everything except the statement is preserved byte-for-byte,
// even if the file ever contains non-UTF8 bytes elsewhere.
export function findStatement(buf) {
  const marker = Buffer.from('const LOADING_STYLE = ');
  const start = buf.indexOf(marker);
  if (start < 0) throw new Error('const LOADING_STYLE = ...; not found');
  const exprStart = start + marker.length;
  const quote = buf[exprStart];
  if (quote !== 0x60 && quote !== 0x22 && quote !== 0x27) {
    throw new Error('LOADING_STYLE is not a template literal or quoted string');
  }
  let p = exprStart + 1;
  let esc = false;
  for (; p < buf.length; p++) {
    const c = buf[p];
    if (esc) { esc = false; continue; }
    if (c === 0x5c) { esc = true; continue; }
    if (c === quote) { p++; break; }
  }
  if (p >= buf.length || buf[p] !== 0x3b) throw new Error('LOADING_STYLE statement is not terminated by ;');
  return { start, exprStart, valueStart: exprStart + 1, valueEnd: p - 1, end: p + 1, quote };
}

export function buildNewFile(origBuf, loadingStyle) {
  const st = findStatement(origBuf);
  // JSON.stringify avoids every backtick / ${ / backslash pitfall: the replacement
  // is an ordinary double-quoted JS string literal.
  const statement = Buffer.from('const LOADING_STYLE = ' + JSON.stringify(loadingStyle) + ';', 'utf8');
  return Buffer.concat([origBuf.subarray(0, st.start), statement, origBuf.subarray(st.end)]);
}

export function readLoadingStyle(buf) {
  const st = findStatement(buf);
  const raw = buf.slice(st.valueStart, st.valueEnd).toString('utf8');
  if (st.quote === 0x22) return JSON.parse('"' + raw + '"');
  if (st.quote === 0x60) return raw;
  throw new Error('LOADING_STYLE is not a JSON string (was the patch applied?)');
}

// ------------------------------------------------------------- surgery (shared)
// planSurgery is pure (no writes) and is reused verbatim by fixture-test.mjs.
export function planSurgery({ archivePath = CONFIG.asar, entryPath = CONFIG.entry,
                              headerJsonBytes, newContent, appendAt }) {
  const info = parseAsar(archivePath);
  const jsonBytes = headerJsonBytes || info.jsonBytes;
  if (Buffer.byteLength(jsonBytes) !== info.jsonSize) throw new Error('header JSON bytes length != jsonSize');
  const header = JSON.parse(jsonBytes.toString('utf8'));
  const target = getEntry(header, entryPath);

  const oldOffset = Number(target.offset);
  const oldSize = Number(target.size);
  const hadIntegrity = Object.prototype.hasOwnProperty.call(target, 'integrity');
  const entryCount = countFileEntries(header);
  const slackBefore = info.jsonSize - Buffer.byteLength(JSON.stringify(header), 'utf8');

  const absAppend = appendAt == null ? info.fileSize : appendAt;
  if (absAppend < info.base) throw new Error('appendAt is inside the header');
  const newOffset = absAppend - info.base;
  const buf = Buffer.isBuffer(newContent) ? newContent : Buffer.from(newContent, 'utf8');
  const newSize = buf.length;

  target.offset = String(newOffset);
  target.size = newSize;
  if (hadIntegrity) delete target.integrity;   // frees ~220 bytes of header slack

  const minified = JSON.stringify(header);
  const minBytes = Buffer.byteLength(minified, 'utf8');
  if (minBytes > info.jsonSize) {
    throw new Error('new header JSON is ' + minBytes + ' bytes but jsonSize is only ' +
      info.jsonSize + ' (' + (minBytes - info.jsonSize) + ' bytes too long). ' +
      'Refusing to corrupt the archive. Shorten the payload or remove more optional fields.');
  }
  const padBytes = info.jsonSize - minBytes;
  const newJsonBytes = Buffer.concat([
    Buffer.from(minified, 'utf8'),
    Buffer.alloc(padBytes, 0x20)               // trailing spaces are legal JSON whitespace
  ]);
  return {
    archivePath, entryPath, base: info.base, jsonSize: info.jsonSize,
    headerSize: info.headerSize, alignmentBytes: info.alignmentBytes,
    fileSize: info.fileSize, originalLength: absAppend,
    oldOffset, oldSize, newOffset, newSize,
    appendedAbsoluteOffset: absAppend,
    newContent: buf, newJsonBytes,
    hadIntegrity, entryCount, slackBefore, slackUsed: padBytes,
    minifiedJsonBytes: minBytes
  };
}

export function applySurgery({ plan }) {
  const fd = fs.openSync(plan.archivePath, 'r+');
  try {
    const h = Buffer.alloc(16);
    fs.readSync(fd, h, 0, 16, 0);
    if (h.readUInt32LE(12) !== plan.jsonSize || (8 + h.readUInt32LE(4)) !== plan.base) {
      throw new Error('asar preamble changed since planning; refusing to write');
    }
    const current = fs.fstatSync(fd).size;
    if (current < plan.originalLength) throw new Error('archive shrank since planning; refusing to write');
    // Idempotent re-apply: drop any previously appended bytes first.
    if (current > plan.originalLength) fs.ftruncateSync(fd, plan.originalLength);
    // Append FIRST, header LAST: a crash can never leave a header pointing at
    // bytes that were not written yet.
    fs.writeSync(fd, plan.newContent, 0, plan.newContent.length, plan.originalLength);
    fs.writeSync(fd, plan.newJsonBytes, 0, plan.jsonSize, 16);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}

// ------------------------------------------------------------------- verification
export function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

// In-process syntax check for --dry-run (no temp files, no writes). ESM import /
// export statements are normalised away; everything else is parsed as-is.
export function checkSyntaxInProcess(source, label = 'web-document.js') {
  const normalised = source.split(/\r?\n/).map(line =>
    /^\s*import\b/.test(line) ? '// ' + line : line.replace(/^(\s*)export\s+/, '$1')
  ).join('\n');
  new vm.Script(normalised, { filename: label });
  return true;
}

// Real `node --check` via spawnSync. Temp file is .mjs so Node parses ESM.
// stdio:'ignore' -- piped stdio capture is forbidden in this sandbox.
export function checkModuleSyntax(source, { nodeExe = process.execPath, tempDir = BACKUP_DIR } = {}) {
  const f = path.join(tempDir, '_ks-verify-web-document.mjs');
  try {
    fs.writeFileSync(f, source, 'utf8');
    const cp = spawnSync(nodeExe, ['--check', f], { stdio: 'ignore' });
    if (cp.status !== 0) throw new Error('node --check failed (status=' + cp.status + ')');
    return true;
  } finally {
    try { fs.unlinkSync(f); } catch (e) {}
  }
}

export function sampleEntries(archivePath, header, base, exclude, count = 5) {
  return listFileEntries(header)
    .filter(x => x.path !== exclude && Number(x.node.size) > 0 && Number(x.node.size) <= 65536)
    .slice(0, count)
    .map(x => {
      const off = base + Number(x.node.offset);
      const size = Number(x.node.size);
      const buf = Buffer.alloc(size);
      const fd = fs.openSync(archivePath, 'r');
      try { fs.readSync(fd, buf, 0, size, off); } finally { fs.closeSync(fd); }
      return { path: x.path, offset: x.node.offset, size: x.node.size, sha256: sha256(buf) };
    });
}

// ------------------------------------------------------------------------- CLI
function fmt(n) { return Number(n).toLocaleString('en-US'); }

function printPlan(plan, payloadStats) {
  console.log('--- header surgery plan ------------------------------------------');
  console.log('archive            : ' + plan.archivePath);
  console.log('preamble           : 16 bytes unchanged');
  console.log('jsonSize           : ' + fmt(plan.jsonSize) + ' bytes');
  console.log('headerSize / base  : ' + fmt(plan.headerSize) + ' / ' + fmt(plan.base));
  console.log('alignment pad      : ' + plan.alignmentBytes + ' bytes (untouched)');
  console.log('current file size  : ' + fmt(plan.fileSize) + ' bytes');
  console.log('original length    : ' + fmt(plan.originalLength) + ' bytes (backup manifest)');
  console.log('append at (abs)    : ' + fmt(plan.appendedAbsoluteOffset));
  console.log('entry old          : offset=' + fmt(plan.oldOffset) + ' size=' + fmt(plan.oldSize));
  console.log('entry new          : offset=' + fmt(plan.newOffset) + ' size=' + fmt(plan.newSize));
  console.log('entry integrity    : ' + (plan.hadIntegrity ? 'present -> DROPPED' : 'absent'));
  console.log('file entries       : ' + fmt(plan.entryCount) + ' (unchanged)');
  console.log('header slack before: ' + fmt(plan.slackBefore) + ' bytes');
  console.log('new minified JSON  : ' + fmt(plan.minifiedJsonBytes) + ' bytes');
  console.log('header slack used  : ' + fmt(plan.slackUsed) + ' bytes of trailing spaces');
  console.log('new file delta     : +' + fmt(plan.newSize - plan.oldSize) + ' bytes');
  if (payloadStats) {
    console.log('LOADING_STYLE      : ' + fmt(payloadStats.total) + ' bytes (UTF-8 validated)');
    console.log('  style            : ' + fmt(payloadStats.style) + ' bytes');
    payloadStats.scripts.forEach((n, i) => console.log('  script[' + i + ']         : ' + fmt(n) + ' bytes (escaped)'));
    console.log('  new web-document : ' + fmt(payloadStats.newFile) + ' bytes');
  }
  console.log('------------------------------------------------------------------');
}

function buildEverything() {
  const payload = buildPayload();
  const loadingStyle = assertReplaceSafe(assembleLoadingStyle(payload), 'LOADING_STYLE');
  const escaped = payload.scripts.map(src => src.replace(/<\/script/gi, '<\\/script'));
  const info = parseAsar(CONFIG.asar);
  const origFile = fs.existsSync(CONFIG.origFile) ? fs.readFileSync(CONFIG.origFile) : readEntryBytes(info, CONFIG.entry);
  const newFile = buildNewFile(origFile, loadingStyle);
  return {
    payload, loadingStyle, info, origFile, newFile,
    stats: {
      total: Buffer.byteLength(loadingStyle, 'utf8'),
      style: Buffer.byteLength(payload.style, 'utf8'),
      scripts: escaped.map(s => Buffer.byteLength(s, 'utf8')),
      newFile: newFile.length
    }
  };
}

function readEntryBytes(info, entryPath) {
  const e = getEntry(info.header, entryPath);
  const size = Number(e.size);
  const buf = Buffer.alloc(size);
  const fd = fs.openSync(CONFIG.asar, 'r');
  try { fs.readSync(fd, buf, 0, size, info.base + Number(e.offset)); } finally { fs.closeSync(fd); }
  return buf;
}

function writeBackups(info, origFile, plan, samples) {
  fs.mkdirSync(CONFIG.backupDir, { recursive: true });
  // Backups are written ONCE. Never overwrite them on a repeat --apply.
  if (!fs.existsSync(CONFIG.origFile)) fs.writeFileSync(CONFIG.origFile, origFile);
  if (!fs.existsSync(CONFIG.origHeader)) fs.writeFileSync(CONFIG.origHeader, info.jsonBytes);
  if (!fs.existsSync(CONFIG.manifest)) {
    fs.writeFileSync(CONFIG.manifest, JSON.stringify({
      version: 2,
      createdAt: new Date().toISOString(),
      asar: CONFIG.asar,
      entry: CONFIG.entry,
      originalLength: plan.originalLength,
      jsonSize: info.jsonSize,
      headerSize: info.headerSize,
      base: info.base,
      entryCount: plan.entryCount,
      oldEntry: { offset: String(plan.oldOffset), size: plan.oldSize, hadIntegrity: plan.hadIntegrity },
      applied: { offset: String(plan.newOffset), size: plan.newSize },
      samples
    }, null, 2) + '\n');
  }
}

function restore() {
  if (!fs.existsSync(CONFIG.manifest) || !fs.existsSync(CONFIG.origHeader)) {
    throw new Error('backup-manifest.json / header.orig.json missing; cannot restore');
  }
  const manifest = JSON.parse(fs.readFileSync(CONFIG.manifest, 'utf8'));
  const header = fs.readFileSync(CONFIG.origHeader);
  const info = parseAsar(CONFIG.asar);
  if (header.length !== info.jsonSize) throw new Error('original header bytes length != jsonSize');
  const fd = fs.openSync(CONFIG.asar, 'r+');
  try {
    fs.writeSync(fd, header, 0, info.jsonSize, 16);
    fs.ftruncateSync(fd, manifest.originalLength);
    fs.fsyncSync(fd);
  } finally { fs.closeSync(fd); }
  console.log('restore: original header rewritten at offset 16 (' + fmt(info.jsonSize) + ' bytes)');
  console.log('restore: truncated to original length ' + fmt(manifest.originalLength) + ' bytes');
  console.log('restore: app.asar now points at the untouched original entry at offset ' + manifest.oldEntry.offset);
}

function verify() {
  const info = parseAsar(CONFIG.asar);
  const check = (name, ok) => { console.log('  ' + (ok ? 'PASS' : 'FAIL') + '  ' + name); if (!ok) failures.push(name); };
  const failures = [];
  console.log('--- verify --------------------------------------------------------');
  check('header JSON parses', !!info.header && !!info.header.files);
  const e = getEntry(info.header, CONFIG.entry);
  const entryCount = countFileEntries(info.header);
  let manifest = null;
  if (fs.existsSync(CONFIG.manifest)) manifest = JSON.parse(fs.readFileSync(CONFIG.manifest, 'utf8'));
  check('entry count unchanged (' + fmt(entryCount) + ')', !manifest || entryCount === manifest.entryCount);

  const entryBuf = readEntryBytes(info, CONFIG.entry);
  let loadingStyle = null;
  try { loadingStyle = readLoadingStyle(entryBuf); } catch (err) { console.log('    ' + err.message); }
  check('LOADING_STYLE is a JSON string', typeof loadingStyle === 'string');
  check('LOADING_STYLE contains #ks-loadscreen', !!loadingStyle && loadingStyle.indexOf('#ks-loadscreen') >= 0);
  check('LOADING_STYLE contains sg-nixie', !!loadingStyle && loadingStyle.indexOf('sg-nixie') >= 0);
  check('entry offset/size match the appended data',
    Number(e.offset) === (manifest ? Number(manifest.applied.offset) : Number(e.offset)) &&
    Number(e.size) === entryBuf.length);
  check('entry integrity dropped', !('integrity' in e));

  // 5 other entries: bytes + hashes must be identical to the first-apply snapshot.
  let samples = manifest ? manifest.samples : null;
  if (!samples) samples = sampleEntries(CONFIG.asar, info.header, info.base, CONFIG.entry, 5);
  let sampleOk = true;
  for (const s of samples) {
    const cur = getEntry(info.header, s.path);
    if (String(cur.offset) !== String(s.offset) || String(cur.size) !== String(s.size)) { sampleOk = false; break; }
    const b = Buffer.alloc(Number(s.size));
    const fd = fs.openSync(CONFIG.asar, 'r');
    try { fs.readSync(fd, b, 0, b.length, info.base + Number(s.offset)); } finally { fs.closeSync(fd); }
    if (sha256(b) !== s.sha256) { sampleOk = false; break; }
  }
  check('5 other entries bytes/hashes unchanged', sampleOk && samples.length === 5);

  let syntax = false;
  try { syntax = checkModuleSyntax(entryBuf.toString('utf8'), { nodeExe: process.execPath, tempDir: CONFIG.backupDir }); }
  catch (err) { console.log('    node --check: ' + err.message); }
  check('node --check on reconstructed web-document.mjs', syntax);
  console.log('------------------------------------------------------------------');
  if (failures.length) throw new Error('verify FAILED: ' + failures.join(', '));
  console.log('verify: ALL PASS');
}

function main() {
  const args = process.argv.slice(2);
  const mode = args.includes('--restore') ? 'restore'
    : args.includes('--verify') ? 'verify'
    : args.includes('--apply') ? 'apply'
    : 'dry-run';

  if (mode === 'restore') { restore(); return; }
  if (mode === 'verify') { verify(); return; }

  const built = buildEverything();
  const manifestExists = fs.existsSync(CONFIG.manifest);
  const manifest = manifestExists ? JSON.parse(fs.readFileSync(CONFIG.manifest, 'utf8')) : null;
  // On a repeat --apply, rebuild from the ONCE-written backups so the result is
  // byte-identical, and use the recorded original length (not the grown file).
  const headerJsonBytes = fs.existsSync(CONFIG.origHeader)
    ? fs.readFileSync(CONFIG.origHeader) : built.info.jsonBytes;
  const appendAt = manifest ? manifest.originalLength : built.info.fileSize;

  if (mode === 'apply' && manifest) {
    const cur = getEntry(built.info.header, CONFIG.entry);
    if (String(cur.offset) !== String(manifest.applied.offset)) {
      throw new Error('app.asar changed since the last apply (entry offset ' + cur.offset +
        ' != ' + manifest.applied.offset + '). Restore or refresh the backups before re-applying.');
    }
  }

  const plan = planSurgery({
    archivePath: CONFIG.asar, entryPath: CONFIG.entry,
    headerJsonBytes, newContent: built.newFile, appendAt
  });
  printPlan(plan, built.stats);

  if (mode === 'dry-run') {
    checkSyntaxInProcess(built.newFile.toString('utf8'));
    console.log('dry-run: in-process syntax check PASSED; NO writes to app.asar (or any file).');
    console.log('dry-run: run with --apply to write backups + patch; then --verify.');
    return;
  }

  // --apply: record samples from the ORIGINAL (unpatched) header first.
  const origHeaderObj = JSON.parse(headerJsonBytes.toString('utf8'));
  const samples = sampleEntries(CONFIG.asar, origHeaderObj, plan.base, CONFIG.entry, 5);
  writeBackups({ ...built.info, jsonBytes: headerJsonBytes }, built.origFile, plan, samples);
  applySurgery({ plan });
  console.log('apply: appended ' + fmt(plan.newSize) + ' bytes at ' + fmt(plan.appendedAbsoluteOffset));
  console.log('apply: header JSON rewritten (' + fmt(plan.jsonSize) + ' bytes, ' + fmt(plan.slackUsed) + ' trailing spaces)');
  console.log('apply: backups in ' + CONFIG.backupDir);
  verify();
}

// Only run the CLI when executed directly, so fixture-test.mjs can import the
// surgery primitives without triggering any archive IO at import time.
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    main();
  } catch (err) {
    console.error('ERROR: ' + (err && err.message ? err.message : String(err)));
    process.exitCode = 1;
  }
}
