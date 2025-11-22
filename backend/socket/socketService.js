const jwt = require('jsonwebtoken');
const Driver = require('../models/Driver');

class SocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socketId

    this.initialize();
  }

  initialize() {
    // Authentication middleware
    this.io.use((socket, next) => {
      try {
        const token = socket.handshake.auth.token?.replace('Bearer ', '');
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.userId} (${socket.userRole})`);

      // Join user to their personal room
      socket.join(`user_${socket.userId}`);
      this.connectedUsers.set(socket.userId, socket.id);

      // Driver-specific events
      if (socket.userRole === 'driver') {
        this.handleDriverEvents(socket);
      }

      // Rider-specific events
      if (socket.userRole === 'rider') {
        this.handleRiderEvents(socket);
      }

      // Common events
      this.handleCommonEvents(socket);

      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userId}`);
        this.connectedUsers.delete(socket.userId);

        // Set driver offline on disconnect
        if (socket.userRole === 'driver') {
          Driver.setOnlineStatus(socket.userId, false).catch(console.error);
        }
      });
    });
  }

  handleDriverEvents(socket) {
    // Driver location updates
    socket.on('driver_location', async (data) => {
      try {
        const { lat, lng } = data;
        await Driver.updateLocation(socket.userId, lat, lng, true);

        // Optionally broadcast to riders tracking this driver
        // This would be implemented when ride is active
      } catch (error) {
        console.error('Driver location error:', error);
      }
    });

    // Driver accepts ride (alternative to REST endpoint)
    socket.on('accept_ride', async (data) => {
      try {
        const { ride_id } = data;
        // This would call the same logic as the REST endpoint
        // For now, we'll use the REST endpoint primarily
        socket.emit('ride_acceptance_ack', { ride_id, status: 'use_rest_endpoint' });
      } catch (error) {
        console.error('Accept ride error:', error);
      }
    });

    // Driver declines ride
    socket.on('decline_ride', async (data) => {
      const { ride_id, reason } = data;
      console.log(`Driver ${socket.userId} declined ride ${ride_id}: ${reason}`);
      // Log or handle decline analytics
    });
  }

  handleRiderEvents(socket) {
    // Rider tracking driver location
    socket.on('track_driver', (data) => {
      const { ride_id } = data;
      socket.join(`ride_${ride_id}`);
    });

    socket.on('stop_tracking', (data) => {
      const { ride_id } = data;
      socket.leave(`ride_${ride_id}`);
    });
  }

  handleCommonEvents(socket) {
    // Heartbeat/ping
    socket.on('heartbeat', () => {
      socket.emit('heartbeat_ack', { timestamp: new Date() });
    });

    // Request user status
    socket.on('get_status', () => {
      socket.emit('status', {
        userId: socket.userId,
        role: socket.userRole,
        connected: true
      });
    });
  }

  // Helper methods to emit events from controllers
  emitToUser(userId, event, data) {
    this.io.to(`user_${userId}`).emit(event, data);
  }

  emitToRide(rideId, event, data) {
    this.io.to(`ride_${rideId}`).emit(event, data);
  }

  broadcastToRole(role, event, data) {
    // Would need to track roles in connected users
    // For now, broadcast to all
    this.io.emit(event, data);
  }

  broadcast(event, data) {
    this.io.emit(event, data);
  }
}

module.exports = SocketService;
