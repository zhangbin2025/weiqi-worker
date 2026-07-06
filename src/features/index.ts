/**
 * Features Module - Main Entry
 * 
 * 特征模块的主入口
 * 
 * 这个模块提供了 KataGo V7 输入特征计算功能。
 * 
 * 当前状态：
 * - 类型定义已经模块化（types.ts）
 * - 功能从原始文件重新导出（featuresV7.ts, featuresV7Fast.ts）
 * - 后续可以优化内部实现
 */

// ============================================================================
// 类型定义
// ============================================================================

export type {
  KataGoInputsV7,
  RecentMove,
  KataGoInputsV7Scratch,
  FeatureOptionsV7,
  FeatureOptionsV7Fast,
} from './types';

// ============================================================================
// 常量
// ============================================================================

/** V7 输入空间特征通道数 */
export const INPUT_SPATIAL_CHANNELS_V7 = 22;

/** V7 输入全局特征通道数 */
export const INPUT_GLOBAL_CHANNELS_V7 = 19;

// ============================================================================
// V7 特征计算（基础版本）
// ============================================================================

export {
  createKataGoInputsV7Scratch,
  fillInputsV7,
  extractInputsV7,
} from '../katago/featuresV7';

// ============================================================================
// V7 特征计算（快速版本，实际使用）
// ============================================================================

export {
  fillInputsV7Fast,
  extractInputsV7Fast,
} from '../katago/featuresV7Fast';

/**
 * 使用说明：
 * 
 * 1. 基础版本（使用 BoardState）：
 *    import { fillInputsV7, extractInputsV7 } from '@features';
 *    const inputs = extractInputsV7({ board, currentPlayer, moveHistory, komi });
 * 
 * 2. 快速版本（使用 Uint8Array，推荐）：
 *    import { fillInputsV7Fast, extractInputsV7Fast } from '@features';
 *    const inputs = extractInputsV7Fast({ stones, koPoint, currentPlayer, recentMoves, komi });
 * 
 * 3. 临时缓冲区（用于多次计算，减少内存分配）：
 *    import { createKataGoInputsV7Scratch } from '@features';
 *    const scratch = createKataGoInputsV7Scratch();
 *    fillInputsV7({ ..., scratch });
 */

/**
 * 模块设计说明：
 * 
 * 当前版本（Phase 2 进行中）：
 * - ✅ 类型定义已经模块化
 * - ✅ 常量已经模块化
 * - ⏳ 功能暂时从原始文件重新导出
 * 
 * 后续版本：
 * - FeatureEngine.ts - 特征引擎主入口
 * - SpatialFeatures.ts - 空间特征计算（planes 0-21）
 * - GlobalFeatures.ts - 全局特征计算（globals 0-18）
 * 
 * 重构原则：
 * - 保持公共 API 不变
 * - 内部实现可以自由重构
 * - 所有功能必须有单元测试
 */
