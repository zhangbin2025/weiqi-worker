/**
 * Board Module - Board Simulator
 * 
 * 棋盘模拟操作：playMove, undoMove
 * 
 * 这些函数是棋盘模拟的核心，用于：
 * - MCTS 搜索树构建
 * - 征子检测
 * - 着法合法性检查
 */

import type { StoneColor, SimPosition, UndoSnapshot } from './types';
import { EMPTY, opponentOf } from './constants';
import {
  BOARD_AREA,
  PASS_MOVE,
  NEIGHBOR_STARTS,
  NEIGHBOR_COUNTS,
  NEIGHBOR_LIST,
  getProcessedGroup,
  getProcessedStamp,
  incrementProcessedStamp,
  getGroupBuf,
} from './BoardState';
import { collectGroupAndLiberties } from './GroupCollector';

/**
 * 执行着法
 * 
 * @param pos - 棋盘位置（会被修改）
 * @param move - 着法位置（0..360 或 PASS_MOVE）
 * @param player - 执棋方（BLACK 或 WHITE）
 * @param captureStack - 提子栈（用于撤销）
 * @returns 撤销快照
 * @throws 如果着法非法（占据位置、劫、自杀）
 */
export function playMove(
  pos: SimPosition,
  move: number,
  player: StoneColor,
  captureStack: number[]
): UndoSnapshot {
  const koPointBefore = pos.koPoint;
  const captureStart = captureStack.length;

  // Pass 着法
  if (move === PASS_MOVE) {
    pos.koPoint = -1;
    return { koPointBefore, captureStart };
  }

  // 合法性检查
  if (move < 0 || move >= BOARD_AREA) throw new Error(`Invalid move index ${move}`);
  if (pos.stones[move] !== EMPTY) throw new Error('Move on occupied point');
  if (pos.koPoint === move) throw new Error('Move violates simple ko');

  const opp = opponentOf(player);
  pos.stones[move] = player;

  let totalCaptured = 0;
  let capturedSinglePos = -1;

  // 提子处理
  const pStamp = incrementProcessedStamp();
  const PROCESSED_GROUP = getProcessedGroup();
  const GROUP_BUF = getGroupBuf();

  const mStart = NEIGHBOR_STARTS[move]!;
  const mCount = NEIGHBOR_COUNTS[move]!;
  for (let i = 0; i < mCount; i++) {
    const n = NEIGHBOR_LIST[mStart + i]!;
    if ((pos.stones[n] as StoneColor) !== opp) continue;
    if (PROCESSED_GROUP[n] === pStamp) continue;

    const { groupLen, liberties } = collectGroupAndLiberties(pos.stones, n, opp, 1);
    for (let j = 0; j < groupLen; j++) PROCESSED_GROUP[GROUP_BUF[j]!] = pStamp;

    if (liberties !== 0) continue;

    // 提子
    for (let j = 0; j < groupLen; j++) {
      const gp = GROUP_BUF[j]!;
      pos.stones[gp] = EMPTY;
      captureStack.push(gp);
    }

    totalCaptured += groupLen;
    if (totalCaptured === 1 && groupLen === 1) capturedSinglePos = GROUP_BUF[0]!;
    if (totalCaptured > 1) capturedSinglePos = -1;
  }

  // 检查自杀
  const selfGroup = collectGroupAndLiberties(pos.stones, move, player, 2);
  if (selfGroup.liberties === 0) {
    throw new Error('Illegal suicide move');
  }

  // 更新劫点
  if (totalCaptured === 1 && capturedSinglePos >= 0 && selfGroup.groupLen === 1 && selfGroup.liberties === 1) {
    pos.koPoint = capturedSinglePos;
  } else {
    pos.koPoint = -1;
  }

  return { koPointBefore, captureStart };
}

/**
 * 撤销着法
 * 
 * @param pos - 棋盘位置（会被修改）
 * @param move - 着法位置
 * @param player - 执棋方
 * @param snapshot - 撤销快照
 * @param captureStack - 提子栈
 */
