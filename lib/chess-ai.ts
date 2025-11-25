import { Chess } from 'chess.js';

// Оценка позиции
const pieceValues: { [key: string]: number } = {
  p: 10,
  n: 30,
  b: 30,
  r: 50,
  q: 90,
  k: 900,
};

// Оценка позиции на доске
function evaluateBoard(chess: Chess): number {
  let score = 0;
  const board = chess.board();

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      const piece = board[i][j];
      if (piece) {
        const value = pieceValues[piece.type];
        score += piece.color === 'w' ? value : -value;
      }
    }
  }

  return score;
}

// Минимакс алгоритм с альфа-бета отсечением
function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizingPlayer: boolean
): number {
  if (depth === 0) {
    return evaluateBoard(chess);
  }

  const moves = chess.moves();

  if (chess.isGameOver()) {
    if (chess.isCheckmate()) {
      return isMaximizingPlayer ? -Infinity : Infinity;
    }
    return 0; // Ничья
  }

  if (isMaximizingPlayer) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) {
        break; // Бета отсечение
      }
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) {
        break; // Альфа отсечение
      }
    }
    return minEval;
  }
}

// Получить лучший ход для AI
export function getBestMove(
  fen: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
): string | null {
  const chess = new Chess(fen);
  const moves = chess.moves();

  if (moves.length === 0) return null;

  // Определяем глубину поиска в зависимости от сложности
  const depth = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 3 : 5;

  // Для легкого уровня добавляем случайность
  if (difficulty === 'easy' && Math.random() < 0.3) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  let bestMove = moves[0];
  let bestValue = -Infinity;

  for (const move of moves) {
    chess.move(move);
    const value = minimax(chess, depth - 1, -Infinity, Infinity, false);
    chess.undo();

    if (value > bestValue) {
      bestValue = value;
      bestMove = move;
    }
  }

  return bestMove;
}

