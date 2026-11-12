#!/usr/bin/env node
/**
 * weiqi-worker / upstream web-katrain patch application
 *
 * Upstream: Sir-Teo/web-katrain @ a6a67d645048a996d606a410c4e4c4b1051ffd43
 *
 * This script transforms a pristine 29-file engine closure (src/upstream/) into
 * the weiqi-worker-compatible form. It is IDEMPOTENT over a pristine upstream
 * tree: run it once after sync.mjs refreshes src/upstream/.
 *
 * Patches (all documented in docs/UPSTREAM.md):
 *  P1 webgl backend in the preference type + backend chain + warmup fallback
 *  P2 WEBGL_DELETE_TEXTURE_THRESHOLD=0 (review 199-move GPU texture leak)
 *  P3 WASM path: publicUrl() -> relative '../tfjs/' (weiqi-bot base:'' subpath deploy)
 *  P4 model download progress (katago:progress) + IndexedDB model cache
 *  P5 protocol adapter: accept gate-side init(baseUrl), pass-normalize moveHistory
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] ?? process.cwd();
const UP = path.join(ROOT, 'src', 'upstream');

const read = (p) => fs.readFileSync(path.join(UP, p), 'utf8');
const write = (p, s) => fs.writeFileSync(path.join(UP, p), s);

/** Assert a unique needle exists, then replace it. Throws on drift (upgrade guard). */
function sub(p, needle, replacement, label) {
  const s = read(p);
  const n = s.split(needle).length - 1;
  if (n !== 1) throw new Error(`[${label}] ${p}: expected 1 occurrence, found ${n}`);
  write(p, s.replace(needle, replacement));
  console.log(`  ok ${label}: ${p}`);
}

console.log(`Applying weiqi-worker patches to ${UP}`);

// ---------------------------------------------------------------------------
// P1a  types.ts: add 'webgl' to KataGoBackendPreference
// ---------------------------------------------------------------------------
sub('types.ts',
  "export type KataGoBackendPreference = 'wasm' | 'webgpu' | 'cpu';",
  "export type KataGoBackendPreference = 'wasm' | 'webgpu' | 'webgl' | 'cpu';",
  'P1a backend type');

// ---------------------------------------------------------------------------
// P1b  backendFallback.ts: normalize + warmup fallback chain
//      webgpu -> webgl -> wasm -> cpu
// ---------------------------------------------------------------------------
sub('engine/katago/backendFallback.ts',
  `export const normalizeKataGoBackendPreference = (
  backend?: KataGoBackendPreference | null
): KataGoBackendPreference => (backend === 'wasm' || backend === 'cpu' ? backend : 'webgpu');`,
  `export const normalizeKataGoBackendPreference = (
  backend?: KataGoBackendPreference | null
): KataGoBackendPreference =>
  backend === 'wasm' || backend === 'cpu' || backend === 'webgl' || backend === 'webgpu'
    ? backend
    : 'webgpu';`,
  'P1b normalize');

sub('engine/katago/backendFallback.ts',
  `  const activeBackend = args.activeBackend?.trim().toLowerCase();
  if (args.requestedBackend === 'webgpu' && activeBackend === 'webgpu') return 'wasm';
  if (args.requestedBackend !== 'cpu' && activeBackend === 'wasm') return 'cpu';
  return null;`,
  `  const activeBackend = args.activeBackend?.trim().toLowerCase();
  // webgpu -> webgl -> wasm -> cpu. Both the setBackend failure chain and the
  // warmup failure chain must agree, otherwise a warmup failure skips webgl
  // and lands on single-threaded WASM (the regression we are avoiding).
  if (activeBackend === 'webgpu' && args.requestedBackend !== 'cpu') return 'webgl';
  if (activeBackend === 'webgl' && args.requestedBackend !== 'cpu') return 'wasm';
  if (activeBackend === 'wasm' && args.requestedBackend !== 'cpu') return 'cpu';
  return null;`,
  'P1b warmup fallback');

