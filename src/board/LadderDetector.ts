/**
 * Board Module - Ladder Detector
 * 
 * 征子检测算法
 * 
 * 这是棋盘模块中最复杂的部分，用于：
 * - KataGo V7 特征输入（spatial planes 14-17）
 * - 检测被征子的棋子群组
 * - 查找征子工作的着法
 * 
 * 算法遵循 KataGo 的实现：
 * - cpp/neuralnet/nninputs.cpp 中的 iterLadders
 * - cpp/game/board.cpp 中的 ladder search
 */

import type { StoneColor, SimPosition, KataGoLadderFeaturesV7 } from './types';
import { EMPTY, BLACK, WHITE, opponentOf } from './constants';
import {
  BOARD_SIZE,
  BOARD_AREA,
  NEIGHBOR_STARTS,
  NEIGHBOR_COUNTS,
  NEIGHBOR_LIST,
  LADDER_SEARCH_NODE_BUDGET,
  getGroupBuf,
  getLadderScratch,
  getLadderGroupSeen,
  getLadderGroupSeenStamp,
  incrementLadderGroupSeenStamp,
  getLadderOppGroupSeen,
  getLadderOppGroupSeenStamp,
  incrementLadderOppGroupSeenStamp,
  getLadderGroupCopy,
  getLadderConnectGroupSeen,
  getLadderConnectGroupSeenStamp,
  incrementLadderConnectGroupSeenStamp,
  getLadderCaptured,
  getLadderCapturedStamp,
  incrementLadderCapturedStamp,
  getLadderFeaturesScratchV7,
} from './BoardState';
import { collectGroupAndLiberties, findLibertiesIntoBuf, getNumLibertiesCapped, getNumImmediateLiberties } from './GroupCollector';
import { tryPlayMoveNoThrow, undoMoveRaw } from './BoardSimulator';

// ============================================================================
// 内部辅助函数
// ============================================================================

/**
 * 检查两个位置是否相邻
 */
function isAdjacent(a: number, b: number): boolean {
  if (a === b) return false;
  const d = a - b;
  if (d === 1 || d === -1) return ((a / BOARD_SIZE) | 0) === ((b / BOARD_SIZE) | 0);
  return d === BOARD_SIZE || d === -BOARD_SIZE;
}

/**
 * 检查是否为劫的提子
 */
function wouldBeKoCapture(stones: Uint8Array, loc: number, pla: StoneColor): boolean {
  if ((stones[loc] as StoneColor) !== EMPTY) return false;
  const opp = opponentOf(pla) as StoneColor;
  let oppCapturableLoc = -1;
  const nStart = NEIGHBOR_STARTS[loc]!;
  const nCount = NEIGHBOR_COUNTS[loc]!;
  
  for (let i = 0; i < nCount; i++) {
    const adj = NEIGHBOR_LIST[nStart + i]!;
    const c = stones[adj] as StoneColor;
    if (c !== opp) return false;
    if (getNumLibertiesCapped(stones, adj, 2) === 1) {
      if (oppCapturableLoc !== -1) return false;
      oppCapturableLoc = adj;
    }
  }

  if (oppCapturableLoc === -1) return false;

  const oppGroup = collectGroupAndLiberties(stones, oppCapturableLoc, opp, 2);
  if (oppGroup.liberties !== 1) return false;
  return oppGroup.groupLen === 1;
}

/**
 * 检查是否有获取气的提子
 */
function hasLibertyGainingCaptures(stones: Uint8Array, loc: number): boolean {
  const pla = stones[loc] as StoneColor;
  if (pla === EMPTY) return false;
  const opp = opponentOf(pla);

  const g = collectGroupAndLiberties(stones, loc, pla, 2);
  const LADDER_GROUP_COPY = getLadderGroupCopy();
  const GROUP_BUF = getGroupBuf();
  
  for (let i = 0; i < g.groupLen; i++) LADDER_GROUP_COPY[i] = GROUP_BUF[i]!;

  for (let i = 0; i < g.groupLen; i++) {
    const p = LADDER_GROUP_COPY[i]!;
    const nStart = NEIGHBOR_STARTS[p]!;
    const nCount = NEIGHBOR_COUNTS[p]!;
    for (let j = 0; j < nCount; j++) {
      const adj = NEIGHBOR_LIST[nStart + j]!;
      if ((stones[adj] as StoneColor) !== opp) continue;
      if (getNumLibertiesCapped(stones, adj, 2) === 1) return true;
    }
  }
  return false;
}

