import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useUnreadCount } from '../services/notifications';

const UNREAD_KEY = ['notifications', 'unread-count'];

interface NotificationContextValue {
  unreadCount: number;
  socket: Socket | null;
  connected: boolean;
}

const NotificationContext = createContext<NotificationContextValue>({
  unreadCount: 0,
  socket: null,
  connected: false,
});

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api/v1', '') ?? 'http://localhost:7001';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const { data: polledCount } = useUnreadCount();

  const unreadCount = polledCount?.count ?? 0;

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    const s = io(`${SOCKET_URL}/notifications`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => setConnected(true));
    s.on('disconnect', () => setConnected(false));
    s.on('notification:new', () => {
      queryClient.invalidateQueries({ queryKey: UNREAD_KEY });
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [user, queryClient]);

  return (
    <NotificationContext.Provider value={{ unreadCount, socket, connected }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  return useContext(NotificationContext);
}
