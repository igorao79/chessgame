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
    const socketUrl = process.env.NODE_ENV === 'production'
      ? 'https://chessgame-ckpq.onrender.com' // твой Render URL
      : 'http://localhost:10000'; // локальная разработка

    console.log('🔌 Creating socket instance for:', socketUrl);

    const socketInstance = io(socketUrl, {
      transports: ['websocket'], // отключаем polling
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
      timeout: 10000,
      withCredentials: true // для CORS
    });

    return socketInstance;
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      console.log('✅ Socket connected');
      setIsConnected(true);
    };

    const onDisconnect = (reason: string) => {
      console.log('❌ Socket disconnected:', reason);
      setIsConnected(false);
    };

    const onConnectError = (error: Error & { message: string }) => {
      console.error('❌ Socket connection error:', error.message);
      setIsConnected(false);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    socket.connect(); // подключаемся

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.disconnect(); // можно отключить при размонтировании
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
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
