/**
 * Board Module - Area Calculator
 * 
 * 计算棋盘领地（基于 Benson 算法）
 * 
 * KataGo V7 领地计算遵循：
 * - Benson pass-alive 群组/领地
 * - 安全/不安全大领地标记
 * - 填充剩余棋子（nonPassAliveStones）
 */

import type { StoneColor } from './types';
import { EMPTY, BLACK, WHITE, opponentOf } from './constants';
import {
  BOARD_AREA,
  NEIGHBOR_STARTS,
  NEIGHBOR_COUNTS,
  NEIGHBOR_LIST,
  getStackBuf,
  getRegionIdxByPos,
  getNextEmptyOrOpp,
  getBordersNonpassaliveByHeadpos,
  getGroupIndexByPos,
  getGroupColorByGroup,
  getGroupStartByGroup,
  getGroupLenByGroup,
  getGroupStonesFlat,
  getMaxRegions,
  getRegionHeads,
  getVitalStart,
  getVitalLen,
  getNumInternalSpacesMax2,
  getContainsOpp,
  getVitalList,
  getRegionQueue,
  getPlaGroups,
  getPlaGroupKilled,
  getVitalCountByGroup,
} from './BoardState';

// ============================================================================
// 群组构建
// ============================================================================

/**
 * 构建群组索引
 * 
 * 遍历棋盘，为每个棋子群组分配索引
 * 返回群组总数
 * 
 * @param stones - 棋盘状态
 * @returns 群组总数
 */