/**
 * 启发式连接气数计算
 */
function countHeuristicConnectionLibertiesX2(stones: Uint8Array, loc: number, pla: StoneColor): number {
  let numLibsX2 = 0;
  const nStart = NEIGHBOR_STARTS[loc]!;
  const nCount = NEIGHBOR_COUNTS[loc]!;
  for (let i = 0; i < nCount; i++) {
    const adj = NEIGHBOR_LIST[nStart + i]!;
    if ((stones[adj] as StoneColor) !== pla) continue;
    const libs = getNumLibertiesCapped(stones, adj, 20);
    if (libs > 1) numLibsX2 += libs * 2 - 3;
  }
  return numLibsX2;
}

/**
 * 获取着法后的气数边界
 */
function getBoundNumLibertiesAfterPlay(
  stones: Uint8Array,
  loc: number,
  pla: StoneColor
): { lowerBound: number; upperBound: number } {
  const opp = opponentOf(pla);

  let numImmediateLibs = 0;
  let numCaps = 0;
  let potentialLibsFromCaps = 0;
  let numConnectionLibs = 0;
  let maxConnectionLibs = 0;

  const nStart = NEIGHBOR_STARTS[loc]!;
  const nCount = NEIGHBOR_COUNTS[loc]!;
  for (let i = 0; i < nCount; i++) {
    const adj = NEIGHBOR_LIST[nStart + i]!;
    const c = stones[adj] as StoneColor;
    if (c === EMPTY) {
      numImmediateLibs++;
    } else if (c === opp) {
      const capInfo = collectGroupAndLiberties(stones, adj, opp, 2);
      if (capInfo.liberties === 1) {
        numCaps++;
        potentialLibsFromCaps += capInfo.groupLen;
      }
    } else if (c === pla) {
      const libs = getNumLibertiesCapped(stones, adj, 20);
      const connLibs = libs - 1;
      numConnectionLibs += connLibs;
      if (connLibs > maxConnectionLibs) maxConnectionLibs = connLibs;
    }
  }

  const lowerBound = numCaps + (maxConnectionLibs > numImmediateLibs ? maxConnectionLibs : numImmediateLibs);
  const upperBound = numImmediateLibs + potentialLibsFromCaps + numConnectionLibs;
  return { lowerBound, upperBound };
}

/**
 * 获取着法后的气数
 */
function getNumLibertiesAfterPlay(stones: Uint8Array, loc: number, pla: StoneColor, max: number): number {
  if ((stones[loc] as StoneColor) !== EMPTY) return 0;
  const opp = opponentOf(pla) as StoneColor;

  const capStamp = incrementLadderCapturedStamp();
  const LADDER_CAPTURED = getLadderCaptured();

  const libs = new Int16Array(16);
  let numLibs = 0;

  const addLib = (p: number): boolean => {
    for (let i = 0; i < numLibs; i++) if (libs[i] === p) return false;
    libs[numLibs++] = p;
    return true;
  };

  const nStart = NEIGHBOR_STARTS[loc]!;
  const nCount = NEIGHBOR_COUNTS[loc]!;
  for (let i = 0; i < nCount; i++) {
    const adj = NEIGHBOR_LIST[nStart + i]!;
    const c = stones[adj] as StoneColor;
    if (c === EMPTY) {
      addLib(adj);
      if (numLibs >= max) return max;
    } else if (c === opp) {
      const oppInfo = collectGroupAndLiberties(stones, adj, opp, 2);
      if (oppInfo.liberties === 1) {
        addLib(adj);
        if (numLibs >= max) return max;
        const GROUP_BUF = getGroupBuf();
        for (let j = 0; j < oppInfo.groupLen; j++) LADDER_CAPTURED[GROUP_BUF[j]!] = capStamp;
      }
    }
  }

  const seenStamp = incrementLadderConnectGroupSeenStamp();
  const LADDER_CONNECT_GROUP_SEEN = getLadderConnectGroupSeen();
  const GROUP_BUF = getGroupBuf();

  const wouldBeEmpty = (p: number): boolean => {
    const c = stones[p] as StoneColor;
    if (c === EMPTY) return true;
    return c === opp && LADDER_CAPTURED[p] === capStamp;
  };

  for (let i = 0; i < nCount; i++) {
    const adj = NEIGHBOR_LIST[nStart + i]!;
    if ((stones[adj] as StoneColor) !== pla) continue;
    if (LADDER_CONNECT_GROUP_SEEN[adj] === seenStamp) continue;

    const g = collectGroupAndLiberties(stones, adj, pla, max);
    for (let j = 0; j < g.groupLen; j++) LADDER_CONNECT_GROUP_SEEN[GROUP_BUF[j]!] = seenStamp;

    for (let j = 0; j < g.groupLen; j++) {
      const cur = GROUP_BUF[j]!;
      const cs = NEIGHBOR_STARTS[cur]!;
      const cc = NEIGHBOR_COUNTS[cur]!;
      for (let k = 0; k < cc; k++) {
        const possibleLib = NEIGHBOR_LIST[cs + k]!;
        if (possibleLib === loc) continue;
        if (!wouldBeEmpty(possibleLib)) continue;
        addLib(possibleLib);
        if (numLibs >= max) return max;
      }
    }
  }

  return numLibs;
}

