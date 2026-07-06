/**
 * Board Module - Types
 * 
 * 棋盘模块的类型定义
 */

/**
 * 石头颜色（内部表示）
 * - 0: 空
 * - 1: 黑
 * - 2: 白
 */
export type StoneColor = 0 | 1 | 2;

/**
 * 棋盘位置（模拟用）
 */
export interface SimPosition {
  /** 棋子状态（Uint8Array，长度为 BOARD_AREA） */
  stones: Uint8Array;
  /** 劫点位置（0..360 或 -1） */
  koPoint: number;
}

/**
 * 撤销快照
 */
export interface UndoSnapshot {
  /** 着法前的劫点 */
  readonly koPointBefore: number;
  /** 提子栈的起始位置 */
  readonly captureStart: number;
}

/**
 * 群组信息
 */
export interface GroupInfo {
  /** 群组长度 */
  groupLen: number;
  /** 气的数量 */
  liberties: number;
}

/**
 * 征子特征（KataGo V7）
 */
export interface KataGoLadderFeaturesV7 {
  /** 被征子的棋子（plane 14） */
  ladderedStones: Uint8Array;
  /** 征子工作的着法（plane 17） */
  ladderWorkingMoves: Uint8Array;
}
