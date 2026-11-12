#!/usr/bin/env node
/**
 * Refresh src/upstream/ from the pinned upstream commit, then re-apply patches.
 *
 * Usage:  node scripts/sync-upstream.mjs [path-to-upstream-git-checkout]
 *
 * If the checkout path is omitted, the script clones the pinned commit into a
 * temp dir (requires network + git). Run from the weiqi-worker repo root.
 *
 * Upgrade procedure:
 *   1. edit UPSTREAM_SHA to the new commit
 *   2. node scripts/sync-upstream.mjs /path/to/web-katrain
 *   3. resolve any patch conflicts reported by apply-patches.mjs / patch-worker.mjs
 *   4. npm run typecheck && npm run test:run && npm run build
 *   5. commit src/upstream/, scripts/, UPSTREAM_SHA, docs/UPSTREAM.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import os from 'node:os';

const ROOT = process.cwd();
const SHA = fs.readFileSync(path.join(ROOT, 'UPSTREAM_SHA'), 'utf8').trim();
const UP = path.join(ROOT, 'src', 'upstream');

// Exact 29-file closure, computed from engine/katago/worker.ts after trimming
// the type-only LegacyGameEncoding import in src/types.ts. See docs/UPSTREAM.md.
const FILES = [  // 29 files: publicUrl.ts dropped by P3 (no longer imported)
  'engine/katago/analysisTransfer.ts',
  'engine/katago/analyzeAbort.ts',
  'engine/katago/analyzeMcts.ts',
  'engine/katago/backendFallback.ts',
  'engine/katago/binModelParser.ts',
  'engine/katago/chosenMove.ts',
  'engine/katago/evalV8.ts',
  'engine/katago/fastBoard.ts',
  'engine/katago/featuresV7Fast.ts',
  'engine/katago/graphHash.ts',
  'engine/katago/historyV7.ts',
  'engine/katago/humanSlProfile.ts',
  'engine/katago/limits.ts',
  'engine/katago/loadModelV8.ts',
  'engine/katago/modelResponse.ts',
  'engine/katago/modelV8.ts',
  'engine/katago/positionInputsV7.ts',
  'engine/katago/scoreValue.ts',
  'engine/katago/searchParams.ts',
  'engine/katago/superkoHistory.ts',
  'engine/katago/types.ts',
  'engine/katago/worker.ts',
  'lib/gtp.ts',
  'types.ts',
  'utils/animationFrame.ts',
  'utils/gameLogic.ts',
  'utils/goRules.ts',
  'utils/superko.ts',
  'utils/workerThreads.ts',
];

let checkout = process.argv[2];
let tmp = '';
if (!checkout) {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wkt-'));
  checkout = tmp;
  console.log(`Cloning upstream @ ${SHA} ...`);
  execFileSync('git', ['clone', '--filter=blob:none', '--no-checkout', '--depth', '1',
    'https://github.com/Sir-Teo/web-katrain.git', checkout], { stdio: 'inherit' });
}
const head = execFileSync('git', ['-C', checkout, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (head !== SHA) {
  throw new Error(`Upstream checkout HEAD ${head} != UPSTREAM_SHA ${SHA}`);
}
// Read every file straight from the pinned commit object. This avoids mutating
// the checkout working tree, and avoids sparse-checkout cone rules (a file path
// such as src/types.ts is not a directory and is rejected by `set --cone`).
execFileSync('git', ['-C', checkout, 'cat-file', '-e', SHA + '^{commit}'], { stdio: 'ignore' });
const readUpstream = (rel) =>
  execFileSync('git', ['-C', checkout, 'show', SHA + ':src/' + rel]);

// Deterministic trim: src/types.ts has one type-only import that pulls in a
// chain of SGF/UI utils unrelated to the engine. Replace with an inline union.
let types = readUpstream('types.ts').toString('utf8');
types = types.replace("import type { LegacyGameEncoding } from './utils/gameRecordImport';\n", '');
types = types.replace(
  'legacyGameEncoding: LegacyGameEncoding;',
  "legacyGameEncoding: 'auto' | 'utf-8' | 'euc-kr' | 'gb18030' | 'big5' | 'shift_jis' | 'windows-1252';",
);
if (types.includes('LegacyGameEncoding')) throw new Error('types.ts trim failed');

fs.rmSync(UP, { recursive: true, force: true });
for (const f of FILES) {
  const dst = path.join(UP, f);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.writeFileSync(dst, f === 'types.ts' ? types : readUpstream(f));
}
console.log(`Copied ${FILES.length} files from ${SHA}`);

execFileSync('node', [path.join(ROOT, 'scripts/apply-patches.mjs'), ROOT], { stdio: 'inherit' });
execFileSync('node', [path.join(ROOT, 'scripts/patch-worker.mjs'), ROOT], { stdio: 'inherit' });
if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
console.log('Done. Run typecheck / test / build before committing.');
