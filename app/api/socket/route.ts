import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { NextRequest } from 'next/server';
import { saveGameState, getGameState } from '@/lib/redis';

export const dynamic = 'force-dynamic';

let io: SocketIOServer | null = null;

const rooms = new Map<string, { players: string[]; gameState: any }>();

export async function GET(req: NextRequest) {
  if (!io) {
    // @ts-ignore
    const httpServer: NetServer = (req as any).socket.server;
    
    io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Создание комнаты
      socket.on('create-room', async (callback) => {
        const roomId = Math.random().toString(36).substring(7);
        rooms.set(roomId, { players: [socket.id], gameState: null });
        socket.join(roomId);
        
        console.log(`Room created: ${roomId} by ${socket.id}`);
        callback({ roomId });
      });

      // Присоединение к комнате
      socket.on('join-room', async ({ roomId }, callback) => {
        const room = rooms.get(roomId);
        
        if (!room) {
          callback({ error: 'Room not found' });
          return;
        }

        if (room.players.length >= 2) {
          callback({ error: 'Room is full' });
          return;
        }

        room.players.push(socket.id);
        socket.join(roomId);
        
        console.log(`${socket.id} joined room ${roomId}`);

        // Уведомляем обоих игроков
        const playerColors = {
          [room.players[0]]: 'white',
          [room.players[1]]: 'black',
        };

        room.players.forEach((playerId) => {
          io?.to(playerId).emit('game-start', {
            roomId,
            color: playerColors[playerId],
            opponent: room.players.find((p) => p !== playerId),
          });
        });

        callback({ success: true, color: 'black' });
      });

      // Ход игрока
      socket.on('move', async ({ roomId, move, fen }) => {
        const room = rooms.get(roomId);
        
        if (!room) return;

        // Сохраняем состояние игры
        room.gameState = { fen, lastMove: move };
        await saveGameState(roomId, room.gameState);

        // Отправляем ход оппоненту
        const opponent = room.players.find((p) => p !== socket.id);
        if (opponent) {
          io?.to(opponent).emit('opponent-move', { move, fen });
        }
      });

      // Конец игры
      socket.on('game-over', async ({ roomId, winner }) => {
        const room = rooms.get(roomId);
        if (!room) return;

        // Уведомляем обоих игроков
        io?.to(roomId).emit('game-ended', { winner });
      });

      // Отключение
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);

        // Находим и удаляем игрока из всех комнат
        rooms.forEach((room, roomId) => {
          const index = room.players.indexOf(socket.id);
          if (index !== -1) {
            room.players.splice(index, 1);
            
            // Уведомляем оставшегося игрока
            if (room.players.length > 0) {
              io?.to(room.players[0]).emit('opponent-disconnected');
            }

            // Удаляем пустую комнату
            if (room.players.length === 0) {
              rooms.delete(roomId);
            }
          }
        });
      });
    });
  }

  return new Response('Socket server is running', { status: 200 });
}