/**
 * 查找获取气的提子
 */
function findLibertyGainingCaptures(stones: Uint8Array, loc: number, buf: Int16Array, bufStart: number): number {
  const pla = stones[loc] as StoneColor;
  if (pla === EMPTY) return 0;
  const opp = opponentOf(pla);

  const seenStamp = incrementLadderOppGroupSeenStamp();
  const LADDER_OPP_GROUP_SEEN = getLadderOppGroupSeen();
  const LADDER_GROUP_COPY = getLadderGroupCopy();
  const GROUP_BUF = getGroupBuf();

  const g = collectGroupAndLiberties(stones, loc, pla, 2);
  for (let i = 0; i < g.groupLen; i++) LADDER_GROUP_COPY[i] = GROUP_BUF[i]!;

  let numFound = 0;
  for (let i = 0; i < g.groupLen; i++) {
    const p = LADDER_GROUP_COPY[i]!;
    const nStart = NEIGHBOR_STARTS[p]!;
    const nCount = NEIGHBOR_COUNTS[p]!;
    for (let j = 0; j < nCount; j++) {
      const adj = NEIGHBOR_LIST[nStart + j]!;
      if ((stones[adj] as StoneColor) !== opp) continue;
      if (LADDER_OPP_GROUP_SEEN[adj] === seenStamp) continue;

      const libCount = findLibertiesIntoBuf(stones, adj, opp, buf, bufStart + numFound, 2);
      const groupLen = collectGroupAndLiberties(stones, adj, opp, 2).groupLen;
      for (let k = 0; k < groupLen; k++) LADDER_OPP_GROUP_SEEN[GROUP_BUF[k]!] = seenStamp;

      if (libCount === 1) {
        numFound += 1;
        if (bufStart + numFound >= buf.length) return numFound;
      }
    }
  }
  return numFound;
}

// ============================================================================
// 征子搜索核心算法
// ============================================================================

/**
 * 搜索是否被征子
 * 
 * 使用迭代式深度优先搜索，避免递归栈溢出
 */
