'use client';

import { useGame } from '@/contexts/GameContext';
import { useState, useRef } from 'react';
import MoveHistoryDropdown from './MoveHistoryDropdown';

export default function GameInfo() {
  const { gameState, resetGame } = useGame();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const historyButtonRef = useRef<HTMLButtonElement | null>(null);

  if (!gameState) return null;

  const getStatusText = () => {
    if (gameState.status === 'finished') {
      if (gameState.winner === 'draw') {
        return 'Ничья!';
      }
      return `${gameState.winner === 'white' ? 'Белые' : 'Черные'} победили!`;
    }

    return `Ход: ${gameState.currentTurn === 'white' ? 'Белые' : 'Черные'}`;
  };

  const getModeText = () => {
    switch (gameState.mode) {
      case 'ai':
        return `Игра против ИИ (${gameState.difficulty})`;
      case 'local':
        return 'Локальная игра';
      case 'online':
        return 'Онлайн игра';
      default:
        return '';
    }
  };

  return (
    <div className="theme-bg-primary rounded-lg shadow-xl p-3 md:p-4 w-full max-w-sm md:max-w-xs lg:max-w-sm relative">
      {/* Кнопка истории ходов */}
      <button
        ref={historyButtonRef}
        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
        className="absolute top-2 right-2 z-10 theme-bg-secondary hover:theme-bg-primary rounded-full p-2 shadow-lg transition-all duration-200 hover:scale-105 border theme-border-secondary"
        title="История ходов"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="theme-text-primary"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10,9 9,9 8,9"/>
        </svg>
      </button>

      {/* Заголовок режима игры */}
      <div className="text-center mb-3 pr-12">
        <h2 className="text-lg font-bold theme-text-primary">{getModeText()}</h2>
      </div>

      {/* Статус игры */}
      <div className="text-center mb-3">
        <p className="text-base theme-text-primary font-medium">{getStatusText()}</p>
        <p className="text-sm theme-text-secondary mt-1">
          Вы играете за: {gameState.playerColor === 'white' ? 'Белые' : 'Черные'}
        </p>
      </div>

      {/* Кнопка новой игры */}
      <div className="flex justify-center mb-3">
        <button
          onClick={resetGame}
          className="theme-button-danger cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
        >
          Новая игра
        </button>
      </div>

      {/* Сообщение о завершении игры */}
      {gameState.status === 'finished' && (
        <div className="mb-3 p-2 theme-bg-accent rounded-lg border theme-border-accent">
          <p className="text-center theme-text-primary font-semibold text-sm">
            Игра завершена
          </p>
        </div>
      )}

      {/* Dropdown истории ходов */}
      <MoveHistoryDropdown
        isOpen={isHistoryOpen}
        onToggle={() => setIsHistoryOpen(!isHistoryOpen)}
        triggerRef={historyButtonRef}
      />
    </div>
  );
}

