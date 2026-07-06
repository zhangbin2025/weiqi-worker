/**
 * Worker Module - Main Entry
 * 
 * Worker 模块的主入口
 * 
 * 这个模块提供了 Web Worker 通信功能。
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
  KataGoInitRequest,
  KataGoInitResponse,
  KataGoAnalyzeRequest,
  KataGoAnalyzeUpdate,
  KataGoAnalyzeResponse,
  KataGoProgressResponse,
  KataGoDebugLog,
  KataGoSetDebug,
  KataGoWorkerRequest,
  KataGoWorkerResponse,
} from './types';

// ============================================================================
// Worker 客户端
// ============================================================================

export {
  KataGoCanceledError,
  isKataGoCanceledError,
  getKataGoEngineClient,
  setWorkerUrl,
} from '../katago/client';

// ============================================================================
// Worker 内部（用于调试）
// ============================================================================

export { setDebugEnabled } from '../katago/worker';

/**
 * 使用说明：
 * 
 * 1. 获取引擎客户端：
 *    import { getKataGoEngineClient } from '@worker';
 *    const client = getKataGoEngineClient();
 * 
 * 2. 初始化引擎：
 *    await client.init(modelUrl, onProgress, baseUrl);
 * 
 * 3. 分析局面：
 *    const analysis = await client.analyze({ board, currentPlayer, ... });
 */

/**
 * 模块设计说明：
 * 
 * 当前版本（Phase 2 进行中）：
 * - ✅ 类型定义已经模块化
 * - ✅ 功能从原始文件重新导出
 * 
 * 后续版本：
 * - WorkerHost.ts - Worker 主机
 * - WorkerClient.ts - Worker 客户端
 * - MessageHandler.ts - 消息处理
 * - TaskScheduler.ts - 任务调度
 * 
 * 重构原则：
 * - 保持公共 API 不变
 * - 内部实现可以自由重构
 * - 所有功能必须有单元测试
 */