function searchIsLadderCaptured(
  pos: SimPosition,
  loc: number,
  defenderFirst: boolean,
  scratch: ReturnType<typeof getLadderScratch>
): boolean {
  if (loc < 0 || loc >= BOARD_AREA) return false;
  const c = pos.stones[loc] as StoneColor;
  if (c !== BLACK && c !== WHITE) return false;

  const libs0 = getNumLibertiesCapped(pos.stones, loc, 3);
  if (libs0 > 2 || (defenderFirst && libs0 > 1)) return false;

  const pla = c;
  const opp = opponentOf(pla) as StoneColor;

  const koSaved = pos.koPoint;
  if (defenderFirst) pos.koPoint = -1;

  const { bufMoves, moveListStarts, moveListLens, moveListCur, recordMoves, recordPlayers, recordKoPointBefore, recordCaptureStart, captureStack } = scratch;

  let stackIdx = 0;
  let searchNodeCount = 0;

  moveListCur[0] = -1;
  moveListStarts[0] = 0;
  moveListLens[0] = 0;

  let returnValue = false;
  let returnedFromDeeper = false;

  while (true) {
    if (stackIdx <= -1) {
      pos.koPoint = koSaved;
      return returnValue;
    }

    if (searchNodeCount >= LADDER_SEARCH_NODE_BUDGET) {
      for (let i = stackIdx - 1; i >= 0; i--) {
        undoMoveRaw(pos, recordMoves[i]!, recordPlayers[i]! as StoneColor, recordKoPointBefore[i]!, recordCaptureStart[i]!, captureStack);
      }
      pos.koPoint = koSaved;
      return false;
    }

    const isDefender = (defenderFirst && (stackIdx % 2) === 0) || (!defenderFirst && (stackIdx % 2) === 1);

    if (moveListCur[stackIdx] === -1) {
      const libs = getNumLibertiesCapped(pos.stones, loc, 3);

      if (!isDefender && libs <= 1) {
        returnValue = true;
        returnedFromDeeper = true;
        stackIdx--;
        continue;
      }
      if (!isDefender && libs >= 3) {
        returnValue = false;
        returnedFromDeeper = true;
        stackIdx--;
        continue;
      }
      if (isDefender && libs >= 2) {
        returnValue = false;
        returnedFromDeeper = true;
        stackIdx--;
        continue;
      }
      if (isDefender && pos.koPoint !== -1) {
        returnValue = false;
        returnedFromDeeper = true;
        stackIdx--;
        continue;
      }

      const start = moveListStarts[stackIdx]!;
      let moveListLen = 0;

      if (isDefender) {
        moveListLen = findLibertyGainingCaptures(pos.stones, loc, bufMoves, start);
        moveListLen += findLibertiesIntoBuf(pos.stones, loc, pla, bufMoves, start + moveListLen, 1);

        if (moveListLen <= 0) {
          returnValue = true;
          returnedFromDeeper = true;
          stackIdx--;
          continue;
        }

        const lastMove = bufMoves[start + moveListLen - 1]!;
        const bounds = getBoundNumLibertiesAfterPlay(pos.stones, lastMove, pla);
        if (bounds.lowerBound >= 3) {
          returnValue = false;
          returnedFromDeeper = true;
          stackIdx--;
          continue;
        }
        if (moveListLen === 1 && bounds.upperBound <= 1) {
          returnValue = true;
          returnedFromDeeper = true;
          stackIdx--;
          continue;
        }
      } else {
        moveListLen += findLibertiesIntoBuf(pos.stones, loc, pla, bufMoves, start, 2);
        if (moveListLen !== 2) {
          returnValue = false;
          returnedFromDeeper = true;
          stackIdx--;
          continue;
        }

        let libsA = getNumImmediateLiberties(pos.stones, bufMoves[start]!);
        let libsB = getNumImmediateLiberties(pos.stones, bufMoves[start + 1]!);

        if (libsA === 0 && libsB === 0 && wouldBeKoCapture(pos.stones, bufMoves[start]!, opp) && wouldBeKoCapture(pos.stones, bufMoves[start + 1]!, opp)) {
          if (getNumLibertiesAfterPlay(pos.stones, bufMoves[start]!, pla, 3) <= 2 && getNumLibertiesAfterPlay(pos.stones, bufMoves[start + 1]!, pla, 3) <= 2) {
            if (!hasLibertyGainingCaptures(pos.stones, loc)) {
              returnValue = true;
              returnedFromDeeper = true;
              stackIdx--;
              continue;
            }
          }
        }

        if (!isAdjacent(bufMoves[start]!, bufMoves[start + 1]!)) {
          if (libsA >= 3 && libsB >= 3) {
            returnValue = false;
            returnedFromDeeper = true;
            stackIdx--;
            continue;
          } else if (libsA >= 3) {
            moveListLen = 1;
          } else if (libsB >= 3) {
            bufMoves[start] = bufMoves[start + 1]!;
            moveListLen = 1;
          }
        }

        if (moveListLen > 1) {
          libsA = libsA * 2 + countHeuristicConnectionLibertiesX2(pos.stones, bufMoves[start]!, pla);
          libsB = libsB * 2 + countHeuristicConnectionLibertiesX2(pos.stones, bufMoves[start + 1]!, pla);
          if (libsB > libsA) {
            const tmp = bufMoves[start]!;
            bufMoves[start] = bufMoves[start + 1]!;
            bufMoves[start + 1] = tmp;
          }
        }
      }

      moveListLens[stackIdx] = moveListLen;
      moveListCur[stackIdx] = 0;
    } else {
      if (returnedFromDeeper) {
        undoMoveRaw(
          pos,
          recordMoves[stackIdx]!,
          recordPlayers[stackIdx]! as StoneColor,
          recordKoPointBefore[stackIdx]!,
          recordCaptureStart[stackIdx]!,
          captureStack
        );
      }

      if (isDefender && !returnValue) {
        returnedFromDeeper = true;
        stackIdx--;
        continue;
      }
      if (!isDefender && returnValue) {
        returnedFromDeeper = true;
        stackIdx--;
        continue;
      }

      moveListCur[stackIdx] = (moveListCur[stackIdx]! + 1) | 0;
    }

    if (moveListCur[stackIdx]! >= moveListLens[stackIdx]!) {
      returnValue = isDefender;
      returnedFromDeeper = true;
      stackIdx--;
      continue;
    }

    const move = bufMoves[moveListStarts[stackIdx]! + moveListCur[stackIdx]!]!;
    const p = isDefender ? pla : opp;

    recordMoves[stackIdx] = move;
    recordPlayers[stackIdx] = p;

    if (!tryPlayMoveNoThrow(pos, move, p, captureStack, recordKoPointBefore, recordCaptureStart, stackIdx)) {
      returnValue = isDefender;
      returnedFromDeeper = false;
      continue;
    }

    searchNodeCount++;

    stackIdx++;
    moveListCur[stackIdx] = -1;
    moveListStarts[stackIdx] = moveListStarts[stackIdx - 1]! + moveListLens[stackIdx - 1]!;
    moveListLens[stackIdx] = 0;
  }
}

