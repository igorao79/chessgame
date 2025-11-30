'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Chess, Square } from 'chess.js';
import { GameState, GameMode, PlayerColor, Difficulty, Move, GameStatus } from '@/types/game';
import { getBestMove } from '@/lib/chess-ai';
import { useSounds } from '@/lib/sounds';

interface GameContextType {
  gameState: GameState | null;
  chess: Chess | null;
  startGame: (mode: GameMode, playerColor?: PlayerColor, difficulty?: Difficulty) => void;
  makeMove: (move: Move) => boolean;
  applyOpponentMove: (fen: string, move: string) => boolean;
  resetGame: () => void;
  isPlayerTurn: () => boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [chess, setChess] = useState<Chess | null>(null);
  const { playTurn, playWin, playFail } = useSounds();

  const makeAIMove = useCallback((chessInstance: Chess, state: GameState) => {
    const bestMove = getBestMove(chessInstance.fen(), state.difficulty);
    if (bestMove) {
      const result = chessInstance.move(bestMove);
      if (result) {
        // Воспроизводим звук хода ИИ
        playTurn();

        setGameState((prev) => {
          if (!prev) return prev;
          const newState = {
            ...prev,
            fen: chessInstance.fen(),
            moves: [...prev.moves, bestMove],
            currentTurn: (chessInstance.turn() === 'w' ? 'white' : 'black') as PlayerColor,
            status: chessInstance.isGameOver() ? ('finished' as GameStatus) : ('playing' as GameStatus),
            winner: chessInstance.isCheckmate()
              ? (chessInstance.turn() === 'w'
                ? 'black' as PlayerColor
                : 'white' as PlayerColor)
              : chessInstance.isDraw()
              ? ('draw' as const)
              : undefined,
          };

          // Воспроизводим звуки победы/поражения для хода ИИ
          if (newState.status === 'finished') {
            setTimeout(() => {
              if (newState.winner === 'draw') {
                console.log('🤝 Ничья!');
              } else if (newState.winner === prev.playerColor) {
                playWin();
              } else {
                playFail();
              }
            }, 500);
          }

          return newState;
        });
      }
    }
  }, [playTurn, playWin, playFail]);

  const startGame = useCallback(
    (mode: GameMode, playerColor: PlayerColor = 'white', difficulty: Difficulty = 'medium') => {
      const newChess = new Chess();
      const newGameState: GameState = {
        id: Math.random().toString(36).substring(7),
        mode,
        status: 'playing',
        fen: newChess.fen(),
        moves: [],
        playerColor,
        currentTurn: 'white',
        difficulty: mode === 'ai' ? difficulty : undefined,
      };

      setChess(newChess);
      setGameState(newGameState);

      // Если AI играет белыми, делаем первый ход
      if (mode === 'ai' && playerColor === 'black') {
        setTimeout(() => {
          makeAIMove(newChess, newGameState);
        }, 500);
      }
    },
    [makeAIMove]
  );

  const makeMove = useCallback(
    (move: Move): boolean => {
      if (!chess || !gameState) return false;

      try {
        // Проверяем, требуется ли превращение пешки
        const piece = chess.get(move.from as Square);
        const isPawnPromotion = piece && piece.type === 'p' &&
          ((piece.color === 'w' && move.to[1] === '8') ||
           (piece.color === 'b' && move.to[1] === '1'));

        const result = chess.move({
          from: move.from as Square,
          to: move.to as Square,
          promotion: isPawnPromotion ? (move.promotion || 'q') : undefined,
        });

        if (result) {
          // Воспроизводим звук хода
          playTurn();

          const newGameState: GameState = {
            ...gameState,
            fen: chess.fen(),
            moves: [...gameState.moves, result.san],
            currentTurn: chess.turn() === 'w' ? 'white' : 'black',
            status: chess.isGameOver() ? 'finished' : 'playing',
            winner: chess.isCheckmate()
              ? chess.turn() === 'w'
                ? 'black'
                : 'white'
              : chess.isDraw()
              ? 'draw'
              : undefined,
          };

          setGameState(newGameState);

          // Воспроизводим звуки победы/поражения
          if (newGameState.status === 'finished') {
            if (newGameState.winner === 'draw') {
              // При ничьей можем играть нейтральный звук или тишину
              console.log('🤝 Ничья!');
            } else if (newGameState.winner === gameState.playerColor) {
              // Игрок победил
              setTimeout(() => playWin(), 500);
            } else {
              // Игрок проиграл
              setTimeout(() => playFail(), 500);
            }
          }

          // Если игра против AI и не конец игры, делаем ход AI
          if (
            gameState.mode === 'ai' &&
            !chess.isGameOver() &&
            chess.turn() !== (gameState.playerColor === 'white' ? 'w' : 'b')
          ) {
            setTimeout(() => {
              makeAIMove(chess, newGameState);
            }, 500);
          }

          return true;
        }
      } catch (error) {
        console.error('Invalid move:', error);
      }

      return false;
    },
    [chess, gameState, makeAIMove, playTurn, playWin, playFail]
  );

  const resetGame = useCallback(() => {
    setChess(null);
    setGameState(null);
  }, []);

  const applyOpponentMove = useCallback((fen: string, move: string): boolean => {
    if (!gameState || !chess) return false;

    try {
      // Устанавливаем позицию из FEN
      chess.load(fen);

      // Обновляем состояние игры
      setGameState(prev => {
        if (!prev) return prev;

        const newState = {
          ...prev,
          fen: chess.fen(),
          moves: [...prev.moves, move],
          currentTurn: (chess.turn() === 'w' ? 'white' : 'black') as PlayerColor,
          status: chess.isGameOver() ? ('finished' as GameStatus) : ('playing' as GameStatus),
          winner: chess.isCheckmate()
            ? (chess.turn() === 'w'
              ? 'black' as PlayerColor
              : 'white' as PlayerColor)
            : chess.isDraw()
            ? ('draw' as const)
            : undefined,
        };

        return newState;
      });

      return true;
    } catch (error) {
      console.error('Error applying opponent move:', error);
      return false;
    }
  }, [gameState, chess]);

  const isPlayerTurn = useCallback((): boolean => {
    if (!gameState || !chess) return false;

    if (gameState.mode === 'ai') {
      const currentColor = chess.turn() === 'w' ? 'white' : 'black';
      return currentColor === gameState.playerColor;
    }

    return true; // Для локальной игры всегда можно ходить
  }, [gameState, chess]);

  return (
    <GameContext.Provider
      value={{
        gameState,
        chess,
        startGame,
        makeMove,
        applyOpponentMove,
        resetGame,
        isPlayerTurn,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

