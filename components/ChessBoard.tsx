'use client';

import { Chessboard } from 'react-chessboard';
import { useGame } from '@/contexts/GameContext';
import { useState, useMemo } from 'react';

export default function ChessBoard() {
  const { gameState, chess, makeMove, isPlayerTurn } = useGame();
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<string[]>([]);

  // Получить возможные ходы для выбранной фигуры
  const getPossibleMoves = (from: string) => {
    if (!chess) return [];

    const moves = chess.moves({ square: from, verbose: true });
    return moves.map(move => move.to);
  };

  // Стили для квадратов
  const customSquareStyles = useMemo(() => {
    const styles: Record<string, React.CSSProperties> = {};

    // Подсветка выбранной фигуры
    if (moveFrom) {
      styles[moveFrom] = {
        backgroundColor: 'rgba(255, 255, 0, 0.4)',
      };
    }

    // Подсветка возможных ходов зелёным
    possibleMoves.forEach(square => {
      styles[square] = {
        ...styles[square],
        backgroundColor: 'rgba(0, 255, 0, 0.4)',
        border: '2px solid rgba(0, 255, 0, 0.8)',
      };
    });

    return styles;
  }, [moveFrom, possibleMoves]);

  const handlePieceDrop = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string }) => {
    if (!isPlayerTurn()) return false;

    // Проверяем, что фигура принадлежит игроку
    const piece = chess?.get(sourceSquare);
    const playerColor = gameState?.playerColor;
    const isPlayerPiece = piece && piece.color === (playerColor === 'white' ? 'w' : 'b');

    if (!isPlayerPiece) return false;

    // Проверяем, что ход допустимый
    if (possibleMoves.includes(targetSquare)) {
      const success = makeMove({
        from: sourceSquare,
        to: targetSquare,
      });

      if (success) {
        setMoveFrom(null);
        setPossibleMoves([]);
      }

      return success;
    }

    return false;
  };

  const handleSquareClick = ({ square }: { square: string }) => {
    if (!isPlayerTurn() || !chess || !gameState) return;

    if (!moveFrom) {
      // Выбор фигуры
      const piece = chess.get(square);
      const playerColor = gameState.playerColor;
      const isPlayerPiece = piece && piece.color === (playerColor === 'white' ? 'w' : 'b');

      if (isPlayerPiece) {
        setMoveFrom(square);
        setPossibleMoves(getPossibleMoves(square));
      }
    } else {
      // Ход на выбранную клетку
      if (possibleMoves.includes(square)) {
        const success = makeMove({
          from: moveFrom,
          to: square,
        });

        if (success) {
          setMoveFrom(null);
          setPossibleMoves([]);
        }
      } else {
        // Клик на другую клетку - выбор новой фигуры или сброс
        const piece = chess.get(square);
        const playerColor = gameState.playerColor;
        const isPlayerPiece = piece && piece.color === (playerColor === 'white' ? 'w' : 'b');

        if (isPlayerPiece) {
          // Выбор новой фигуры
          setMoveFrom(square);
          setPossibleMoves(getPossibleMoves(square));
        } else {
          // Сброс выбора
          setMoveFrom(null);
          setPossibleMoves([]);
        }
      }
    }
  };

  if (!gameState || !chess) {
    return null;
  }

  return (
    <div className="w-full max-w-[600px] mx-auto">
      <Chessboard
        options={{
          position: gameState.fen,
          boardOrientation: gameState.playerColor === 'white' ? 'white' : 'black',
          onPieceDrop: handlePieceDrop,
          onSquareClick: handleSquareClick,
          squareStyles: customSquareStyles,
          boardStyle: {
            borderRadius: '8px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',
          },
        }}
      />
    </div>
  );
}