function buildGroups(stones: Uint8Array): number {
  const GROUP_INDEX_BY_POS = getGroupIndexByPos();
  const GROUP_COLOR_BY_GROUP = getGroupColorByGroup();
  const GROUP_START_BY_GROUP = getGroupStartByGroup();
  const GROUP_LEN_BY_GROUP = getGroupLenByGroup();
  const GROUP_STONES_FLAT = getGroupStonesFlat();
  const STACK_BUF = getStackBuf();

  GROUP_INDEX_BY_POS.fill(-1);
  let numGroups = 0;
  let flat = 0;

  for (let p = 0; p < BOARD_AREA; p++) {
    const c = stones[p] as StoneColor;
    if (c === EMPTY) continue;
    if (GROUP_INDEX_BY_POS[p] !== -1) continue;

    const groupIdx = numGroups++;
    GROUP_COLOR_BY_GROUP[groupIdx] = c;
    GROUP_START_BY_GROUP[groupIdx] = flat;

    let stackLen = 0;
    STACK_BUF[stackLen++] = p;
    GROUP_INDEX_BY_POS[p] = groupIdx;

    let groupLen = 0;
    while (stackLen > 0) {
      const cur = STACK_BUF[--stackLen]!;
      GROUP_STONES_FLAT[flat++] = cur;
      groupLen++;

      const nStart = NEIGHBOR_STARTS[cur]!;
      const nCount = NEIGHBOR_COUNTS[cur]!;
      for (let i = 0; i < nCount; i++) {
        const n = NEIGHBOR_LIST[nStart + i]!;
        if ((stones[n] as StoneColor) !== c) continue;
        if (GROUP_INDEX_BY_POS[n] !== -1) continue;
        GROUP_INDEX_BY_POS[n] = groupIdx;
        STACK_BUF[stackLen++] = n;
      }
    }

    GROUP_LEN_BY_GROUP[groupIdx] = groupLen;
  }

  return numGroups;
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 检查位置是否与指定颜色相邻
 */
function isAdjacentToColor(stones: Uint8Array, pos: number, color: StoneColor): boolean {
  const nStart = NEIGHBOR_STARTS[pos]!;
  const nCount = NEIGHBOR_COUNTS[pos]!;
  for (let i = 0; i < nCount; i++) {
    const n = NEIGHBOR_LIST[nStart + i]!;
    if ((stones[n] as StoneColor) === color) return true;
  }
  return false;
}

/**
 * 检查位置是否与指定玩家群组相邻
 */
function isAdjacentToPlaGroup(
  stones: Uint8Array,
  pos: number,
  plaColor: StoneColor,
  plaGroup: number
): boolean {
  const GROUP_INDEX_BY_POS = getGroupIndexByPos();
  const nStart = NEIGHBOR_STARTS[pos]!;
  const nCount = NEIGHBOR_COUNTS[pos]!;
  for (let i = 0; i < nCount; i++) {
    const n = NEIGHBOR_LIST[nStart + i]!;
    if ((stones[n] as StoneColor) !== plaColor) continue;
    if (GROUP_INDEX_BY_POS[n] === plaGroup) return true;
  }
  return false;
}

// ============================================================================
// Benson 算法核心
// ============================================================================

/**
 * 为指定玩家计算领地
 * 
 * 使用 Benson 算法确定 pass-alive 群组和领地
 */
function calculateAreaForPla(args: {
  stones: Uint8Array;
  numGroups: number;
  plaColor: StoneColor;
  safeBigTerritories: boolean;
  unsafeBigTerritories: boolean;
  isMultiStoneSuicideLegal: boolean;
  result: Uint8Array;
}): void {
  const { stones, numGroups, plaColor, safeBigTerritories, unsafeBigTerritories, isMultiStoneSuicideLegal, result } = args;
  const oppColor = opponentOf(plaColor);

  // 获取缓冲区
  const REGION_IDX_BY_POS = getRegionIdxByPos();
  const BORDERS_NONPASSALIVE_BY_HEADPOS = getBordersNonpassaliveByHeadpos();
  const REGION_HEADS = getRegionHeads();
  const VITAL_START = getVitalStart();
  const VITAL_LEN = getVitalLen();
  const NUM_INTERNAL_SPACES_MAX2 = getNumInternalSpacesMax2();
  const CONTAINS_OPP = getContainsOpp();
  const VITAL_LIST = getVitalList();
  const REGION_QUEUE = getRegionQueue();
  const PLA_GROUPS = getPlaGroups();
  const PLA_GROUP_KILLED = getPlaGroupKilled();
  const VITAL_COUNT_BY_GROUP = getVitalCountByGroup();
  const GROUP_INDEX_BY_POS = getGroupIndexByPos();
  const NEXT_EMPTY_OR_OPP = getNextEmptyOrOpp();

  REGION_IDX_BY_POS.fill(-1);
  BORDERS_NONPASSALIVE_BY_HEADPOS.fill(0);

  let numRegions = 0;
  let vitalTotal = 0;
  let atLeastOnePla = false;

  // 构建区域（空位 + 对手棋子）
  const buildRegion = (initialPos: number, regionIdx: number): number => {
    let tailTarget = initialPos;

    let qh = 0;
    let qt = 1;
    REGION_QUEUE[0] = initialPos;
    REGION_IDX_BY_POS[initialPos] = regionIdx;

    let hasVital = VITAL_LEN[regionIdx]! > 0;

    while (qh !== qt) {
      const pos = REGION_QUEUE[qh++]!;

      // 更新关键群组
      if (hasVital && (isMultiStoneSuicideLegal || (stones[pos] as StoneColor) === EMPTY)) {
        const vStart = VITAL_START[regionIdx]!;
        const oldLen = VITAL_LEN[regionIdx]!;
        let newLen = 0;
        for (let i = 0; i < oldLen; i++) {
          const g = VITAL_LIST[vStart + i]!;
          if (isAdjacentToPlaGroup(stones, pos, plaColor, g)) {
            VITAL_LIST[vStart + newLen] = g;
            newLen++;
          }
        }
        VITAL_LEN[regionIdx] = newLen;
        hasVital = newLen > 0;
      }

      // 统计内部空间
      if (NUM_INTERNAL_SPACES_MAX2[regionIdx]! < 2 && !isAdjacentToColor(stones, pos, plaColor)) {
        NUM_INTERNAL_SPACES_MAX2[regionIdx] = (NUM_INTERNAL_SPACES_MAX2[regionIdx]! + 1) as number;
      }

      // 标记是否包含对手
      if ((stones[pos] as StoneColor) === oppColor) CONTAINS_OPP[regionIdx] = 1;

      // 构建链表
      NEXT_EMPTY_OR_OPP[pos] = tailTarget;
      tailTarget = pos;

      // BFS 遍历
      const nStart = NEIGHBOR_STARTS[pos]!;
      const nCount = NEIGHBOR_COUNTS[pos]!;
      for (let i = 0; i < nCount; i++) {
        const n = NEIGHBOR_LIST[nStart + i]!;
        const c = stones[n] as StoneColor;
        if (c !== EMPTY && c !== oppColor) continue;
        if (REGION_IDX_BY_POS[n] !== -1) continue;
        REGION_IDX_BY_POS[n] = regionIdx;
        REGION_QUEUE[qt++] = n;
      }
    }

    return tailTarget;
  };

  // 遍历所有空位，构建区域
  for (let p = 0; p < BOARD_AREA; p++) {
    if (REGION_IDX_BY_POS[p] !== -1) continue;
    const c = stones[p] as StoneColor;
    if (c !== EMPTY) {
      if (c === plaColor) atLeastOnePla = true;
      continue;
    }

    const regionIdx = numRegions++;
    REGION_HEADS[regionIdx] = p;
    VITAL_START[regionIdx] = vitalTotal;
    VITAL_LEN[regionIdx] = 0;
    NUM_INTERNAL_SPACES_MAX2[regionIdx] = 0;
    CONTAINS_OPP[regionIdx] = 0;

    // 收集初始关键群组
    let initialVLen = 0;
    {
      const nStart = NEIGHBOR_STARTS[p]!;
      const nCount = NEIGHBOR_COUNTS[p]!;
      for (let i = 0; i < nCount; i++) {
        const adj = NEIGHBOR_LIST[nStart + i]!;
        if ((stones[adj] as StoneColor) !== plaColor) continue;
        const g = GROUP_INDEX_BY_POS[adj]!;
        let alreadyPresent = false;
        for (let j = 0; j < initialVLen; j++) {
          if (VITAL_LIST[vitalTotal + j] === g) {
            alreadyPresent = true;
            break;
          }
        }
        if (!alreadyPresent) {
          VITAL_LIST[vitalTotal + initialVLen] = g;
          initialVLen++;
          if (initialVLen >= 4) break;
        }
      }
    }
    VITAL_LEN[regionIdx] = initialVLen;

    const tail = buildRegion(p, regionIdx);
    NEXT_EMPTY_OR_OPP[p] = tail;

    vitalTotal += VITAL_LEN[regionIdx]!;
  }

  // 收集玩家群组
  const GROUP_COLOR_BY_GROUP = getGroupColorByGroup();
  let numPlaGroups = 0;
  for (let g = 0; g < numGroups; g++) {
    if ((GROUP_COLOR_BY_GROUP[g] as StoneColor) === plaColor) {
      PLA_GROUPS[numPlaGroups++] = g;
      PLA_GROUP_KILLED[g] = 0;
      VITAL_COUNT_BY_GROUP[g] = 0;
    }
  }

  // 统计每个群组的关键区域数
  for (let i = 0; i < numRegions; i++) {
    const vStart = VITAL_START[i]!;
    const vLen = VITAL_LEN[i]!;
    for (let j = 0; j < vLen; j++) {
      const g = VITAL_LIST[vStart + j]!;
      VITAL_COUNT_BY_GROUP[g] = (VITAL_COUNT_BY_GROUP[g]! + 1) as number;
    }
  }

  // Benson 算法：迭代删除不 pass-alive 的群组
  while (true) {
    let killedAnything = false;

    for (let i = 0; i < numPlaGroups; i++) {
      const g = PLA_GROUPS[i]!;
      if (PLA_GROUP_KILLED[g]) continue;
      if (VITAL_COUNT_BY_GROUP[g]! >= 2) continue;

      PLA_GROUP_KILLED[g] = 1;
      killedAnything = true;

      // 更新相关区域的关键群组
      const GROUP_START_BY_GROUP = getGroupStartByGroup();
      const GROUP_LEN_BY_GROUP = getGroupLenByGroup();
      const GROUP_STONES_FLAT = getGroupStonesFlat();

      const start = GROUP_START_BY_GROUP[g]!;
      const len = GROUP_LEN_BY_GROUP[g]!;
      for (let t = 0; t < len; t++) {
        const cur = GROUP_STONES_FLAT[start + t]!;
        const nStart = NEIGHBOR_STARTS[cur]!;
        const nCount = NEIGHBOR_COUNTS[cur]!;
        for (let k = 0; k < nCount; k++) {
          const adj = NEIGHBOR_LIST[nStart + k]!;
          const regionIdx = REGION_IDX_BY_POS[adj]!;
          if (regionIdx < 0) continue;

          const headPos = REGION_HEADS[regionIdx]!;
          if (BORDERS_NONPASSALIVE_BY_HEADPOS[headPos]) continue;
          const ac = stones[adj] as StoneColor;
          if (ac !== EMPTY && ac !== oppColor) continue;

          BORDERS_NONPASSALIVE_BY_HEADPOS[headPos] = 1;

          const vs = VITAL_START[regionIdx]!;
          const vl = VITAL_LEN[regionIdx]!;
          for (let u = 0; u < vl; u++) {
            const gg = VITAL_LIST[vs + u]!;
            VITAL_COUNT_BY_GROUP[gg] = (VITAL_COUNT_BY_GROUP[gg]! - 1) as number;
          }
        }
      }
    }

    if (!killedAnything) break;
  }

  // 标记 pass-alive 群组
  const GROUP_START_BY_GROUP = getGroupStartByGroup();
  const GROUP_LEN_BY_GROUP = getGroupLenByGroup();
  const GROUP_STONES_FLAT = getGroupStonesFlat();

  for (let i = 0; i < numPlaGroups; i++) {
    const g = PLA_GROUPS[i]!;
    if (PLA_GROUP_KILLED[g]) continue;
    const start = GROUP_START_BY_GROUP[g]!;
    const len = GROUP_LEN_BY_GROUP[g]!;
    for (let t = 0; t < len; t++) {
      result[GROUP_STONES_FLAT[start + t]!] = plaColor;
    }
  }

  // 标记领地
  for (let i = 0; i < numRegions; i++) {
    const headPos = REGION_HEADS[i]!;

    let shouldMark = NUM_INTERNAL_SPACES_MAX2[i]! <= 1 && !BORDERS_NONPASSALIVE_BY_HEADPOS[headPos] && atLeastOnePla;
    shouldMark = shouldMark || (safeBigTerritories && !CONTAINS_OPP[i] && !BORDERS_NONPASSALIVE_BY_HEADPOS[headPos] && atLeastOnePla);

    if (shouldMark) {
      let cur = headPos;
      do {
        result[cur] = plaColor;
        cur = NEXT_EMPTY_OR_OPP[cur]!;
      } while (cur !== headPos);
    } else {
      const shouldMarkIfEmpty = unsafeBigTerritories && !CONTAINS_OPP[i] && atLeastOnePla;
      if (shouldMarkIfEmpty) {
        let cur = headPos;
        do {
          if ((result[cur] as StoneColor) === EMPTY) result[cur] = plaColor;
          cur = NEXT_EMPTY_OR_OPP[cur]!;
        } while (cur !== headPos);
      }
    }
  }
}

// ============================================================================
// 公共 API
// ============================================================================

/**
 * 计算 KataGo V7 领地图
 * 
 * @param stones - 棋盘状态
 * @param isMultiStoneSuicideLegal - 是否允许多子自杀
 * @returns 领地图
 */
export function computeAreaMapV7KataGo(stones: Uint8Array, isMultiStoneSuicideLegal = false): Uint8Array {
  return computeAreaMapV7KataGoInto(stones, new Uint8Array(BOARD_AREA), isMultiStoneSuicideLegal);
}

/**
 * 计算领地图并写入缓冲区
 * 
 * @param stones - 棋盘状态
 * @param out - 输出缓冲区
 * @param isMultiStoneSuicideLegal - 是否允许多子自杀
 * @returns 输出缓冲区
 */
export function computeAreaMapV7KataGoInto(
  stones: Uint8Array,
  out: Uint8Array,
  isMultiStoneSuicideLegal = false
): Uint8Array {
  if (out.length !== BOARD_AREA) {
    throw new Error(`computeAreaMapV7KataGoInto: expected out length ${BOARD_AREA}, got ${out.length}`);
  }
  
  out.fill(EMPTY);
  const numGroups = buildGroups(stones);

  // 为双方计算领地
  calculateAreaForPla({
    stones,
    numGroups,
    plaColor: BLACK,
    safeBigTerritories: true,
    unsafeBigTerritories: true,
    isMultiStoneSuicideLegal,
    result: out,
  });
  calculateAreaForPla({
    stones,
    numGroups,
    plaColor: WHITE,
    safeBigTerritories: true,
    unsafeBigTerritories: true,
    isMultiStoneSuicideLegal,
    result: out,
  });

  // 填充剩余棋子（nonPassAliveStones = true）
  for (let p = 0; p < BOARD_AREA; p++) {
    if ((out[p] as StoneColor) === EMPTY) out[p] = stones[p]!;
  }

  return out;
}
