'use client';

import { useGame } from '@/contexts/GameContext';
import { useEffect, useRef, useState } from 'react';

// Импортируем ChessBoard.js и jQuery
declare global {
  interface Window {
    $: any;
    jQuery: any;
    Chessboard: any;
  }
}

export default function ChessBoard() {
  const { gameState, chess, makeMove, isPlayerTurn } = useGame();
  const boardRef = useRef<HTMLDivElement>(null);
  const chessboardRef = useRef<any>(null);

  // Получить возможные ходы для выбранной фигуры
  const getPossibleMoves = (from: string): string[] => {
    if (!chess) return [];

    try {
      const moves = chess.moves({ square: from as any, verbose: true });
      return moves.map(move => move.to).filter(to => to !== null) as string[];
    } catch {
      return [];
    }
  };

  // Подсветить квадраты
  const highlightSquares = (squares: string[]) => {
    if (!chessboardRef.current || !boardRef.current) return;

    // Очищаем старую подсветку
    const $board = window.$(`#${boardRef.current.id}`);
    $board.find('.square-55d63').removeClass('highlight-square');

    // Добавляем новую подсветку
    squares.forEach(square => {
      $board.find(`.square-${square}`).addClass('highlight-square');
    });
  };

  // Очистить подсветку
  const clearHighlights = () => {
    if (boardRef.current) {
      const $board = window.$(`#${boardRef.current.id}`);
      $board.find('.square-55d63').removeClass('highlight-square');
    }
  };

  // Инициализация доски
  useEffect(() => {
    if (!boardRef.current || !gameState || !chess) return;

    // Подключаем jQuery и ChessBoard.js
    const loadScripts = async () => {
      // jQuery
      if (!window.$) {
        const jqueryScript = document.createElement('script');
        jqueryScript.src = 'https://code.jquery.com/jquery-3.7.1.min.js';
        document.head.appendChild(jqueryScript);
        await new Promise(resolve => {
          jqueryScript.onload = resolve;
        });
      }

      // ChessBoard.js CSS
      if (!document.querySelector('#chessboard-css')) {
        const cssLink = document.createElement('link');
        cssLink.id = 'chessboard-css';
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.css';
        document.head.appendChild(cssLink);
      }

      // ChessBoard.js
      if (!window.Chessboard) {
        const chessboardScript = document.createElement('script');
        chessboardScript.src = 'https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.js';
        document.head.appendChild(chessboardScript);
        await new Promise(resolve => {
          chessboardScript.onload = resolve;
        });
      }
    };

    loadScripts().then(() => {
      if (!window.Chessboard || !boardRef.current) return;

      // Конфигурация доски
      const config = {
        position: gameState.fen,
        orientation: gameState.playerColor === 'white' ? 'white' : 'black',
        draggable: true,
        dropOffBoard: 'snapback',

        // Начало перетаскивания - показываем возможные ходы
        onDragStart: (source: string, piece: string) => {
          // Проверяем очередь хода
          if (!isPlayerTurn()) return false;

          // Проверяем, что фигура принадлежит игроку
          const playerColor = gameState.playerColor;
          const pieceColor = piece.charAt(0);
          const isPlayerPiece = (playerColor === 'white' && pieceColor === 'w') ||
                               (playerColor === 'black' && pieceColor === 'b');

          if (!isPlayerPiece) return false;

          // Показываем возможные ходы
          const moves = getPossibleMoves(source);
          highlightSquares([source, ...moves]);

          console.log('🟡 Drag start:', source, 'Possible moves:', moves);
          return true;
        },

        // Во время перетаскивания - поддерживаем подсветку
        onDragMove: (newLocation: string, oldLocation: string, source: string) => {
          // Подсветка остается активной во время перетаскивания
          console.log('🔄 Dragging...', source);
        },

        // Отпускание фигуры - проверяем и выполняем ход
        onDrop: (source: string, target: string, piece: string) => {
          console.log('🎯 Drop attempt:', source, 'to', target);

          // Очищаем подсветку
          clearHighlights();

          // Проверяем, что ход возможен
          const possibleMoves = getPossibleMoves(source);
          if (!possibleMoves.includes(target)) {
            console.log('❌ Invalid move:', source, 'to', target);
            return 'snapback';
          }

          // Выполняем ход
          const success = makeMove({
            from: source,
            to: target,
          });

          console.log('✅ Move result:', success);

          // Если ход не выполнился, возвращаем фигуру обратно
          return success ? null : 'snapback';
        },

        // После завершения анимации
        onSnapEnd: () => {
          // Обновляем позицию на доске
          if (chessboardRef.current && chess) {
            chessboardRef.current.position(chess.fen());
          }
          console.log('🏁 Snap end - position updated');
        },

        // Тема фигур - используем несколько источников с fallback
        pieceTheme: function(piece) {
          // Пробуем несколько источников
          const sources = [
            'https://chessboardjs.com/img/chesspieces/wikipedia/' + piece + '.png',
            'https://raw.githubusercontent.com/lichess-org/lila/master/public/piece/merida/' + piece + '.png',
            'https://images.chesscomfiles.com/chess-themes/pieces/neo/150/' + piece + '.png',
            'https://chessboardjs.com/img/chesspieces/alpha/' + piece + '.png'
          ];
          // Возвращаем первый источник (ChessBoard.js попробует остальные при ошибке)
          return sources[0];
        }
      };

      // Создаем доску
      chessboardRef.current = window.Chessboard(boardRef.current, config);

      // Добавляем кастомные стили для подсветки
      if (!document.querySelector('#chess-highlight-styles')) {
        const style = document.createElement('style');
        style.id = 'chess-highlight-styles';
        style.textContent = `
          .highlight-square {
            background-color: rgba(0, 255, 0, 0.4) !important;
            box-shadow: inset 0 0 0 3px rgba(0, 255, 0, 0.8) !important;
            border-radius: 3px !important;
          }

          .square-55d63:hover {
            background-color: rgba(255, 255, 0, 0.2) !important;
          }

          /* Убираем overflow: hidden чтобы фигуры не обрезались при перетаскивании */
          .board-b72b1,
          .board-b72b1 * {
            overflow: visible !important;
          }

          /* Дополнительные селекторы для ChessBoard.js */
          [class*="board-"] {
            overflow: visible !important;
          }

          [class*="board-"] * {
            overflow: visible !important;
          }
        `;
        document.head.appendChild(style);
      }

      console.log('♟️ ChessBoard.js initialized successfully');
    });

    // Cleanup
    return () => {
      if (chessboardRef.current && chessboardRef.current.destroy) {
        chessboardRef.current.destroy();
        console.log('🧹 ChessBoard destroyed');
      }
    };
  }, [gameState?.id]);

  // Обновляем позицию когда меняется FEN
  useEffect(() => {
    if (chessboardRef.current && gameState) {
      chessboardRef.current.position(gameState.fen);
      clearHighlights(); // Очищаем подсветку при обновлении позиции
      console.log('🔄 Position updated:', gameState.fen);
    }
  }, [gameState?.fen]);

  if (!gameState || !chess) {
    return (
      <div className="w-full max-w-[600px] mx-auto">
        <div className="bg-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600">Загрузка шахматной доски...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[600px] mx-auto">
      <div
        ref={boardRef}
        id={`chessboard-${gameState.id}`}
        style={{
          width: '100%',
          borderRadius: '8px',
          boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',
          zIndex: 20,
          position: 'relative'
        }}
      />
    </div>
  );
}