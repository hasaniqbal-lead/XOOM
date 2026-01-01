const jwt = require('jsonwebtoken');
const Driver = require('../models/Driver');

class SocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socketId
    this.driverLocations = new Map(); // driverId -> {lat, lng, timestamp}

    this.initialize();
  }

  // Simple geohash for area-based rooms (precision ~5km)
  getAreaCode(lat, lng) {
    const latCode = Math.floor(lat * 10);
    const lngCode = Math.floor(lng * 10);
    return `${latCode}_${lngCode}`;
  }

  initialize() {
    // Public namespace for non-authenticated connections
    const pool = require('../config/database');
    
    this.io.of('/public').on('connection', async (socket) => {
      console.log('Public viewer connected:', socket.id);
      
      // Join public driver view room
      socket.join('public_driver_view');
      
      // Send current active requests
      try {
        const result = await pool.query('SELECT * FROM public_active_requests LIMIT 50');
        const timeoutResult = await pool.query(
          "SELECT setting_value FROM app_settings WHERE setting_key = 'ride_request_timeout'"
        );
        
        socket.emit('active_requests_initial', {
          requests: result.rows,
          request_timeout: parseInt(timeoutResult.rows[0]?.setting_value || '120')
        });
      } catch (error) {
        console.error('Error sending initial requests:', error);
      }
      
      socket.on('disconnect', () => {
        console.log('Public viewer disconnected:', socket.id);
      });
    });

    // Authentication middleware for main namespace
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
        const { lat, lng, vehicle_type } = data;
        await Driver.updateLocation(socket.userId, lat, lng, true);

        // Store location in memory for quick access
        this.driverLocations.set(socket.userId, { lat, lng, vehicle_type, timestamp: Date.now() });

        // Join area-based room for efficient broadcasting
        const areaCode = this.getAreaCode(lat, lng);
        socket.join(`area_${areaCode}`);

        // Broadcast to nearby riders in the same area
        socket.broadcast.to(`area_${areaCode}`).emit('driver_moved', {
          driver_id: socket.userId,
          lat,
          lng,
          vehicle_type,
          is_online: true
        });
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

    // Join area to receive nearby driver updates
    socket.on('join_area', (data) => {
      const { lat, lng } = data;
      const areaCode = this.getAreaCode(lat, lng);
      socket.join(`area_${areaCode}`);
      
      // Send current drivers in area
      const nearbyDrivers = [];
      for (const [driverId, location] of this.driverLocations.entries()) {
        const driverAreaCode = this.getAreaCode(location.lat, location.lng);
        if (driverAreaCode === areaCode) {
          nearbyDrivers.push({
            driver_id: driverId,
            ...location
          });
        }
      }
      
      socket.emit('nearby_drivers_initial', { drivers: nearbyDrivers });
    });

    socket.on('leave_area', (data) => {
      const { lat, lng } = data;
      const areaCode = this.getAreaCode(lat, lng);
      socket.leave(`area_${areaCode}`);
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
