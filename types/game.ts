export type GameMode = 'ai' | 'local' | 'online';
export type PlayerColor = 'white' | 'black';
export type GameStatus = 'waiting' | 'playing' | 'finished';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface GameState {
  id: string;
  mode: GameMode;
  status: GameStatus;
  fen: string;
  moves: string[];
  playerColor: PlayerColor;
  currentTurn: PlayerColor;
  winner?: PlayerColor | 'draw';
  difficulty?: Difficulty;
  roomId?: string;
  players?: {
    white?: string;
    black?: string;
  };
}

export interface Move {
  from: string;
  to: string;
  promotion?: string;
}

