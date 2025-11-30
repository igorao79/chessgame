const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = dev ? 'localhost' : '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Хранилище активных комнат в памяти
const rooms = new Map();

app.prepare().then(() => {
  // Создаём HTTP сервер
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);

      // CORS headers для всех запросов
      res.setHeader('Access-Control-Allow-Origin', 'https://chessgame-delta-five.vercel.app');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'false');

      // CORS preflight
      if (req.method === 'OPTIONS') {
        res.statusCode = 200;
        res.end();
        return;
      }

      // Health check endpoint
      if (parsedUrl.pathname === '/api/health') {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString(),
          rooms: rooms.size,
          connections: io ? io.engine.clientsCount : 0
        }));
        return;
      }

      // Пропускаем маршруты Socket.io
      if (parsedUrl.pathname && parsedUrl.pathname.startsWith('/socket.io')) {
        // Socket.io сам обработает этот маршрут
        return;
      }

      // Остальные маршруты Next.js
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Инициализация Socket.io
  const io = new Server(server, {
    cors: {
      origin: 'https://chessgame-delta-five.vercel.app',
      methods: ['GET', 'POST']
    }
  });

  console.log('Socket.io сервер инициализирован');

  // --- Socket.io события ---
  io.on('connection', (socket) => {
    console.log('✅ Игрок подключился:', socket.id);
    console.log(`📊 Статистика: Комнат: ${rooms.size}, Подключений: ${io.engine.clientsCount}`);

    // Создание новой комнаты
    socket.on('create-room', (callback) => {
      const roomId = Math.random().toString(36).substring(7);
      const roomData = { players: [socket.id], gameState: null, createdAt: new Date().toISOString() };
      rooms.set(roomId, roomData);
      socket.join(roomId);
      console.log(`🎮 Комната создана: ${roomId} игроком ${socket.id}`);
      callback({ roomId });
    });

    // Присоединение к комнате
    socket.on('join-room', ({ roomId }, callback) => {
      const room = rooms.get(roomId);
      if (!room) return callback({ error: 'Комната не найдена' });
      if (room.players.length >= 2) return callback({ error: 'Комната заполнена' });

      room.players.push(socket.id);
      socket.join(roomId);

      console.log(`✅ Игрок ${socket.id} присоединился к комнате ${roomId}`);

      // Назначаем цвета
      const playerColors = {
        [room.players[0]]: 'white',
        [room.players[1]]: 'black',
      };

      room.players.forEach((playerId) => {
        io.to(playerId).emit('game-start', {
          roomId,
          color: playerColors[playerId],
          opponent: room.players.find((p) => p !== playerId),
        });
      });

      callback({ success: true, color: 'black' });
    });

    // Ход игрока
    socket.on('move', ({ roomId, move, fen }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      room.gameState = { fen, lastMove: move, timestamp: new Date().toISOString() };
      const opponent = room.players.find((p) => p !== socket.id);
      if (opponent) io.to(opponent).emit('opponent-move', { move, fen });
    });

    // Завершение игры
    socket.on('game-over', ({ roomId, winner }) => {
      const room = rooms.get(roomId);
      if (!room) return;
      io.to(roomId).emit('game-ended', { winner });
      setTimeout(() => {
        rooms.delete(roomId);
        console.log(`🗑️ Комната ${roomId} удалена после окончания игры`);
      }, 60000);
    });

    // Отключение игрока
    socket.on('disconnect', () => {
      console.log('❌ Игрок отключился:', socket.id);
      rooms.forEach((room, roomId) => {
        const index = room.players.indexOf(socket.id);
        if (index !== -1) {
          room.players.splice(index, 1);
          if (room.players.length > 0) io.to(room.players[0]).emit('opponent-disconnected');
          if (room.players.length === 0) {
            rooms.delete(roomId);
            console.log(`🗑️ Комната ${roomId} удалена (пустая)`);
          }
        }
      });
    });

    // Отладка
    socket.on('ping', () => socket.emit('pong'));
  });

  // --- Запуск сервера ---
  server.listen(port, (err) => {
    if (err) throw err;
    console.log('='.repeat(50));
    console.log('♟️  ШАХМАТНЫЙ СЕРВЕР ЗАПУЩЕН');
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