// ---------------------------------------------------------------------------
// P1c  worker.ts initBackend(): insert webgl between webgpu and wasm
// ---------------------------------------------------------------------------
sub('engine/katago/worker.ts',
  `  if (preferredBackend === 'webgpu') {
    try {
      if (!(await tf.setBackend('webgpu'))) throw new Error('tf.setBackend(\\'webgpu\\') returned false');
      await tf.ready();
      return;
    } catch (err) {
      // Fall back to WASM/CPU if WebGPU isn't available or fails to initialize.
      backendNote = \`WebGPU backend failed (\${describeError(err)}); trying WASM\`;
    }
  }

  await initWasmBackend();`,
  `  if (preferredBackend === 'webgpu') {
    try {
      if (!(await tf.setBackend('webgpu'))) throw new Error('tf.setBackend(\\'webgpu\\') returned false');
      await tf.ready();
      return;
    } catch (err) {
      // WebGPU is unavailable on many terminals. Try WebGL (registered by the
      // @tensorflow/tfjs union package) before falling back to WASM/CPU.
      backendNote = \`WebGPU backend failed (\${describeError(err)}); trying WebGL\`;
    }
  }

  if (preferredBackend === 'webgpu' || preferredBackend === 'webgl') {
    try {
      if (!(await tf.setBackend('webgl'))) throw new Error('tf.setBackend(\\'webgl\\') returned false');
      await tf.ready();
      return;
    } catch (err) {
      backendNote = [backendNote, \`WebGL backend failed (\${describeError(err)}); trying WASM\`]
        .filter(Boolean)
        .join('. ');
    }
  }

  await initWasmBackend();`,
  'P1c initBackend webgl');

// ---------------------------------------------------------------------------
// P2  WEBGL_DELETE_TEXTURE_THRESHOLD=0. Since webgl is now in the chain,
//     the review-time GPU texture leak fix must be kept.
// ---------------------------------------------------------------------------
sub('engine/katago/worker.ts',
  `import { setThreadsCount, setWasmPaths } from '@tensorflow/tfjs-backend-wasm';
import pako from 'pako';`,
  `import { setThreadsCount, setWasmPaths } from '@tensorflow/tfjs-backend-wasm';
import pako from 'pako';

// P2 (weiqi-worker): TFJS WebGL caches GL textures for unused tensors; a full
// game review accumulates thousands of NN evals and VRAM grows unbounded.
// Setting the threshold to 0 disposes unused textures immediately.
try {
  tf.env().set('WEBGL_DELETE_TEXTURE_THRESHOLD', 0);
} catch {
  // Some TFJS builds/backends do not expose this flag; ignore.
}`,
  'P2 texture threshold');

// ---------------------------------------------------------------------------
// P3  WASM path. Upstream publicUrl('tfjs/') uses import.meta.env.BASE_URL
//     (absolute '/'), but weiqi-bot deploys under subpaths with base:''.
//     Relative '../tfjs/' resolves against assets/worker.js as it does today.
// ---------------------------------------------------------------------------
sub('engine/katago/worker.ts',
  `    setWasmPaths(publicUrl('tfjs/'));`,
  `    // P3 (weiqi-worker): relative to assets/worker.js. publicUrl() relies on
    // BASE_URL which is '' for weiqi-bot's subpath deployment.
    setWasmPaths('../tfjs/');`,
  'P3 wasm path');

// remove the now-unused import to satisfy noUnusedLocals-style builds
sub('engine/katago/worker.ts',
  `import { publicUrl } from '../../utils/publicUrl';\n`,
  ``,
  'P3 drop publicUrl import');

// ---------------------------------------------------------------------------
// P4  types.ts (protocol): add progress + notice to the response union.
//     Gate-side client.ts already handles katago:progress.
// ---------------------------------------------------------------------------
sub('engine/katago/types.ts',
  `export type KataGoWorkerResponse =
  | KataGoNotice`,
  `/** P4 (weiqi-worker): streamed model-download progress, consumed by the gate client. */
export interface KataGoProgressResponse {
  type: 'katago:progress';
  loaded: number;
  total: number;
  progress: number;
}

export type KataGoWorkerResponse =
  | KataGoProgressResponse
  | KataGoNotice`,
  'P4 progress response type');

console.log('Patches P1-P4 (types/backend) applied.');
console.log('P4 download/IDB + P5 protocol adapter are applied by patch-worker.mjs');
