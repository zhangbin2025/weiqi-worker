/**
 * Worker Module - Types
 * 
 * Worker 模块的类型定义
 */

import type { BoardState, GameRules, Move, Player, RegionOfInterest, AnalysisPayload, BackendType, ModelInfo } from '../core/types';

/**
 * 初始化请求
 */
export interface KataGoInitRequest {
  type: 'katago:init';
  modelUrl: string;
  baseUrl?: string;
  debugEnabled?: boolean;
}

/**
 * 初始化响应
 */
export interface KataGoInitResponse {
  type: 'katago:init_result';
  ok: boolean;
  backend?: string;
  modelName?: string;
  error?: string;
}

/**
 * 分析请求
 */
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

/**
 * 分析更新
 */
export interface KataGoAnalyzeUpdate {
  type: 'katago:analyze_update';
  id: number;
  ok: boolean;
  canceled?: boolean;
  backend?: string;
  modelName?: string;
  analysis?: AnalysisPayload;
  error?: string;
}

/**
 * 分析响应
 */
export interface KataGoAnalyzeResponse {
  type: 'katago:analyze_result';
  id: number;
  ok: boolean;
  canceled?: boolean;
  backend?: string;
  modelName?: string;
  analysis?: AnalysisPayload;
  error?: string;
}

/**
 * 进度响应
 */
export interface KataGoProgressResponse {
  type: 'katago:progress';
  loaded: number;
  total: number;
  progress: number;
}

/**
 * 调试日志消息
 */
export interface KataGoDebugLog {
  type: 'katago:debug_log';
  level: 'log' | 'warn' | 'error';
  message: string;
  data?: unknown;
}

/**
 * 设置调试开关
 */
export interface KataGoSetDebug {
  type: 'katago:set_debug';
  enabled: boolean;
}

/**
 * Worker 请求类型联合
 */
export type KataGoWorkerRequest =
  | KataGoInitRequest
  | KataGoAnalyzeRequest
  | import('../analysis').KataGoAnalyzeGameRequest
  | import('../analysis').KataGoEvalRequest
  | import('../analysis').KataGoEvalBatchRequest
  | KataGoSetDebug;

/**
 * Worker 响应类型联合
 */
export type KataGoWorkerResponse =
  | KataGoInitResponse
  | KataGoProgressResponse
  | KataGoDebugLog
  | KataGoAnalyzeUpdate
  | KataGoAnalyzeResponse
  | import('../analysis').KataGoAnalyzeGameResponse
  | import('../analysis').KataGoEvalResponse
  | import('../analysis').KataGoEvalBatchResponse;
