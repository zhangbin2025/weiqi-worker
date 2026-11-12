// 核心类型定义（完整的版本）

export type Player = 'black' | 'white';
export type Intersection = Player | null;
export type BoardState = Intersection[][];
export type FloatArray = Float32Array | number[];
export type GameRules = 'japanese' | 'chinese' | 'korean';

export interface Move {
    x: number;
    y: number;
    player: Player;
}

export interface GameState {
    board: BoardState;
    currentPlayer: Player;
    moveHistory: Move[];
    capturedBlack: number;
    capturedWhite: number;
    komi: number;
}

export interface CandidateMove {
    x: number;
    y: number;
    winRate: number;
    scoreLead: number;
    visits: number;
    order: number;
    pv?: string[];
}

export interface AnalysisResult {
    rootWinRate: number;
    rootScoreLead: number;
    moves: CandidateMove[];
    /**
     * 根节点领地归属（可选）
     * 长度 = boardSize * boardSize，索引 = y * boardSize + x
     * +1 表示黑方领地，-1 表示白方领地，接近 0 表示未确定
     */
    ownership?: FloatArray;
}

export type RegionOfInterest = { 
    xMin: number; 
    xMax: number; 
    yMin: number; 
    yMax: number 
};
