/**
 * Board Module - Board State Management
 * 
 * 管理棋盘的全局状态，包括棋盘大小、邻居数据结构、临时缓冲区等。
 * 
 * 注意：这些是全局可变状态，用于性能优化。
 * 在多线程环境中需要特别小心。
 */

import type { StoneColor, SimPosition } from './types';

// ============================================================================
// 棋盘基础常量（可变，根据棋盘大小调整）
// ============================================================================

/** 当前棋盘大小 */
export let BOARD_SIZE = 19;

/** 当前棋盘面积 */
export let BOARD_AREA = BOARD_SIZE * BOARD_SIZE;

/** Pass 着法标记 */
export let PASS_MOVE = BOARD_AREA;

// ============================================================================
// 邻居数据结构（用于快速访问相邻位置）
// ============================================================================

/** 每个位置的邻居起始索引 */
let NEIGHBOR_START = new Int16Array(BOARD_AREA);

/** 每个位置的邻居数量 */
let NEIGHBOR_COUNT = new Int8Array(BOARD_AREA);

/** 邻居列表（扁平化数组） */
let NEIGHBORS = new Int16Array(BOARD_AREA * 4);

/** 导出的邻居数据结构（只读访问） */
export let NEIGHBOR_STARTS = NEIGHBOR_START;
export let NEIGHBOR_COUNTS = NEIGHBOR_COUNT;
export let NEIGHBOR_LIST = NEIGHBORS;

// ============================================================================
// BFS 和群组计算的临时缓冲区
// ============================================================================

/** BFS 访问标记 */
let VISITED = new Int32Array(BOARD_AREA);

/** 气的访问标记 */
let LIB_VISITED = new Int32Array(BOARD_AREA);

/** BFS 时间戳 */
let bfsStamp = 0;

/** 群组缓冲区 */
let GROUP_BUF = new Int16Array(BOARD_AREA);

/** 栈缓冲区 */
let STACK_BUF = new Int16Array(BOARD_AREA);

/** 已处理的群组标记 */
let PROCESSED_GROUP = new Int32Array(BOARD_AREA);

/** 处理时间戳 */
let processedStamp = 0;

/** 群组可见标记 */
let GROUP_SEEN = new Int32Array(BOARD_AREA);

/** 群组可见时间戳 */
let groupSeenStamp = 0;

// ============================================================================
// 领地计算的临时缓冲区
// ============================================================================

/** 区域索引（按位置） */
let REGION_IDX_BY_POS = new Int16Array(BOARD_AREA);

/** 下一个空位或对手位置 */
let NEXT_EMPTY_OR_OPP = new Int16Array(BOARD_AREA);

/** 边界非 Pass-alive 标记（按头位置） */
let BORDERS_NONPASSALIVE_BY_HEADPOS = new Uint8Array(BOARD_AREA);

/** 群组索引（按位置） */
let GROUP_INDEX_BY_POS = new Int16Array(BOARD_AREA);

/** 群组颜色（按群组） */
let GROUP_COLOR_BY_GROUP = new Uint8Array(BOARD_AREA);

/** 群组起始位置（按群组） */
let GROUP_START_BY_GROUP = new Int16Array(BOARD_AREA);

/** 群组长度（按群组） */
let GROUP_LEN_BY_GROUP = new Int16Array(BOARD_AREA);

/** 群组棋子（扁平化） */
let GROUP_STONES_FLAT = new Int16Array(BOARD_AREA);

/** 最大区域数 */
let MAX_REGIONS = ((BOARD_AREA + 1) / 2 + 1) | 0;

/** 区域头位置 */
let REGION_HEADS = new Int16Array(MAX_REGIONS);

/** 关键起始位置 */
let VITAL_START = new Uint16Array(MAX_REGIONS);

/** 关键长度 */
let VITAL_LEN = new Uint8Array(MAX_REGIONS);

/** 内部空间数（最大2） */
let NUM_INTERNAL_SPACES_MAX2 = new Uint8Array(MAX_REGIONS);

/** 包含对手标记 */
let CONTAINS_OPP = new Uint8Array(MAX_REGIONS);

/** 关键列表 */
let VITAL_LIST = new Int16Array(MAX_REGIONS * 4);

/** 区域队列 */
let REGION_QUEUE = new Int16Array(BOARD_AREA);

/** 玩家群组列表 */
let PLA_GROUPS = new Int16Array(BOARD_AREA);

/** 玩家群组被杀标记 */
let PLA_GROUP_KILLED = new Uint8Array(BOARD_AREA);

