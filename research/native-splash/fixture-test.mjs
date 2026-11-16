// End-to-end proof of the header-surgery algorithm WITHOUT touching the real
// 180 MB app.asar: build a tiny asar (same 16-byte preamble format), run the
// exported planSurgery/applySurgery from patch-asar-splash.mjs against it, parse
// it back and assert every invariant. Also runs node --check on the real
// payload's script sources and on a reconstructed ESM web-document.mjs.
//
// Run:
//   <home>\.dsh\dsh-runtimes\dsh-next-primary-runtime\dependencies\node\bin\node.exe kurisu-skin\research\native-splash\fixture-test.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  parseAsar, getEntry, countFileEntries, listFileEntries,
  findStatement, buildNewFile, readLoadingStyle,
  planSurgery, applySurgery, sha256, checkModuleSyntax
} from '../patch-asar-splash.mjs';
import {
  buildPayload, assembleLoadingStyle, assertReplaceSafe, verifyPayload,
  assertEncoding, extractLiteral, PATHS, WALL_KEYS
} from './payload.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const NODE = process.execPath;
const ENTRY = 'lib/web-document.js';

let checks = 0;
const failures = [];
function ok(name, cond) {
  checks++;
  if (!cond) failures.push(name);
  console.log('  ' + (cond ? 'PASS' : 'FAIL') + '  ' + name);
}

const STUB = [
  'import { r as NATIVE_ACCESS_HEADER } from "./desktop-contract-Dfyxcsjh.js";',
  'const APP_BOOT_SCRIPT = "<script>globalThis.X=1<\\/script>";',
  'const LOADING_STYLE = `<style id="dsh-next-loading-style">body{background:#000}</style>`;',
  'export function serveWebDocument() { return APP_BOOT_SCRIPT + LOADING_STYLE; }',
  ''
].join('\n');

// The real payload, built from src/* and assets/* (never from the real asar).
const payload = buildPayload();
const LOADING = assertReplaceSafe(assembleLoadingStyle(payload), 'LOADING_STYLE');

// ----------------------------------------------------------- synthetic asar
// jsonSize is padded with trailing spaces (slack), then 0-padded to a 4-byte
// boundary, exactly like a real asar header pickle.
function makeAsar(file, { slackBytes = 96, withIntegrity = true, stub = STUB, extra = 0 } = {}) {
  const a = Buffer.from('<html><head></head><body>fixture</body></html>');
  const b = Buffer.from(stub, 'utf8');
  const c = Buffer.from('{"name":"ks-fixture","version":"1.0.0"}');
  const extras = [];
  for (let i = 0; i < extra; i++) extras.push(Buffer.from('extra-fixture-data-' + i));
  const data = Buffer.concat([a, b, c, ...extras]);
  const hdr = {
    files: {
      'index.html': { size: a.length, offset: '0' },
      'lib': { files: {
        'web-document.js': {
          size: b.length,
          offset: String(a.length),
          ...(withIntegrity ? { integrity: {
            algorithm: 'SHA256', hash: 'a'.repeat(64), blockSize: 4194304,
            blocks: ['a'.repeat(64)]
          } } : {})
        }
      } },
      'package.json': { size: c.length, offset: String(a.length + b.length) }
    }
  };
  let off = a.length + b.length + c.length;
  for (let i = 0; i < extras.length; i++) {
    hdr.files['extra-' + i + '.txt'] = { size: extras[i].length, offset: String(off) };
    off += extras[i].length;
  }
  const minified = JSON.stringify(hdr);
  const jsonSize = Buffer.byteLength(minified, 'utf8') + slackBytes;
  const jsonBytes = Buffer.concat([
    Buffer.from(minified, 'utf8'), Buffer.alloc(slackBytes, 0x20)
  ]);
  const align = Math.ceil(jsonSize / 4) * 4;
  const headerSize = 8 + align;
  const base = 8 + headerSize;
  const preamble = Buffer.alloc(16);
  preamble.writeUInt32LE(4, 0);
  preamble.writeUInt32LE(headerSize, 4);
  preamble.writeUInt32LE(4 + align, 8);
  preamble.writeUInt32LE(jsonSize, 12);
  fs.writeFileSync(file, Buffer.concat([
    preamble, jsonBytes, Buffer.alloc(align - jsonSize), data
  ]));
  return { preamble, jsonBytes, jsonSize, headerSize, base, data, hdr, a, b, c };
}

