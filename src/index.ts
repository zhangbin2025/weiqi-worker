// KataGo Core Library - Main Entry Point

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

// Export KataGo client
export { getKataGoEngineClient, setWorkerUrl } from './katago/client';

// Export error classes and utilities
export { KataGoCanceledError, isKataGoCanceledError } from './katago/client';

// Export utility functions (if needed by applications)
export { getOpponent } from './utils/gameLogic';

// 导出调试控制函数
export { setDebugEnabled } from './katago/worker';
