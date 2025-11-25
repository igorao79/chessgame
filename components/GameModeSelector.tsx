'use client';

import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { GameMode, PlayerColor, Difficulty } from '@/types/game';

export default function GameModeSelector() {
  const { startGame } = useGame();
  const [selectedMode, setSelectedMode] = useState<GameMode>('ai');
  const [selectedColor, setSelectedColor] = useState<PlayerColor>('white');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');

  const handleStartGame = () => {
    startGame(selectedMode, selectedColor, selectedDifficulty);
  };

  return (
    <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
        ♟️ Шахматы
      </h1>

      <div className="space-y-6">
        {/* Выбор режима игры */}
        <div>
          <label className="block text-lg font-semibold text-gray-700 mb-3">
            Выберите режим игры:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setSelectedMode('ai')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedMode === 'ai'
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-300 hover:border-blue-300'
              }`}
            >
              <div className="text-3xl mb-2">🤖</div>
              <div className="font-semibold">Против ИИ</div>
              <div className="text-sm text-gray-600 mt-1">
                Играйте против компьютера
              </div>
            </button>

            <button
              onClick={() => setSelectedMode('local')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedMode === 'local'
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-300 hover:border-blue-300'
              }`}
            >
              <div className="text-3xl mb-2">👥</div>
              <div className="font-semibold">Локальная игра</div>
              <div className="text-sm text-gray-600 mt-1">
                Играйте на одном устройстве
              </div>
            </button>

            <button
              onClick={() => setSelectedMode('online')}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedMode === 'online'
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-300 hover:border-blue-300'
              }`}
            >
              <div className="text-3xl mb-2">🌐</div>
              <div className="font-semibold">Онлайн</div>
              <div className="text-sm text-gray-600 mt-1">
                Играйте с другом онлайн
              </div>
            </button>
          </div>
        </div>

        {/* Выбор цвета */}
        {selectedMode !== 'online' && (
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-3">
              Выберите цвет:
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedColor('white')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedColor === 'white'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <div className="text-3xl mb-2">⚪</div>
                <div className="font-semibold">Белые</div>
              </button>

              <button
                onClick={() => setSelectedColor('black')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedColor === 'black'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                <div className="text-3xl mb-2">⚫</div>
                <div className="font-semibold">Черные</div>
              </button>
            </div>
          </div>
        )}

        {/* Выбор сложности для ИИ */}
        {selectedMode === 'ai' && (
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-3">
              Выберите сложность:
            </label>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setSelectedDifficulty('easy')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedDifficulty === 'easy'
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-300 hover:border-green-300'
                }`}
              >
                <div className="font-semibold">Легко</div>
                <div className="text-sm text-gray-600 mt-1">⭐</div>
              </button>

              <button
                onClick={() => setSelectedDifficulty('medium')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedDifficulty === 'medium'
                    ? 'border-yellow-500 bg-yellow-50 shadow-md'
                    : 'border-gray-300 hover:border-yellow-300'
                }`}
              >
                <div className="font-semibold">Средне</div>
                <div className="text-sm text-gray-600 mt-1">⭐⭐</div>
              </button>

              <button
                onClick={() => setSelectedDifficulty('hard')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedDifficulty === 'hard'
                    ? 'border-red-500 bg-red-50 shadow-md'
                    : 'border-gray-300 hover:border-red-300'
                }`}
              >
                <div className="font-semibold">Сложно</div>
                <div className="text-sm text-gray-600 mt-1">⭐⭐⭐</div>
              </button>
            </div>
          </div>
        )}

        {/* Кнопка начала игры */}
        <button
          onClick={handleStartGame}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg text-xl transition-colors shadow-lg hover:shadow-xl"
        >
          🎮 Начать игру
        </button>

        {selectedMode === 'online' && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>Примечание:</strong> Для онлайн игры будет создана комната. 
              Вы сможете поделиться ссылкой с другом.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

