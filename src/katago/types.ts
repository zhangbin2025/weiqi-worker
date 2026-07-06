import type { BoardState, FloatArray, GameRules, Move, Player, RegionOfInterest } from '../types';

export interface KataGoInitRequest {
  type: 'katago:init';
  modelUrl: string;
  baseUrl?: string;  // 部署根目录，用于解析 WASM 路径
  debugEnabled?: boolean;  // 调试开关
}

export interface KataGoInitResponse {
  type: 'katago:init_result';
  ok: boolean;
  backend?: string;
  modelName?: string;
  error?: string;
}

export interface KataGoAnalyzeRequest {
  type: 'katago:analyze';
  id: number;
  analysisGroup?: 'interactive' | 'background';
  positionId?: string;
  parentPositionId?: string;
  modelUrl: string;
  board: BoardState;
  previousBoard?: BoardState;
  previousPreviousBoard?: BoardState;
  currentPlayer: Player;
  moveHistory: Move[];
  komi: number;
  rules?: GameRules;
  regionOfInterest?: RegionOfInterest | null;
  topK?: number;
  analysisPvLen?: number;
  includeMovesOwnership?: boolean;
  wideRootNoise?: number;
  nnRandomize?: boolean;
  conservativePass?: boolean;
  visits?: number;
  maxTimeMs?: number;
  batchSize?: number;
  maxChildren?: number;
  reportDuringSearchEveryMs?: number;
  ownershipRefreshIntervalMs?: number;
  reuseTree?: boolean;
  ownershipMode?: 'none' | 'root' | 'tree';
}

// 批量分析请求（支持 analyzeTurns）
export interface KataGoAnalyzeGameRequest {
  type: 'katago:analyze_game';
  id: number;
  modelUrl: string;
  moves: Move[];              // 所有着法
  initialStones?: Move[];     // 初始棋子（如让子）
  komi: number;
  rules?: GameRules;
  analyzeTurns?: number[];    // 要分析的回合，undefined = 所有回合
  visits?: number;
  maxTimeMs?: number;
  topK?: number;
  analysisPvLen?: number;
  includeMovesOwnership?: boolean;
  includeOwnership?: boolean;
  includeOwnershipStdev?: boolean;
  wideRootNoise?: number;
  nnRandomize?: boolean;
  conservativePass?: boolean;
}

export interface KataGoAnalysisPayload {
  rootWinRate: number;
  rootScoreLead: number;
  rootScoreSelfplay: number;
  rootScoreStdev: number;
  rootVisits: number;
  ownership: FloatArray; // len 361, +1 black owns, -1 white owns
  ownershipStdev: FloatArray; // len 361
  policy: FloatArray; // len 362, illegal = -1, pass at index 361
  moves: Array<{
    x: number;
    y: number;
    winRate: number;
    winRateLost: number;
    scoreLead: number;
    scoreSelfplay: number;
    scoreStdev: number;
    visits: number;
    pointsLost: number;
    relativePointsLost: number;
    order: number;
    prior: number;
    pv: string[];
    ownership?: FloatArray; // len 361, +1 black owns, -1 white owns (position after this move)
  }>;
}

export interface KataGoAnalyzeUpdate {
  type: 'katago:analyze_update';
  id: number;
  ok: boolean;
  canceled?: boolean;
  backend?: string;
  modelName?: string;
  analysis?: KataGoAnalysisPayload;
  error?: string;
}

export interface KataGoAnalyzeResponse {
  type: 'katago:analyze_result';
  id: number;
  ok: boolean;
  canceled?: boolean;
  backend?: string;
  modelName?: string;
  analysis?: KataGoAnalysisPayload;
  error?: string;
}

// 批量分析响应
export interface KataGoAnalyzeGameResponse {
  type: 'katago:analyze_game_result';
  id: number;
  ok: boolean;
  canceled?: boolean;
  backend?: string;
  modelName?: string;
  analyses?: Array<{
    turnNumber: number;
    analysis: KataGoAnalysisPayload;
  }>;
  error?: string;
}

export interface KataGoEvalRequest {
  type: 'katago:eval';
  id: number;
  modelUrl: string;
  board: BoardState;
  previousBoard?: BoardState;
  previousPreviousBoard?: BoardState;
  currentPlayer: Player;
  moveHistory: Move[];
  komi: number;
  rules?: GameRules;
  conservativePass?: boolean;
}

export interface KataGoEvalResponse {
  type: 'katago:eval_result';
  id: number;
  ok: boolean;
  backend?: string;
  modelName?: string;
  eval?: {
    rootWinRate: number;
    rootScoreLead: number;
    rootScoreSelfplay: number;
    rootScoreStdev: number;
  };
  error?: string;
}

export interface KataGoEvalBatchRequest {
  type: 'katago:eval_batch';
  id: number;
  modelUrl: string;
  positions: Array<{
    board: BoardState;
    previousBoard?: BoardState;
    previousPreviousBoard?: BoardState;
    currentPlayer: Player;
    moveHistory: Move[];
    komi: number;
  }>;
  rules?: GameRules;
  conservativePass?: boolean;
}

export interface KataGoEvalBatchResponse {
  type: 'katago:eval_batch_result';
  id: number;
  ok: boolean;
  backend?: string;
  modelName?: string;
  evals?: Array<{
    rootWinRate: number;
    rootScoreLead: number;
    rootScoreSelfplay: number;
    rootScoreStdev: number;
  }>;
  error?: string;
}

export interface KataGoProgressResponse {
  type: 'katago:progress';
  loaded: number;
  total: number;
  progress: number;
}

// 调试日志消息（Worker -> 主线程）
export interface KataGoDebugLog {
  type: 'katago:debug_log';
  level: 'log' | 'warn' | 'error';
  message: string;
  data?: unknown;
}

// 设置调试开关（主线程 -> Worker）
export interface KataGoSetDebug {
  type: 'katago:set_debug';
  enabled: boolean;
}

export type KataGoWorkerRequest =
  | KataGoInitRequest
  | KataGoAnalyzeRequest
  | KataGoAnalyzeGameRequest
  | KataGoEvalRequest
  | KataGoEvalBatchRequest
  | KataGoSetDebug;
export type KataGoWorkerResponse =
  | KataGoInitResponse
  | KataGoProgressResponse
  | KataGoDebugLog
  | KataGoAnalyzeUpdate
  | KataGoAnalyzeResponse
  | KataGoAnalyzeGameResponse
  | KataGoEvalResponse
  | KataGoEvalBatchResponse;
