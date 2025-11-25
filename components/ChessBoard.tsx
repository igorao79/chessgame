'use client';

import { Chessboard } from 'react-chessboard';
import { useGame } from '@/contexts/GameContext';
import { Square } from 'chess.js';
import { useState } from 'react';

export default function ChessBoard() {
  const { gameState, chess, makeMove, isPlayerTurn } = useGame();
  const [moveFrom, setMoveFrom] = useState<string | null>(null);

  if (!gameState || !chess) {
    return null;
  }

  return (
    <div className="w-full max-w-[600px] mx-auto">
      <Chessboard
        options={{
          position: gameState.fen,
          boardOrientation: gameState.playerColor === 'white' ? 'white' : 'black',
          onPieceDrop: ({ sourceSquare, targetSquare }) => {
            if (!isPlayerTurn()) return false;

            const move = makeMove({
              from: sourceSquare as Square,
              to: targetSquare as Square,
            });

            return move;
          },
          onSquareClick: ({ square }) => {
            if (!isPlayerTurn()) return;

            if (!moveFrom) {
              const piece = chess?.get(square as Square);
              if (piece && piece.color === chess?.turn()) {
                setMoveFrom(square);
              }
            } else {
              makeMove({
                from: moveFrom as Square,
                to: square as Square,
              });
              setMoveFrom(null);
            }
          },
          boardStyle: {
            borderRadius: '8px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',
          },
        }}
      />
    </div>
  );
}

