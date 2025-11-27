'use client';

import { useState } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { GameMode, PlayerColor, Difficulty } from '@/types/game';
import AuthModal from './AuthModal';
import { GiChessKing } from 'react-icons/gi';
import { FaRobot, FaUsers, FaGlobe, FaCircle, FaStar, FaPlay } from 'react-icons/fa';

export default function GameModeSelector() {
  const { startGame } = useGame();
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedMode, setSelectedMode] = useState<GameMode>('ai');
  const [selectedColor, setSelectedColor] = useState<PlayerColor>('white');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');

  const handleStartGame = () => {
    startGame(selectedMode, selectedColor, selectedDifficulty);
  };

  return (
    <div className="theme-bg-primary glassmorphism-selector rounded-xl shadow-xl p-6 max-w-4xl mx-auto min-h-[600px]">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center theme-bg-accent theme-text-primary px-6 py-3 rounded-lg text-2xl font-bold shadow-md gap-2">
          <GiChessKing className="text-2xl flex-shrink-0" style={{ marginTop: '-6px' }} />
          <span>Chessarao</span>
        </div>
      </div>

      <div className="space-y-3">
        {/* Фиксированная высота для каждой секции */}
        <div className="min-h-[120px] flex flex-col justify-center">
          {/* Выбор режима игры всегда видим */}
          <div>
            <label className="block text-base font-semibold theme-text-primary mb-2">
              Выберите режим игры:
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedMode('ai')}
                className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedMode === 'ai'
                    ? 'theme-border-accent theme-bg-accent shadow-md'
                    : 'theme-border-primary hover:theme-border-secondary'
                }`}
              >
                <div className="flex justify-center mb-1">
                  <FaRobot className="text-2xl" />
                </div>
                <div className="font-medium text-sm">Против ИИ</div>
                <div className="text-xs theme-text-muted mt-1">
                  Играйте против компьютера
                </div>
              </button>

              <button
                onClick={() => setSelectedMode('local')}
                className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedMode === 'local'
                    ? 'theme-border-accent theme-bg-accent shadow-md'
                    : 'theme-border-primary hover:theme-border-secondary'
                }`}
              >
                <div className="flex justify-center mb-1">
                  <FaUsers className="text-2xl" />
                </div>
                <div className="font-medium text-sm">Локальная игра</div>
                <div className="text-xs theme-text-muted mt-1">
                  Играйте на одном устройстве
                </div>
              </button>

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    setShowAuthModal(true);
                    return;
                  }
                  setSelectedMode('online');
                }}
                className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedMode === 'online'
                    ? 'theme-border-accent theme-bg-accent shadow-md'
                    : 'theme-border-primary hover:theme-border-secondary'
                } ${!isAuthenticated ? 'opacity-75' : ''}`}
              >
                <div className="flex justify-center mb-1">
                  <FaGlobe className="text-2xl" />
                </div>
                <div className="font-medium text-sm">
                  Онлайн игра
                  {!isAuthenticated && <span className="theme-button-danger ml-1">*</span>}
                </div>
                <div className="text-xs theme-text-muted mt-1">
                  {isAuthenticated ? 'Играйте по сети' : 'Требуется авторизация'}
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-[100px] flex flex-col justify-center">
          {/* Выбор цвета - всегда занимает место */}
          <div className={selectedMode === 'online' ? 'invisible' : ''}>
            <label className="block text-base font-semibold theme-text-primary mb-1">
              Выберите цвет:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedColor('white')}
                className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedColor === 'white'
                    ? 'theme-border-accent theme-bg-accent shadow-md'
                    : 'theme-border-primary hover:theme-border-secondary'
                }`}
                disabled={selectedMode === 'online'}
              >
                <div className="flex justify-center mb-1">
                  <FaCircle className="text-2xl text-white" />
                </div>
                <div className="font-medium text-sm">Белые</div>
              </button>

              <button
                onClick={() => setSelectedColor('black')}
                className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedColor === 'black'
                    ? 'theme-border-accent theme-bg-accent shadow-md'
                    : 'theme-border-primary hover:theme-border-secondary'
                }`}
                disabled={selectedMode === 'online'}
              >
                <div className="flex justify-center mb-1">
                  <FaCircle className="text-2xl text-black" />
                </div>
                <div className="font-medium text-sm">Черные</div>
              </button>
            </div>
          </div>
        </div>

        <div className="min-h-[120px] flex flex-col justify-center">
          {/* Выбор сложности - всегда занимает место */}
          <div className={selectedMode !== 'ai' ? 'invisible' : ''}>
            <label className="block text-base font-semibold theme-text-primary mb-1">
              Выберите сложность:
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setSelectedDifficulty('easy')}
                className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedDifficulty === 'easy'
                    ? 'theme-border-accent theme-bg-accent shadow-md'
                    : 'theme-border-primary hover:theme-border-secondary'
                }`}
                disabled={selectedMode !== 'ai'}
              >
                <div className="font-medium text-sm">Легко</div>
                <div className="text-xs theme-text-muted mt-1 flex gap-1 justify-center">
                  <FaStar />
                </div>
              </button>

              <button
                onClick={() => setSelectedDifficulty('medium')}
                className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedDifficulty === 'medium'
                    ? 'theme-border-accent theme-bg-accent shadow-md'
                    : 'theme-border-primary hover:theme-border-secondary'
                }`}
                disabled={selectedMode !== 'ai'}
              >
                <div className="font-medium text-sm">Средне</div>
                <div className="text-xs theme-text-muted mt-1 flex gap-1 justify-center">
                  <FaStar />
                  <FaStar />
                </div>
              </button>

              <button
                onClick={() => setSelectedDifficulty('hard')}
                className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedDifficulty === 'hard'
                    ? 'theme-border-accent theme-bg-accent shadow-md'
                    : 'theme-border-primary hover:theme-border-secondary'
                }`}
                disabled={selectedMode !== 'ai'}
              >
                <div className="font-medium text-sm">Сложно</div>
                <div className="text-xs theme-text-muted mt-1 flex gap-1 justify-center">
                  <FaStar />
                  <FaStar />
                  <FaStar />
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-[160px] flex flex-col justify-center">
          {/* Кнопка начала игры и предупреждения */}
          <button
            onClick={handleStartGame}
            className="w-full theme-button-primary font-bold py-3 px-4 rounded-lg text-lg transition-colors shadow-md hover:shadow-lg cursor-pointer"
          >
            <div className="flex items-center justify-center gap-2">
              <FaPlay className="text-lg" />
              <span>Начать игру</span>
            </div>
          </button>

          {selectedMode === 'online' && (
            <div className="mt-3 p-3 theme-bg-tertiary theme-border-secondary border rounded-lg">
              <p className="text-xs theme-text-secondary">
                <strong>Примечание:</strong> Для онлайн игры будет создана комната.
                Вы сможете поделиться ссылкой с другом.
              </p>
            </div>
          )}

          {!isAuthenticated && (
            <div className="mt-1 text-xs theme-button-danger">
              * Онлайн игра доступна только зарегистрированным пользователям
            </div>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode="register"
      />
    </div>
  );
}