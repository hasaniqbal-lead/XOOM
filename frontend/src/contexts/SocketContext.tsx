import { createContext, useContext, useEffect, ReactNode } from "react";
import socketService from "@/services/socket";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

interface SocketError {
  message?: string;
}

interface NotificationData {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface SocketContextType {
  socket: ReturnType<typeof socketService.getSocket>;
  emit: (event: string, data?: unknown) => void;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  off: (event: string, callback?: (...args: unknown[]) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && token) {
      socketService.connect(token);

      // Global socket event listeners
      socketService.on("error", (...args: unknown[]) => {
        const error = args[0] as SocketError;
        toast.error(error.message || "An error occurred");
      });

      socketService.on("notification", (...args: unknown[]) => {
        const data = args[0] as NotificationData;
        toast.info(data.message);
      });
    }

    return () => {
      if (!isAuthenticated) {
        socketService.disconnect();
      }
    };
  }, [isAuthenticated, token]);

  const value: SocketContextType = {
    socket: socketService.getSocket(),
    emit: (event, data) => socketService.emit(event, data),
    on: (event, callback) => socketService.on(event, callback),
    off: (event, callback) => socketService.off(event, callback),
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export default SocketContext;
