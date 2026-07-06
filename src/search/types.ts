/**
 * Search Module - Types
 * 
 * 搜索模块的类型定义
 */

import type { FloatArray, Player } from '../core/types';

/**
 * 所有权模式
 */
export type OwnershipMode = 'none' | 'root' | 'tree';

/**
 * MCTS 树节点
 */
export interface MCTSNode {
  /** 执棋方 */
  readonly playerToMove: number;
  /** 访问次数 */
  visits: number;
  /** 价值总和 */
  valueSum: number;
  /** 得分领先总和 */
  scoreLeadSum: number;
  /** 得分均值总和 */
  scoreMeanSum: number;
  /** 得分均值平方总和 */
  scoreMeanSqSum: number;
  /** 效用总和 */
  utilitySum: number;
  /** 效用平方总和 */
  utilitySqSum: number;
  /** NN 效用 */
  nnUtility: number | null;
  /** 所有权 */
  ownership: Float32Array | null;
  /** 在途节点数 */
  inFlight: number;
  /** 待评估标记 */
  pendingEval: boolean;
  /** 边 */
  edges: MCTSEdge[] | null;
}

/**
 * MCTS 边
 */
export interface MCTSEdge {
  /** 着法位置 */
  move: number;
  /** 先验概率 */
  prior: number;
  /** 子节点 */
  child: MCTSNode | null;
  /** PV 缓存 */
  pvCache?: { visits: number; depth: number; pv: string[] };
}

/**
 * MCTS 搜索选项
 */
export interface MCTSSearchOptions {
  /** 模型 */
  model: unknown;
  /** 棋盘状态 */
  board: import('../core/types').BoardState;
  /** 前一帧棋盘 */
  previousBoard?: import('../core/types').BoardState;
  /** 前前一帧棋盘 */
  previousPreviousBoard?: import('../core/types').BoardState;
  /** 当前执棋方 */
  currentPlayer: Player;
  /** 着法历史 */
  moveHistory: import('../core/types').Move[];
  /** 贴目 */
  komi: number;
  /** 规则 */
  rules: import('../core/types').GameRules;
  /** 最大子节点数 */
  maxChildren: number;
  /** 所有权模式 */
  ownershipMode: OwnershipMode;
  /** 根节点噪声 */
  wideRootNoise: number;
  /** 是否随机化神经网络 */
  nnRandomize: boolean;
  /** 保守 Pass */
  conservativePass: boolean;
  /** 区域兴趣 */
  regionOfInterest?: import('../core/types').RegionOfInterest | null;
}

/**
 * MCTS 运行选项
 */
export interface MCTSRunOptions {
  /** 访问次数限制 */
  visits: number;
  /** 最大时间限制（毫秒） */
  maxTimeMs: number;
  /** 批大小 */
  batchSize: number;
  /** 是否中止 */
  shouldAbort?: () => boolean;
}

/**
 * MCTS 分析选项
 */
export interface MCTSAnalysisOptions {
  /** 返回前 K 个候选着法 */
  topK: number;
  /** 是否包含着法所有权 */
  includeMovesOwnership: boolean;
  /** 变化图长度 */
  analysisPvLen: number;
  /** 是否克隆缓冲区 */
  cloneBuffers: boolean;
  /** 所有权刷新间隔（毫秒） */
  ownershipRefreshIntervalMs?: number;
}