/** 关键计数（按群组） */
let VITAL_COUNT_BY_GROUP = new Int16Array(BOARD_AREA);

// ============================================================================
// 征子计算的临时缓冲区
// ============================================================================

/** 征子栈大小 */
let LADDER_STACK_SIZE = ((BOARD_AREA * 3) / 2 + 2) | 0;

/** 征子缓冲区大小 */
const LADDER_BUF_SIZE = 8192;

/** 征子搜索节点预算 */
export const LADDER_SEARCH_NODE_BUDGET = 25_000;

/** 征子搜索临时数据 */
type LadderSearchScratch = {
  bufMoves: Int16Array;
  moveListStarts: Int32Array;
  moveListLens: Int32Array;
  moveListCur: Int32Array;
  recordMoves: Int16Array;
  recordPlayers: Uint8Array;
  recordKoPointBefore: Int16Array;
  recordCaptureStart: Int32Array;
  tmpKoPointBefore: Int16Array;
  tmpCaptureStart: Int32Array;
  captureStack: number[];
};

let LADDER_SCRATCH: LadderSearchScratch = {
  bufMoves: new Int16Array(LADDER_BUF_SIZE),
  moveListStarts: new Int32Array(LADDER_STACK_SIZE),
  moveListLens: new Int32Array(LADDER_STACK_SIZE),
  moveListCur: new Int32Array(LADDER_STACK_SIZE),
  recordMoves: new Int16Array(LADDER_STACK_SIZE),
  recordPlayers: new Uint8Array(LADDER_STACK_SIZE),
  recordKoPointBefore: new Int16Array(LADDER_STACK_SIZE),
  recordCaptureStart: new Int32Array(LADDER_STACK_SIZE),
  tmpKoPointBefore: new Int16Array(1),
  tmpCaptureStart: new Int32Array(1),
  captureStack: [],
};

/** 征子群组可见标记 */
let LADDER_GROUP_SEEN = new Int32Array(BOARD_AREA);
let ladderGroupSeenStamp = 0;

/** 征子对手群组可见标记 */
let LADDER_OPP_GROUP_SEEN = new Int32Array(BOARD_AREA);
let ladderOppGroupSeenStamp = 0;

/** 征子群组副本 */
let LADDER_GROUP_COPY = new Int16Array(BOARD_AREA);

/** 征子连接群组可见标记 */
let LADDER_CONNECT_GROUP_SEEN = new Int32Array(BOARD_AREA);
let ladderConnectGroupSeenStamp = 0;

/** 征子被提标记 */
let LADDER_CAPTURED = new Int32Array(BOARD_AREA);
let ladderCapturedStamp = 0;

/** 征子特征临时数据 */
type KataGoLadderFeaturesScratchV7 = {
  copyPos: SimPosition;
  groupStones: Int16Array;
  workingMoves: number[];
};

let LADDER_FEATURES_SCRATCH_V7: KataGoLadderFeaturesScratchV7 = {
  copyPos: { stones: new Uint8Array(BOARD_AREA), koPoint: -1 },
  groupStones: new Int16Array(BOARD_AREA),
  workingMoves: [],
};

// ============================================================================
// 初始化函数
// ============================================================================

/**
 * 初始化棋盘数组
 * 根据棋盘大小重新分配所有缓冲区
 */
