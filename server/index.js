const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = dev ? 'localhost' : '0.0.0.0';
const port = parseInt(process.env.PORT || '10000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Хранилище активных комнат
const rooms = new Map();

app.prepare().then(() => {
  // Создаём HTTP сервер
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);

      // Health check
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

      // Остальные маршруты Next.js
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // --- Socket.IO ---
  const io = new Server(server, {
    cors: {
      origin: [
        'https://chessgame-delta-five.vercel.app', 
        'http://localhost:3000'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket'], // Отключаем polling для Render
  });

  io.on('connection', (socket) => {
    console.log('✅ Игрок подключился:', socket.id);
    console.log(`📊 Комнат: ${rooms.size}, Подключений: ${io.engine.clientsCount}`);

    // Создание комнаты
    socket.on('create-room', (callback) => {
      const roomId = Math.random().toString(36).substring(7);
      const roomData = { players: [socket.id], gameState: null, createdAt: new Date().toISOString() };
      rooms.set(roomId, roomData);
      socket.join(roomId);
      callback({ roomId });
    });

    // Присоединение к комнате
    socket.on('join-room', ({ roomId }, callback) => {
      const room = rooms.get(roomId);
      if (!room) return callback({ error: 'Комната не найдена' });
      if (room.players.length >= 2) return callback({ error: 'Комната заполнена' });

      room.players.push(socket.id);
      socket.join(roomId);

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
      }, 60000);
    });

    // Отключение игрока
    socket.on('disconnect', () => {
      rooms.forEach((room, roomId) => {
        const index = room.players.indexOf(socket.id);
        if (index !== -1) {
          room.players.splice(index, 1);
          if (room.players.length > 0) io.to(room.players[0]).emit('opponent-disconnected');
          if (room.players.length === 0) rooms.delete(roomId);
        }
      });
    });
  });

  // --- Запуск сервера ---
  server.listen(port, () => {
    console.log('='.repeat(50));
    console.log('♟️  ШАХМАТНЫЙ СЕРВЕР ЗАПУЩЕН');
    console.log(`🌐 URL: http://${hostname}:${port}`);
    console.log('📡 Socket.io: готов к подключениям');
    console.log(`🔧 Режим: ${dev ? 'Development' : 'Production'}`);
    console.log('='.repeat(50));
  });
});
