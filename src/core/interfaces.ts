/**
 * KataGo Core - 核心接口定义
 * 
 * 定义所有核心模块的接口，确保模块间的松耦合和可扩展性。
 */

import type {
  Player,
  BoardState,
  Move,
  GameRules,
  RegionOfInterest,
  BackendType,
  ModelInfo,
  EngineState,
  ProgressInfo,
  AnalysisOptions,
  AnalysisPayload,
  EvalOptions,
  EvalResult,
  EvalBatchOptions,
  AnalyzeGameOptions,
  OwnershipMode,
} from './types';

/**
 * 棋盘模拟器接口
 */
export interface IBoardSimulator {
  /**
   * 获取棋盘大小
   */
  getBoardSize(): number;

  /**
   * 获取棋盘面积
   */
  getBoardArea(): number;

  /**
   * 执行着法
   */
  playMove(pos: number, player: Player): void;

  /**
   * 撤销着法
   */
  undoMove(): void;

  /**
   * 获取当前位置
   */
  getPosition(): IBoardPosition;
}

/**
 * 棋盘位置接口
 */
export interface IBoardPosition {
  /**
   * 棋子状态（Uint8Array）
   */
  stones: Uint8Array;

  /**
   * 劫点位置
   */
  koPoint: number;
}

/**
 * 特征引擎接口
 */
export interface IFeatureEngine {
  /**
   * 计算空间特征
   */
  computeSpatialFeatures(board: BoardState, options: IFeatureOptions): Float32Array;

  /**
   * 计算全局特征
   */
  computeGlobalFeatures(board: BoardState, options: IFeatureOptions): Float32Array;

  /**
   * 批量计算特征
   */
  computeFeaturesBatch(boards: BoardState[], options: IFeatureOptions): {
    spatial: Float32Array;
    global: Float32Array;
  };
}

/**
 * 特征计算选项
 */
export interface IFeatureOptions {
  currentPlayer: Player;
  moveHistory: Move[];
  komi: number;
  rules: GameRules;
  koPoint?: number;
  previousBoard?: BoardState;
  previousPreviousBoard?: BoardState;
  regionOfInterest?: RegionOfInterest | null;
}

/**
 * 模型基类接口
 */
export interface IModel {
  /**
   * 模型信息
   */
  readonly info: ModelInfo;

  /**
   * 初始化模型
   */
  init(url: string, onProgress?: (progress: ProgressInfo) => void): Promise<void>;

  /**
   * 前向推理（策略 + 价值）
   */
  forwardPolicyValue(spatial: Float32Array, global: Float32Array): Promise<{
    policy: Float32Array;
    value: Float32Array;
  }>;

  /**
   * 前向推理（策略 + 价值 + 所有权）
   */
  forward(spatial: Float32Array, global: Float32Array): Promise<{
    policy: Float32Array;
    value: Float32Array;
    ownership: Float32Array;
  }>;

  /**
   * 批量前向推理
   */
  forwardBatch(spatial: Float32Array, global: Float32Array, batchSize: number): Promise<{
    policy: Float32Array;
    value: Float32Array;
    ownership?: Float32Array;
  }>;

  /**
   * 释放资源
   */
  dispose(): void;
}

/**
 * 模型注册表接口
 */
export interface IModelRegistry {
  /**
   * 注册模型
   */
  registerModel(version: number, factory: IModelFactory): void;

  /**
   * 获取模型
   */
  getModel(version: number): IModel | null;

  /**
   * 获取支持的版本列表
   */
  getSupportedVersions(): number[];
}

/**
 * 模型工厂接口
 */
export interface IModelFactory {
  /**
   * 创建模型实例
   */
  create(): IModel;
}

/**
 * MCTS 搜索引擎接口
 */
export interface IMCTSEngine {
  /**
   * 创建搜索树
   */
  createTree(options: IMCTSSearchOptions): Promise<void>;