const initBoardArrays = (size: number): void => {
  BOARD_SIZE = size;
  BOARD_AREA = BOARD_SIZE * BOARD_SIZE;
  PASS_MOVE = BOARD_AREA;

  // 初始化邻居数据结构
  NEIGHBOR_START = new Int16Array(BOARD_AREA);
  NEIGHBOR_COUNT = new Int8Array(BOARD_AREA);
  NEIGHBORS = new Int16Array(BOARD_AREA * 4);

  let neighOffset = 0;
  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const pos = y * BOARD_SIZE + x;
      NEIGHBOR_START[pos] = neighOffset;
      let count = 0;
      if (x > 0) {
        NEIGHBORS[neighOffset++] = pos - 1;
        count++;
      }
      if (x + 1 < BOARD_SIZE) {
        NEIGHBORS[neighOffset++] = pos + 1;
        count++;
      }
      if (y > 0) {
        NEIGHBORS[neighOffset++] = pos - BOARD_SIZE;
        count++;
      }
      if (y + 1 < BOARD_SIZE) {
        NEIGHBORS[neighOffset++] = pos + BOARD_SIZE;
        count++;
      }
      NEIGHBOR_COUNT[pos] = count;
    }
  }

  NEIGHBOR_STARTS = NEIGHBOR_START;
  NEIGHBOR_COUNTS = NEIGHBOR_COUNT;
  NEIGHBOR_LIST = NEIGHBORS;

  // 重新分配 BFS 缓冲区
  VISITED = new Int32Array(BOARD_AREA);
  LIB_VISITED = new Int32Array(BOARD_AREA);
  GROUP_BUF = new Int16Array(BOARD_AREA);
  STACK_BUF = new Int16Array(BOARD_AREA);
  PROCESSED_GROUP = new Int32Array(BOARD_AREA);
  GROUP_SEEN = new Int32Array(BOARD_AREA);
  bfsStamp = 0;
  processedStamp = 0;
  groupSeenStamp = 0;

  // 重新分配领地计算缓冲区
  REGION_IDX_BY_POS = new Int16Array(BOARD_AREA);
  NEXT_EMPTY_OR_OPP = new Int16Array(BOARD_AREA);
  BORDERS_NONPASSALIVE_BY_HEADPOS = new Uint8Array(BOARD_AREA);
  GROUP_INDEX_BY_POS = new Int16Array(BOARD_AREA);
  GROUP_COLOR_BY_GROUP = new Uint8Array(BOARD_AREA);
  GROUP_START_BY_GROUP = new Int16Array(BOARD_AREA);
  GROUP_LEN_BY_GROUP = new Int16Array(BOARD_AREA);
  GROUP_STONES_FLAT = new Int16Array(BOARD_AREA);

  MAX_REGIONS = ((BOARD_AREA + 1) / 2 + 1) | 0;
  REGION_HEADS = new Int16Array(MAX_REGIONS);
  VITAL_START = new Uint16Array(MAX_REGIONS);
  VITAL_LEN = new Uint8Array(MAX_REGIONS);
  NUM_INTERNAL_SPACES_MAX2 = new Uint8Array(MAX_REGIONS);
  CONTAINS_OPP = new Uint8Array(MAX_REGIONS);
  VITAL_LIST = new Int16Array(MAX_REGIONS * 4);
  REGION_QUEUE = new Int16Array(BOARD_AREA);

  PLA_GROUPS = new Int16Array(BOARD_AREA);
  PLA_GROUP_KILLED = new Uint8Array(BOARD_AREA);
  VITAL_COUNT_BY_GROUP = new Int16Array(BOARD_AREA);

  // 重新分配征子计算缓冲区
  LADDER_STACK_SIZE = ((BOARD_AREA * 3) / 2 + 2) | 0;
  LADDER_SCRATCH = {
    bufMoves: new Int16Array(LADDER_BUF_SIZE),
    moveListStarts: new Int32Array(LADDER_STACK_SIZE),
    moveListLens: new Int32Array(LADDER_STACK_SIZE),
    moveListCur: new Int32Array(LADDER_STACK_SIZE),
    recordMoves: new Int16Array(LADDER_STACK_SIZE),
    recordPlayers: new Uint8Array(LADDER_STACK_SIZE),
    recordKoPointBefore: new Int16Array(LADDER_STACK_SIZE),
    recordCaptureStart: new Int32Array(LADDER_STACK_SIZE),
    tmpKoPointBefore: new Int16Array(1),
    tmpCaptureStart: new Int32Array(1),
    captureStack: [],
  };
  LADDER_GROUP_SEEN = new Int32Array(BOARD_AREA);
  LADDER_OPP_GROUP_SEEN = new Int32Array(BOARD_AREA);
  LADDER_GROUP_COPY = new Int16Array(BOARD_AREA);
  LADDER_CONNECT_GROUP_SEEN = new Int32Array(BOARD_AREA);
  LADDER_CAPTURED = new Int32Array(BOARD_AREA);
  ladderGroupSeenStamp = 0;
  ladderOppGroupSeenStamp = 0;
  ladderConnectGroupSeenStamp = 0;
  ladderCapturedStamp = 0;

  LADDER_FEATURES_SCRATCH_V7 = {
    copyPos: { stones: new Uint8Array(BOARD_AREA), koPoint: -1 },
    groupStones: new Int16Array(BOARD_AREA),
    workingMoves: [],
  };
};

/**
 * 设置棋盘大小
 * 如果大小没有变化，则不执行任何操作
 */
export function setBoardSize(size: number): void {
  const next = Math.max(2, Math.floor(size));
  if (next === BOARD_SIZE) return;
  initBoardArrays(next);
}

