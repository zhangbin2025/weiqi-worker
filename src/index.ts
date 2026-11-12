// KataGo Core Library - Main Entry Point
//
// weiqi-worker 门面：weiqi-bot 只 import 本文件导出的符号。
// 引擎实现来自 src/upstream/（上游 web-katrain pin commit + patches/）。
// KataGo debug 接口（setDebugEnabled / KATAGO_DEBUG / katago:set_debug /
// katago:debug_log）已随上游对接彻底移除，weiqi-bot 侧调用代码同步删除。

// Export types
export type {
  BoardState,
  Player,
  Move,
  AnalysisResult,
  GameState,
  GameRules,
  RegionOfInterest,
  FloatArray,
  CandidateMove
} from './types';

// Export KataGo client（协议客户端保留，见 docs/UPSTREAM.md）
export { getKataGoEngineClient, setWorkerUrl } from './katago/client';

// Export error classes and utilities
export { KataGoCanceledError, isKataGoCanceledError } from './katago/client';

// Export utility functions (if needed by applications)
export { getOpponent } from './utils/gameLogic';
