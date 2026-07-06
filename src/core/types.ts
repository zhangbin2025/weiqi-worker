/**
 * KataGo Core - 统一类型定义
 * 
 * 这个文件定义了所有核心类型，确保类型安全和代码可维护性。
 * 所有公共 API 的类型都应该从这里导出。
 */

/**
 * 棋手颜色
 */
export type Player = 'black' | 'white';

/**
 * 棋盘交叉点状态
 */
export type Intersection = Player | null;

/**
 * 棋盘状态 - 二维数组表示
 */
export type BoardState = Intersection[][];

/**
 * 浮点数数组类型（支持 Float32Array 和普通数组）
 */
export type FloatArray = Float32Array | number[];

/**
 * 游戏规则类型
 */
export type GameRules = 'japanese' | 'chinese' | 'korean';

/**
 * 所有权模式
 */
export type OwnershipMode = 'none' | 'root' | 'tree';

/**
 * 着法
 */
export interface Move {
  /** X 坐标 (0-18) */
  x: number;
  /** Y 坐标 (0-18) */
  y: number;
  /** 执棋方 */
  player: Player;
}

/**
 * 游戏状态
 */
export interface GameState {
  /** 当前棋盘状态 */
  board: BoardState;
  /** 当前执棋方 */
  currentPlayer: Player;
  /** 着法历史 */
  moveHistory: Move[];
  /** 黑方提子数 */
  capturedBlack: number;
  /** 白方提子数 */
  capturedWhite: number;
  /** 贴目 */
  komi: number;
}

/**
 * 候选着法
 */
export interface CandidateMove {
  /** X 坐标 */
  x: number;
  /** Y 坐标 */
  y: number;
  /** 胜率 (0-1) */
  winRate: number;
  /** 领先目数 */
  scoreLead: number;
  /** 访问次数 */
  visits: number;
  /** 排序 */
  order: number;
  /** 变化图 */
  pv?: string[];
}

/**
 * 分析结果
 */
export interface AnalysisResult {
  /** 根节点胜率 */
  rootWinRate: number;
  /** 根节点领先目数 */
  rootScoreLead: number;
  /** 候选着法列表 */
  moves: CandidateMove[];
}

/**
 * 区域兴趣（用于局部分析）
 */
export interface RegionOfInterest {
  /** X 最小值 */
  xMin: number;
  /** X 最大值 */
  xMax: number;
  /** Y 最小值 */
  yMin: number;
  /** Y 最大值 */
  yMax: number;
}

/**
 * 后端类型
 */
export type BackendType = 'webgpu' | 'webgl' | 'wasm' | 'cpu';

/**
 * 模型信息
 */
export interface ModelInfo {
  /** 模型名称 */
  name: string;
  /** 模型版本 */
  version: number;
  /** 模型 URL */
  url: string;
  /** 后端类型 */
  backend: BackendType;
}

/**
 * 引擎状态
 */
export interface EngineState {
  /** 是否已初始化 */
  initialized: boolean;
  /** 当前后端 */
  backend: BackendType | null;
  /** 模型信息 */
  model: ModelInfo | null;
  /** 是否正在分析 */
  analyzing: boolean;
}

/**
 * 进度信息
 */
export interface ProgressInfo {
  /** 已加载字节数 */
  loaded: number;
  /** 总字节数 */
  total: number;
  /** 进度 (0-1) */
  progress: number;
}

/**
 * 分析选项
 */
export interface AnalysisOptions {
  /** 分析组（interactive | background） */
  analysisGroup?: 'interactive' | 'background';
  /** 位置 ID */
  positionId?: string;
  /** 父位置 ID */
  parentPositionId?: string;
  /** 模型 URL */
  modelUrl: string;
  /** 棋盘状态 */
  board: BoardState;
  /** 前一帧棋盘 */
  previousBoard?: BoardState;
  /** 前前一帧棋盘 */
  previousPreviousBoard?: BoardState;
  /** 当前执棋方 */
  currentPlayer: Player;
  /** 着法历史 */
  moveHistory: Move[];
  /** 贴目 */
  komi: number;
  /** 规则 */
  rules?: GameRules;
  /** 区域兴趣 */
  regionOfInterest?: RegionOfInterest | null;
  /** 返回前 K 个候选着法 */
  topK?: number;
  /** 变化图长度 */
  analysisPvLen?: number;
  /** 是否包含着法所有权 */
  includeMovesOwnership?: boolean;
  /** 根节点噪声 */
  wideRootNoise?: number;
  /** 是否随机化神经网络 */
  nnRandomize?: boolean;
  /** 保守 Pass */
  conservativePass?: boolean;
  /** 访问次数限制 */
  visits?: number;
  /** 最大时间限制（毫秒） */
  maxTimeMs?: number;
  /** 批大小 */
  batchSize?: number;
  /** 最大子节点数 */
  maxChildren?: number;
  /** 搜索期间报告间隔（毫秒） */
  reportDuringSearchEveryMs?: number;
  /** 所有权刷新间隔（毫秒） */
  ownershipRefreshIntervalMs?: number;
  /** 是否重用树 */
  reuseTree?: boolean;
  /** 所有权模式 */
  ownershipMode?: OwnershipMode;
}

