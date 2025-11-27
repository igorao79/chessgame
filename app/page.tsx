'use client';

import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import ChessBoard from '@/components/ChessBoard';
import GameInfo from '@/components/GameInfo';
import GameModeSelector from '@/components/GameModeSelector';
import OnlineGame from '@/components/OnlineGame';
import UserProfile from '@/components/UserProfile';
import { PieceThemeSelector } from '@/components/PieceThemeSelector';
import { ChessBackground } from '@/components/ChessBackground';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { GiChessKing } from 'react-icons/gi';

function HomePage() {
  const { gameState } = useGame();
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const [isOnlineMode, setIsOnlineMode] = useState(false);

  useEffect(() => {
    const roomParam = searchParams.get('room');
    if (roomParam) {
      // Проверяем аутентификацию для онлайн режима
      if (!isAuthenticated) {
        // Если пользователь не авторизован, перенаправляем на главную
        window.history.replaceState({}, '', '/');
        return;
      }
      setIsOnlineMode(true);
    }
  }, [searchParams, isAuthenticated]);

  return (
    <main className="min-h-screen theme-bg-primary relative">
      {/* Анимированный шахматный фон */}
      <ChessBackground />

      {/* Хедер с эффектом жидкого стекла */}
      <header className="relative z-10">
        <div className="glassmorphism-header-full">
          <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
            <Link href="/">
              <h1 className="text-xl font-bold theme-text-primary hover:theme-text-accent transition-all duration-300 hover:scale-105 inline-flex items-center justify-center gap-2 cursor-pointer">
                <GiChessKing className="text-2xl flex-shrink-0" style={{ marginTop: '-6px' }} />
                <span>Chessarao</span>
              </h1>
            </Link>
            <UserProfile />
          </div>
        </div>
      </header>

      <div className="py-4 px-4">
        <div className="container mx-auto max-w-7xl relative z-10">
        {!gameState && !isOnlineMode ? (
          <div className="flex items-center justify-center min-h-[80vh]">
            <GameModeSelector />
          </div>
        ) : gameState?.mode === 'online' || isOnlineMode ? (
          <OnlineGame />
        ) : (
          <div className="flex flex-col items-center gap-6">
            {/* Информация об игре по центру */}
            <div className="flex justify-center">
              <GameInfo />
            </div>

            {/* Шахматная доска */}
            <ChessBoard />
          </div>
        )}
        </div>
      </div>

    </main>
  );
}

function LoadingFallback() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="container mx-auto max-w-7xl flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <div className="text-6xl mb-4">♟️</div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HomePage />
    </Suspense>
  );
}
