/**
 * Board Module - Constants
 * 
 * 棋盘模块的常量定义
 */

/**
 * 石头颜色常量
 */
export const EMPTY = 0 as const;
export const BLACK = 1 as const;
export const WHITE = 2 as const;

/**
 * 获取对手颜色
 */
export function opponentOf(color: number): number {
  return (3 - color) as 1 | 2;
}