  /**
   * 执行搜索
   */
  search(options: IMCTSRunOptions): Promise<boolean>;

  /**
   * 获取分析结果
   */
  getAnalysis(options: IMCTSAnalysisOptions): AnalysisPayload;

  /**
   * 取消搜索
   */
  cancel(): void;

  /**
   * 重置搜索树
   */
  reset(): void;
}

/**
 * MCTS 搜索选项
 */
export interface IMCTSSearchOptions {
  model: IModel;
  board: BoardState;
  previousBoard?: BoardState;
  previousPreviousBoard?: BoardState;
  currentPlayer: Player;
  moveHistory: Move[];
  komi: number;
  rules: GameRules;
  maxChildren: number;
  ownershipMode: OwnershipMode;
  wideRootNoise: number;
  nnRandomize: boolean;
  conservativePass: boolean;
  regionOfInterest?: RegionOfInterest | null;
}

/**
 * MCTS 运行选项
 */
export interface IMCTSRunOptions {
  visits: number;
  maxTimeMs: number;
  batchSize: number;
  shouldAbort?: () => boolean;
}

/**
 * MCTS 分析选项
 */
export interface IMCTSAnalysisOptions {
  topK: number;
  includeMovesOwnership: boolean;
  analysisPvLen: number;
  cloneBuffers: boolean;
  ownershipRefreshIntervalMs?: number;
}

/**
 * 分析引擎接口
 */
export interface IAnalysisEngine {
  /**
   * 初始化引擎
   */
  init(options: IEngineInitOptions): Promise<void>;

  /**
   * 分析局面
   */
  analyze(options: AnalysisOptions, onProgress?: (analysis: AnalysisPayload) => void): Promise<AnalysisPayload>;

  /**
   * 批量分析整局
   */
  analyzeGame(options: AnalyzeGameOptions): Promise<Array<{ turnNumber: number; analysis: AnalysisPayload }>>;

  /**
   * 评估局面
   */
  evaluate(options: EvalOptions): Promise<EvalResult>;

  /**
   * 批量评估
   */
  evaluateBatch(options: EvalBatchOptions): Promise<EvalResult[]>;

  /**
   * 取消当前分析
   */
  cancel(): void;

  /**
   * 获取引擎状态
   */
  getState(): EngineState;

  /**
   * 设置调试模式
   */
  setDebugMode(enabled: boolean): void;
}

/**
 * 引擎初始化选项
 */
export interface IEngineInitOptions {
  modelUrl: string;
  baseUrl?: string;
  debugEnabled?: boolean;
  onProgress?: (progress: ProgressInfo) => void;
}

/**
 * 后端管理器接口
 */
export interface IBackendManager {
  /**
   * 初始化后端
   */
  init(): Promise<BackendType>;

  /**
   * 获取当前后端
   */
  getCurrentBackend(): BackendType | null;

  /**
   * 获取可用的后端列表
   */
  getAvailableBackends(): BackendType[];

  /**
   * 设置首选后端
   */
  setPreferredBackend(backend: BackendType): void;
}

/**
 * Worker 客户端接口
 */
export interface IWorkerClient {
  /**
   * 发送消息到 Worker
   */
  postMessage(message: unknown): void;

  /**
   * 设置消息处理器
   */
  onMessage(handler: (message: unknown) => void): void;

  /**
   * 终止 Worker
   */
  terminate(): void;
}

/**
 * 任务调度器接口
 */
export interface ITaskScheduler {
  /**
   * 提交任务
   */
  submit<T>(task: () => Promise<T>, priority?: number): Promise<T>;

  /**
   * 取消所有任务
   */
  cancelAll(): void;

  /**
   * 获取待处理任务数
   */
  getPendingCount(): number;
}

/**
 * 错误处理器接口
 */
export interface IErrorHandler {
  /**
   * 处理错误
   */
  handle(error: Error): void;

  /**
   * 设置错误处理器
   */
  setHandler(handler: (error: Error) => void): void;
}