/**
 * 攻击方先手的2气征子搜索
 */
function searchIsLadderCapturedAttackerFirst2Libs(
  pos: SimPosition,
  loc: number,
  scratch: ReturnType<typeof getLadderScratch>,
  outWorkingMoves: number[]
): boolean {
  if (loc < 0 || loc >= BOARD_AREA) return false;
  const c = pos.stones[loc] as StoneColor;
  if (c !== BLACK && c !== WHITE) return false;

  if (getNumLibertiesCapped(pos.stones, loc, 3) !== 2) return false;

  const pla = c;
  const opp = opponentOf(pla) as StoneColor;

  const tmpLibs = new Int16Array(2);
  const libCount = findLibertiesIntoBuf(pos.stones, loc, pla, tmpLibs, 0, 2);
  if (libCount !== 2) return false;
  const move0 = tmpLibs[0]!;
  const move1 = tmpLibs[1]!;

  let move0Works = false;
  let move1Works = false;

  outWorkingMoves.length = 0;
  scratch.captureStack.length = 0;

  if (tryPlayMoveNoThrow(pos, move0, opp, scratch.captureStack, scratch.tmpKoPointBefore, scratch.tmpCaptureStart, 0)) {
    move0Works = searchIsLadderCaptured(pos, loc, true, scratch);
    undoMoveRaw(pos, move0, opp, scratch.tmpKoPointBefore[0]!, scratch.tmpCaptureStart[0]!, scratch.captureStack);
  }

  if (tryPlayMoveNoThrow(pos, move1, opp, scratch.captureStack, scratch.tmpKoPointBefore, scratch.tmpCaptureStart, 0)) {
    move1Works = searchIsLadderCaptured(pos, loc, true, scratch);
    undoMoveRaw(pos, move1, opp, scratch.tmpKoPointBefore[0]!, scratch.tmpCaptureStart[0]!, scratch.captureStack);
  }

  if (move0Works || move1Works) {
    if (move0Works) outWorkingMoves.push(move0);
    if (move1Works) outWorkingMoves.push(move1);
    return true;
  }
  return false;
}

// ============================================================================
// 公共 API
// ============================================================================

/**
 * 计算 KataGo V7 征子特征并写入缓冲区
 */
