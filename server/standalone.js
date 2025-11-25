// Standalone Socket.io сервер для Render
// Next.js будет на Vercel, этот сервер только для WebSocket

const { createServer } = require('http');
const { Server } = require('socket.io');

const port = parseInt(process.env.PORT || '3000', 10);

// Хранилище активных комнат в памяти
const rooms = new Map();

// Простой HTTP сервер для health check
const httpServer = createServer((req, res) => {
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Socket.io server is running');
  } else {
    res.writeHead(404);
    res.end();
  }
});

// Инициализация Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: '*', // В production укажите конкретный домен Vercel
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
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

  // Пинг для проверки соединения
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

// Запуск сервера
httpServer.listen(port, '0.0.0.0', () => {
  console.log('='.repeat(50));
  console.log('♟️  ШАХМАТНЫЙ SOCKET.IO СЕРВЕР');
  console.log('='.repeat(50));
  console.log(`🌐 Порт: ${port}`);
  console.log(`📡 Socket.io: готов к подключениям`);
  console.log(`🔧 Режим: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Активных комнат: ${rooms.size}`);
  console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM получен, закрываю сервер...');
  httpServer.close(() => {
    console.log('Сервер закрыт');
    process.exit(0);
  });
});

// Периодический вывод статистики
setInterval(() => {
  console.log(`📊 Статистика: Комнат: ${rooms.size}, Подключений: ${io.engine.clientsCount}`);
}, 60000); // Каждую минуту

