import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { tokenStore } from '../services/api';

export type NotificationData = {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isCritical?: boolean;
};

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:5000';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [latestNotification, setLatestNotification] = useState<NotificationData | null>(null);

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected to server');
    });

    newSocket.on('NOTIFICATION', (data: NotificationData) => {
      console.log('[Socket] Received notification:', data);
      setLatestNotification(data);
    });

    newSocket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const clearNotification = useCallback(() => {
    setLatestNotification(null);
  }, []);

  return { socket, latestNotification, clearNotification };
};
