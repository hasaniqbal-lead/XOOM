import { createContext, useContext, useEffect, ReactNode } from "react";
import socketService from "@/services/socket";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

interface SocketContextType {
  socket: ReturnType<typeof socketService.getSocket>;
  emit: (event: string, data?: any) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
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
      socketService.on("error", (error: any) => {
        toast.error(error.message || "An error occurred");
      });

      socketService.on("notification", (data: any) => {
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