export function undoMove(
  pos: SimPosition,
  move: number,
  player: StoneColor,
  snapshot: UndoSnapshot,
  captureStack: number[]
): void {
  const captureEnd = captureStack.length;
  const opp = opponentOf(player);

  // 恢复棋盘
  if (move !== PASS_MOVE) {
    pos.stones[move] = EMPTY;
  }

  // 恢复提子
  for (let i = snapshot.captureStart; i < captureEnd; i++) {
    const p = captureStack[i]!;
    pos.stones[p] = opp;
  }
  captureStack.length = snapshot.captureStart;
  pos.koPoint = snapshot.koPointBefore;
}

/**
 * 尝试执行着法（不抛出异常）
 * 
 * @param pos - 棋盘位置（会被修改）
 * @param move - 着法位置
 * @param player - 执棋方
 * @param captureStack - 提子栈
 * @param koPointBeforeOut - 输出：着法前的劫点
 * @param captureStartOut - 输出：提子栈起始位置
 * @param recordIdx - 记录索引
 * @returns 是否成功
 */
export function tryPlayMoveNoThrow(
  pos: SimPosition,
  move: number,
  player: StoneColor,
  captureStack: number[],
  koPointBeforeOut: Int16Array,
  captureStartOut: Int32Array,
  recordIdx: number
): boolean {
  const koPointBefore = pos.koPoint;
  const captureStart = captureStack.length;
  koPointBeforeOut[recordIdx] = koPointBefore;
  captureStartOut[recordIdx] = captureStart;

  // Pass 着法
  if (move === PASS_MOVE) {
    pos.koPoint = -1;
    return true;
  }

  // 合法性检查（不抛出异常）
  if (move < 0 || move >= BOARD_AREA) return false;
  if ((pos.stones[move] as StoneColor) !== EMPTY) return false;
  if (pos.koPoint === move) return false;

  const opp = opponentOf(player);
  pos.stones[move] = player;

  let totalCaptured = 0;
  let capturedSinglePos = -1;

  const pStamp = incrementProcessedStamp();
  const PROCESSED_GROUP = getProcessedGroup();
  const GROUP_BUF = getGroupBuf();

  const mStart = NEIGHBOR_STARTS[move]!;
  const mCount = NEIGHBOR_COUNTS[move]!;
  for (let i = 0; i < mCount; i++) {
    const n = NEIGHBOR_LIST[mStart + i]!;
    if ((pos.stones[n] as StoneColor) !== opp) continue;
    if (PROCESSED_GROUP[n] === pStamp) continue;

    const { groupLen, liberties } = collectGroupAndLiberties(pos.stones, n, opp, 1);
    for (let j = 0; j < groupLen; j++) PROCESSED_GROUP[GROUP_BUF[j]!] = pStamp;
    if (liberties !== 0) continue;

    for (let j = 0; j < groupLen; j++) {
      const gp = GROUP_BUF[j]!;
      pos.stones[gp] = EMPTY;
      captureStack.push(gp);
    }

    totalCaptured += groupLen;
    if (totalCaptured === 1 && groupLen === 1) capturedSinglePos = GROUP_BUF[0]!;
    if (totalCaptured > 1) capturedSinglePos = -1;
  }

  const selfGroup = collectGroupAndLiberties(pos.stones, move, player, 2);
  if (selfGroup.liberties === 0) {
    undoMoveRaw(pos, move, player, koPointBefore, captureStart, captureStack);
    return false;
  }

  if (totalCaptured === 1 && capturedSinglePos >= 0 && selfGroup.groupLen === 1 && selfGroup.liberties === 1) {
    pos.koPoint = capturedSinglePos;
  } else {
    pos.koPoint = -1;
  }

  return true;
}

/**
 * 撤销着法（原始版本，不使用快照）
 * 
 * @param pos - 棋盘位置
 * @param move - 着法位置
 * @param player - 执棋方
 * @param koPointBefore - 着法前的劫点
 * @param captureStart - 提子栈起始位置
 * @param captureStack - 提子栈
 */
export function undoMoveRaw(
  pos: SimPosition,
  move: number,
  player: StoneColor,
  koPointBefore: number,
  captureStart: number,
  captureStack: number[]
): void {
  const captureEnd = captureStack.length;
  const opp = opponentOf(player);

  if (move !== PASS_MOVE) pos.stones[move] = EMPTY;

  for (let i = captureStart; i < captureEnd; i++) {
    const p = captureStack[i]!;
    pos.stones[p] = opp;
  }
  captureStack.length = captureStart;
  pos.koPoint = koPointBefore;
}
