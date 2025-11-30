'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useGame } from '@/contexts/GameContext';
import { useSounds } from '@/lib/sounds';
import { IoGlobe, IoGameController, IoCheckmarkCircle, IoCopy, IoSadOutline } from 'react-icons/io5';
import ChessBoard from './ChessBoard';
import GameInfo from './GameInfo';
import { useOnlineGameIntegration } from '@/hooks/useOnlineGameIntegration';

interface JoinRoomResponse {
  error?: string;
  success?: boolean;
  color?: 'white' | 'black';
}



export default function OnlineGame() {
  const { socket, isConnected } = useSocket();
  const { gameState, startGame, resetGame } = useGame();
  const { playFail } = useSounds();
  
  const [roomId, setRoomId] = useState<string>('');
  const [inputRoomId, setInputRoomId] = useState<string>('');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameStatus, setGameStatus] = useState<string>('');
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);

  const handleOpponentDisconnect = useCallback(() => {
    setOpponentDisconnected(true);
    setGameStarted(false);
    
    // Сбрасываем игру в GameContext
    resetGame();
    
    playFail();
    
    // Через 5 секунд возвращаемся к выбору режима
    setTimeout(() => {
      setRoomId('');
      setOpponentDisconnected(false);
      setGameStatus('');
      setGameStarted(false);
    }, 5000);
  }, [resetGame, playFail]);

  // Интеграция с сокетами для онлайн игры
  useOnlineGameIntegration(roomId, gameStarted);

  // Обработка событий socket для основного компонента
  useEffect(() => {
    if (!socket) return;

    socket.on('game-start', ({ roomId: newRoomId, color }) => {
      setGameStarted(true);
      setGameStatus('');
      // Запускаем игру через обычный GameContext
      startGame('online', color);
      console.log(`Игра началась! Комната: ${newRoomId}, Цвет: ${color}`);
    });

    socket.on('opponent-disconnected', () => {
      setGameStatus('Ваш оппонент отключился от игры');
      handleOpponentDisconnect();
    });

    return () => {
      socket.off('game-start');
      socket.off('opponent-disconnected');
    };
  }, [socket, startGame, handleOpponentDisconnect]);

  const createRoom = () => {
    if (!socket) return;

    socket.emit('create-room', ({ roomId: newRoomId }: { roomId: string }) => {
      setRoomId(newRoomId);
      setGameStatus('Комната создана! Ожидание соперника...');
    });
  };

  const joinRoom = () => {
    if (!socket || !inputRoomId) return;

    socket.emit('join-room', { roomId: inputRoomId }, (response: JoinRoomResponse) => {
      if (response.error) {
        setGameStatus(`Ошибка: ${response.error}`);
      } else {
        setRoomId(inputRoomId);
        setGameStatus('Присоединились к комнате! Ожидание начала игры...');
        // НЕ устанавливаем gameStarted=true пока не придет событие game-start
      }
    });
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(link);
    setGameStatus('Ссылка скопирована в буфер обмена!');
  };


  if (!isConnected) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin mx-auto w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
        <p className="text-lg text-gray-600">Подключение к серверу...</p>
        <p className="text-sm text-gray-500 mt-2">Если подключение не происходит, проверьте что сервер запущен</p>
      </div>
    );
  }

  if (!gameStarted && !roomId) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="theme-bg-primary glassmorphism-selector rounded-xl shadow-xl p-4 md:p-6 lg:p-8 max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl w-full mx-auto">
          <div className="text-center mb-6 md:mb-8">
            <div className="inline-flex items-center justify-center theme-bg-accent theme-text-primary px-4 md:px-6 py-2 md:py-3 rounded-lg text-lg md:text-xl lg:text-2xl font-bold shadow-md gap-2 mb-4">
              <IoGlobe className="text-lg md:text-xl lg:text-2xl" />
              <span>Онлайн игра</span>
            </div>
            <p className="theme-text-secondary text-xs md:text-sm px-2">
              Играйте с друзьями по сети в режиме реального времени
            </p>
          </div>

          <div className="space-y-4 md:space-y-6">
            <div>
              <button
                onClick={createRoom}
                className="w-full theme-button-primary font-bold py-3 md:py-4 px-4 md:px-6 rounded-lg text-base md:text-lg transition-all hover:shadow-lg"
              >
                <div className="flex items-center justify-center gap-2 md:gap-3">
                  <IoGameController className="text-lg md:text-xl" />
                  <span className="text-sm md:text-base">Создать новую комнату</span>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex-1 h-px theme-bg-secondary opacity-30"></div>
              <span className="theme-text-muted font-semibold text-xs md:text-sm">или</span>
              <div className="flex-1 h-px theme-bg-secondary opacity-30"></div>
            </div>

            <div>
              <label className="block text-sm md:text-base font-semibold theme-text-primary mb-2 md:mb-3">
                Присоединиться к комнате:
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={inputRoomId}
                  onChange={(e) => setInputRoomId(e.target.value)}
                  placeholder="Введите код комнаты"
                  className="flex-1 px-3 md:px-4 py-3 border-2 theme-border-primary rounded-lg theme-bg-secondary theme-text-primary placeholder:theme-text-muted focus:theme-border-accent focus:outline-none transition-colors text-sm md:text-base"
                />
                <button
                  onClick={joinRoom}
                  disabled={!inputRoomId}
                  className="theme-button-secondary disabled:opacity-50 disabled:cursor-not-allowed font-bold py-3 px-4 md:px-6 rounded-lg transition-all text-sm md:text-base whitespace-nowrap"
                >
                  Войти
                </button>
              </div>
            </div>
          </div>

          {gameStatus && (
            <div className="mt-6 p-4 theme-bg-tertiary theme-border-secondary border rounded-lg">
              <p className="text-center theme-text-secondary text-sm">{gameStatus}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (roomId && !gameStarted) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="theme-bg-primary glassmorphism-selector rounded-xl shadow-xl p-4 md:p-6 lg:p-8 max-w-sm sm:max-w-md md:max-w-lg w-full mx-auto">
          <div className="text-center mb-4 md:mb-6">
            <div className="inline-flex items-center justify-center theme-bg-accent theme-text-primary px-4 md:px-6 py-2 md:py-3 rounded-lg text-lg md:text-xl font-bold shadow-md gap-2 mb-4">
              <IoCheckmarkCircle className="text-lg md:text-xl" />
              <span className="text-sm md:text-base">Комната создана!</span>
            </div>
          </div>

          <div className="space-y-4 md:space-y-6">
            <div className="theme-bg-tertiary p-4 md:p-6 rounded-lg border theme-border-secondary">
              <p className="text-xs md:text-sm theme-text-muted mb-2 text-center">Код комнаты:</p>
              <p className="text-2xl md:text-3xl font-bold text-center theme-text-primary select-all font-mono tracking-wider break-all">
                {roomId}
              </p>
            </div>

            <button
              onClick={copyRoomLink}
              className="w-full theme-button-primary font-bold py-3 px-4 md:px-6 rounded-lg transition-all hover:shadow-lg text-sm md:text-base"
            >
              <div className="flex items-center justify-center gap-2">
                <IoCopy className="text-base md:text-lg" />
                <span>Скопировать ссылку</span>
              </div>
            </button>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/30 rounded-lg border border-amber-200 dark:border-amber-700">
              <div className="flex items-center justify-center gap-3">
                <div className="animate-pulse">
                  <div className="w-3 h-3 bg-amber-500 rounded-full animate-bounce"></div>
                </div>
                <p className="text-center text-amber-800 dark:text-amber-200 font-medium">
                  Ожидание второго игрока...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Экран ожидания когда присоединились к комнате, но игра еще не началась
  if (roomId && !gameStarted) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <div className="theme-bg-primary glassmorphism-selector rounded-xl shadow-xl p-4 md:p-6 lg:p-8 max-w-sm sm:max-w-md md:max-w-lg w-full mx-auto">
          <div className="text-center mb-4 md:mb-6">
            <div className="inline-flex items-center justify-center theme-bg-accent theme-text-primary px-4 md:px-6 py-2 md:py-3 rounded-lg text-lg md:text-xl font-bold shadow-md gap-2 mb-4">
              <IoGlobe className="text-lg md:text-xl" />
              <span className="text-sm md:text-base">Присоединились к игре!</span>
            </div>
          </div>

          <div className="space-y-4 md:space-y-6">
            <div className="theme-bg-tertiary p-4 md:p-6 rounded-lg border theme-border-secondary">
              <p className="text-xs md:text-sm theme-text-muted mb-2 text-center">Комната:</p>
              <p className="text-xl md:text-2xl font-bold text-center theme-text-primary select-all font-mono tracking-wider break-all">
                {roomId}
              </p>
            </div>

            <div className="p-3 md:p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-center gap-2 md:gap-3">
                <div className="animate-pulse">
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full animate-bounce"></div>
                </div>
                <p className="text-center text-blue-800 dark:text-blue-200 font-medium text-sm md:text-base">
                  Ожидание начала игры...
                </p>
              </div>
              {gameStatus && (
                <p className="text-center text-blue-700 dark:text-blue-300 text-xs md:text-sm mt-2">
                  {gameStatus}
                </p>
              )}
            </div>

            <button
              onClick={() => {
                setRoomId('');
                setGameStatus('');
                setGameStarted(false);
                setInputRoomId('');
              }}
              className="w-full theme-button-secondary font-medium py-2 px-4 rounded-lg text-xs md:text-sm transition-colors"
            >
              Выйти из комнаты
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
      {/* Уведомление об отключении оппонента */}
      {opponentDisconnected && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="theme-bg-primary glassmorphism-selector rounded-xl shadow-2xl p-4 md:p-6 lg:p-8 max-w-sm sm:max-w-md mx-auto w-full">
            <div className="text-center">
              <div className="text-4xl md:text-5xl lg:text-6xl mb-4 flex justify-center">
                <IoSadOutline className="text-red-500" />
              </div>
              <h3 className="text-lg md:text-xl font-bold theme-text-primary mb-2">
                Оппонент отключился
              </h3>
              <p className="theme-text-secondary text-sm md:text-base mb-4 px-2">
                Ваш оппонент покинул игру. Через несколько секунд вы вернетесь к выбору режима.
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {gameStarted && gameState && (
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center lg:justify-start gap-4 md:gap-6 lg:gap-8">
          <GameInfo />
          <ChessBoard />
        </div>
      )}
    </div>
  );
}

