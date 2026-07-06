/**
 * KataGo Core - 常量定义
 * 
 * 定义所有常量，包括引擎参数、限制、默认值等。
 */

/**
 * 默认棋盘大小
 */
export const DEFAULT_BOARD_SIZE = 19;

/**
 * 默认贴目
 */
export const DEFAULT_KOMI = 7.5;

/**
 * 最大棋盘大小
 */
export const MAX_BOARD_SIZE = 19;

/**
 * 最小棋盘大小
 */
export const MIN_BOARD_SIZE = 9;

/**
 * Pass 着法标记
 */
export const PASS_MOVE = -1;

/**
 * 默认游戏规则
 */
export const DEFAULT_RULES = 'japanese';

/**
 * 引擎限制
 */
export const ENGINE_LIMITS = {
  /** 最大访问次数 */
  MAX_VISITS: 10000,
  
  /** 最大时间（毫秒） */
  MAX_TIME_MS: 60000,
  
  /** 最小访问次数 */
  MIN_VISITS: 1,
  
  /** 最小时间（毫秒） */
  MIN_TIME_MS: 100,
  
  /** 最大批大小 */
  MAX_BATCH_SIZE: 128,
  
  /** 默认批大小 */
  DEFAULT_BATCH_SIZE: 8,
  
  /** 最大子节点数 */
  MAX_CHILDREN: 100,
  
  /** 默认最大子节点数 */
  DEFAULT_MAX_CHILDREN: 50,
} as const;

/**
 * 搜索参数
 */
export const SEARCH_PARAMS = {
  /** 策略乐观系数 */
  POLICY_OPTIMISM: 1.0,
  
  /** 根节点策略乐观系数 */
  ROOT_POLICY_OPTIMISM: 1.0,
  
  /** FPU 减少量 */
  FPU_REDUCTION: 0.25,
  
  /** FPU 下降系数 */
  FPU_ROOT_DROPOUT: 0.0,
  
  /** C-Puct 常数 */
  CPUNCT: 1.0,
  
  /** C-Puct 增长因子 */
  CPUNCT_BASE: 0.9,
  
  /** C-Puct 最大值 */
  CPUNCT_MAX: 3.0,
  
  /** C-Puct 对数因子 */
  CPUCT_LOG: 0.0,
} as const;

/**
 * 特征参数
 */
export const FEATURE_PARAMS = {
  /** 空间特征通道数 */
  SPATIAL_CHANNELS: 22,
  
  /** 全局特征维度 */
  GLOBAL_DIM: 19,
  
  /** 最大历史着法数 */
  MAX_HISTORY_MOVES: 30,
  
  /** 默认历史着法数 */
  DEFAULT_HISTORY_MOVES: 5,
} as const;

/**
 * 模型参数
 */
export const MODEL_PARAMS = {
  /** 支持的模型版本范围 */
  MIN_VERSION: 8,
  MAX_VERSION: 14,
  
  /** V8 模型特定参数 */
  V8: {
    TD_SCORE_MULTIPLIER: 20,
    SCORE_MEAN_MULTIPLIER: 20,
    SCORE_STDEV_MULTIPLIER: 20,
    LEAD_MULTIPLIER: 20,
    VARIANCE_TIME_MULTIPLIER: 40,
    SHORTTERM_VALUE_ERROR_MULTIPLIER: 0.25,
    SHORTTERM_SCORE_ERROR_MULTIPLIER: 30,
    OUTPUT_SCALE_MULTIPLIER: 1,
  },
} as const;

/**
 * 后端优先级
 */
export const BACKEND_PRIORITY = {
  WEBGPU: 0,
  WEBGL: 1,
  WASM: 2,
  CPU: 3,
} as const;

/**
 * 默认超时时间（毫秒）
 */
export const DEFAULT_TIMEOUTS = {
  /** 初始化超时 */
  INIT: 60000,
  
  /** 模型加载超时 */
  MODEL_LOAD: 120000,
  
  /** 分析超时 */
  ANALYSIS: 30000,
  
  /** 评估超时 */
  EVAL: 10000,
} as const;

/**
 * 消息类型
 */
export const MESSAGE_TYPES = {
  // 请求类型
  INIT: 'katago:init',
  ANALYZE: 'katago:analyze',
  ANALYZE_GAME: 'katago:analyze_game',
  EVAL: 'katago:eval',
  EVAL_BATCH: 'katago:eval_batch',
  SET_DEBUG: 'katago:set_debug',
  
  // 响应类型
  INIT_RESULT: 'katago:init_result',
  ANALYZE_RESULT: 'katago:analyze_result',
  ANALYZE_UPDATE: 'katago:analyze_update',
  ANALYZE_GAME_RESULT: 'katago:analyze_game_result',
  EVAL_RESULT: 'katago:eval_result',
  EVAL_BATCH_RESULT: 'katago:eval_batch_result',
  PROGRESS: 'katago:progress',
  DEBUG_LOG: 'katago:debug_log',
} as const;

/**
 * 调试配置
 */
export const DEBUG_CONFIG = {
  /** 调试开关 localStorage key */
  DEBUG_KEY: 'KATAGO_DEBUG',
  
  /** 是否启用调试日志 */
  DEFAULT_ENABLED: false,
  
  /** 日志级别 */
  LOG_LEVELS: {
    LOG: 'log',
    WARN: 'warn',
    ERROR: 'error',
  } as const,
} as const;

/**
 * 石头颜色
 */
export const STONE_COLORS = {
  /** 空 */
  EMPTY: 0,
  
  /** 黑 */
  BLACK: 1,
  
  /** 白 */
  WHITE: 2,
} as const;

/**
 * 计算棋盘面积
 */
export function getBoardArea(size: number): number {
  return size * size;
}

/**
 * 计算邻居数组大小
 */
export function getNeighborArraySize(boardArea: number): number {
  return boardArea * 4;
}

/**
 * 验证棋盘大小
 */
export function isValidBoardSize(size: number): boolean {
  return size >= MIN_BOARD_SIZE && size <= MAX_BOARD_SIZE && Number.isInteger(size);
}

/**
 * 验证坐标
 */
export function isValidCoordinate(x: number, y: number, boardSize: number): boolean {
  return x >= 0 && x < boardSize && y >= 0 && y < boardSize;
}

/**
 * 验证贴目
 */
export function isValidKomi(komi: number): boolean {
  return Number.isFinite(komi);
}

/**
 * 验证访问次数
 */
export function isValidVisits(visits: number): boolean {
  return Number.isInteger(visits) && visits >= ENGINE_LIMITS.MIN_VISITS && visits <= ENGINE_LIMITS.MAX_VISITS;
}

/**
 * 验证时间
 */
export function isValidTimeMs(timeMs: number): boolean {
  return Number.isFinite(timeMs) && timeMs >= ENGINE_LIMITS.MIN_TIME_MS && timeMs <= ENGINE_LIMITS.MAX_TIME_MS;
}