/**
 * 评估选项
 */
export interface EvalOptions {
  /** 模型 URL */
  modelUrl: string;
  /** 棋盘状态 */
  board: BoardState;
  /** 前一帧棋盘 */
  previousBoard?: BoardState;
  /** 前前一帧棋盘 */
  previousPreviousBoard?: BoardState;
  /** 当前执棋方 */
  currentPlayer: Player;
  /** 着法历史 */
  moveHistory: Move[];
  /** 贴目 */
  komi: number;
  /** 规则 */
  rules?: GameRules;
  /** 保守 Pass */
  conservativePass?: boolean;
}

/**
 * 评估结果
 */
export interface EvalResult {
  /** 根节点胜率 */
  rootWinRate: number;
  /** 根节点领先目数 */
  rootScoreLead: number;
  /** 根节点自玩得分 */
  rootScoreSelfplay: number;
  /** 根节点得分标准差 */
  rootScoreStdev: number;
}

/**
 * 批量评估选项
 */
export interface EvalBatchOptions {
  /** 模型 URL */
  modelUrl: string;
  /** 位置列表 */
  positions: Array<{
    board: BoardState;
    previousBoard?: BoardState;
    previousPreviousBoard?: BoardState;
    currentPlayer: Player;
    moveHistory: Move[];
    komi: number;
  }>;
  /** 规则 */
  rules?: GameRules;
  /** 保守 Pass */
  conservativePass?: boolean;
}

/**
 * 批量分析请求
 */
export interface AnalyzeGameOptions {
  /** 模型 URL */
  modelUrl: string;
  /** 所有着法 */
  moves: Move[];
  /** 初始棋子（如让子） */
  initialStones?: Move[];
  /** 贴目 */
  komi: number;
  /** 规则 */
  rules?: GameRules;
  /** 要分析的回合 */
  analyzeTurns?: number[];
  /** 访问次数 */
  visits?: number;
  /** 最大时间（毫秒） */
  maxTimeMs?: number;
  /** 返回前 K 个候选着法 */
  topK?: number;
  /** 变化图长度 */
  analysisPvLen?: number;
  /** 是否包含着法所有权 */
  includeMovesOwnership?: boolean;
  /** 是否包含所有权 */
  includeOwnership?: boolean;
  /** 是否包含所有权标准差 */
  includeOwnershipStdev?: boolean;
  /** 根节点噪声 */
  wideRootNoise?: number;
  /** 是否随机化神经网络 */
  nnRandomize?: boolean;
  /** 保守 Pass */
  conservativePass?: boolean;
}

/**
 * 分析载荷（详细结果）
 */
export interface AnalysisPayload {
  /** 根节点胜率 */
  rootWinRate: number;
  /** 根节点领先目数 */
  rootScoreLead: number;
  /** 根节点自玩得分 */
  rootScoreSelfplay: number;
  /** 根节点得分标准差 */
  rootScoreStdev: number;
  /** 根节点访问次数 */
  rootVisits: number;
  /** 所有权（+1 黑方拥有，-1 白方拥有） */
  ownership: FloatArray;
  /** 所有权标准差 */
  ownershipStdev: FloatArray;
  /** 策略（非法 = -1，Pass 在索引 361） */
  policy: FloatArray;
  /** 候选着法列表 */
  moves: Array<{
    x: number;
    y: number;
    winRate: number;
    winRateLost: number;
    scoreLead: number;
    scoreSelfplay: number;
    scoreStdev: number;
    visits: number;
    pointsLost: number;
    relativePointsLost: number;
    order: number;
    prior: number;
    pv: string[];
    ownership?: FloatArray;
  }>;
}
