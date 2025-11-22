import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token: `Bearer ${token}`
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);

      // Store listener for cleanup
      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }
      this.listeners.get(event).push(callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // Driver specific methods
  updateLocation(lat, lng) {
    this.emit('driver_location', { lat, lng, timestamp: new Date() });
  }

  acceptRide(rideId) {
    this.emit('accept_ride', { ride_id: rideId });
  }

  declineRide(rideId, reason) {
    this.emit('decline_ride', { ride_id: rideId, reason });
  }

  // Rider specific methods
  trackDriver(rideId) {
    this.emit('track_driver', { ride_id: rideId });
  }

  stopTracking(rideId) {
    this.emit('stop_tracking', { ride_id: rideId });
  }

  // Heartbeat
  sendHeartbeat() {
    this.emit('heartbeat');
  }
}

export default new SocketService();
