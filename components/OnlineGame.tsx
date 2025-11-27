'use client';

import { useEffect, useState, useRef } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/contexts/AuthContext';
import { Chess, Square } from 'chess.js';
import { useSounds } from '@/lib/sounds';

// ChessBoard.js globals
declare global {
  interface Window {
    $: any;
    jQuery: any;
    Chessboard: any;
  }
}

interface JoinRoomResponse {
  error?: string;
  success?: boolean;
  color?: 'white' | 'black';
}

export default function OnlineGame() {
  const { socket, isConnected } = useSocket();
  const { playTurn, playWin, playFail } = useSounds();
  const [roomId, setRoomId] = useState<string>('');
  const [inputRoomId, setInputRoomId] = useState<string>('');
  const [gameStarted, setGameStarted] = useState(false);
  const [playerColor, setPlayerColor] = useState<'white' | 'black'>('white');
  const [chess] = useState(new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [gameStatus, setGameStatus] = useState<string>('');
  const [moveFrom, setMoveFrom] = useState<string | null>(null);
  
  // ChessBoard.js refs
  const boardRef = useRef<HTMLDivElement>(null);
  const chessboardRef = useRef<any>(null);

  // Инициализация ChessBoard.js для онлайн игры
  useEffect(() => {
    if (!boardRef.current || !gameStarted) return;

    const loadAndInitBoard = async () => {
      // Загружаем jQuery и ChessBoard.js
      if (!window.$) {
        const jqueryScript = document.createElement('script');
        jqueryScript.src = 'https://code.jquery.com/jquery-3.7.1.min.js';
        document.head.appendChild(jqueryScript);
        await new Promise(resolve => { jqueryScript.onload = resolve; });
      }

      if (!document.querySelector('#chessboard-css')) {
        const cssLink = document.createElement('link');
        cssLink.id = 'chessboard-css';
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.css';
        document.head.appendChild(cssLink);
      }

      if (!window.Chessboard) {
        const chessboardScript = document.createElement('script');
        chessboardScript.src = 'https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/chessboard-1.0.0.min.js';
        document.head.appendChild(chessboardScript);
        await new Promise(resolve => { chessboardScript.onload = resolve; });
      }

      // Создаем доску
      const config = {
        position: fen,
        orientation: playerColor,
        draggable: true,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
        
        onDragStart: (source: string, piece: string) => {
          const currentTurn = chess.turn();
          const isPlayerTurn = (currentTurn === 'w' && playerColor === 'white') || 
                               (currentTurn === 'b' && playerColor === 'black');
          
          if (!isPlayerTurn) return false;
          
          const pieceColor = piece.charAt(0);
          const isPlayerPiece = (playerColor === 'white' && pieceColor === 'w') || 
                               (playerColor === 'black' && pieceColor === 'b');
          
          return isPlayerPiece;
        },
        
        onDrop: (source: string, target: string) => {
          const success = makeMove(source, target);
          return success ? null : 'snapback';
        },
        
        onSnapEnd: () => {
          if (chessboardRef.current) {
            chessboardRef.current.position(chess.fen());
          }
        }
      };

      chessboardRef.current = window.Chessboard(boardRef.current, config);
    };

    loadAndInitBoard();

    return () => {
      if (chessboardRef.current?.destroy) {
        chessboardRef.current.destroy();
      }
    };
  }, [gameStarted, fen]);

  useEffect(() => {
    if (!socket) return;

    socket.on('game-start', ({ roomId, color }) => {
      setRoomId(roomId);
      setPlayerColor(color);
      setGameStarted(true);
      setGameStatus(`${user?.name || 'Игрок'} - игра началась! Вы играете за ${color === 'white' ? 'белых' : 'черных'}`);
    });

    socket.on('opponent-move', ({ move, fen: newFen }) => {
      chess.load(newFen);
      setFen(chess.fen());
      setGameStatus(`Ход соперника: ${move}`);
      console.log(`${user?.name || 'Игрок'} - соперник сделал ход: ${move}`);

      // Воспроизводим звук хода противника
      playTurn();

      // Обновляем позицию на ChessBoard.js доске
      if (chessboardRef.current) {
        chessboardRef.current.position(newFen);
      }
    });

    socket.on('opponent-disconnected', () => {
      setGameStatus('Соперник отключился');
      setGameStarted(false);
    });

    socket.on('game-over', ({ winner }) => {
      // Воспроизводим звуки когда игра заканчивается от сервера
      setTimeout(() => {
        if (winner === 'draw') {
          console.log('🤝 Ничья!');
        } else if (winner === playerColor) {
          playWin();
        } else {
          playFail();
        }
      }, 500);
      
      setGameStatus(`Игра завершена! ${winner === 'draw' ? 'Ничья' : winner === playerColor ? 'Вы победили!' : 'Вы проиграли!'}`);
    });

    socket.on('game-ended', ({ winner }) => {
      setGameStatus(`Игра завершена! Победитель: ${winner}`);
    });

    return () => {
      socket.off('game-start');
      socket.off('opponent-move');
      socket.off('opponent-disconnected');
      socket.off('game-over');
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

        // Воспроизводим звук собственного хода
        playTurn();

        // Обновляем позицию на ChessBoard.js доске
        if (chessboardRef.current) {
          chessboardRef.current.position(newFen);
        }

        if (socket && roomId) {
          socket.emit('move', { roomId, move: move.san, fen: newFen });
        }

        if (chess.isGameOver()) {
          const winner = chess.isCheckmate() 
            ? (chess.turn() === 'w' ? 'black' : 'white')
            : 'draw';
          
          // Воспроизводим звуки победы/поражения
          setTimeout(() => {
            if (winner === 'draw') {
              console.log('🤝 Ничья в онлайн игре!');
            } else if (winner === playerColor) {
              playWin();
            } else {
              playFail();
            }
          }, 500);
          
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
        <div 
          ref={boardRef}
          id={`online-chessboard-${roomId || 'waiting'}`}
          style={{ 
            width: '100%',
            borderRadius: '8px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.5)',
            overflow: 'hidden'
          }}
        />
      </div>
    </div>
  );
}

