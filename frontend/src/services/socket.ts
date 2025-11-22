import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token: `Bearer ${token}`,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      console.log("✓ Socket.IO connected");
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket.IO disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket.IO connection error:", error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    return this.socket;
  }

  // Emit events
  emit(event: string, data?: unknown) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // Listen to events
  on(event: string, callback: (...args: unknown[]) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Remove event listener
  off(event: string, callback?: (...args: unknown[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Driver-specific methods
  updateDriverLocation(lat: number, lng: number, isAvailable: boolean = true) {
    this.emit("driver_location", { lat, lng, is_available: isAvailable });
  }

  // Rider-specific methods
  requestRide(rideData: unknown) {
    this.emit("request_ride", rideData);
  }
}

const socketService = new SocketService();
export default socketService;
