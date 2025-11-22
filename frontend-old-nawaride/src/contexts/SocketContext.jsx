import { createContext, useContext, useEffect, useState } from 'react';
import socketService from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (isAuthenticated && token) {
      const socket = socketService.connect(token);

      socket.on('connect', () => {
        setConnected(true);
      });

      socket.on('disconnect', () => {
        setConnected(false);
      });

      return () => {
        socketService.disconnect();
      };
    }
  }, [isAuthenticated, token]);

  const value = {
    socket: socketService,
    connected,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
