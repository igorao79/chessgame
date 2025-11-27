'use client';

import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import ChessBoard from '@/components/ChessBoard';
import GameInfo from '@/components/GameInfo';
import GameModeSelector from '@/components/GameModeSelector';
import OnlineGame from '@/components/OnlineGame';
import UserProfile from '@/components/UserProfile';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';

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
    <main className="min-h-screen theme-bg-primary py-4 px-4">
      {/* Хедер с профилем пользователя */}
      <header className="py-2">
        <div className="container mx-auto max-w-7xl flex justify-between items-center">
          <Link href="/">
            <h1 className="text-xl font-bold theme-text-primary cursor-pointer hover:theme-text-accent transition-colors">
              ♟️ Шахматы
            </h1>
          </Link>
          <UserProfile />
        </div>
      </header>

      <div className="container mx-auto max-w-7xl">
        {!gameState && !isOnlineMode ? (
          <div className="flex items-center justify-center min-h-[80vh]">
            <GameModeSelector />
          </div>
        ) : gameState?.mode === 'online' || isOnlineMode ? (
          <OnlineGame />
        ) : (
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <div>
              <GameInfo />
            </div>
            <div>
              <ChessBoard />
            </div>
          </div>
        )}
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
