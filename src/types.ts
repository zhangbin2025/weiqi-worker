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
}

export type RegionOfInterest = { 
    xMin: number; 
    xMax: number; 
    yMin: number; 
    yMax: number 
};
