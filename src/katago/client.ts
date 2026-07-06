import type { KataGoWorkerRequest, KataGoWorkerResponse } from './types';
import type { BoardState, GameRules, Move, Player, RegionOfInterest } from '../types';

type Analysis = NonNullable<Extract<KataGoWorkerResponse, { type: 'katago:analyze_result' }>['analysis']>;
type EvalResult = NonNullable<Extract<KataGoWorkerResponse, { type: 'katago:eval_result' }>['eval']>;
type EvalBatchResult = NonNullable<Extract<KataGoWorkerResponse, { type: 'katago:eval_batch_result' }>['evals']>;

const takeLastMoves = (moves: Move[]): Move[] => (moves.length <= 30 ? moves : moves.slice(moves.length - 30));

export class KataGoCanceledError extends Error {
  readonly canceled = true;

  constructor(message = 'Analysis canceled') {
    super(message);
    this.name = 'KataGoCanceledError';
  }
}

export const isKataGoCanceledError = (err: unknown): err is KataGoCanceledError => {
  if (!err || typeof err !== 'object') return false;
  if ((err as { canceled?: boolean }).canceled) return true;
  return err instanceof Error && err.name === 'KataGoCanceledError';
};

/**
 * Worker URL 覆盖（用于子目录部署）
 */
let workerUrlOverride: string | null = null;

/**
 * 设置 Worker URL（在子目录部署时使用）
 * @param url Worker 文件的完整 URL，如 '/dist-web/assets/worker.js'
 */
export function setWorkerUrl(url: string): void {
  workerUrlOverride = url;
}

/**
 * Worker URL - 使用 Vite 的 Worker 单独打包
 * Vite 会自动识别 new URL('./worker.ts', import.meta.url) 模式
 * 并输出单独的 worker.js 文件
 */
// 使用 Vite 推荐的 Worker 导入方式
const defaultWorkerUrl = new URL('./worker.ts', import.meta.url).href;

/**
 * 获取 Worker URL
 */
function getWorkerUrl(): string {
  if (workerUrlOverride) {
    return workerUrlOverride;
  }
  // 默认使用 vite 构建的静态路径
  return defaultWorkerUrl;
}

class KataGoEngineClient {
  private worker: Worker | null = null;
  private nextId = 1;
  private pendingInit: { resolve: () => void; reject: (e: Error) => void } | null = null;
  private pending = new Map<
    number,
    { resolve: (a: Analysis) => void; reject: (e: Error) => void; onProgress?: (a: Analysis) => void }
  >();
  private pendingEval = new Map<number, { resolve: (e: EvalResult) => void; reject: (e: Error) => void }>();
  private pendingEvalBatch = new Map<number, { resolve: (e: EvalBatchResult) => void; reject: (e: Error) => void }>();
  private backend: string | null = null;
  private modelName: string | null = null;
  private lastLoggedEngineLabel: string | null = null;
  private pendingProgress: ((loaded: number, total: number, progress: number) => void) | null = null;

  /**
   * 设置调试模式
   * @param enabled - 是否启用调试日志
   */
  setDebugEnabled(enabled: boolean): void {
    this.ensureWorker();
    this.worker!.postMessage({
      type: 'katago:set_debug',
      enabled
    });
  }

  /**
   * 确保 Worker 已创建
   */
  private ensureWorker(): void {
    if (this.worker) return;
    
    const workerUrl = getWorkerUrl();
    this.worker = new Worker(workerUrl, { type: 'module' });

    // 设置消息处理器
    this.worker.onmessage = (ev: MessageEvent<KataGoWorkerResponse>) => {
      const msg = ev.data;
      this.handleMessage(msg);
    };
  }

