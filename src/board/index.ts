/**
 * Board Module - Main Entry
 * 
 * 棋盘模块的主入口
 * 
 * 这个模块提供了棋盘模拟、群组计算、气计算、领地计算、征子检测等功能。
 */

// ============================================================================
// 类型定义
// ============================================================================

export type { StoneColor, SimPosition, UndoSnapshot, GroupInfo, KataGoLadderFeaturesV7 } from './types';

// ============================================================================
// 常量
// ============================================================================

export { EMPTY, BLACK, WHITE, opponentOf } from './constants';

// ============================================================================
// 状态管理
// ============================================================================

export {
  BOARD_SIZE,
  BOARD_AREA,
  PASS_MOVE,
  NEIGHBOR_STARTS,
  NEIGHBOR_COUNTS,
  NEIGHBOR_LIST,
  setBoardSize,
  LADDER_SEARCH_NODE_BUDGET,
} from './BoardState';

// ============================================================================
// 群组收集
// ============================================================================

export {
  collectGroupAndLiberties,
  findLibertiesIntoBuf,
  getNumLibertiesCapped,
  getNumImmediateLiberties,
} from './GroupCollector';

// ============================================================================
// 棋盘模拟
// ============================================================================

export {
  playMove,
  undoMove,
  tryPlayMoveNoThrow,
  undoMoveRaw,
} from './BoardSimulator';

// ============================================================================
// 气计算
// ============================================================================

export {
  computeLibertyMapInto,
  updateLibertyMapForSeeds,
  computeLibertyMap,
} from './LibertyCalculator';

// ============================================================================
// 领地计算
// ============================================================================

export {
  computeAreaMapV7KataGo,
  computeAreaMapV7KataGoInto,
} from './AreaCalculator';

// ============================================================================
// 征子检测
// ============================================================================

export {
  computeLadderFeaturesV7KataGo,
  computeLadderFeaturesV7KataGoInto,
  computeLadderedStonesV7KataGoInto,
  computeLadderedStonesV7KataGo,
} from './LadderDetector';

/**
 * 使用说明：
 * 
 * 1. 类型导入：
 *    import type { StoneColor, SimPosition, UndoSnapshot } from '@board';
 * 
 * 2. 常量导入：
 *    import { EMPTY, BLACK, WHITE, BOARD_SIZE, BOARD_AREA } from '@board';
 * 
 * 3. 函数导入：
 *    import { playMove, undoMove, computeLibertyMap } from '@board';
 * 
 * 4. 设置棋盘大小：
 *    import { setBoardSize } from '@board';
 *    setBoardSize(19); // 默认是 19
 */

/**
 * 模块设计说明：
 * 
 * 当前版本（Phase 2 进行中）：
 * - ✅ 类型和常量已经模块化
 * - ✅ 全局状态已经模块化（BoardState.ts）
 * - ✅ 群组收集已经模块化（GroupCollector.ts）
 * - ✅ 棋盘模拟已经模块化（BoardSimulator.ts）
 * - ⏳ 气计算、领地计算、征子检测暂时从原始文件重新导出
 * 
 * 后续版本：
 * - LibertyCalculator.ts - 气图计算
 * - AreaCalculator.ts - 领地计算（Benson算法）
 * - LadderDetector.ts - 征子检测
 * 
 * 重构原则：
 * - 保持公共 API 不变
 * - 内部实现可以自由重构
 * - 所有功能必须有单元测试
 */
