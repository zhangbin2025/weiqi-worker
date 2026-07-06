/**
 * Features Module - Types
 * 
 * 特征模块的类型定义
 */

import type { Player } from '../core/types';

/**
 * KataGo V7 输入特征
 */
export interface KataGoInputsV7 {
  /** 空间特征 [19,19,22] NHWC */
  spatial: Float32Array;
  /** 全局特征 [19] */
  global: Float32Array;
}

/**
 * 最近着法（用于特征计算）
 */
export interface RecentMove {
  /** 着法位置 0..360 或 PASS_MOVE */
  move: number;
  /** 执棋方 */
  player: Player;
}

/**
 * V7 输入临时缓冲区（用于 featuresV7.ts）
 */
export interface KataGoInputsV7Scratch {
  /** 棋子状态 (0 empty, 1 black, 2 white) */
  stones: Uint8Array;
  /** 访问标记 */
  visited: Uint8Array;
  /** 气标记 */
  libertyMarked: Uint8Array;
  /** 栈 */
  stack: number[];
  /** 群组 */
  group: number[];
  /** 接触的气 */
  touchedLibs: number[];
}

/**
 * 特征计算选项（基础版本，使用 BoardState）
 */
export interface FeatureOptionsV7 {
  /** 棋盘状态（二维数组） */
  board: import('../core/types').BoardState;
  /** 当前执棋方 */
  currentPlayer: Player;
  /** 着法历史 */
  moveHistory: import('../core/types').Move[];
  /** 贴目 */
  komi: number;
  /** 规则 */
  rules?: import('../core/types').GameRules;
  /** 保守 Pass（根节点） */
  conservativePassAndIsRoot?: boolean;
}

/**
 * 特征计算选项（快速版本，使用 Uint8Array）
 */
export interface FeatureOptionsV7Fast {
  /** 棋子状态 (0 empty, 1 black, 2 white) */
  stones: Uint8Array;
  /** 劫点位置 (0..360 或 -1) */
  koPoint: number;
  /** 当前执棋方 */
  currentPlayer: Player;
  /** 最近着法（按时间顺序，最后一项是最近着法） */
  recentMoves: RecentMove[];
  /** 贴目 */
  komi: number;
  /** 规则 */
  rules?: import('../core/types').GameRules;
  /** 保守 Pass（根节点） */
  conservativePassAndIsRoot?: boolean;
  /** 气图（每个位置的气数，上限3，仅用于棋子） */
  libertyMap?: Uint8Array;
  /** 领地图（KataGo风格，用于 plane 18/19） */
  areaMap?: Uint8Array;
  /** 被征子的棋子（V7 plane 14） */
  ladderedStones?: Uint8Array;
  /** 前一帧被征子的棋子（V7 plane 15） */
  prevLadderedStones?: Uint8Array;
  /** 前前一帧被征子的棋子（V7 plane 16） */
  prevPrevLadderedStones?: Uint8Array;
  /** 征子工作的着法（V7 plane 17） */
  ladderWorkingMoves?: Uint8Array;
}
