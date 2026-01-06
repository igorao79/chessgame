'use client';

import { useGame } from '@/contexts/GameContext';
import { useState, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';

export default function ChessBoard() {
  const { gameState, makeMove, isPlayerTurn, chess } = useGame();
  const [optionSquares, setOptionSquares] = useState<{[square: string]: { background: string, borderRadius?: string }}>({});
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);





  // Получить возможные ходы для фигуры
  const getPossibleMoves = useCallback((from: string): string[] => {
    if (!chess) return [];

    try {
      const moves = chess.moves({ square: from as any, verbose: true });
      return moves.map(move => move.to).filter(to => to !== null && to !== undefined) as string[];
    } catch {
      return [];
    }
  }, [chess]);

  // Получить квадраты для подсветки
  const getMoveSquares = useCallback((square: string) => {
    const moves = getPossibleMoves(square);
    const newSquares: {[square: string]: { background: string, borderRadius?: string }} = {};

    moves.forEach(move => {
      newSquares[move] = {
        background: "rgba(0, 255, 0, 0.4)"
      };
    });

    newSquares[square] = {
      background: "rgba(255, 255, 0, 0.4)"
    };

    return newSquares;
  }, [getPossibleMoves]);


  // Обработчик начала перетаскивания
  const onPieceDragBegin = useCallback((piece: string, sourceSquare: string) => {
    if (!isPlayerTurn() || !chess || !gameState) {
      return false;
    }

    // Проверяем, что фигура принадлежит игроку
    const playerColor = gameState.playerColor;
    const pieceColor = piece.charAt(0);
    const isPlayerPiece = (playerColor === 'white' && pieceColor === 'w') ||
                         (playerColor === 'black' && pieceColor === 'b');

    if (!isPlayerPiece) {
      return false;
    }

    // Показываем возможные ходы
    const newSquares = getMoveSquares(sourceSquare);
    setOptionSquares(newSquares);

    return true;
  }, [isPlayerTurn, chess, gameState, getMoveSquares]);

  // Обработчик клика по клетке (для click-to-move)
  const onSquareClick = useCallback((square: string) => {
    if (!isPlayerTurn() || !chess || !gameState) return;

    if (selectedSquare) {
      // Если уже выбрана клетка
      if (selectedSquare !== square) {
        // Проверяем, является ли кликнутая клетка валидным ходом
        const possibleMoves = getPossibleMoves(selectedSquare);
        if (possibleMoves.includes(square)) {
          // Валидный ход - выполняем
          const success = makeMove({
            from: selectedSquare,
            to: square,
          });

          if (success) {
            setSelectedSquare(null);
            setOptionSquares({});
          }
        } else {
          // Не валидный ход - отменяем выделение
          setSelectedSquare(null);
          setOptionSquares({});
        }
      } else {
        // Клик по той же клетке - снимаем выделение
        setSelectedSquare(null);
        setOptionSquares({});
      }
    } else {
      // Проверяем, есть ли фигура на клетке и можем ли мы ее выбрать
      const piece = chess.get(square as any);
      if (piece && ((piece.color === 'w' && gameState.playerColor === 'white') ||
                    (piece.color === 'b' && gameState.playerColor === 'black'))) {
        setSelectedSquare(square);
        // Показываем возможные ходы
        const newSquares = getMoveSquares(square);
        setOptionSquares(newSquares);
      } else {
        // Клик в пустом месте - снимаем любое возможное выделение
        setSelectedSquare(null);
        setOptionSquares({});
      }
    }
  }, [selectedSquare, isPlayerTurn, chess, gameState, makeMove, getMoveSquares]);

  // Обработчик клика по фигуре
  const onPieceClick = useCallback((piece: string, square: string) => {
    onSquareClick(square);
  }, [onSquareClick]);

  const onPieceDrop = useCallback((sourceSquare: string, targetSquare: string) => {

    if (!isPlayerTurn() || !gameState) {
      return false;
    }

    // Выполняем ход через GameContext
    const success = makeMove({
      from: sourceSquare,
      to: targetSquare,
    });

    return success;
  }, [isPlayerTurn, gameState, makeMove]);

  if (!gameState) {
    return (
      <div className="w-full max-w-[800px] mx-auto">
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-600 dark:text-gray-300">Загрузка шахматной доски...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[800px] mx-auto">
      <Chessboard
        position={gameState.fen}
        onPieceDrop={onPieceDrop}
        onPieceDragBegin={onPieceDragBegin}
        onSquareClick={onSquareClick}
        onPieceClick={onPieceClick}
        boardOrientation={gameState.playerColor === 'white' ? 'white' : 'black'}
        customSquareStyles={optionSquares}
        arePiecesDraggable={false}
      />
    </div>
  );
}