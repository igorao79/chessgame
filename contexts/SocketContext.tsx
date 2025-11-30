'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);

  // Создаём socket instance один раз
  const socket = useMemo(() => {
    // В production используем текущий домен, в разработке - localhost
    const socketUrl = process.env.NODE_ENV === 'production'
      ? 'https://chessgame-ckpq.onrender.com'
      : 'http://localhost:3000';
    console.log('🔌 Creating socket instance for:', socketUrl);
    console.log('🔍 Current window.location.origin:', typeof window !== 'undefined' ? window.location.origin : 'SSR');
    
    const socketInstance = io(socketUrl, {
      path: '/api/socket',
      transports: ['polling', 'websocket'], // Начинаем с polling для Render.com
      withCredentials: false, // Отключаем credentials для совместимости с CORS
      autoConnect: false, // Отключаем авто-подключение, будем подключаться вручную
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 15,
      timeout: 20000, // Увеличиваем timeout для Render.com
      forceNew: false,
      upgrade: true, // Разрешаем upgrade с polling на websocket
    });
    return socketInstance;
  }, []);

  useEffect(() => {
    // Настраиваем обработчики событий
    socket.on('connect', () => {
      console.log('✅ Socket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message, error);
      setIsConnected(false);

      // Для Render.com сначала пробуем polling, потом websocket
      if (socket.io.opts.transports?.[0] === 'polling' && !error.message.includes('xhr poll error')) {
        console.log('🔄 Connection failed, will retry with reconnection...');
      }
    });

    socket.on('reconnect_attempt', (attempt) => {
      console.log(`🔄 Reconnection attempt ${attempt}`);
    });

    socket.on('reconnect', (attempt) => {
      console.log(`✅ Reconnected after ${attempt} attempts`);
      setIsConnected(true);
    });

    socket.on('reconnect_error', (error) => {
      console.error('❌ Reconnection failed:', error.message);
    });

    // Подключаемся к серверу
    console.log('🚀 Connecting to socket server...');
    socket.connect();

    // Не отключаем socket при размонтировании, чтобы избежать циклов переподключений
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('reconnect_attempt');
      socket.off('reconnect');
      socket.off('reconnect_error');
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}

