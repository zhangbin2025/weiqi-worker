/**
 * KataGo Core - 错误处理体系
 * 
 * 定义所有错误类型，提供统一的错误处理机制。
 */

/**
 * KataGo 基础错误类
 */
export class KataGoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KataGoError';
  }
}

/**
 * 初始化错误
 */
export class KataGoInitError extends KataGoError {
  constructor(message: string) {
    super(message);
    this.name = 'KataGoInitError';
  }
}

/**
 * 模型加载错误
 */
export class KataGoModelLoadError extends KataGoInitError {
  readonly url: string;

  constructor(url: string, reason: string) {
    super(`Failed to load model from ${url}: ${reason}`);
    this.name = 'KataGoModelLoadError';
    this.url = url;
  }
}

/**
 * 后端初始化错误
 */
export class KataGoBackendError extends KataGoInitError {
  readonly backend: string;

  constructor(backend: string, reason: string) {
    super(`Failed to initialize ${backend} backend: ${reason}`);
    this.name = 'KataGoBackendError';
    this.backend = backend;
  }
}

/**
 * 分析错误
 */
export class KataGoAnalysisError extends KataGoError {
  constructor(message: string) {
    super(message);
    this.name = 'KataGoAnalysisError';
  }
}

/**
 * 分析取消错误
 */
export class KataGoCanceledError extends KataGoAnalysisError {
  readonly canceled = true;

  constructor(message = 'Analysis canceled') {
    super(message);
    this.name = 'KataGoCanceledError';
  }
}

/**
 * 超时错误
 */
export class KataGoTimeoutError extends KataGoAnalysisError {
  readonly timeout: number;

  constructor(timeout: number) {
    super(`Analysis timed out after ${timeout}ms`);
    this.name = 'KataGoTimeoutError';
    this.timeout = timeout;
  }
}

/**
 * 模型不支持错误
 */
export class KataGoUnsupportedModelError extends KataGoError {
  readonly version: number;

  constructor(version: number) {
    super(`Unsupported model version: ${version}`);
    this.name = 'KataGoUnsupportedModelError';
    this.version = version;
  }
}

/**
 * 无效参数错误
 */
export class KataGoInvalidArgumentError extends KataGoError {
  readonly argument: string;

  constructor(argument: string, reason: string) {
    super(`Invalid argument '${argument}': ${reason}`);
    this.name = 'KataGoInvalidArgumentError';
    this.argument = argument;
  }
}

/**
 * 棋盘错误
 */
export class KataGoBoardError extends KataGoError {
  constructor(message: string) {
    super(message);
    this.name = 'KataGoBoardError';
  }
}

/**
 * 非法着法错误
 */
export class KataGoIllegalMoveError extends KataGoBoardError {
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number, reason: string) {
    super(`Illegal move (${x}, ${y}): ${reason}`);
    this.name = 'KataGoIllegalMoveError';
    this.x = x;
    this.y = y;
  }
}

/**
 * Worker 错误
 */
export class KataGoWorkerError extends KataGoError {
  constructor(message: string) {
    super(message);
    this.name = 'KataGoWorkerError';
  }
}

/**
 * Worker 通信错误
 */
export class KataGoWorkerCommunicationError extends KataGoWorkerError {
  constructor(message: string) {
    super(`Worker communication error: ${message}`);
    this.name = 'KataGoWorkerCommunicationError';
  }
}

/**
 * 特征计算错误
 */
export class KataGoFeatureError extends KataGoError {
  constructor(message: string) {
    super(message);
    this.name = 'KataGoFeatureError';
  }
}

/**
 * 搜索错误
 */
export class KataGoSearchError extends KataGoError {
  constructor(message: string) {
    super(message);
    this.name = 'KataGoSearchError';
  }
}

/**
 * 类型守卫：判断是否为取消错误
 */
export function isKataGoCanceledError(err: unknown): err is KataGoCanceledError {
  if (!err || typeof err !== 'object') return false;
  if ((err as { canceled?: boolean }).canceled) return true;
  return err instanceof Error && err.name === 'KataGoCanceledError';
}

/**
 * 类型守卫：判断是否为 KataGo 错误
 */
export function isKataGoError(err: unknown): err is KataGoError {
  return err instanceof KataGoError;
}

/**
 * 错误分类
 */
export enum ErrorCategory {
  INIT = 'init',
  ANALYSIS = 'analysis',
  BOARD = 'board',
  WORKER = 'worker',
  MODEL = 'model',
  FEATURE = 'feature',
  SEARCH = 'search',
  UNKNOWN = 'unknown',
}

/**
 * 错误分类器
 */
export function categorizeError(err: Error): ErrorCategory {
  if (err instanceof KataGoInitError) return ErrorCategory.INIT;
  if (err instanceof KataGoAnalysisError) return ErrorCategory.ANALYSIS;
  if (err instanceof KataGoBoardError) return ErrorCategory.BOARD;
  if (err instanceof KataGoWorkerError) return ErrorCategory.WORKER;
  if (err instanceof KataGoFeatureError) return ErrorCategory.FEATURE;
  if (err instanceof KataGoSearchError) return ErrorCategory.SEARCH;
  return ErrorCategory.UNKNOWN;
}

/**
 * 错误格式化
 */
export function formatError(err: Error): string {
  if (isKataGoError(err)) {
    return `[${err.name}] ${err.message}`;
  }
  // TypeScript type narrowing: err is Error but not KataGoError
  return (err as Error).message;
}
