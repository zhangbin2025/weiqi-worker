#!/usr/bin/env node
/**
 * P4: model download progress + IndexedDB cache
 * P5: protocol adapter (gate-side init + pass normalization)
 *
 * Applied on top of apply-patches.mjs. See docs/UPSTREAM.md.
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.argv[2] ?? process.cwd();
const UP = path.join(ROOT, 'src', 'upstream');
const W = path.join(UP, 'engine', 'katago', 'worker.ts');

let s = fs.readFileSync(W, 'utf8');
function sub(needle, replacement, label) {
  const n = s.split(needle).length - 1;
  if (n !== 1) throw new Error(`[${label}] expected 1 occurrence, found ${n}`);
  s = s.replace(needle, replacement);
  console.log(`  ok ${label}`);
}

// ---------------------------------------------------------------------------
// P5a  Protocol adapter: gate client sends katago:init with baseUrl
//      (not backend), and moveHistory may contain {pass:true}.
//      Normalize at the very top of the onmessage handler, before the queue.
// ---------------------------------------------------------------------------
sub(
  `self.onmessage = (ev: MessageEvent<KataGoWorkerRequest>) => {
  const msg = ev.data;`,
  `self.onmessage = (ev: MessageEvent<KataGoWorkerRequest>) => {
  // P5 (weiqi-worker): adapt the gate-side protocol to the upstream protocol.
  //   * gate init carries baseUrl, no backend -> let normalize()
  //     pick the default (webgpu -> webgl -> wasm -> cpu).
  //   * gate moveHistory may carry {pass:true,player} instead of x/y -1.
  //     Upstream positionInputsV7 checks m.x<0||m.y<0, so normalize here.
  const raw = ev.data as KataGoWorkerRequest & {
    moveHistory?: Array<{ x: number; y: number; player: Player } | { pass: true; player: Player }>;
  };
  let msg: KataGoWorkerRequest = raw;
  if (raw.type === 'katago:init') {
    // Strip gate-only fields; upstream KataGoInitRequest has no baseUrl.
    const { baseUrl: _baseUrl, ...rest } = raw as typeof raw & {
      baseUrl?: string;
    };
    msg = rest as KataGoWorkerRequest;
  }
  if ('moveHistory' in msg && Array.isArray((msg as typeof raw).moveHistory)) {
    const moves = (msg as typeof raw).moveHistory!;
    msg = {
      ...msg,
      moveHistory: moves.map((m) =>
        'pass' in m && m.pass ? { x: -1, y: -1, player: m.player } : m,
      ),
    } as unknown as KataGoWorkerRequest;
  }`,
  'P5 protocol adapter');

// ---------------------------------------------------------------------------
// P4a  Insert IndexedDB cache helpers right after maybeUngzip().
// ---------------------------------------------------------------------------
sub(
  `function maybeUngzip(data: Uint8Array): Uint8Array {
  // gzip magic bytes 0x1f8b
  if (data.length >= 2 && data[0] === 0x1f && data[1] === 0x8b) return pako.ungzip(data);
  return data;
}`,
  `function maybeUngzip(data: Uint8Array): Uint8Array {
  // gzip magic bytes 0x1f8b
  if (data.length >= 2 && data[0] === 0x1f && data[1] === 0x8b) return pako.ungzip(data);
  return data;
}

// ---- P4 (weiqi-worker): IndexedDB model cache ----------------------------
// Browser Cache Storage cannot be used here: Cloudflare Worker Assets responses
// cannot be written via Cache.put (NetworkError). IndexedDB works inside a Web
// Worker, is not subject to cross-origin/cache-header constraints, and persists
// across reloads. This avoids re-downloading the 93MB remote model on refresh.
const MODEL_DB_NAME = 'katago-models-idb-v1';
const MODEL_STORE = 'models';

function normalizeModelKey(modelUrl: string): string {
  try {
    if (modelUrl.startsWith('http://') || modelUrl.startsWith('https://')) return modelUrl;
    const origin = self.location && self.location.origin ? self.location.origin : '';
    return new URL(modelUrl, origin || 'https://bot.weiqi.lol').href;
  } catch {
    return modelUrl;
  }
}

async function getModelStore(mode: IDBTransactionMode): Promise<IDBObjectStore | null> {
  try {
    if (typeof indexedDB === 'undefined') return null;
    return await new Promise<IDBObjectStore>((resolve, reject) => {
      const req = indexedDB.open(MODEL_DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(MODEL_STORE)) db.createObjectStore(MODEL_STORE);
      };
      req.onsuccess = () => {
        const db = req.result;
        try { resolve(db.transaction(MODEL_STORE, mode).objectStore(MODEL_STORE)); }
        catch (e) { reject(e); }
      };
      req.onerror = () => reject(req.error);
    });
  } catch { return null; }
}

async function idbGetBuffer(key: string): Promise<ArrayBuffer | null> {
  const store = await getModelStore('readonly');
  if (!store) return null;
  return await new Promise<ArrayBuffer | null>((resolve) => {
    try {
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as ArrayBuffer) ?? null);
      req.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}

async function idbPutBuffer(key: string, buf: ArrayBufferLike): Promise<boolean> {
  const store = await getModelStore('readwrite');
  if (!store) return false;
  return await new Promise<boolean>((resolve) => {
    try {
      const req = store.put(buf, key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch { resolve(false); }
  });
}

/** Stream a fetch response, emitting katago:progress and persisting to IDB. */
async function fetchModelBytes(modelUrl: string): Promise<Uint8Array> {
  const res = await fetch(modelUrl);
  if (!res.ok) throw new Error(\`Failed to fetch model: \${res.status} \${res.statusText}\`);
  let buf: Uint8Array;
  if (res.body) {
    const contentLength = res.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;
    let loaded = 0;
    const chunks: Uint8Array[] = [];
    const reader = res.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      if (total > 0) {
        post({ type: 'katago:progress', loaded, total, progress: Math.min((loaded / total) * 100, 100) });
      }
    }
    buf = new Uint8Array(loaded);
    let offset = 0;
    for (const chunk of chunks) { buf.set(chunk, offset); offset += chunk.length; }
  } else {
    buf = new Uint8Array(await res.arrayBuffer());
  }
  const key = normalizeModelKey(modelUrl);
  try {
    await idbPutBuffer(key, buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  } catch { /* cache write is best-effort */ }
  return buf;
}`,
  'P4 IDB helpers');

// ---------------------------------------------------------------------------
// P4b  Replace the fetch block inside ensureModel() with cache-aware load.
// ---------------------------------------------------------------------------
sub(
  `  const res = await fetch(modelUrl);
  if (!res.ok) throw new Error(\`Failed to fetch model: \${res.status} \${res.statusText}\`);
  const buf = new Uint8Array(await res.arrayBuffer());
  if (looksLikeMarkup(buf)) throw modelResponseError(modelUrl);
  const data = maybeUngzip(buf);

  const parsed = parseKataGoModelV8(data);`,
  `  // P4: prefer IndexedDB cache, otherwise stream with progress + persist.
  const key = normalizeModelKey(modelUrl);
  let buf: Uint8Array | null = null;
  try {
    const cached = await idbGetBuffer(key);
    if (cached && cached.byteLength > 0) buf = new Uint8Array(cached);
  } catch { /* fall through to network */ }
  if (!buf) buf = await fetchModelBytes(modelUrl);
  if (looksLikeMarkup(buf)) throw modelResponseError(modelUrl);
  const data = maybeUngzip(buf);

  const parsed = parseKataGoModelV8(data);`,
  'P4 ensureModel');

fs.writeFileSync(W, s);
console.log('P4 + P5 applied to', W);