export function computeLadderFeaturesV7KataGoInto(args: {
  stones: Uint8Array;
  koPoint: number;
  currentPlayer: StoneColor;
  outLadderedStones: Uint8Array;
  outLadderWorkingMoves: Uint8Array;
}): void {
  const { stones, koPoint, currentPlayer, outLadderedStones, outLadderWorkingMoves } = args;
  outLadderedStones.fill(0);
  outLadderWorkingMoves.fill(0);

  const opp = opponentOf(currentPlayer);

  const seenStamp = incrementLadderGroupSeenStamp();
  const LADDER_GROUP_SEEN = getLadderGroupSeen();
  const GROUP_BUF = getGroupBuf();

  const { copyPos, groupStones, workingMoves } = getLadderFeaturesScratchV7();
  const LADDER_SCRATCH = getLadderScratch();

  for (let p = 0; p < BOARD_AREA; p++) {
    const c = stones[p] as StoneColor;
    if (c === EMPTY) continue;
    if (LADDER_GROUP_SEEN[p] === seenStamp) continue;

    const g = collectGroupAndLiberties(stones, p, c, 3);
    for (let i = 0; i < g.groupLen; i++) LADDER_GROUP_SEEN[GROUP_BUF[i]!] = seenStamp;

    if (g.liberties !== 1 && g.liberties !== 2) continue;

    groupStones.set(GROUP_BUF.subarray(0, g.groupLen));

    copyPos.stones.set(stones);
    copyPos.koPoint = koPoint;
    LADDER_SCRATCH.captureStack.length = 0;

    let laddered = false;
    workingMoves.length = 0;
    if (g.liberties === 1) {
      laddered = searchIsLadderCaptured(copyPos, p, true, LADDER_SCRATCH);
    } else {
      laddered = searchIsLadderCapturedAttackerFirst2Libs(copyPos, p, LADDER_SCRATCH, workingMoves);
    }

    if (!laddered) continue;

    for (let i = 0; i < g.groupLen; i++) outLadderedStones[groupStones[i]!] = 1;
    if (g.liberties === 2 && c === opp && workingMoves.length > 0) {
      for (let i = 0; i < workingMoves.length; i++) outLadderWorkingMoves[workingMoves[i]!] = 1;
    }
  }
}

/**
 * 计算 KataGo V7 征子特征
 */
export function computeLadderFeaturesV7KataGo(args: {
  stones: Uint8Array;
  koPoint: number;
  currentPlayer: StoneColor;
}): KataGoLadderFeaturesV7 {
  const ladderedStones = new Uint8Array(BOARD_AREA);
  const ladderWorkingMoves = new Uint8Array(BOARD_AREA);
  computeLadderFeaturesV7KataGoInto({ ...args, outLadderedStones: ladderedStones, outLadderWorkingMoves: ladderWorkingMoves });

  return { ladderedStones, ladderWorkingMoves };
}

/**
 * 计算被征子的棋子并写入缓冲区
 */
export function computeLadderedStonesV7KataGoInto(args: {
  stones: Uint8Array;
  koPoint: number;
  outLadderedStones: Uint8Array;
}): void {
  const { stones, koPoint, outLadderedStones } = args;
  outLadderedStones.fill(0);

  const seenStamp = incrementLadderGroupSeenStamp();
  const LADDER_GROUP_SEEN = getLadderGroupSeen();
  const GROUP_BUF = getGroupBuf();

  const { copyPos, groupStones, workingMoves } = getLadderFeaturesScratchV7();
  const LADDER_SCRATCH = getLadderScratch();

  for (let p = 0; p < BOARD_AREA; p++) {
    const c = stones[p] as StoneColor;
    if (c === EMPTY) continue;
    if (LADDER_GROUP_SEEN[p] === seenStamp) continue;

    const g = collectGroupAndLiberties(stones, p, c, 3);
    for (let i = 0; i < g.groupLen; i++) LADDER_GROUP_SEEN[GROUP_BUF[i]!] = seenStamp;

    if (g.liberties !== 1 && g.liberties !== 2) continue;

    groupStones.set(GROUP_BUF.subarray(0, g.groupLen));

    copyPos.stones.set(stones);
    copyPos.koPoint = koPoint;
    LADDER_SCRATCH.captureStack.length = 0;

    workingMoves.length = 0;
    let ladderedGroup = false;
    if (g.liberties === 1) ladderedGroup = searchIsLadderCaptured(copyPos, p, true, LADDER_SCRATCH);
    else ladderedGroup = searchIsLadderCapturedAttackerFirst2Libs(copyPos, p, LADDER_SCRATCH, workingMoves);

    if (!ladderedGroup) continue;
    for (let i = 0; i < g.groupLen; i++) outLadderedStones[groupStones[i]!] = 1;
  }
}

/**
 * 计算被征子的棋子
 */
export function computeLadderedStonesV7KataGo(args: { stones: Uint8Array; koPoint: number }): Uint8Array {
  const laddered = new Uint8Array(BOARD_AREA);
  computeLadderedStonesV7KataGoInto({ ...args, outLadderedStones: laddered });
  return laddered;
}
