/**
 * Search Module - Main Entry
 * 
 * 搜索模块的主入口
 * 
 * 这个模块提供了 MCTS 搜索算法实现。
 * 
 * 当前状态：
 * - 类型定义已经模块化（types.ts）
 * - 功能从原始文件重新导出（analyzeMcts.ts）
 * - 后续可以优化内部实现
 */

// ============================================================================
// 类型定义
// ============================================================================

export type {
  OwnershipMode,
  MCTSNode,
  MCTSEdge,
  MCTSSearchOptions,
  MCTSRunOptions,
  MCTSAnalysisOptions,
} from './types';

// ============================================================================
// MCTS 搜索
// ============================================================================

export {
  MctsSearch,
} from '../katago/analyzeMcts';

/**
 * 使用说明：
 * 
 * 1. 创建搜索树：
 *    import { MctsSearch } from '@search';
 *    const search = await MctsSearch.create({ model, board, ... });
 * 
 * 2. 执行搜索：
 *    const aborted = await search.run({ visits: 100, maxTimeMs: 10000 });
 * 
 * 3. 获取分析结果：
 *    const analysis = search.getAnalysis({ topK: 10, ... });
 */

/**
 * 模块设计说明：
 * 
 * 当前版本（Phase 2 进行中）：
 * - ✅ 类型定义已经模块化
 * - ✅ 功能从原始文件重新导出
 * 
 * 后续版本：
 * - mcts/MCTSEngine.ts - MCTS 引擎
 * - mcts/TreeNode.ts - 树节点
 * - mcts/Selection.ts - 选择策略
 * - mcts/Expansion.ts - 扩展策略
 * - mcts/Backpropagation.ts - 反向传播
 * - SearchParams.ts - 搜索参数
 * 
 * 重构原则：
 * - 保持公共 API 不变
 * - 内部实现可以自由重构
 * - 所有功能必须有单元测试
 */
