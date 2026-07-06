/**
 * Board Module - Group Collector
 * 
 * 收集棋盘上的群组和气
 * 这是气计算、领地计算、征子检测的基础
 */

import type { StoneColor, GroupInfo } from './types';
import { EMPTY } from './constants';
import {
  BOARD_AREA,
  NEIGHBOR_STARTS,
  NEIGHBOR_COUNTS,
  NEIGHBOR_LIST,
  getGroupBuf,
  getStackBuf,
  getVisited,
  getLibVisited,
  getBfsStamp,
  incrementBfsStamp,
} from './BoardState';

/**
 * 收集群组和气
 * 
 * 使用 BFS 遍历群组，同时统计气数
 * 
 * @param stones - 棋盘状态
 * @param start - 起始位置
 * @param color - 棋子颜色
 * @param maxLibertiesToCount - 最大统计气数（用于提前终止）
 * @returns 群组信息（长度和气数）
 */
export function collectGroupAndLiberties(
  stones: Uint8Array,
  start: number,
  color: StoneColor,
  maxLibertiesToCount: number
): GroupInfo {
  const stamp = incrementBfsStamp();
  const VISITED = getVisited();
  const LIB_VISITED = getLibVisited();
  const GROUP_BUF = getGroupBuf();
  const STACK_BUF = getStackBuf();
  
  let groupLen = 0;
  let stackLen = 0;
  let liberties = 0;

  VISITED[start] = stamp;
  STACK_BUF[stackLen++] = start;

  while (stackLen > 0) {
    const p = STACK_BUF[--stackLen]!;
    GROUP_BUF[groupLen++] = p;

    const nStart = NEIGHBOR_STARTS[p]!;
    const nCount = NEIGHBOR_COUNTS[p]!;
    for (let i = 0; i < nCount; i++) {
      const n = NEIGHBOR_LIST[nStart + i]!;
      const c = stones[n] as StoneColor;
      if (c === EMPTY) {
        if (liberties < maxLibertiesToCount && LIB_VISITED[n] !== stamp) {
          LIB_VISITED[n] = stamp;
          liberties++;
        }
      } else if (c === color) {
        if (VISITED[n] !== stamp) {
          VISITED[n] = stamp;
          STACK_BUF[stackLen++] = n;
        }
      }
    }
  }

  return { groupLen, liberties };
}

/**
 * 查找群组的气并写入缓冲区
 * 
 * @param stones - 棋盘状态
 * @param start - 起始位置
 * @param color - 棋子颜色
 * @param buf - 输出缓冲区
 * @param bufIdx - 缓冲区起始索引
 * @param max - 最大气数
 * @returns 实际找到的气数
 */
export function findLibertiesIntoBuf(
  stones: Uint8Array,
  start: number,
  color: StoneColor,
  buf: Int16Array,
  bufIdx: number,
  max: number
): number {
  const stamp = incrementBfsStamp();
  const VISITED = getVisited();
  const LIB_VISITED = getLibVisited();
  const GROUP_BUF = getGroupBuf();
  const STACK_BUF = getStackBuf();
  
  let stackLen = 0;
  let groupLen = 0;
  let liberties = 0;

  VISITED[start] = stamp;
  STACK_BUF[stackLen++] = start;

  while (stackLen > 0) {
    const p = STACK_BUF[--stackLen]!;
    GROUP_BUF[groupLen++] = p;

    const nStart = NEIGHBOR_STARTS[p]!;
    const nCount = NEIGHBOR_COUNTS[p]!;
    for (let i = 0; i < nCount; i++) {
      const n = NEIGHBOR_LIST[nStart + i]!;
      const c = stones[n] as StoneColor;
      if (c === EMPTY) {
        if (liberties < max && LIB_VISITED[n] !== stamp) {
          LIB_VISITED[n] = stamp;
          buf[bufIdx + liberties] = n;
          liberties++;
        }
      } else if (c === color) {
        if (VISITED[n] !== stamp) {
          VISITED[n] = stamp;
          STACK_BUF[stackLen++] = n;
        }
      }
    }
  }

  return liberties;
}

/**
 * 获取群组的气数（带上限）
 * 
 * @param stones - 棋盘状态
 * @param loc - 位置
 * @param cap - 气数上限
 * @returns 气数（最多返回 cap）
 */
export function getNumLibertiesCapped(stones: Uint8Array, loc: number, cap: number): number {
  const c = stones[loc] as StoneColor;
  if (c === EMPTY) return 0;
  return collectGroupAndLiberties(stones, loc, c, cap).liberties;
}

/**
 * 获取位置的直接气数
 * 
 * @param stones - 棋盘状态
 * @param pos - 位置
 * @returns 直接气数
 */
export function getNumImmediateLiberties(stones: Uint8Array, pos: number): number {
  let num = 0;
  const nStart = NEIGHBOR_STARTS[pos]!;
  const nCount = NEIGHBOR_COUNTS[pos]!;
  for (let i = 0; i < nCount; i++) {
    const n = NEIGHBOR_LIST[nStart + i]!;
    if ((stones[n] as StoneColor) === EMPTY) num++;
  }
  return num;
}
