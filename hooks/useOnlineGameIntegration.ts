'use client';

import { useEffect, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useGame } from '@/contexts/GameContext';
import { useSounds } from '@/lib/sounds';

export function useOnlineGameIntegration(roomId: string, isOnlineMode: boolean) {
  const { socket } = useSocket();
  const { gameState, chess, applyOpponentMove } = useGame();
  const { playTurn } = useSounds();
  const lastMoveRef = useRef<string>('');
  const isProcessingOpponentMoveRef = useRef(false);

  // Отправка ходов игрока на сервер
  useEffect(() => {
    if (!isOnlineMode || !socket || !roomId || !gameState) return;

    // Проверяем если добавился новый ход (не от соперника)
    if (gameState.moves.length > 0 && !isProcessingOpponentMoveRef.current) {
      const lastMove = gameState.moves[gameState.moves.length - 1];
      
      // Если это новый ход (не тот же что был в прошлый раз)
      if (lastMove !== lastMoveRef.current && chess) {
        lastMoveRef.current = lastMove;
        
        // Отправляем ход на сервер
        socket.emit('move', { 
          roomId, 
          move: lastMove, 
          fen: gameState.fen 
        });

        // Проверяем окончание игры
        if (gameState.status === 'finished') {
          socket.emit('game-over', { 
            roomId, 
            winner: gameState.winner 
          });
        }
      }
    }
  }, [gameState, socket, roomId, isOnlineMode, chess]);

  // Получение ходов соперника
  useEffect(() => {
    if (!isOnlineMode || !socket || !chess) return;

    const handleOpponentMove = ({ move, fen: newFen }: { move: string, fen: string }) => {
      console.log('Получен ход соперника:', move, newFen);
      
      // Устанавливаем флаг что обрабатываем ход соперника
      isProcessingOpponentMoveRef.current = true;
      
      try {
        // Применяем ход соперника через GameContext
        const success = applyOpponentMove(newFen, move);
        
        if (success) {
        // Обновляем lastMoveRef чтобы не отправить ход обратно
        lastMoveRef.current = move;
        }
        
        // Сбрасываем флаг через небольшую задержку
        setTimeout(() => {
          isProcessingOpponentMoveRef.current = false;
        }, 100);
        
      } catch (error) {
        console.error('Ошибка применения хода соперника:', error);
        isProcessingOpponentMoveRef.current = false;
      }
    };

    socket.on('opponent-move', handleOpponentMove);

    return () => {
      socket.off('opponent-move', handleOpponentMove);
    };
  }, [socket, chess, isOnlineMode, applyOpponentMove]);

  // Сброс состояния при смене режима
  useEffect(() => {
    if (!isOnlineMode) {
      lastMoveRef.current = '';
      isProcessingOpponentMoveRef.current = false;
    }
  }, [isOnlineMode]);
}
