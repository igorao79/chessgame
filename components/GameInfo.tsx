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
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{getModeText()}</h2>
          <p className="text-lg text-gray-600 mt-2">{getStatusText()}</p>
          <p className="text-sm text-gray-500 mt-1">
            Вы играете за: {gameState.playerColor === 'white' ? 'Белые' : 'Черные'}
          </p>
        </div>
        <button
          onClick={resetGame}
          className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          Новая игра
        </button>
      </div>

      {gameState.status === 'finished' && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-center text-blue-800 font-semibold">
            Игра завершена
          </p>
        </div>
      )}

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          История ходов ({gameState.moves.length}):
        </h3>
        <div className="max-h-32 overflow-y-auto bg-gray-50 rounded p-2">
          {gameState.moves.length === 0 ? (
            <p className="text-gray-400 text-sm">Ходы еще не сделаны</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {gameState.moves.map((move, index) => (
                <span key={index} className="text-gray-700">
                  {Math.floor(index / 2) + 1}. {move}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