const fixture = path.join(HERE, '_fixture.asar');
const negative = path.join(HERE, '_fixture-negative.asar');
const cliDir = path.join(HERE, '_cli');
const files = [fixture, negative];
try {
  const syn = makeAsar(fixture);
  const before = parseAsar(fixture);
  console.log('--- synthetic asar ---------------------------------------------------');
  console.log('  jsonSize=' + before.jsonSize + ' headerSize=' + before.headerSize +
    ' base=' + before.base + ' fileSize=' + before.fileSize + ' entries=' + countFileEntries(before.header));

  // 1. Same statement-swap the real patcher uses.
  const orig = Buffer.from(STUB, 'utf8');
  const st = findStatement(orig);
  const newFile = buildNewFile(orig, LOADING);
  ok('LOADING_STYLE statement found', st.end > st.start);
  ok('prefix before statement preserved byte-for-byte',
    newFile.subarray(0, st.start).equals(orig.subarray(0, st.start)));
  ok('suffix after statement preserved byte-for-byte',
    newFile.subarray(newFile.length - (orig.length - st.end)).equals(orig.subarray(st.end)));
  ok('readLoadingStyle round-trips the exact payload', readLoadingStyle(newFile) === LOADING);
  const newText = newFile.toString('utf8');
  let encOk = true;
  try { assertEncoding(newText, 'new web-document'); } catch (e) { encOk = false; console.log('    ' + e.message); }
  ok('new web-document is valid UTF-8 (no lone surrogates / C0 / U+FFFD)', encOk);
  ok('Japanese caption survives the byte round trip',
    newText.indexOf('\u4e16\u754c\u7dda 1.130205 \u78ba\u5b9a') >= 0 &&
    readLoadingStyle(newFile).indexOf('\u4e16\u754c\u7dda 1.130205 \u78ba\u5b9a') >= 0);

  // 2. The SAME surgery functions patch-asar-splash.mjs --apply uses.
  const plan = planSurgery({
    archivePath: fixture, entryPath: ENTRY,
    headerJsonBytes: syn.jsonBytes, newContent: newFile
  });
  applySurgery({ plan });
  console.log('  plan: oldSize=' + plan.oldSize + ' newSize=' + plan.newSize +
    ' newOffset=' + plan.newOffset + ' slackUsed=' + plan.slackUsed);

  // 3. Parse back and assert every invariant.
  const after = parseAsar(fixture);
  ok('16-byte preamble byte-identical', after.preamble.equals(syn.preamble));
  ok('jsonSize unchanged', after.jsonSize === syn.jsonSize);
  ok('header JSON still parses', !!after.header.files);
  ok('header region is exactly jsonSize + alignment bytes',
    after.alignmentBytes === syn.base - 16 - syn.jsonSize);
  ok('header padded to exactly jsonSize with trailing spaces',
    after.jsonBytes.length === syn.jsonSize &&
    after.jsonBytes.subarray(plan.minifiedJsonBytes).equals(Buffer.alloc(plan.slackUsed, 0x20)));
  ok('entry count unchanged', countFileEntries(after.header) === countFileEntries(syn.hdr));

  const target = getEntry(after.header, ENTRY);
  ok('target offset = appended absolute offset - base',
    Number(target.offset) === plan.originalLength - after.base);
  ok('target size = new file length', Number(target.size) === newFile.length);
  ok('target integrity dropped', !('integrity' in target));
  ok('file size = originalLength + newContent', after.fileSize === plan.originalLength + newFile.length);

  const othersBefore = listFileEntries(syn.hdr).filter(x => x.path !== ENTRY);
  const hashesBefore = othersBefore.map(x => sha256(x.path === 'index.html' ? syn.a : syn.c));
  const othersAfter = listFileEntries(after.header).filter(x => x.path !== ENTRY);
  ok('other entries offsets/sizes unchanged',
    JSON.stringify(othersBefore.map(x => [x.path, x.node.offset, x.node.size])) ===
    JSON.stringify(othersAfter.map(x => [x.path, x.node.offset, x.node.size])));
  const readAt = (x) => {
    const size = Number(x.node.size);
    const b = Buffer.alloc(size);
    const f = fs.openSync(fixture, 'r');
    try { fs.readSync(f, b, 0, size, after.base + Number(x.node.offset)); } finally { fs.closeSync(f); }
    return b;
  };
  const bytesOk = othersAfter.every((x, i) =>
    readAt(x).equals(x.path === 'index.html' ? syn.a : syn.c) && sha256(readAt(x)) === hashesBefore[i]);
  ok('other entries bytes/hashes unchanged', bytesOk);

  const appended = Buffer.alloc(newFile.length);
  const fd = fs.openSync(fixture, 'r');
  try { fs.readSync(fd, appended, 0, appended.length, after.base + Number(target.offset)); }
  finally { fs.closeSync(fd); }
  ok('appended content read back byte-identical', appended.equals(newFile));
  ok('LOADING_STYLE read back contains #ks-loadscreen',
    readLoadingStyle(appended).indexOf('#ks-loadscreen') >= 0);
  ok('LOADING_STYLE read back contains sg-nixie',
    readLoadingStyle(appended).indexOf('sg-nixie') >= 0);

  // 4. node --check on the reconstructed ESM web-document.mjs.
  let moduleCheck = false;
  try { moduleCheck = checkModuleSyntax(appended.toString('utf8'), { nodeExe: NODE, tempDir: HERE }); }
  catch (e) { console.log('    node --check: ' + e.message); }
  ok('node --check on reconstructed web-document.mjs', moduleCheck);

  // 5. node --check on each REAL, ESCAPED script source (ASCII-stripped
  //    component + verbatim UTF-8 SEQUENCE_JS + ES5 builder). Proves that
  //    "<\/script" is still valid JS and that UTF-8 survives node --check.
  let scriptChecks = [];
  try { scriptChecks = verifyPayload(payload, { nodeExe: NODE, tempDir: HERE }); }
  catch (e) { console.log('    verifyPayload: ' + e.message); }
  scriptChecks.forEach(r => console.log('    ' + r.name + ': source=' + r.sourceBytes +
    ' bytes, escaped=' + r.escapedBytes + ' bytes, node --check=' + (r.nodeCheck ? 'ok' : 'FAIL')));
  ok('node --check on 3 escaped script sources',
    scriptChecks.length === 3 && scriptChecks.every(r => r.nodeCheck));
  ok('payload.scripts = 3 (component / SEQUENCE_JS / builder)', payload.scripts.length === 3);
  const hostSource = fs.readFileSync(PATHS.hostTemplate, 'utf8');
  ok('SEQUENCE_JS embedded verbatim, UTF-8 preserved (U+2588 + caption)',
    payload.scripts[1] === extractLiteral(hostSource, 'SEQUENCE_JS') &&
    payload.scripts[1].indexOf('\u2588') >= 0 &&
    payload.scripts[1].indexOf('\u4e16\u754c\u7dda') >= 0);
  const wallUris = WALL_KEYS.map(k => 'data:image/webp;base64,' +
    fs.readFileSync(PATHS[{
      WALL_NIGHT: 'wallNight', WALL_DAY: 'wallDay',
      WALL_DUSK: 'wallDusk', WALL_LIBRARY: 'wallLibrary'
    }[k]]).toString('base64'));
  ok('assembled payload contains KS_SEQ', LOADING.indexOf('KS_SEQ') >= 0);
  ok('assembled payload contains all 4 wallpaper data URIs',
    wallUris.every(u => LOADING.indexOf(u) >= 0) &&
    !/\{\{WALL_[A-Z]+\}\}/.test(LOADING));
  // KS_PROBE.lastArc must use ONE unit across the whole timeline: raw degrees
  // (or null) at t=0, exactly like the host LOAD_SCRIPT at readiness.
  const builder = payload.scripts[2];
  ok('native builder passes RAW arc degrees (or null) to KS_SEQ.render',
    /SEQ\.render\(n, deg\)/.test(builder) &&
    /return isFinite\(deg\) \? deg : null;/.test(builder) &&
    /\(deg - 72\) \/ 216/.test(builder) &&
    /\/ 9000/.test(builder));

  // 6. Negative test: a header with NO slack and no integrity to free MUST fail
  //    loudly instead of silently writing an over-long header.
  const neg = makeAsar(negative, { slackBytes: 0, withIntegrity: false });
  let refused = false, refuseMsg = '';
  try {
    planSurgery({
      archivePath: negative, entryPath: ENTRY,
      headerJsonBytes: neg.jsonBytes,
      newContent: Buffer.alloc(123456, 0x41),
      appendAt: 1234567890123          // longer offset string: 13 digits
    });
  } catch (e) { refused = true; refuseMsg = e.message; }
  ok('over-long header JSON fails loudly', refused && /Refusing to corrupt/.test(refuseMsg));
  console.log('  refusal: ' + refuseMsg.slice(0, 140));

  // 7. Simulation of serveWebDocument's exact expression:
  //    body.toString().replace("<head>", "<head>" + LOADING_STYLE + APP_BOOT_SCRIPT)
  //    String.replace treats $$, $&, $`, $', $1..$9, $<name> in the REPLACEMENT as
  //    substitution patterns, so the payload must contain none of them.
  const BODY = '<!doctype html><html><head><meta charset="utf-8"><title>x</title></head><body><div id="root"></div></body></html>';
  const APP_BOOT_SCRIPT = '<script>globalThis.__DSH_BOOT_READY__ = Promise.withResolvers();</script>';
  const out = BODY.replace('<head>', '<head>' + LOADING + APP_BOOT_SCRIPT);
  ok('serveWebDocument simulation keeps the document intact',
    out.startsWith('<!doctype html><html><head>') &&
    out.endsWith('<meta charset="utf-8"><title>x</title></head><body><div id="root"></div></body></html>'));
  ok('serveWebDocument simulation injects the payload verbatim',
    out.indexOf(LOADING) > 0 &&
    out.indexOf('<style id="dsh-next-loading-style">') > 0 &&
    out.indexOf('</style><script>') > 0);
  ok('no $ substitution pattern in the payload',
    !/\$[$&'`1-9<]/.test(LOADING));
  const styleEnd = out.indexOf('</style>');
  ok('style element closes before the first script opens', styleEnd < out.indexOf('<script>'));
  const loadingScripts = (LOADING.match(/<script>/g) || []).length;
  const loadingCloses = (LOADING.match(/<\/script>/g) || []).length;
  ok('payload has exactly 3 balanced <script> elements (+1 APP_BOOT_SCRIPT)',
    loadingScripts === 3 && loadingCloses === 3 && (out.match(/<script>/g) || []).length === 4);

  // 8. Full CLI integration: --apply / --verify / --restore against a synthetic
  //    archive via the scoped KS_SPLASH_* env overrides. This exercises the exact
  //    command the Lead will run, including backups and rollback, with zero risk
  //    to the real 180 MB archive.
  fs.mkdirSync(cliDir, { recursive: true });
  const cliAsar = path.join(cliDir, 'app.asar');
  makeAsar(cliAsar, { extra: 6 });   // 9 entries => 5 samples available for --verify
  const cliBefore = parseAsar(cliAsar);
  const env = { ...process.env, KS_SPLASH_ASAR: cliAsar, KS_SPLASH_BACKUP_DIR: cliDir };
  const patcher = path.join(HERE, '..', 'patch-asar-splash.mjs');
  const runCli = (flag) => {
    const log = path.join(cliDir, flag.replace(/^-+/, '') + '.log');
    const out = fs.openSync(log, 'w');
    let r;
    try { r = spawnSync(NODE, [patcher, flag], { env, stdio: ['ignore', out, out] }); }
    finally { fs.closeSync(out); }
    return { status: r.status, text: fs.readFileSync(log, 'utf8') };
  };
  const applied = runCli('--apply');
  ok('CLI --apply exits 0 on synthetic asar', applied.status === 0);
  if (applied.status !== 0) console.log(applied.text.slice(-1500));
  const afterApply = parseAsar(cliAsar);
  ok('CLI --apply grows archive and moves the entry offset',
    afterApply.fileSize > cliBefore.fileSize &&
    String(getEntry(afterApply.header, ENTRY).offset) !== String(getEntry(cliBefore.header, ENTRY).offset));
  ok('CLI --apply writes all 3 backups once',
    ['web-document.orig.js', 'header.orig.json', 'backup-manifest.json']
      .every(f => fs.existsSync(path.join(cliDir, f))));
  const verified = runCli('--verify');
  ok('CLI --verify exits 0 (ALL PASS)', verified.status === 0 && /ALL PASS/.test(verified.text));
  if (verified.status !== 0) console.log(verified.text.slice(-1500));
  const restored = runCli('--restore');
  ok('CLI --restore exits 0', restored.status === 0);
  const afterRestore = parseAsar(cliAsar);
  ok('CLI --restore returns exact original length / header bytes / integrity',
    afterRestore.fileSize === cliBefore.fileSize &&
    afterRestore.jsonBytes.equals(cliBefore.jsonBytes) &&
    !!getEntry(afterRestore.header, ENTRY).integrity);

  console.log('------------------------------------------------------------------');
  console.log('fixture test: ' + (checks - failures.length) + '/' + checks + ' checks passed');
  if (failures.length) {
    console.error('FAILED: ' + failures.join(', '));
    process.exitCode = 1;
  } else {
    console.log('fixture test: ALL PASS (real app.asar untouched)');
  }
} finally {
  for (const f of files) { try { fs.unlinkSync(f); } catch (e) {} }
  try { fs.rmSync(cliDir, { recursive: true, force: true }); } catch (e) {}
}
