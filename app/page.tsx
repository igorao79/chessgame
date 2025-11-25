'use client';

import { useGame } from '@/contexts/GameContext';
import ChessBoard from '@/components/ChessBoard';
import GameInfo from '@/components/GameInfo';
import GameModeSelector from '@/components/GameModeSelector';
import OnlineGame from '@/components/OnlineGame';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

function HomePage() {
  const { gameState } = useGame();
  const searchParams = useSearchParams();
  const [isOnlineMode, setIsOnlineMode] = useState(false);

  useEffect(() => {
    const roomParam = searchParams.get('room');
    if (roomParam) {
      setIsOnlineMode(true);
    }
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
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

export default function Page() {
  return (
    <div suppressHydrationWarning>
      <HomePage />
    </div>
  );
}
