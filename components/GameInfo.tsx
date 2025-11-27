'use client';

import { useGame } from '@/contexts/GameContext';

export default function GameInfo() {
  const { gameState, resetGame } = useGame();

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
    <div className="theme-bg-primary rounded-lg shadow-xl p-4 max-w-sm">
      {/* Заголовок режима игры */}
      <div className="text-center mb-3">
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

      {/* История ходов */}
      <div className="border-t theme-border-secondary pt-3">
        <h3 className="text-sm font-semibold theme-text-primary mb-2 text-center">
          История ходов ({gameState.moves.length})
        </h3>
        <div className="max-h-24 overflow-y-auto theme-bg-secondary rounded p-2">
          {gameState.moves.length === 0 ? (
            <p className="text-center theme-text-muted text-xs">Ходы еще не сделаны</p>
          ) : (
            <div className="space-y-1">
              {gameState.moves.map((move, index) => (
                <div key={index} className="text-xs theme-text-primary text-center">
                  {Math.floor(index / 2) + 1}.{index % 2 === 0 ? '' : '..'} {move}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

