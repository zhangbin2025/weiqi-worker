/**
 * Model Module - Types
 * 
 * 模型模块的类型定义
 */

/**
 * 激活函数类型
 */
export type ActivationKind = 'identity' | 'relu' | 'mish';

/**
 * 解析后的批归一化层
 */
export interface ParsedBatchNorm {
  /** 通道数 */
  readonly channels: number;
  /** 合并后的缩放 */
  readonly mergedScale: Float32Array;
  /** 合并后的偏置 */
  readonly mergedBias: Float32Array;
}

/**
 * 解析后的卷积层
 */
export interface ParsedConv2d {
  /** 名称 */
  readonly name: string;
  /** 卷积核 Y 大小 */
  readonly kernelY: number;
  /** 卷积核 X 大小 */
  readonly kernelX: number;
  /** 输入通道数 */
  readonly inChannels: number;
  /** 输出通道数 */
  readonly outChannels: number;
  /** Y 方向膨胀 */
  readonly dilationY: number;
  /** X 方向膨胀 */
  readonly dilationX: number;
  /** 权重 [kY,kX,inC,outC] */
  readonly weights: Float32Array;
}

/**
 * 解析后的矩阵乘法层
 */
export interface ParsedMatMul {
  /** 名称 */
  readonly name: string;
  /** 输入通道数 */
  readonly inChannels: number;
  /** 输出通道数 */
  readonly outChannels: number;
  /** 权重 [inC,outC] */
  readonly weights: Float32Array;
}

/**
 * 解析后的矩阵偏置
 */
export interface ParsedMatBias {
  /** 名称 */
  readonly name: string;
  /** 通道数 */
  readonly channels: number;
  /** 权重 */
  readonly weights: Float32Array;
}

/**
 * 模型后处理参数
 */
export interface ModelPostProcessParams {
  /** TD 得分乘数 */
  tdScoreMultiplier: number;
  /** 得分均值乘数 */
  scoreMeanMultiplier: number;
  /** 得分标准差乘数 */
  scoreStdevMultiplier: number;
  /** 领先乘数 */
  leadMultiplier: number;
  /** 方差时间乘数 */
  varianceTimeMultiplier: number;
  /** 短期价值误差乘数 */
  shorttermValueErrorMultiplier: number;
  /** 短期得分误差乘数 */
  shorttermScoreErrorMultiplier: number;
  /** 输出缩放乘数 */
  outputScaleMultiplier: number;
}