// ============================================================================
// 导出访问器（供其他模块使用）
// ============================================================================

export function getGroupBuf(): Int16Array {
  return GROUP_BUF;
}

export function getStackBuf(): Int16Array {
  return STACK_BUF;
}

export function getVisited(): Int32Array {
  return VISITED;
}

export function getLibVisited(): Int32Array {
  return LIB_VISITED;
}

export function getBfsStamp(): number {
  return bfsStamp;
}

export function incrementBfsStamp(): number {
  return ++bfsStamp;
}

export function getProcessedGroup(): Int32Array {
  return PROCESSED_GROUP;
}

export function getProcessedStamp(): number {
  return processedStamp;
}

export function incrementProcessedStamp(): number {
  return ++processedStamp;
}

export function getGroupSeen(): Int32Array {
  return GROUP_SEEN;
}

export function getGroupSeenStamp(): number {
  return groupSeenStamp;
}

export function incrementGroupSeenStamp(): number {
  return ++groupSeenStamp;
}

export function getLadderScratch(): LadderSearchScratch {
  return LADDER_SCRATCH;
}

export function getLadderGroupSeen(): Int32Array {
  return LADDER_GROUP_SEEN;
}

export function getLadderGroupSeenStamp(): number {
  return ladderGroupSeenStamp;
}

export function incrementLadderGroupSeenStamp(): number {
  return ++ladderGroupSeenStamp;
}

export function getLadderOppGroupSeen(): Int32Array {
  return LADDER_OPP_GROUP_SEEN;
}

export function getLadderOppGroupSeenStamp(): number {
  return ladderOppGroupSeenStamp;
}

export function incrementLadderOppGroupSeenStamp(): number {
  return ++ladderOppGroupSeenStamp;
}

export function getLadderGroupCopy(): Int16Array {
  return LADDER_GROUP_COPY;
}

export function getLadderConnectGroupSeen(): Int32Array {
  return LADDER_CONNECT_GROUP_SEEN;
}

export function getLadderConnectGroupSeenStamp(): number {
  return ladderConnectGroupSeenStamp;
}

export function incrementLadderConnectGroupSeenStamp(): number {
  return ++ladderConnectGroupSeenStamp;
}

export function getLadderCaptured(): Int32Array {
  return LADDER_CAPTURED;
}

export function getLadderCapturedStamp(): number {
  return ladderCapturedStamp;
}

export function incrementLadderCapturedStamp(): number {
  return ++ladderCapturedStamp;
}

export function getLadderFeaturesScratchV7(): KataGoLadderFeaturesScratchV7 {
  return LADDER_FEATURES_SCRATCH_V7;
}

// 导出领地计算缓冲区访问器
export function getRegionIdxByPos(): Int16Array {
  return REGION_IDX_BY_POS;
}

export function getNextEmptyOrOpp(): Int16Array {
  return NEXT_EMPTY_OR_OPP;
}

export function getBordersNonpassaliveByHeadpos(): Uint8Array {
  return BORDERS_NONPASSALIVE_BY_HEADPOS;
}

export function getGroupIndexByPos(): Int16Array {
  return GROUP_INDEX_BY_POS;
}

export function getGroupColorByGroup(): Uint8Array {
  return GROUP_COLOR_BY_GROUP;
}

export function getGroupStartByGroup(): Int16Array {
  return GROUP_START_BY_GROUP;
}

export function getGroupLenByGroup(): Int16Array {
  return GROUP_LEN_BY_GROUP;
}

export function getGroupStonesFlat(): Int16Array {
  return GROUP_STONES_FLAT;
}

export function getMaxRegions(): number {
  return MAX_REGIONS;
}

export function getRegionHeads(): Int16Array {
  return REGION_HEADS;
}

export function getVitalStart(): Uint16Array {
  return VITAL_START;
}

export function getVitalLen(): Uint8Array {
  return VITAL_LEN;
}

export function getNumInternalSpacesMax2(): Uint8Array {
  return NUM_INTERNAL_SPACES_MAX2;
}

export function getContainsOpp(): Uint8Array {
  return CONTAINS_OPP;
}

export function getVitalList(): Int16Array {
  return VITAL_LIST;
}

export function getRegionQueue(): Int16Array {
  return REGION_QUEUE;
}

export function getPlaGroups(): Int16Array {
  return PLA_GROUPS;
}

export function getPlaGroupKilled(): Uint8Array {
  return PLA_GROUP_KILLED;
}

export function getVitalCountByGroup(): Int16Array {
  return VITAL_COUNT_BY_GROUP;
}
