/**
 * Model Module - Main Entry
 * 
 * 模型模块的主入口
 * 
 * 这个模块提供了 KataGo 模型的加载、解析和推理功能。
 * 
 * 当前状态：
 * - 类型定义已经模块化（types.ts）
 * - 功能从原始文件重新导出（binModelParser.ts, loadModelV8.ts, modelV8.ts）
 * - 后续可以优化内部实现
 */

// ============================================================================
// 类型定义
// ============================================================================

export type {
  ActivationKind,
  ParsedBatchNorm,
  ParsedConv2d,
  ParsedMatMul,
  ParsedMatBias,
  ModelPostProcessParams,
} from './types';

// ============================================================================
// 模型解析器
// ============================================================================

export {
  KataGoBinModelParser,
  parseActivationKind,
  parseBatchNormV8,
  parseConv2d,
  parseMatBias,
  parseMatMul,
} from '../katago/binModelParser';

// ============================================================================
// 模型加载器
// ============================================================================

export { parseKataGoModelV8 } from '../katago/loadModelV8';

// ============================================================================
// 模型推理
// ============================================================================

export {
  KataGoModelV8Tf,
  type ParsedKataGoModelV8,
} from '../katago/modelV8';

/**
 * 使用说明：
 * 
 * 1. 解析模型：
 *    import { parseKataGoModelV8 } from '@model';
 *    const modelData = await fetch(modelUrl).then(r => r.arrayBuffer());
 *    const parsed = parseKataGoModelV8(new Uint8Array(modelData));
 * 
 * 2. 创建模型实例：
 *    import { KataGoModelV8Tf } from '@model';
 *    const model = new KataGoModelV8Tf(parsed);
 * 
 * 3. 模型推理：
 *    const { policy, value, ownership } = model.forward(spatial, global);
 */

/**
 * 模块设计说明：
 * 
 * 当前版本（Phase 2 进行中）：
 * - ✅ 类型定义已经模块化
 * - ✅ 功能从原始文件重新导出
 * 
 * 后续版本：
 * - ModelLoader.ts - 模型加载器
 * - ModelRegistry.ts - 模型注册表（支持多版本）
 * - v8/ModelV8.ts - V8 模型实现
 * - v8/ParserV8.ts - V8 模型解析器
 * - v8/EvaluatorV8.ts - V8 评估器
 * 
 * 重构原则：
 * - 保持公共 API 不变
 * - 内部实现可以自由重构
 * - 所有功能必须有单元测试
 */
