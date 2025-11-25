const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Хранилище активных комнат в памяти
// Все игры хранятся здесь, пока сервер запущен
const rooms = new Map();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Инициализация Socket.io
  const io = new Server(server, {
    path: '/api/socket',
    addTrailingSlash: false,
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  console.log('Socket.io сервер инициализирован');

  io.on('connection', (socket) => {
    console.log('✅ Игрок подключился:', socket.id);

    // Создание новой комнаты
    socket.on('create-room', (callback) => {
      const roomId = Math.random().toString(36).substring(7);
      
      const roomData = {
        players: [socket.id],
        gameState: null,
        createdAt: new Date().toISOString(),
      };
      
      rooms.set(roomId, roomData);
      socket.join(roomId);
      
      console.log(`🎮 Комната создана: ${roomId} игроком ${socket.id}`);
      
      callback({ roomId });
    });

    // Присоединение к существующей комнате
    socket.on('join-room', ({ roomId }, callback) => {
      const room = rooms.get(roomId);
      
      if (!room) {
        console.log(`❌ Комната не найдена: ${roomId}`);
        callback({ error: 'Комната не найдена' });
        return;
      }

      if (room.players.length >= 2) {
        console.log(`❌ Комната заполнена: ${roomId}`);
        callback({ error: 'Комната заполнена' });
        return;
      }

      room.players.push(socket.id);
      socket.join(roomId);
      
      console.log(`✅ Игрок ${socket.id} присоединился к комнате ${roomId}`);

      // Назначаем цвета игрокам
      const playerColors = {
        [room.players[0]]: 'white',
        [room.players[1]]: 'black',
      };

      // Уведомляем обоих игроков о начале игры
      room.players.forEach((playerId) => {
        io.to(playerId).emit('game-start', {
          roomId,
          color: playerColors[playerId],
          opponent: room.players.find((p) => p !== playerId),
        });
      });

      callback({ success: true, color: 'black' });
    });

    // Обработка хода игрока
    socket.on('move', ({ roomId, move, fen }) => {
      const room = rooms.get(roomId);
      
      if (!room) {
        console.log(`❌ Попытка хода в несуществующей комнате: ${roomId}`);
        return;
      }

      // Обновляем состояние игры
      room.gameState = { 
        fen, 
        lastMove: move,
        timestamp: new Date().toISOString()
      };
      
      console.log(`♟️ Ход в комнате ${roomId}: ${move}`);

      // Отправляем ход оппоненту
      const opponent = room.players.find((p) => p !== socket.id);
      if (opponent) {
        io.to(opponent).emit('opponent-move', { move, fen });
      }
    });

    // Завершение игры
    socket.on('game-over', ({ roomId, winner }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      console.log(`🏁 Игра завершена в комнате ${roomId}. Победитель: ${winner}`);

      // Уведомляем всех игроков в комнате
      io.to(roomId).emit('game-ended', { winner });

      // Удаляем комнату через минуту после окончания
      setTimeout(() => {
        rooms.delete(roomId);
        console.log(`🗑️ Комната ${roomId} удалена после окончания игры`);
      }, 60000);
    });

    // Отключение игрока
    socket.on('disconnect', () => {
      console.log('❌ Игрок отключился:', socket.id);

      // Находим и обрабатываем все комнаты, где был этот игрок
      rooms.forEach((room, roomId) => {
        const index = room.players.indexOf(socket.id);
        if (index !== -1) {
          room.players.splice(index, 1);
          
          console.log(`👋 Игрок ${socket.id} покинул комнату ${roomId}`);
          
          // Уведомляем оставшегося игрока
          if (room.players.length > 0) {
            io.to(room.players[0]).emit('opponent-disconnected');
          }

          // Удаляем пустую комнату
          if (room.players.length === 0) {
            rooms.delete(roomId);
            console.log(`🗑️ Комната ${roomId} удалена (пустая)`);
          }
        }
      });
    });

    // Дополнительные события для отладки
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  // Запуск сервера
  server.listen(port, (err) => {
    if (err) throw err;
    console.log('='.repeat(50));
    console.log('♟️  ШАХМАТНЫЙ СЕРВЕР ЗАПУЩЕН');
    console.log('='.repeat(50));
    console.log(`🌐 URL: http://${hostname}:${port}`);
    console.log(`📡 Socket.io: готов к подключениям`);
    console.log(`🔧 Режим: ${dev ? 'Development' : 'Production'}`);
    console.log('='.repeat(50));
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM получен, закрываю сервер...');
    server.close(() => {
      console.log('Сервер закрыт');
      process.exit(0);
    });
  });
});

