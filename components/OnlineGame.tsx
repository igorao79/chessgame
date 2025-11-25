'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { Chess, Square } from 'chess.js';
import { Chessboard } from 'react-chessboard';

interface JoinRoomResponse {
  error?: string;
  success?: boolean;
  color?: 'white' | 'black';
}

export default function OnlineGame() {
  const { socket, isConnected } = useSocket();
  const [roomId, setRoomId] = useState<string>('');
  const [inputRoomId, setInputRoomId] = useState<string>('');
  const [gameStarted, setGameStarted] = useState(false);
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [chess] = useState(new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [gameStatus, setGameStatus] = useState<string>('');
  const [moveFrom, setMoveFrom] = useState<string | null>(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('game-start', ({ roomId, color }) => {
      setRoomId(roomId);
      setPlayerColor(color);
      setGameStarted(true);
      setGameStatus(`Игра началась! Вы играете за ${color === 'white' ? 'белых' : 'черных'}`);
    });

    socket.on('opponent-move', ({ move, fen: newFen }) => {
      chess.load(newFen);
      setFen(chess.fen());
      setGameStatus(`Ход соперника: ${move}`);
    });

    socket.on('opponent-disconnected', () => {
      setGameStatus('Соперник отключился');
      setGameStarted(false);
    });

    socket.on('game-ended', ({ winner }) => {
      setGameStatus(`Игра завершена! Победитель: ${winner}`);
    });

    return () => {
      socket.off('game-start');
      socket.off('opponent-move');
      socket.off('opponent-disconnected');
      socket.off('game-ended');
    };
  }, [socket, chess]);

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
        setPlayerColor(response.color || 'white');
      }
    });
  };

  const makeMove = (from: string, to: string) => {
    const currentTurn = chess.turn();
    const isPlayerTurn = (currentTurn === 'w' && playerColor === 'white') || 
                         (currentTurn === 'b' && playerColor === 'black');

    if (!isPlayerTurn) {
      setGameStatus('Не ваш ход!');
      return false;
    }

    try {
      const move = chess.move({ from, to, promotion: 'q' });
      if (move) {
        const newFen = chess.fen();
        setFen(newFen);

        if (socket && roomId) {
          socket.emit('move', { roomId, move: move.san, fen: newFen });
        }

        if (chess.isGameOver()) {
          const winner = chess.isCheckmate() 
            ? (chess.turn() === 'w' ? 'black' : 'white')
            : 'draw';
          
          if (socket && roomId) {
            socket.emit('game-over', { roomId, winner });
          }
        }

        return true;
      }
    } catch (error) {
      console.error('Invalid move:', error);
    }

    return false;
  };

  const copyRoomLink = () => {
    const link = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(link);
    setGameStatus('Ссылка скопирована в буфер обмена!');
  };

  if (!isConnected) {
    return (
      <div className="text-center p-8">
        <p className="text-lg text-gray-600">Подключение к серверу...</p>
      </div>
    );
  }

  if (!gameStarted && !roomId) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Онлайн игра
        </h2>

        <div className="space-y-6">
          <div>
            <button
              onClick={createRoom}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg text-xl transition-colors"
            >
              🎮 Создать новую комнату
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-300"></div>
            <span className="text-gray-500 font-semibold">или</span>
            <div className="flex-1 h-px bg-gray-300"></div>
          </div>

          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-3">
              Присоединиться к комнате:
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value)}
                placeholder="Введите код комнаты"
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={joinRoom}
                disabled={!inputRoomId}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Войти
              </button>
            </div>
          </div>
        </div>

        {gameStatus && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-center text-blue-800">{gameStatus}</p>
          </div>
        )}
      </div>
    );
  }

  if (roomId && !gameStarted) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Комната создана!
        </h2>

        <div className="space-y-4">
          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Код комнаты:</p>
            <p className="text-3xl font-bold text-center text-gray-800 select-all">
              {roomId}
            </p>
          </div>

          <button
            onClick={copyRoomLink}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            📋 Скопировать ссылку
          </button>

          <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-center text-amber-800">
              Ожидание второго игрока...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Онлайн игра</h2>
            <p className="text-gray-600 mt-1">
              Комната: <span className="font-mono font-bold">{roomId}</span>
            </p>
            <p className="text-gray-600">
              Вы играете за: {playerColor === 'white' ? '⚪ Белых' : '⚫ Черных'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-700">
              Ход: {chess.turn() === 'w' ? 'Белые' : 'Черные'}
            </p>
          </div>
        </div>

        {gameStatus && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-center text-blue-800">{gameStatus}</p>
          </div>
        )}
      </div>

      <div className="w-full max-w-[600px] mx-auto">
        <Chessboard
          options={{
            position: fen,
            boardOrientation: playerColor,
            onPieceDrop: ({ sourceSquare, targetSquare }) => {
              if (!sourceSquare || !targetSquare) return false;
              return makeMove(sourceSquare, targetSquare);
            },
            onSquareClick: ({ square }) => {
              if (!square) return;
              
              if (!moveFrom) {
                const piece = chess.get(square as Square);
                if (piece && piece.color === chess.turn()) {
                  setMoveFrom(square);
                }
              } else {
                makeMove(moveFrom, square);
                setMoveFrom(null);
              }
            },
            boardStyle: {
              borderRadius: '8px',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',
            },
          }}
        />
      </div>
    </div>
  );
}

