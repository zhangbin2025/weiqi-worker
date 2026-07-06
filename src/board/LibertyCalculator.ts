/**
 * Board Module - Liberty Calculator
 * 
 * 计算棋盘上每个位置的气数
 * 
 * 气图用于：
 * - KataGo V7 特征输入
 * - 快速评估群组的健康状况
 */

import type { StoneColor } from './types';
import { EMPTY } from './constants';
import {
  BOARD_AREA,
  getGroupBuf,
  getGroupSeen,
  getGroupSeenStamp,
  incrementGroupSeenStamp,
} from './BoardState';
import { collectGroupAndLiberties } from './GroupCollector';

/**
 * 计算气图并写入输出缓冲区
 * 
 * 遍历棋盘上的所有群组，计算每个位置的气数
 * 气数上限为 4（用于 KataGo V7 特征）
 * 
 * @param stones - 棋盘状态
 * @param out - 输出缓冲区（长度必须为 BOARD_AREA）
 * @returns 输出缓冲区
 */
export function computeLibertyMapInto(stones: Uint8Array, out: Uint8Array): Uint8Array {
  if (out.length !== BOARD_AREA) {
    throw new Error(`computeLibertyMapInto: expected out length ${BOARD_AREA}, got ${out.length}`);
  }
  
  out.fill(0);
  const stamp = incrementGroupSeenStamp();
  const GROUP_SEEN = getGroupSeen();
  const GROUP_BUF = getGroupBuf();

  for (let p = 0; p < BOARD_AREA; p++) {
    const c = stones[p] as StoneColor;
    if (c === EMPTY) continue;
    if (GROUP_SEEN[p] === stamp) continue;

    const { groupLen, liberties } = collectGroupAndLiberties(stones, p, c, 4);
    const capLibs = liberties >= 4 ? 4 : liberties;
    for (let i = 0; i < groupLen; i++) {
      const gp = GROUP_BUF[i]!;
      out[gp] = capLibs;
      GROUP_SEEN[gp] = stamp;
    }
  }

  return out;
}

/**
 * 更新指定种子点的气图
 * 
 * 只更新指定位置所在的群组的气数
 * 用于增量更新，避免重新计算整个棋盘
 * 
 * @param stones - 棋盘状态
 * @param seeds - 种子点数组
 * @param seedCount - 种子点数量
 * @param out - 输出缓冲区（会被修改）
 */
export function updateLibertyMapForSeeds(
  stones: Uint8Array,
  seeds: Int16Array,
  seedCount: number,
  out: Uint8Array
): void {
  if (out.length !== BOARD_AREA) {
    throw new Error(`updateLibertyMapForSeeds: expected out length ${BOARD_AREA}, got ${out.length}`);
  }
  if (seedCount <= 0) return;
  
  const stamp = incrementGroupSeenStamp();
  const GROUP_SEEN = getGroupSeen();
  const GROUP_BUF = getGroupBuf();

  for (let i = 0; i < seedCount; i++) {
    const p = seeds[i]!;
    const c = stones[p] as StoneColor;
    if (c === EMPTY) continue;
    if (GROUP_SEEN[p] === stamp) continue;

    const { groupLen, liberties } = collectGroupAndLiberties(stones, p, c, 4);
    const capLibs = liberties >= 4 ? 4 : liberties;
    for (let j = 0; j < groupLen; j++) {
      const gp = GROUP_BUF[j]!;
      out[gp] = capLibs;
      GROUP_SEEN[gp] = stamp;
    }
  }
}

/**
 * 计算气图（返回新数组）
 * 
 * @param stones - 棋盘状态
 * @returns 气图（每个位置的气数）
 */
export function computeLibertyMap(stones: Uint8Array): Uint8Array {
  return computeLibertyMapInto(stones, new Uint8Array(BOARD_AREA));
}
