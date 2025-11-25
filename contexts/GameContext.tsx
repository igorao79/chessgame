'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Chess } from 'chess.js';
import { GameState, GameMode, PlayerColor, Difficulty, Move } from '@/types/game';
import { getBestMove } from '@/lib/chess-ai';

interface GameContextType {
  gameState: GameState | null;
  chess: Chess | null;
  startGame: (mode: GameMode, playerColor?: PlayerColor, difficulty?: Difficulty) => void;
  makeMove: (move: Move) => boolean;
  resetGame: () => void;
  isPlayerTurn: () => boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [chess, setChess] = useState<Chess | null>(null);

  const makeAIMove = useCallback((chessInstance: Chess, state: GameState) => {
    const bestMove = getBestMove(chessInstance.fen(), state.difficulty);
    if (bestMove) {
      const result = chessInstance.move(bestMove);
      if (result) {
        setGameState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            fen: chessInstance.fen(),
            moves: [...prev.moves, bestMove],
            currentTurn: chessInstance.turn() === 'w' ? 'white' : 'black',
            status: chessInstance.isGameOver() ? 'finished' : 'playing',
            winner: chessInstance.isCheckmate()
              ? chessInstance.turn() === 'w'
                ? 'black'
                : 'white'
              : chessInstance.isDraw()
              ? 'draw'
              : undefined,
          };
        });
      }
    }
  }, []);

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
        const result = chess.move({
          from: move.from,
          to: move.to,
          promotion: move.promotion || 'q',
        });

        if (result) {
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
    [chess, gameState, makeAIMove]
  );

  const resetGame = useCallback(() => {
    setChess(null);
    setGameState(null);
  }, []);

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

