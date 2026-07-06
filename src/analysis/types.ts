/**
 * Analysis Module - Types
 * 
 * 分析模块的类型定义
 */

import type { BoardState, GameRules, Move, Player, AnalysisPayload } from '../core/types';

/**
 * 批量分析请求
 */
export interface KataGoAnalyzeGameRequest {
  type: 'katago:analyze_game';
  id: number;
  modelUrl: string;
  moves: Move[];
  initialStones?: Move[];
  komi: number;
  rules?: GameRules;
  analyzeTurns?: number[];
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

/**
 * 批量分析响应
 */
export interface KataGoAnalyzeGameResponse {
  type: 'katago:analyze_game_result';
  id: number;
  ok: boolean;
  canceled?: boolean;
  backend?: string;
  modelName?: string;
  analyses?: Array<{
    turnNumber: number;
    analysis: AnalysisPayload;
  }>;
  error?: string;
}

/**
 * 评估请求
 */
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

/**
 * 评估响应
 */
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

/**
 * 批量评估请求
 */
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

/**
 * 批量评估响应
 */
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