  /**
   * 处理 Worker 消息
   */
  private handleMessage(msg: KataGoWorkerResponse): void {
      // 处理调试日志
      if (msg.type === 'katago:debug_log') {
        const prefix = `[KataGo:${msg.level.toUpperCase()}]`;
        const fullMessage = `${prefix} ${msg.message}`;
        if (msg.data !== undefined) {
          console[msg.level](fullMessage, msg.data);
        } else {
          console[msg.level](fullMessage);
        }
        return;
      }
      
      if (msg.type === 'katago:init_result') {
        const pendingInit = this.pendingInit;
        if (!pendingInit) return;
        this.pendingInit = null;
        this.pendingProgress = null;  // 清除进度回调
        if (msg.ok) {
          this.syncEngineInfo(msg);
        }
        if (!msg.ok) pendingInit.reject(new Error(msg.error ?? 'Init failed'));
        else pendingInit.resolve();
        return;
      }
      if (msg.type === 'katago:progress') {
        // 处理下载进度
        if (this.pendingProgress) {
          this.pendingProgress(msg.loaded, msg.total, msg.progress);
        }
        return;
      }
      if (msg.type === 'katago:analyze_update') {
        const pending = this.pending.get(msg.id);
        if (!pending) return;
        if (msg.canceled || msg.error === 'canceled') return;
        this.syncEngineInfo(msg);
        if (!msg.ok || !msg.analysis) return;
        pending.onProgress?.(msg.analysis);
        return;
      }
      if (msg.type === 'katago:analyze_result') {
        const pending = this.pending.get(msg.id);
        if (!pending) return;
        this.pending.delete(msg.id);
        if (msg.canceled || msg.error === 'canceled') {
          pending.reject(new KataGoCanceledError());
          return;
        }
        this.syncEngineInfo(msg);
        if (!msg.ok || !msg.analysis) pending.reject(new Error(msg.error ?? 'Analysis failed'));
        else pending.resolve(msg.analysis);
        return;
      }
      if (msg.type === 'katago:eval_result') {
        const pending = this.pendingEval.get(msg.id);
        if (!pending) return;
        this.pendingEval.delete(msg.id);
        this.syncEngineInfo(msg);
        if (!msg.ok || !msg.eval) pending.reject(new Error(msg.error ?? 'Eval failed'));
        else pending.resolve(msg.eval);
        return;
      }
      if (msg.type === 'katago:eval_batch_result') {
        const pending = this.pendingEvalBatch.get(msg.id);
        if (!pending) return;
        this.pendingEvalBatch.delete(msg.id);
        this.syncEngineInfo(msg);
        if (!msg.ok || !msg.evals) pending.reject(new Error(msg.error ?? 'Eval batch failed'));
        else pending.resolve(msg.evals);
      }
  }

  private syncEngineInfo(msg: { backend?: string; modelName?: string }): void {
    let changed = false;
    if (typeof msg.backend === 'string' && msg.backend !== this.backend) {
      this.backend = msg.backend;
      changed = true;
    }
    if (typeof msg.modelName === 'string' && msg.modelName !== this.modelName) {
      this.modelName = msg.modelName;
      changed = true;
    }
    if (!changed) return;

    const parts: string[] = [];
    if (this.backend) parts.push(this.backend);
    if (this.modelName) parts.push(this.modelName);
    const label = parts.join(' / ');
    if (!label || label === this.lastLoggedEngineLabel) return;
    this.lastLoggedEngineLabel = label;
  }

  getEngineInfo(): { backend: string | null; modelName: string | null } {
    return { backend: this.backend, modelName: this.modelName };
  }

  init(modelUrl: string, onProgress?: (loaded: number, total: number, progress: number) => void, baseUrl?: string): Promise<void> {
    this.ensureWorker();
    if (this.pendingInit) return Promise.reject(new Error('Init already in progress'));
    
    // 检查 localStorage 中的调试开关
    const debugEnabled = typeof localStorage !== 'undefined' && localStorage.getItem('KATAGO_DEBUG') === 'true';
    console.log('[KataGo Client] init() called, debugEnabled:', debugEnabled);
    
    return new Promise<void>((resolve, reject) => {
      this.pendingInit = { resolve, reject };
      
      // 设置进度回调
      if (onProgress) {
        this.pendingProgress = onProgress;
      }
      
      const initMsg: KataGoWorkerRequest = { 
        type: 'katago:init', 
        modelUrl, 
        baseUrl,
        debugEnabled  // 传递调试开关
      };
      console.log('[KataGo Client] Sending init message to worker:', { debugEnabled, modelUrl });
      this.worker!.postMessage(initMsg);
    });
  }

