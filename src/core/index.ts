/**
 * KataGo Core - 核心模块入口
 * 
 * 导出所有核心类型、接口、错误和常量。
 */

// 类型定义
export type {
  Player,
  Intersection,
  BoardState,
  FloatArray,
  GameRules,
  OwnershipMode,
  Move,
  GameState,
  CandidateMove,
  AnalysisResult,
  RegionOfInterest,
  BackendType,
  ModelInfo,
  EngineState,
  ProgressInfo,
  AnalysisOptions,
  EvalOptions,
  EvalResult,
  EvalBatchOptions,
  AnalyzeGameOptions,
  AnalysisPayload,
} from './types';

// 接口定义
export type {
  IBoardSimulator,
  IBoardPosition,
  IFeatureEngine,
  IFeatureOptions,
  IModel,
  IModelRegistry,
  IModelFactory,
  IMCTSEngine,
  IMCTSSearchOptions,
  IMCTSRunOptions,
  IMCTSAnalysisOptions,
  IAnalysisEngine,
  IEngineInitOptions,
  IBackendManager,
  IWorkerClient,
  ITaskScheduler,
  IErrorHandler,
} from './interfaces';

// 错误类型
export {
  KataGoError,
  KataGoInitError,
  KataGoModelLoadError,
  KataGoBackendError,
  KataGoAnalysisError,
  KataGoCanceledError,
  KataGoTimeoutError,
  KataGoUnsupportedModelError,
  KataGoInvalidArgumentError,
  KataGoBoardError,
  KataGoIllegalMoveError,
  KataGoWorkerError,
  KataGoWorkerCommunicationError,
  KataGoFeatureError,
  KataGoSearchError,
  isKataGoCanceledError,
  isKataGoError,
  ErrorCategory,
  categorizeError,
  formatError,
} from './errors';

// 常量
export {
  DEFAULT_BOARD_SIZE,
  DEFAULT_KOMI,
  MAX_BOARD_SIZE,
  MIN_BOARD_SIZE,
  PASS_MOVE,
  DEFAULT_RULES,
  ENGINE_LIMITS,
  SEARCH_PARAMS,
  FEATURE_PARAMS,
  MODEL_PARAMS,
  BACKEND_PRIORITY,
  DEFAULT_TIMEOUTS,
  MESSAGE_TYPES,
  DEBUG_CONFIG,
  STONE_COLORS,
  getBoardArea,
  getNeighborArraySize,
  isValidBoardSize,
  isValidCoordinate,
  isValidKomi,
  isValidVisits,
  isValidTimeMs,
} from './constants';
