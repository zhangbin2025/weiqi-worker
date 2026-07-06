/**
 * Analysis Module - Main Entry
 * 
 * 分析模块的主入口
 * 
 * 这个模块提供了局面分析、评估、批量分析等功能。
 * 
 * 当前状态：
 * - 类型定义已经模块化（types.ts）
 * - 功能从原始文件重新导出（worker.ts, client.ts）
 * - 后续可以优化内部实现
 */

// ============================================================================
// 类型定义
// ============================================================================

export type {
  KataGoAnalyzeGameRequest,
  KataGoAnalyzeGameResponse,
  KataGoEvalRequest,
  KataGoEvalResponse,
  KataGoEvalBatchRequest,
  KataGoEvalBatchResponse,
} from './types';

/**
 * 使用说明：
 * 
 * 1. 分析请求和响应类型：
 *    import type { KataGoAnalyzeGameRequest, KataGoAnalyzeGameResponse } from '@analysis';
 * 
 * 2. 评估请求和响应类型：
 *    import type { KataGoEvalRequest, KataGoEvalResponse } from '@analysis';
 * 
 * 注意：实际的分析功能通过 Worker 客户端调用（见 @worker 模块）
 */

/**
 * 模块设计说明：
 * 
 * 当前版本（Phase 2 进行中）：
 * - ✅ 类型定义已经模块化
 * - ✅ 公共 API 保持兼容
 * 
 * 后续版本：
 * - AnalysisEngine.ts - 分析引擎
 * - PositionAnalyzer.ts - 局面分析器
 * - BatchProcessor.ts - 批量处理器
 * - ResultBuilder.ts - 结果构建器
 * 
 * 重构原则：
 * - 保持公共 API 不变
 * - 内部实现可以自由重构
 * - 所有功能必须有单元测试
 */