  async analyze(args: {
    analysisGroup?: 'interactive' | 'background' | undefined;
    positionId?: string | undefined;
    parentPositionId?: string | undefined;
    modelUrl: string;
    board: BoardState;
    previousBoard?: BoardState | undefined;
    previousPreviousBoard?: BoardState | undefined;
    currentPlayer: Player;
    moveHistory: Move[];
    komi: number;
    rules?: GameRules | undefined;
    regionOfInterest?: RegionOfInterest | null | undefined;
    topK?: number | undefined;
    analysisPvLen?: number | undefined;
    includeMovesOwnership?: boolean | undefined;
    wideRootNoise?: number | undefined;
    nnRandomize?: boolean | undefined;
    conservativePass?: boolean | undefined;
    visits?: number | undefined;
    maxTimeMs?: number | undefined;
    batchSize?: number | undefined;
    maxChildren?: number | undefined;
    reportDuringSearchEveryMs?: number | undefined;
    ownershipRefreshIntervalMs?: number | undefined;
    reuseTree?: boolean | undefined;
    ownershipMode?: 'none' | 'root' | 'tree' | undefined;
    onProgress?: ((analysis: Analysis) => void) | undefined;
  }): Promise<Analysis> {
    this.ensureWorker();
    const id = this.nextId++;
    const req: KataGoWorkerRequest = {
      type: 'katago:analyze',
      id,
      analysisGroup: args.analysisGroup,
      positionId: args.positionId,
      parentPositionId: args.parentPositionId,
      modelUrl: args.modelUrl,
      board: args.board,
      previousBoard: args.previousBoard,
      previousPreviousBoard: args.previousPreviousBoard,
      currentPlayer: args.currentPlayer,
      moveHistory: takeLastMoves(args.moveHistory),
      komi: args.komi,
      rules: args.rules,
      regionOfInterest: args.regionOfInterest,
      topK: args.topK,
      analysisPvLen: args.analysisPvLen,
      includeMovesOwnership: args.includeMovesOwnership,
      wideRootNoise: args.wideRootNoise,
      nnRandomize: args.nnRandomize,
      conservativePass: args.conservativePass,
      visits: args.visits,
      maxTimeMs: args.maxTimeMs,
      batchSize: args.batchSize,
      maxChildren: args.maxChildren,
      reportDuringSearchEveryMs: args.reportDuringSearchEveryMs,
      ownershipRefreshIntervalMs: args.ownershipRefreshIntervalMs,
      reuseTree: args.reuseTree,
      ownershipMode: args.ownershipMode,
    };
    const promise = new Promise<Analysis>((resolve, reject) => {
      this.pending.set(id, { resolve, reject, onProgress: args.onProgress });
    });
    this.worker!.postMessage(req);
    return promise;
  }

  async evaluate(args: {
    modelUrl: string;
    board: BoardState;
    previousBoard?: BoardState | undefined;
    previousPreviousBoard?: BoardState | undefined;
    currentPlayer: Player;
    moveHistory: Move[];
    komi: number;
    rules?: GameRules | undefined;
    conservativePass?: boolean | undefined;
  }): Promise<EvalResult> {
    this.ensureWorker();
    const id = this.nextId++;
    const req: KataGoWorkerRequest = {
      type: 'katago:eval',
      id,
      modelUrl: args.modelUrl,
      board: args.board,
      previousBoard: args.previousBoard,
      previousPreviousBoard: args.previousPreviousBoard,
      currentPlayer: args.currentPlayer,
      moveHistory: takeLastMoves(args.moveHistory),
      komi: args.komi,
      rules: args.rules,
      conservativePass: args.conservativePass,
    };
    const promise = new Promise<EvalResult>((resolve, reject) => {
      this.pendingEval.set(id, { resolve, reject });
    });
    this.worker!.postMessage(req);
    return promise;
  }

  async evaluateBatch(args: {
    modelUrl: string;
    positions: Array<{
      board: BoardState;
      previousBoard?: BoardState | undefined;
      previousPreviousBoard?: BoardState | undefined;
      currentPlayer: Player;
      moveHistory: Move[];
      komi: number;
    }>;
    rules?: GameRules | undefined;
    conservativePass?: boolean | undefined;
  }): Promise<EvalBatchResult> {
    this.ensureWorker();
    const id = this.nextId++;
    const req: KataGoWorkerRequest = {
      type: 'katago:eval_batch',
      id,
      modelUrl: args.modelUrl,
      positions: args.positions.map((p) => ({
        board: p.board,
        previousBoard: p.previousBoard,
        previousPreviousBoard: p.previousPreviousBoard,
        currentPlayer: p.currentPlayer,
        moveHistory: takeLastMoves(p.moveHistory),
        komi: p.komi,
      })),
      rules: args.rules,
      conservativePass: args.conservativePass,
    };
    const promise = new Promise<EvalBatchResult>((resolve, reject) => {
      this.pendingEvalBatch.set(id, { resolve, reject });
    });
    this.worker!.postMessage(req);
    return promise;
  }
}

let singleton: KataGoEngineClient | null = null;

export function getKataGoEngineClient(): KataGoEngineClient {
  if (!singleton) singleton = new KataGoEngineClient();
  return singleton;
}
