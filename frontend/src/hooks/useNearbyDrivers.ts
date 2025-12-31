import { useState, useEffect, useCallback } from 'react';
import { useSocket } from '@/contexts/SocketContext';
import axios from 'axios';

export interface NearbyDriver {
  id: number;
  lat: number;
  lng: number;
  vehicle_type: string;
  is_online: boolean;
  is_verified: boolean;
  distance_km: number;
}

interface UseNearbyDriversOptions {
  lat: number | null;
  lng: number | null;
  radius?: number;
  vehicle_type?: string | null;
  enabled?: boolean;
}

export const useNearbyDrivers = ({
  lat,
  lng,
  radius = 5,
  vehicle_type,
  enabled = true,
}: UseNearbyDriversOptions) => {
  const [drivers, setDrivers] = useState<NearbyDriver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();

  // Fetch initial nearby drivers
  const fetchDrivers = useCallback(async () => {
    if (!lat || !lng || !enabled) return;

    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {
        lat: lat.toString(),
        lng: lng.toString(),
        radius: radius.toString(),
      };

      if (vehicle_type) {
        params.vehicle_type = vehicle_type;
      }

      const response = await axios.get('/api/drivers/nearby', { params });
      
      setDrivers(response.data.drivers || []);
    } catch (err) {
      console.error('Failed to fetch nearby drivers:', err);
      setError('Failed to load nearby drivers');
    } finally {
      setLoading(false);
    }
  }, [lat, lng, radius, vehicle_type, enabled]);

  // Initial fetch
  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // Real-time updates via Socket.IO
  useEffect(() => {
    if (!socket || !lat || !lng || !enabled) return;

    // Join area to receive updates
    socket.emit('join_area', { lat, lng });

    // Handle initial drivers from socket
    const handleInitialDrivers = (data: { drivers: NearbyDriver[] }) => {
      setDrivers(prevDrivers => {
        const newDrivers = data.drivers;
        // Merge with existing drivers
        const driverMap = new Map(prevDrivers.map(d => [d.id, d]));
        newDrivers.forEach(d => driverMap.set(d.id, d));
        return Array.from(driverMap.values());
      });
    };

    // Handle driver movement
    const handleDriverMoved = (data: {
      driver_id: number;
      lat: number;
      lng: number;
      vehicle_type: string;
      is_online: boolean;
    }) => {
      setDrivers(prevDrivers => {
        const existingDriver = prevDrivers.find(d => d.id === data.driver_id);
        
        if (existingDriver) {
          // Update existing driver
          return prevDrivers.map(d =>
            d.id === data.driver_id
              ? { ...d, lat: data.lat, lng: data.lng, vehicle_type: data.vehicle_type }
              : d
          );
        } else {
          // Add new driver
          return [
            ...prevDrivers,
            {
              id: data.driver_id,
              lat: data.lat,
              lng: data.lng,
              vehicle_type: data.vehicle_type,
              is_online: data.is_online,
              is_verified: true,
              distance_km: 0, // Calculate if needed
            },
          ];
        }
      });
    };

    // Handle driver going offline
    const handleDriverOffline = (data: { driver_id: number }) => {
      setDrivers(prevDrivers => prevDrivers.filter(d => d.id !== data.driver_id));
    };

    socket.on('nearby_drivers_initial', handleInitialDrivers);
    socket.on('driver_moved', handleDriverMoved);
    socket.on('driver_offline', handleDriverOffline);

    return () => {
      socket.emit('leave_area', { lat, lng });
      socket.off('nearby_drivers_initial', handleInitialDrivers);
      socket.off('driver_moved', handleDriverMoved);
      socket.off('driver_offline', handleDriverOffline);
    };
  }, [socket, lat, lng, enabled]);

  // Filter drivers by vehicle type if specified
  const filteredDrivers = vehicle_type
    ? drivers.filter(d => d.vehicle_type === vehicle_type)
    : drivers;

  return {
    drivers: filteredDrivers,
    loading,
    error,
    refetch: fetchDrivers,
  };
};

