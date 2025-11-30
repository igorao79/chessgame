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
      ? (typeof window !== 'undefined' ? window.location.origin : 'https://chessgame-ckpq.onrender.com')
      : 'http://localhost:3000';
    console.log('🔌 Creating socket instance for:', socketUrl);
    
    const socketInstance = io(socketUrl, {
      path: '/api/socket',
      transports: ['websocket', 'polling'],
      withCredentials: false, // Отключаем credentials для совместимости с CORS
      autoConnect: false, // Отключаем авто-подключение, будем подключаться вручную
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 3000,
      reconnectionAttempts: 10,
      timeout: 10000,
      forceNew: false
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
      console.error('❌ Socket connection error:', error.message);
      setIsConnected(false);

      // Попробуем подключиться через polling если websocket не работает
      if (error.message.includes('websocket') && socket.io.opts.transports?.[0] === 'websocket') {
        console.log('🔄 Trying polling transport...');
        socket.io.opts.transports = ['polling'];
        setTimeout(() => socket.connect(), 1000);
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

